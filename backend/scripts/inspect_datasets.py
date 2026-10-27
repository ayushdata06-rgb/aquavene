"""Inspect available raw datasets and report metadata.

Usage: python -m scripts.inspect_datasets
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.services.gis.raster_service import RasterService
from app.services.rainfall_service import RainfallService

DATASET_PATHS = {
    "srtm": "raw/srtm",
    "copernicus": "raw/copernicus",
    "worldcover": "raw/worldcover",
    "india_wris": "raw/india_wris",
    "population": "raw/population",
}

RASTER_EXTENSIONS = {".tif", ".tiff", ".geotiff"}
NETCDF_EXTENSIONS = {".nc", ".nc4", ".netcdf"}
VECTOR_EXTENSIONS = {".shp", ".gpkg", ".geojson", ".json"}


def file_checksum(path: Path, algorithm: str = "sha256") -> str:
    """Calculate file checksum."""
    h = hashlib.new(algorithm)
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def inspect_file(path: Path) -> dict:
    """Inspect a single data file based on its extension."""
    ext = path.suffix.lower()
    result = {
        "path": str(path),
        "name": path.name,
        "size_mb": round(path.stat().st_size / 1e6, 2),
        "extension": ext,
    }

    try:
        if ext in RASTER_EXTENSIONS:
            info = RasterService.inspect(path)
            result.update({
                "type": "raster",
                "width": info.width,
                "height": info.height,
                "bands": info.count,
                "crs": info.crs,
                "resolution": info.resolution,
                "nodata": info.nodata,
                "dtype": info.dtype,
                "bounds": info.bounds,
            })
        elif ext in NETCDF_EXTENSIONS:
            info = RainfallService.inspect_netcdf(path)
            result.update({"type": "netcdf", **info})
        elif ext in VECTOR_EXTENSIONS:
            import geopandas as gpd
            gdf = gpd.read_file(path)
            result.update({
                "type": "vector",
                "features": len(gdf),
                "crs": str(gdf.crs),
                "columns": list(gdf.columns),
                "geometry_types": list(gdf.geometry.geom_type.unique()),
            })
        else:
            result["type"] = "unknown"
    except Exception as e:
        result["error"] = str(e)

    return result


def main():
    settings = get_settings()
    data_dir = settings.data_path
    print(f"\n{'='*60}")
    print(f"AquaVane Dataset Inspector")
    print(f"Data directory: {data_dir}")
    print(f"{'='*60}\n")

    for name, rel_path in DATASET_PATHS.items():
        full_path = data_dir / rel_path
        print(f"\n--- {name.upper()} ({full_path}) ---")

        if not full_path.exists():
            print(f"  Directory not found. Create and add source files.")
            continue

        files = list(full_path.rglob("*"))
        data_files = [f for f in files if f.is_file() and f.suffix.lower() in
                      RASTER_EXTENSIONS | NETCDF_EXTENSIONS | VECTOR_EXTENSIONS]

        if not data_files:
            print(f"  No recognized data files found.")
            continue

        for f in data_files:
            info = inspect_file(f)
            print(f"\n  {info['name']} ({info['size_mb']} MB)")
            if info.get("type") == "raster":
                print(f"    Type: {info['type']}, Size: {info['width']}x{info['height']}, "
                      f"Bands: {info['bands']}, CRS: {info['crs']}")
                print(f"    Resolution: {info['resolution']}, NoData: {info['nodata']}")
            elif info.get("type") == "netcdf":
                print(f"    Type: netcdf, Variables: {info.get('variables', [])}")
                if "time_range" in info:
                    print(f"    Time: {info['time_range']}")
            elif info.get("type") == "vector":
                print(f"    Type: vector, Features: {info['features']}, CRS: {info['crs']}")
            if "error" in info:
                print(f"    ERROR: {info['error']}")


if __name__ == "__main__":
    main()
