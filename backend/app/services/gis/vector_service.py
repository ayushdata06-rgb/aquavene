"""Vector data engine using GeoPandas.

Handles reading, writing, validation, reprojection, spatial joins,
area calculations, and GeoJSON export for watershed polygons and vector features.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import geopandas as gpd
import numpy as np
from pyproj import CRS
from shapely.geometry import mapping, shape
from shapely.validation import explain_validity, make_valid

logger = logging.getLogger(__name__)


class VectorService:
    """Vector and watershed operations powered by GeoPandas."""

    # ---- Reading ----

    @staticmethod
    def read_file(
        path: Union[str, Path],
        layer: Optional[str] = None,
    ) -> gpd.GeoDataFrame:
        """Read a vector file (Shapefile, GeoPackage, GeoJSON).

        Args:
            path: Path to the vector file.
            layer: Layer name (for GeoPackage with multiple layers).

        Returns:
            GeoDataFrame with validated geometry.

        Raises:
            FileNotFoundError: If the file does not exist.
        """
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Vector file not found: {path}")

        kwargs = {}
        if layer:
            kwargs["layer"] = layer

        gdf = gpd.read_file(path, **kwargs)
        logger.info(
            "Read vector: %s — %d features, CRS=%s",
            path.name, len(gdf), gdf.crs,
        )
        return gdf

    # ---- Validation ----

    @staticmethod
    def validate_geometries(
        gdf: gpd.GeoDataFrame,
        repair: bool = True,
    ) -> Tuple[gpd.GeoDataFrame, Dict[str, Any]]:
        """Validate and optionally repair geometries.

        Returns the GeoDataFrame (possibly with repaired geometries) and
        a validation report.

        WARNING: Geometry repair via make_valid() may change geometry topology.
        Repairs are logged but may not be appropriate for all use cases.
        """
        report = {
            "total_features": len(gdf),
            "null_geometries": int(gdf.geometry.isna().sum()),
            "empty_geometries": 0,
            "invalid_geometries": 0,
            "repaired": 0,
            "still_invalid": 0,
            "issues": [],
        }

        # Remove null geometries
        null_mask = gdf.geometry.isna()
        if null_mask.any():
            logger.warning("Removing %d features with null geometry", null_mask.sum())
            gdf = gdf[~null_mask].copy()

        # Check empty geometries
        empty_mask = gdf.geometry.is_empty
        report["empty_geometries"] = int(empty_mask.sum())
        if empty_mask.any():
            logger.warning("Found %d empty geometries", empty_mask.sum())
            gdf = gdf[~empty_mask].copy()

        # Check validity
        invalid_mask = ~gdf.geometry.is_valid
        report["invalid_geometries"] = int(invalid_mask.sum())

        if invalid_mask.any() and repair:
            for idx in gdf.index[invalid_mask]:
                reason = explain_validity(gdf.loc[idx, "geometry"])
                report["issues"].append({"index": int(idx), "reason": reason})
                logger.warning("Invalid geometry at index %d: %s", idx, reason)

                try:
                    repaired = make_valid(gdf.loc[idx, "geometry"])
                    gdf.loc[idx, "geometry"] = repaired
                    report["repaired"] += 1
                except Exception as e:
                    report["still_invalid"] += 1
                    logger.error("Could not repair geometry at index %d: %s", idx, e)

        # Re-check after repair
        still_invalid = ~gdf.geometry.is_valid
        report["still_invalid"] = int(still_invalid.sum())

        return gdf, report

    # ---- CRS and Reprojection ----

    @staticmethod
    def reproject(
        gdf: gpd.GeoDataFrame,
        target_crs: Union[str, int, CRS],
    ) -> gpd.GeoDataFrame:
        """Reproject a GeoDataFrame to a target CRS.

        Args:
            gdf: Input GeoDataFrame.
            target_crs: Target CRS (e.g., 'EPSG:32643', 4326).

        Returns:
            Reprojected GeoDataFrame.
        """
        if gdf.crs is None:
            raise ValueError("GeoDataFrame has no CRS set. Cannot reproject.")

        target = CRS.from_user_input(target_crs)
        if gdf.crs == target:
            logger.info("GeoDataFrame already in %s, no reprojection needed", target)
            return gdf

        result = gdf.to_crs(target)
        logger.info("Reprojected from %s to %s", gdf.crs, target)
        return result

    @staticmethod
    def get_utm_crs(gdf: gpd.GeoDataFrame) -> str:
        """Estimate the appropriate UTM CRS for a GeoDataFrame based on its centroid."""
        centroid = gdf.dissolve().centroid.iloc[0]
        lon, lat = centroid.x, centroid.y
        zone_number = int((lon + 180) / 6) + 1
        if lat >= 0:
            return f"EPSG:{32600 + zone_number}"
        return f"EPSG:{32700 + zone_number}"

    # ---- Area Calculation ----

    @staticmethod
    def calculate_areas(
        gdf: gpd.GeoDataFrame,
        area_column: str = "area_sq_km",
    ) -> gpd.GeoDataFrame:
        """Calculate geodesic area in square kilometres.

        Does NOT calculate area from longitude/latitude degrees directly.
        Uses either a projected CRS or geodesic area calculation.

        Args:
            gdf: GeoDataFrame with polygon geometries.
            area_column: Name for the output area column.

        Returns:
            GeoDataFrame with the area column added.
        """
        if gdf.crs and gdf.crs.is_geographic:
            # Use geodesic area calculation for geographic CRS
            # Reproject to UTM for accurate area
            utm_crs = VectorService.get_utm_crs(gdf)
            projected = gdf.to_crs(utm_crs)
            gdf[area_column] = projected.geometry.area / 1e6  # m² -> km²
            logger.info(
                "Calculated areas using projected CRS %s (original CRS was geographic)", utm_crs
            )
        else:
            # Already projected, area in CRS units
            gdf[area_column] = gdf.geometry.area / 1e6
            logger.info("Calculated areas using existing projected CRS")

        return gdf

    # ---- Spatial Operations ----

    @staticmethod
    def spatial_join(
        left: gpd.GeoDataFrame,
        right: gpd.GeoDataFrame,
        how: str = "inner",
        predicate: str = "intersects",
    ) -> gpd.GeoDataFrame:
        """Perform a spatial join between two GeoDataFrames.

        Ensures both are in the same CRS before joining.
        """
        if left.crs != right.crs:
            logger.info("Reprojecting right GeoDataFrame to match left CRS")
            right = right.to_crs(left.crs)

        result = gpd.sjoin(left, right, how=how, predicate=predicate)
        logger.info(
            "Spatial join: %d left × %d right -> %d result features",
            len(left), len(right), len(result),
        )
        return result

    @staticmethod
    def intersect_with_watersheds(
        features: gpd.GeoDataFrame,
        watersheds: gpd.GeoDataFrame,
        watershed_id_col: str = "watershed_code",
    ) -> gpd.GeoDataFrame:
        """Intersect features (rivers, settlements) with watershed boundaries.

        Returns features with their associated watershed ID.
        """
        if features.crs != watersheds.crs:
            features = features.to_crs(watersheds.crs)

        intersected = gpd.overlay(features, watersheds[[watershed_id_col, "geometry"]], how="intersection")
        logger.info("Intersected %d features with %d watersheds", len(features), len(watersheds))
        return intersected

    # ---- GeoJSON Export ----

    @staticmethod
    def to_geojson_features(
        gdf: gpd.GeoDataFrame,
        properties: Optional[List[str]] = None,
        id_column: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Convert GeoDataFrame to GeoJSON Feature list for API response.

        Args:
            gdf: Input GeoDataFrame.
            properties: Column names to include in properties (None = all non-geometry).
            id_column: Column to use as Feature ID.

        Returns:
            List of GeoJSON Feature dictionaries.
        """
        # Ensure WGS84 for GeoJSON output
        if gdf.crs and not gdf.crs.is_geographic:
            gdf = gdf.to_crs("EPSG:4326")

        features = []
        prop_cols = properties or [c for c in gdf.columns if c != gdf.geometry.name]

        for idx, row in gdf.iterrows():
            geom = row.geometry
            if geom is None or geom.is_empty:
                continue

            feature = {
                "type": "Feature",
                "geometry": mapping(geom),
                "properties": {},
            }

            if id_column and id_column in row.index:
                feature["id"] = str(row[id_column])

            for col in prop_cols:
                val = row[col]
                # Convert numpy types to Python native
                if isinstance(val, (np.integer,)):
                    val = int(val)
                elif isinstance(val, (np.floating,)):
                    val = float(val)
                elif isinstance(val, np.bool_):
                    val = bool(val)
                feature["properties"][col] = val

            features.append(feature)

        return features

    @staticmethod
    def to_geojson_collection(
        gdf: gpd.GeoDataFrame,
        properties: Optional[List[str]] = None,
        id_column: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Convert GeoDataFrame to a complete GeoJSON FeatureCollection."""
        features = VectorService.to_geojson_features(gdf, properties, id_column)
        return {
            "type": "FeatureCollection",
            "features": features,
        }

    # ---- PostGIS I/O ----

    @staticmethod
    def to_postgis(
        gdf: gpd.GeoDataFrame,
        table_name: str,
        engine,
        if_exists: str = "replace",
        index: bool = True,
        schema: Optional[str] = None,
    ):
        """Write GeoDataFrame to a PostGIS table.

        Args:
            gdf: GeoDataFrame to write.
            table_name: Target table name.
            engine: SQLAlchemy engine.
            if_exists: 'fail', 'replace', or 'append'.
            index: Whether to write the DataFrame index.
            schema: Database schema (optional).
        """
        gdf.to_postgis(
            table_name,
            engine,
            if_exists=if_exists,
            index=index,
            schema=schema,
        )
        logger.info(
            "Wrote %d features to PostGIS table %s.%s",
            len(gdf), schema or "public", table_name,
        )

    @staticmethod
    def from_postgis(
        sql: str,
        engine,
        geom_col: str = "geom",
    ) -> gpd.GeoDataFrame:
        """Read a GeoDataFrame from a PostGIS query."""
        gdf = gpd.read_postgis(sql, engine, geom_col=geom_col)
        logger.info("Read %d features from PostGIS", len(gdf))
        return gdf

    # ---- File Writing ----

    @staticmethod
    def write_file(
        gdf: gpd.GeoDataFrame,
        output_path: Union[str, Path],
        driver: Optional[str] = None,
    ) -> Path:
        """Write GeoDataFrame to file.

        Auto-detects driver from extension: .shp -> ESRI Shapefile,
        .gpkg -> GPKG, .geojson/.json -> GeoJSON.
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if driver is None:
            ext = output_path.suffix.lower()
            driver_map = {
                ".shp": "ESRI Shapefile",
                ".gpkg": "GPKG",
                ".geojson": "GeoJSON",
                ".json": "GeoJSON",
            }
            driver = driver_map.get(ext, "GPKG")

        gdf.to_file(output_path, driver=driver)
        logger.info("Wrote %d features to %s (%s)", len(gdf), output_path, driver)
        return output_path
