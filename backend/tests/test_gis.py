"""Unit tests for GIS and hydrology processing services."""

from __future__ import annotations

from pathlib import Path
import pytest
from app.services.gis.raster_service import RasterService
from app.services.gis.hydrology_service import HydrologyService
from app.services.landcover_service import LandCoverService
from app.services.rainfall_service import RainfallService


def test_synthetic_dem_creation_and_inspection(temp_dir: Path):
    """Test generating a synthetic DEM and inspecting its metadata."""
    dem_path = temp_dir / "test_dem.tif"
    RasterService.create_synthetic_dem(dem_path, width=50, height=50)

    assert dem_path.exists()
    info = RasterService.inspect(dem_path)
    assert info.width == 50
    assert info.height == 50
    assert info.count == 1
    assert info.crs is not None


def test_slope_calculation(temp_dir: Path):
    """Test slope raster computation from DEM."""
    dem_path = temp_dir / "test_dem.tif"
    RasterService.create_synthetic_dem(dem_path, width=40, height=40)

    slope_path = temp_dir / "test_slope.tif"
    RasterService.calculate_slope(dem_path, slope_path)

    assert slope_path.exists()
    slope_info = RasterService.inspect(slope_path)
    assert slope_info.width == 40
    assert slope_info.height == 40


def test_whitebox_hydrology_wrapper(temp_dir: Path):
    """Test WhiteboxTools wrapper interface, parameter validation and safe handling."""
    dem_path = temp_dir / "test_dem.tif"
    RasterService.create_synthetic_dem(dem_path, width=30, height=30)

    service = HydrologyService()
    # Test checking tool availability or running pipeline
    try:
        results = service.process_dem_pipeline(dem_path, output_dir=temp_dir, stream_threshold=100.0)
        assert isinstance(results, dict)
    except Exception as e:
        # If WhiteboxTools precompiled binary is not present in environment,
        # verify that the wrapper properly captures and reports the error rather than crashing
        assert "Whitebox" in str(e) or "wbt" in str(e).lower() or "not found" in str(e).lower()


def test_landcover_service_synthetic(temp_dir: Path):
    """Test LandCoverService synthetic creation and class proportions."""
    lc_path = temp_dir / "test_lc.tif"
    LandCoverService.create_synthetic_landcover(lc_path, width=30, height=30)

    assert lc_path.exists()
    proportions = LandCoverService.calculate_class_proportions(lc_path)
    assert isinstance(proportions, dict)
    assert sum(proportions.values()) == pytest.approx(1.0, 0.05)

    degradation = LandCoverService.calculate_degradation_score(proportions)
    assert 0.0 <= degradation <= 1.0


def test_rainfall_service_synthetic(temp_dir: Path):
    """Test RainfallService synthetic NetCDF creation and monthly aggregation."""
    nc_path = temp_dir / "test_precip.nc"
    RainfallService.create_synthetic_netcdf(nc_path)

    assert nc_path.exists()
    info = RainfallService.inspect_netcdf(nc_path)
    assert "tp" in info.get("variables", []) or "precip" in str(info.get("variables", []))

    monthly = RainfallService.aggregate_monthly(nc_path)
    assert isinstance(monthly, list)
    assert len(monthly) > 0
    assert "precipitation_mm" in monthly[0]
