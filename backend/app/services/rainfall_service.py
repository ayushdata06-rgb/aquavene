"""Rainfall processing service using Xarray and netCDF4.

Handles ERA5-Land precipitation data inspection, reading, and aggregation.

IMPORTANT:
- ERA5-Land total precipitation is in metres (per hour for hourly data).
- Accumulation semantics depend on the dataset variant.
- Always verify units and conventions before aggregation.
- Never assume hourly values can be summed without checking.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import xarray as xr

logger = logging.getLogger(__name__)


class RainfallService:
    """ERA5-Land precipitation data processing."""

    @staticmethod
    def inspect_netcdf(path: Union[str, Path]) -> Dict[str, Any]:
        """Inspect a NetCDF file and return metadata.

        Returns variable names, dimensions, time range, CRS info,
        and identified precipitation variables.
        """
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"NetCDF file not found: {path}")

        with xr.open_dataset(path) as ds:
            info = {
                "path": str(path),
                "variables": list(ds.data_vars),
                "dimensions": {dim: size for dim, size in ds.dims.items()},
                "coordinates": list(ds.coords),
                "attributes": dict(ds.attrs),
            }

            # Time range
            if "time" in ds.coords:
                time_vals = ds.coords["time"].values
                info["time_range"] = {
                    "start": str(np.datetime_as_string(time_vals[0], unit="D")),
                    "end": str(np.datetime_as_string(time_vals[-1], unit="D")),
                    "steps": len(time_vals),
                }

            # Spatial info
            for lat_name in ["latitude", "lat"]:
                if lat_name in ds.coords:
                    lat_vals = ds.coords[lat_name].values
                    info["latitude_range"] = {
                        "min": float(lat_vals.min()),
                        "max": float(lat_vals.max()),
                        "resolution": float(abs(np.diff(lat_vals).mean())) if len(lat_vals) > 1 else None,
                    }
                    break

            for lon_name in ["longitude", "lon"]:
                if lon_name in ds.coords:
                    lon_vals = ds.coords[lon_name].values
                    info["longitude_range"] = {
                        "min": float(lon_vals.min()),
                        "max": float(lon_vals.max()),
                        "resolution": float(abs(np.diff(lon_vals).mean())) if len(lon_vals) > 1 else None,
                    }
                    break

            # Precipitation variable detection
            precip_candidates = ["tp", "total_precipitation", "precip", "pr"]
            found_precip = None
            for var_name in precip_candidates:
                if var_name in ds.data_vars:
                    found_precip = var_name
                    var = ds[var_name]
                    info["precipitation_variable"] = {
                        "name": var_name,
                        "units": var.attrs.get("units", "unknown"),
                        "long_name": var.attrs.get("long_name", ""),
                        "shape": list(var.shape),
                        "dtype": str(var.dtype),
                    }
                    break

            if not found_precip:
                info["precipitation_variable"] = None
                info["warning"] = (
                    f"No recognised precipitation variable found. "
                    f"Available: {list(ds.data_vars)}"
                )

        logger.info("Inspected NetCDF: %s — vars=%s", path.name, info["variables"])
        return info

    @staticmethod
    def extract_monthly_precip(
        path: Union[str, Path],
        lat_range: Optional[Tuple[float, float]] = None,
        lon_range: Optional[Tuple[float, float]] = None,
        precip_var: str = "tp",
    ) -> xr.DataArray:
        """Extract monthly precipitation totals from ERA5-Land NetCDF.

        ERA5-Land total precipitation (tp) is in metres per hour (for hourly data)
        or metres per accumulation step. This method:
        1. Checks the time resolution.
        2. Converts to mm (multiply by 1000 if in metres).
        3. Resamples to monthly totals.

        IMPORTANT: Verify the accumulation convention of your specific dataset.

        Args:
            path: Path to the NetCDF file.
            lat_range: (min_lat, max_lat) for spatial subset.
            lon_range: (min_lon, max_lon) for spatial subset.
            precip_var: Name of the precipitation variable.

        Returns:
            Monthly precipitation DataArray in mm.
        """
        with xr.open_dataset(path) as ds:
            if precip_var not in ds.data_vars:
                available = list(ds.data_vars)
                raise ValueError(
                    f"Variable '{precip_var}' not found. Available: {available}"
                )

            da = ds[precip_var]

            # Check units
            units = da.attrs.get("units", "unknown")
            logger.info("Precipitation units: %s", units)

            # Spatial subsetting
            lat_name = "latitude" if "latitude" in ds.coords else "lat"
            lon_name = "longitude" if "longitude" in ds.coords else "lon"

            if lat_range:
                da = da.sel({lat_name: slice(max(lat_range), min(lat_range))})
            if lon_range:
                da = da.sel({lon_name: slice(min(lon_range), max(lon_range))})

            # Convert units: ERA5-Land tp is in metres, convert to mm
            if units in ("m", "metres", "meters"):
                da = da * 1000.0
                da.attrs["units"] = "mm"
            elif units in ("mm",):
                pass  # Already in mm
            else:
                logger.warning(
                    "Unknown precipitation units '%s'. Assuming metres, converting to mm.",
                    units,
                )
                da = da * 1000.0
                da.attrs["units"] = "mm (assumed conversion from metres)"

            # Check time resolution
            if "time" in da.dims and len(da.time) > 1:
                time_diff = np.diff(da.time.values)
                median_hours = np.median(time_diff.astype("timedelta64[h]").astype(float))
                logger.info("Median time step: %.1f hours", median_hours)

                if median_hours <= 1.5:
                    # Hourly data — sum to monthly
                    monthly = da.resample(time="ME").sum(dim="time", skipna=True)
                elif median_hours <= 25:
                    # Daily data — sum to monthly
                    monthly = da.resample(time="ME").sum(dim="time", skipna=True)
                else:
                    # Already monthly or longer — spatial mean only
                    monthly = da
            else:
                monthly = da

            # Load into memory for this subset
            return monthly.load()

    @staticmethod
    def watershed_monthly_stats(
        monthly_precip: xr.DataArray,
        bounds: Tuple[float, float, float, float],
    ) -> Dict[str, Any]:
        """Calculate monthly precipitation statistics for a watershed bounding box.

        Args:
            monthly_precip: Monthly precipitation DataArray.
            bounds: (min_lon, min_lat, max_lon, max_lat) of the watershed.

        Returns:
            Dict with monthly values, annual total, and coverage info.
        """
        min_lon, min_lat, max_lon, max_lat = bounds

        lat_name = "latitude" if "latitude" in monthly_precip.coords else "lat"
        lon_name = "longitude" if "longitude" in monthly_precip.coords else "lon"

        # Subset to watershed bounds
        subset = monthly_precip.sel(
            {lat_name: slice(max_lat, min_lat), lon_name: slice(min_lon, max_lon)}
        )

        if subset.size == 0:
            return {
                "monthly_values": [],
                "annual_total_mm": None,
                "data_coverage": 0.0,
                "warning": "No data within watershed bounds.",
            }

        # Spatial mean for each month
        spatial_mean = subset.mean(dim=[lat_name, lon_name], skipna=True)

        # Build monthly series
        monthly_values = []
        if "time" in spatial_mean.dims:
            for t in spatial_mean.time.values:
                val = float(spatial_mean.sel(time=t).values)
                date_str = str(np.datetime_as_string(t, unit="M"))
                monthly_values.append({
                    "date": date_str,
                    "precipitation_mm": round(val, 2) if not np.isnan(val) else None,
                })

        # Annual total
        valid_monthly = [
            mv["precipitation_mm"]
            for mv in monthly_values
            if mv["precipitation_mm"] is not None
        ]
        annual_total = sum(valid_monthly) if valid_monthly else None

        # Coverage
        total_months = len(monthly_values)
        valid_months = len(valid_monthly)
        coverage = valid_months / total_months if total_months > 0 else 0.0

        return {
            "monthly_values": monthly_values,
            "annual_total_mm": round(annual_total, 2) if annual_total else None,
            "mean_monthly_mm": round(annual_total / valid_months, 2) if valid_months > 0 and annual_total else None,
            "data_coverage": round(coverage, 2),
            "months_available": valid_months,
            "total_months": total_months,
        }

    @staticmethod
    def aggregate_monthly(path: Union[str, Path]) -> List[Dict[str, Any]]:
        """Aggregate precipitation NetCDF into monthly totals list."""
        da = RainfallService.extract_monthly_precip(path)
        if "time" in da.dims:
            monthly_list = []
            for t in da.time.values:
                val = float(da.sel(time=t).mean().values)
                date_str = str(np.datetime_as_string(t, unit="M"))
                monthly_list.append({
                    "date": date_str,
                    "precipitation_mm": round(val, 2) if not np.isnan(val) else 0.0,
                })
            return monthly_list
        return [{"date": "2024-01", "precipitation_mm": float(da.mean().values)}]

    @staticmethod
    def create_synthetic_netcdf(output_path: Union[str, Path]) -> Path:
        """Create a synthetic ERA5-Land NetCDF file for pipeline and tests."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        import pandas as pd
        times = pd.date_range("2024-01-01", periods=12, freq="MS")
        lats = np.linspace(16.0, 15.0, 10)
        lons = np.linspace(74.0, 75.0, 10)
        # Precipitation values in meters (m) to test m -> mm conversion
        data = np.random.uniform(0.01, 0.40, size=(12, 10, 10)).astype(np.float32)
        ds = xr.Dataset(
            data_vars={"tp": (["time", "latitude", "longitude"], data, {"units": "m"})},
            coords={"time": times, "latitude": lats, "longitude": lons},
            attrs={"Conventions": "CF-1.6", "institution": "ECMWF", "title": "Synthetic ERA5-Land"},
        )
        ds.to_netcdf(output_path)
        return output_path

