"""WhiteboxTools hydrological terrain processing service.

Wraps the WhiteboxTools Python interface for DEM conditioning,
flow direction, flow accumulation, stream extraction, and watershed delineation.
"""

from __future__ import annotations

import logging
import shutil
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional, Union

import numpy as np
import rasterio

logger = logging.getLogger(__name__)


@dataclass
class HydrologyResult:
    """Result from a hydrological processing operation."""

    success: bool
    output_path: Optional[str]
    tool_name: str
    parameters: Dict[str, Any]
    elapsed_seconds: float
    error_message: Optional[str] = None
    output_info: Optional[Dict[str, Any]] = None


class HydrologyService:
    """Hydrological terrain processing using WhiteboxTools.

    Important notes:
    - Flow accumulation values represent upstream cell counts (by default), NOT discharge or flood probability.
    - DEM must be hydrologically conditioned (depressions filled/breached) before flow analysis.
    - DEM should ideally be in a projected CRS for accurate distance-based operations.
    - Always verify WhiteboxTools is installed and executable.
    """

    def __init__(self, exe_path: str = "whitebox_tools", work_dir: str = "./data/interim/whitebox"):
        self.exe_path = exe_path
        self.work_dir = Path(work_dir)
        self.work_dir.mkdir(parents=True, exist_ok=True)
        self._version: Optional[str] = None

    def check_installation(self) -> Dict[str, Any]:
        """Verify WhiteboxTools is installed and accessible."""
        try:
            result = subprocess.run(
                [self.exe_path, "--version"],
                capture_output=True, text=True, timeout=30,
            )
            if result.returncode == 0:
                self._version = result.stdout.strip()
                return {"installed": True, "version": self._version, "path": self.exe_path}
            return {"installed": False, "error": result.stderr}
        except FileNotFoundError:
            return {"installed": False, "error": f"WhiteboxTools not found at: {self.exe_path}"}
        except subprocess.TimeoutExpired:
            return {"installed": False, "error": "WhiteboxTools check timed out"}

    def _run_tool(
        self,
        tool_name: str,
        args: Dict[str, str],
        timeout: int = 600,
    ) -> HydrologyResult:
        """Execute a WhiteboxTools tool with validation.

        Args:
            tool_name: Name of the WBT tool (e.g., 'fill_depressions').
            args: Tool-specific arguments as flag-value pairs.
            timeout: Max seconds to wait for completion.

        Returns:
            HydrologyResult with success status, output path, and metadata.
        """
        # Build command
        cmd = [self.exe_path, f"--run={tool_name}"]
        for flag, value in args.items():
            cmd.append(f"--{flag}={value}")
        cmd.append("--v=false")  # Suppress verbose output to stderr

        logger.info("Running WhiteboxTools: %s %s", tool_name, args)
        start = time.time()

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=str(self.work_dir),
            )
            elapsed = time.time() - start

            if result.returncode != 0:
                error_msg = result.stderr.strip() or result.stdout.strip() or "Unknown error"
                logger.error("WhiteboxTools %s failed: %s", tool_name, error_msg)
                return HydrologyResult(
                    success=False,
                    output_path=None,
                    tool_name=tool_name,
                    parameters=args,
                    elapsed_seconds=elapsed,
                    error_message=error_msg,
                )

            # Determine output path
            output_path = args.get("output", args.get("o"))

            # Validate output exists
            if output_path and not Path(output_path).exists():
                return HydrologyResult(
                    success=False,
                    output_path=output_path,
                    tool_name=tool_name,
                    parameters=args,
                    elapsed_seconds=elapsed,
                    error_message=f"Tool completed but output file not found: {output_path}",
                )

            # Validate output raster
            output_info = None
            if output_path and Path(output_path).exists():
                output_info = self._validate_output(output_path)

            logger.info(
                "WhiteboxTools %s completed in %.1fs -> %s",
                tool_name, elapsed, output_path,
            )
            return HydrologyResult(
                success=True,
                output_path=output_path,
                tool_name=tool_name,
                parameters=args,
                elapsed_seconds=elapsed,
                output_info=output_info,
            )

        except subprocess.TimeoutExpired:
            elapsed = time.time() - start
            return HydrologyResult(
                success=False,
                output_path=None,
                tool_name=tool_name,
                parameters=args,
                elapsed_seconds=elapsed,
                error_message=f"Tool timed out after {timeout}s",
            )
        except Exception as e:
            elapsed = time.time() - start
            return HydrologyResult(
                success=False,
                output_path=None,
                tool_name=tool_name,
                parameters=args,
                elapsed_seconds=elapsed,
                error_message=str(e),
            )

    @staticmethod
    def _validate_output(path: str) -> Dict[str, Any]:
        """Validate a raster output from WhiteboxTools."""
        try:
            with rasterio.open(path) as src:
                data = src.read(1, masked=True)
                valid_count = int(np.ma.count(data))
                nodata_count = int(np.ma.count_masked(data))
                return {
                    "width": src.width,
                    "height": src.height,
                    "crs": str(src.crs) if src.crs else None,
                    "nodata": src.nodata,
                    "dtype": str(src.dtypes[0]),
                    "valid_pixels": valid_count,
                    "nodata_pixels": nodata_count,
                    "min": float(data.min()) if valid_count > 0 else None,
                    "max": float(data.max()) if valid_count > 0 else None,
                    "mean": float(data.mean()) if valid_count > 0 else None,
                }
        except Exception as e:
            return {"error": str(e)}

    # ---- High-Level Workflow Steps ----

    def fill_depressions(
        self,
        dem_path: Union[str, Path],
        output_path: Union[str, Path],
        fix_flats: bool = True,
    ) -> HydrologyResult:
        """Fill depressions in a DEM for hydrological analysis.

        Uses the Planchon and Darboux (2001) algorithm by default.
        This ensures all cells drain to an edge of the DEM.

        Args:
            dem_path: Input DEM raster.
            output_path: Output filled DEM raster.
            fix_flats: If True, also resolve flat areas.
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        args = {
            "dem": str(dem_path),
            "output": str(output_path),
            "fix_flats": str(fix_flats).lower(),
        }
        return self._run_tool("fill_depressions", args)

    def breach_depressions(
        self,
        dem_path: Union[str, Path],
        output_path: Union[str, Path],
        max_depth: Optional[float] = None,
    ) -> HydrologyResult:
        """Breach depressions rather than filling.

        Breaching generally produces more realistic flow paths than filling,
        especially in flat areas. Uses least-cost breaching.

        Args:
            dem_path: Input DEM raster.
            output_path: Output breached DEM.
            max_depth: Maximum depth of depressions to breach (optional).
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        args = {
            "dem": str(dem_path),
            "output": str(output_path),
            "fill_pits": "true",
        }
        if max_depth is not None:
            args["max_depth"] = str(max_depth)
        return self._run_tool("breach_depressions_least_cost", args)

    def flow_direction_d8(
        self,
        filled_dem_path: Union[str, Path],
        output_path: Union[str, Path],
    ) -> HydrologyResult:
        """Calculate D8 flow direction from a conditioned DEM.

        D8 assigns flow to one of 8 neighbors based on steepest descent.
        Output values represent compass directions.

        Args:
            filled_dem_path: Hydrologically conditioned (filled/breached) DEM.
            output_path: Output flow direction raster.
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        args = {
            "dem": str(filled_dem_path),
            "output": str(output_path),
        }
        return self._run_tool("d8_pointer", args)

    def flow_accumulation_d8(
        self,
        flow_dir_path: Union[str, Path],
        output_path: Union[str, Path],
    ) -> HydrologyResult:
        """Calculate D8 flow accumulation.

        Output values represent the number of upstream cells draining through each cell.
        These are cell counts, NOT discharge, runoff volume, or flood probability.

        Args:
            flow_dir_path: D8 flow direction raster from d8_pointer.
            output_path: Output flow accumulation raster.
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        args = {
            "input": str(flow_dir_path),
            "output": str(output_path),
            "out_type": "cells",
        }
        return self._run_tool("d8_flow_accumulation", args)

    def extract_streams(
        self,
        flow_accum_path: Union[str, Path],
        output_path: Union[str, Path],
        threshold: float = 1000.0,
    ) -> HydrologyResult:
        """Extract stream/drainage network using a flow accumulation threshold.

        The threshold value determines the minimum number of upstream cells
        needed to define a stream cell. This is an arbitrary parameter that
        should be documented and calibrated for the study area.

        Args:
            flow_accum_path: Flow accumulation raster.
            output_path: Output stream raster (binary: 1=stream, 0/nodata=non-stream).
            threshold: Minimum accumulation value to be classified as a stream cell.
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        args = {
            "flow_accum": str(flow_accum_path),
            "output": str(output_path),
            "threshold": str(threshold),
        }
        return self._run_tool("extract_streams", args)

    def watershed_delineation(
        self,
        flow_dir_path: Union[str, Path],
        pour_points_path: Union[str, Path],
        output_path: Union[str, Path],
    ) -> HydrologyResult:
        """Delineate watersheds from D8 flow direction and pour points.

        Only valid when pour points (outlets) are properly snapped to the
        drainage network. Without valid pour points, this will produce
        incorrect watersheds.

        Args:
            flow_dir_path: D8 flow direction raster.
            pour_points_path: Pour points (raster or vector).
            output_path: Output watershed raster.
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        args = {
            "d8_pntr": str(flow_dir_path),
            "pour_pts": str(pour_points_path),
            "output": str(output_path),
        }
        return self._run_tool("watershed", args)

    def calculate_slope(
        self,
        dem_path: Union[str, Path],
        output_path: Union[str, Path],
        units: str = "degrees",
    ) -> HydrologyResult:
        """Calculate slope from DEM using WhiteboxTools.

        Args:
            dem_path: Input DEM raster.
            output_path: Output slope raster.
            units: 'degrees' or 'percent'.
        """
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        args = {
            "dem": str(dem_path),
            "output": str(output_path),
        }
        return self._run_tool("slope", args)

    # ---- Full Pipeline ----

    def run_hydrology_pipeline(
        self,
        dem_path: Union[str, Path],
        output_dir: Union[str, Path],
        stream_threshold: float = 1000.0,
        conditioning_method: str = "breach",
    ) -> Dict[str, HydrologyResult]:
        """Run the complete hydrological processing pipeline.

        Steps:
        1. Depression filling or breaching
        2. Flow direction (D8)
        3. Flow accumulation
        4. Stream extraction
        5. Slope calculation

        Args:
            dem_path: Input DEM raster path.
            output_dir: Directory for all outputs.
            stream_threshold: Flow accumulation threshold for stream extraction.
            conditioning_method: 'fill' or 'breach'.

        Returns:
            Dict mapping step name to HydrologyResult.
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        results = {}

        # Step 1: Condition DEM
        conditioned_path = output_dir / "dem_conditioned.tif"
        if conditioning_method == "breach":
            result = self.breach_depressions(dem_path, conditioned_path)
        else:
            result = self.fill_depressions(dem_path, conditioned_path)
        results["conditioning"] = result
        if not result.success:
            logger.error("DEM conditioning failed, aborting pipeline")
            return results

        # Step 2: Flow direction
        flow_dir_path = output_dir / "flow_direction.tif"
        result = self.flow_direction_d8(conditioned_path, flow_dir_path)
        results["flow_direction"] = result
        if not result.success:
            logger.error("Flow direction failed, aborting pipeline")
            return results

        # Step 3: Flow accumulation
        flow_accum_path = output_dir / "flow_accumulation.tif"
        result = self.flow_accumulation_d8(flow_dir_path, flow_accum_path)
        results["flow_accumulation"] = result
        if not result.success:
            logger.error("Flow accumulation failed, continuing with slope")

        # Step 4: Stream extraction
        streams_path = output_dir / "streams.tif"
        if results.get("flow_accumulation", HydrologyResult(False, None, "", {}, 0)).success:
            result = self.extract_streams(flow_accum_path, streams_path, stream_threshold)
            results["streams"] = result

        # Step 5: Slope
        slope_path = output_dir / "slope.tif"
        result = self.calculate_slope(dem_path, slope_path)
        results["slope"] = result

        return results

    # Pipeline alias
    process_dem_pipeline = run_hydrology_pipeline

