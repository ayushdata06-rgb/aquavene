"""AquaVane 5-Pillar Comprehensive Restoration Planner.

Calculates certified civil, ecological, and agro-forestry interventions across:
1. Reforestation & Native Vegetation
2. Stream & Wetland Repair (Woody debris, bio-stabilization)
3. Removing Barriers & Restoring Fish Passage
4. Erosion & Dirt Road Runoff Control
5. Regenerative Land & Farm Management
With MGNREGA-calibrated Schedule of Rates (SoR) and 3-Year Implementation Milestones.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)


class RestorationPlannerService:
    """Orchestrates prescriptive restoration across all 5 ecological & engineering pillars."""

    @classmethod
    def generate_full_plan(
        cls,
        features: Dict[str, Any],
        location: Dict[str, Any],
        score: float,
        sliders: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate comprehensive 5-pillar restoration plan, BoQ, and phased roadmap."""
        sliders = sliders or {}
        area_km2 = float(features.get("area_sq_km", 40.0))
        slope_deg = float(features.get("mean_slope_deg", 15.0))
        bare_soil = float(features.get("bare_soil_pct", 20.0))
        cropland = float(features.get("cropland_pct", 30.0))
        centroid = features.get("centroid", [15.15, 74.35])
        lat, lon = centroid[0], centroid[1]
        agro_zone = location.get("agro_climatic_zone", "Western Ghats / Deccan")
        river_basin = location.get("river_basin", "Peninsular Basin")

        # PILLAR 1: Reforestation & Native Vegetation
        pillar1 = cls._plan_reforestation(area_km2, slope_deg, bare_soil, agro_zone, lat, lon, sliders.get("reforest_pct"))

        # PILLAR 2: Stream & Wetland Repair
        pillar2 = cls._plan_stream_repair(
            area_km2, slope_deg, features.get("stream_order_max", 3), lat, lon, sliders.get("stream_repair_km")
        )

        # PILLAR 3: Removing Barriers & Fish Passage
        pillar3 = cls._plan_barrier_removal(area_km2, river_basin, lat, lon, sliders.get("barriers_removed"))

        # PILLAR 4: Erosion & Dirt Road Control
        pillar4 = cls._plan_road_and_erosion_control(
            area_km2, slope_deg, lat, lon, sliders.get("road_stabilize_km"), sliders.get("check_dams"), sliders.get("cct_pct")
        )

        # PILLAR 5: Regenerative Farming & Land Management
        pillar5 = cls._plan_farm_land_management(
            area_km2, cropland, features.get("twi_index", 8.0), lat, lon, sliders.get("cover_crop_pct")
        )

        # COMPILE BILL OF QUANTITIES (BoQ)
        all_items = (
            pillar1["boq_items"]
            + pillar2["boq_items"]
            + pillar3["boq_items"]
            + pillar4["boq_items"]
            + pillar5["boq_items"]
        )

        # Number items sequentially
        for idx, item in enumerate(all_items, 1):
            item["item_no"] = idx

        total_budget_lakhs = round(sum(item["total_cost_lakhs"] for item in all_items), 2)
        total_mandays = int(sum(item.get("mandays", 0) for item in all_items))

        # Dynamic environmental impact calculations
        reforest_lever = float(sliders.get("reforest_pct") or 0.0)
        cct_lever = float(sliders.get("cct_pct") or 0.0)
        runoff_reduction = min(68.0, round(18.0 + (slope_deg * 1.1) + (bare_soil * 0.3) + (reforest_lever * 0.15) + (cct_lever * 0.12), 1))
        soil_reduction = min(82.0, round(25.0 + (bare_soil * 0.6) + (reforest_lever * 0.22) + (cct_lever * 0.18), 1))

        soil_loss_pre = round(float(features.get("soil_loss_t_ha_yr", 32.4)), 1)
        soil_loss_post = round(max(1.8, soil_loss_pre * (1.0 - (soil_reduction / 100.0))), 1)

        # PHASED 3-YEAR IMPLEMENTATION ROADMAP
        roadmap = cls._generate_phased_roadmap(total_budget_lakhs)

        return {
            "summary": {
                "catchment_name": location.get("display_name", location.get("name", "Catchment")),
                "district": location.get("district", "District"),
                "state": location.get("state", "State"),
                "river_basin": river_basin,
                "urgency_score": round(score, 1),
                "total_budget_lakhs_inr": total_budget_lakhs,
                "total_mgnrega_mandays": total_mandays,
                "projected_runoff_reduction_pct": runoff_reduction,
                "projected_soil_loss_reduction_pct": soil_reduction,
                "soil_loss_pre_t_ha_yr": soil_loss_pre,
                "soil_loss_post_t_ha_yr": soil_loss_post,
                "implementation_years": 3,
                "scheme": "MGNREGA / State Forest SoR",
            },
            "pillar1_reforestation": pillar1,
            "pillar2_stream_wetland": pillar2,
            "pillar3_barriers_fish": pillar3,
            "pillar4_erosion_roads": pillar4,
            "pillar5_regenerative_farming": pillar5,
            "bill_of_quantities": all_items,
            "implementation_roadmap": roadmap,
        }

    @classmethod
    def _plan_reforestation(
        cls,
        area_km2: float,
        slope: float,
        bare_soil: float,
        agro_zone: str,
        lat: float,
        lon: float,
        reforest_lever: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Pillar 1: Native species, vetiver buffers, ridge afforestation."""
        if reforest_lever is not None and reforest_lever > 0:
            afforest_ha = round(max(1.0, area_km2 * (float(reforest_lever) / 100.0) * 8.0), 1)
        else:
            afforest_ha = round(max(3.0, area_km2 * (bare_soil / 100.0) * 8.0), 1)

        riparian_km = round(max(1.2, area_km2 * 0.6), 1)

        # Select native species by agro-climatic zone
        if "Western Ghats" in agro_zone or "Peninsular" in agro_zone:
            species = [
                {"name": "Jamun (Syzygium cumini)", "role": "Riparian canopy & bank root holding"},
                {"name": "Arjun (Terminalia arjuna)", "role": "Water-cooling riparian tree"},
                {"name": "Bamboo (Bambusa bambos)", "role": "High-tensile bank bio-shield"},
                {"name": "Vetiver Grass (Chrysopogon zizanioides)", "role": "Sediment filtering contour hedge"},
            ]
        elif "Dry" in agro_zone or "Arid" in agro_zone:
            species = [
                {"name": "Khejri (Prosopis cineraria)", "role": "Deep root moisture retention"},
                {"name": "Neem (Azadirachta indica)", "role": "Hardy drought-tolerant upper cover"},
                {"name": "Babool (Vachellia nilotica)", "role": "Gully bank stabilization"},
                {"name": "Cenchrus ciliaris (Dhaman)", "role": "Dense ground pasture binder"},
            ]
        else:
            species = [
                {"name": "Neem (Azadirachta indica)", "role": "Pest-resistant watershed canopy"},
                {"name": "Mahua (Madhuca longifolia)", "role": "Community non-timber forest product"},
                {"name": "Karanj (Pongamia pinnata)", "role": "Nitrogen-fixing stream border"},
                {"name": "Vetiver Grass", "role": "Continuous contour sediment barrier"},
            ]

        # BoQ Calculation
        plant_cost = round(afforest_ha * 0.65, 2)  # ₹65,000 per ha
        buffer_cost = round(riparian_km * 0.45, 2)

        plant_mandays = int(afforest_ha * 200)
        buffer_mandays = int(riparian_km * 80)

        return {
            "title": "Reforestation & Native Vegetation",
            "afforestation_area_ha": afforest_ha,
            "riparian_buffer_km": riparian_km,
            "target_zone": "Upper denuded ridges and 20m stream setbacks",
            "recommended_species": species,
            "ecological_benefit": "Forms a multi-tier canopy to dissipate rainfall kinetic energy, cool stream water temperatures by 2-4°C, and anchor unstable slopes.",
            "boq_items": [
                {
                    "item_code": "SOR-P1-01",
                    "pillar": "Pillar 1: Reforestation & Native Vegetation",
                    "description": f"Ridge Afforestation & Sapling Plantation ({afforest_ha} ha @ 800 saplings/ha)",
                    "quantity": f"{afforest_ha} ha",
                    "unit": "ha",
                    "unit_rate_lakhs": 0.65,
                    "total_cost_lakhs": plant_cost,
                    "mandays": plant_mandays,
                    "scheme": "State Forest / CAMPA",
                },
                {
                    "item_code": "SOR-P1-02",
                    "pillar": "Pillar 1: Reforestation & Native Vegetation",
                    "description": f"Vetiver Grass Riparian Buffer Hedge ({riparian_km} km along stream banks)",
                    "quantity": f"{riparian_km} km",
                    "unit": "km",
                    "unit_rate_lakhs": 0.45,
                    "total_cost_lakhs": buffer_cost,
                    "mandays": buffer_mandays,
                    "scheme": "MGNREGA",
                },
            ],
            "coordinates": [round(lat + 0.007, 5), round(lon - 0.006, 5)],
        }

    @classmethod
    def _plan_stream_repair(
        cls,
        area_km2: float,
        slope: float,
        stream_order: int,
        lat: float,
        lon: float,
        stream_repair_lever: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Pillar 2: Floodplain reconnection & bio-engineered large woody debris."""
        reconnect_ha = round(max(1.5, area_km2 * 0.35), 1)
        lwd_units = max(4, int(area_km2 * 1.5))
        if stream_repair_lever is not None and stream_repair_lever > 0:
            coir_km = round(float(stream_repair_lever), 1)
        else:
            coir_km = round(max(0.8, area_km2 * 0.4), 1)

        lwd_cost = round(lwd_units * 0.35, 2)
        coir_cost = round(coir_km * 1.80, 2)
        lwd_mandays = int(lwd_units * 30)
        coir_mandays = int(coir_km * 120)

        return {
            "title": "Stream & Wetland Bio-Repair",
            "floodplain_reconnection_ha": reconnect_ha,
            "large_woody_debris_structures": lwd_units,
            "coir_geotextile_km": coir_km,
            "target_zone": f"Order {stream_order} main stream and mid-reach seasonal floodplains",
            "restoration_actions": [
                "Set back channelized agricultural levees to restore seasonal flood dissipation zones.",
                "Anchor engineered Large Woody Debris (LWD) and root wads to create scouring pools for aquatic life.",
                "Install biodegradable coir geotextile mats pre-seeded with native hygrophytic grasses on vertical banks.",
            ],
            "boq_items": [
                {
                    "item_code": "SOR-P2-01",
                    "pillar": "Pillar 2: Stream & Wetland Repair",
                    "description": f"Large Woody Debris (LWD) & Root Wad In-Stream Flow Baffles ({lwd_units} units)",
                    "quantity": f"{lwd_units} units",
                    "unit": "units",
                    "unit_rate_lakhs": 0.35,
                    "total_cost_lakhs": lwd_cost,
                    "mandays": lwd_mandays,
                    "scheme": "MGNREGA / CWC",
                },
                {
                    "item_code": "SOR-P2-02",
                    "pillar": "Pillar 2: Stream & Wetland Repair",
                    "description": f"Coir Geotextile Bio-Engineered Bank Armoring ({coir_km} km)",
                    "quantity": f"{coir_km} km",
                    "unit": "km",
                    "unit_rate_lakhs": 1.80,
                    "total_cost_lakhs": coir_cost,
                    "mandays": coir_mandays,
                    "scheme": "State Irrigation / MGNREGA",
                },
            ],
            "coordinates": [round(lat - 0.003, 5), round(lon + 0.002, 5)],
        }

    @classmethod
    def _plan_barrier_removal(
        cls, area_km2: float, basin: str, lat: float, lon: float, barriers_lever: Optional[int] = None
    ) -> Dict[str, Any]:
        """Pillar 3: Removing obsolete weirs and modifying perched culverts for fish migration."""
        if barriers_lever is not None and barriers_lever > 0:
            culverts_to_fix = int(barriers_lever)
        else:
            culverts_to_fix = max(1, int(area_km2 * 0.3) + 1)

        cost_culvert = round(culverts_to_fix * 1.25, 2)
        culvert_mandays = int(culverts_to_fix * 150)

        return {
            "title": "Barrier Removal & Free Fish Migration",
            "barriers_identified": culverts_to_fix,
            "target_zone": "Choked road stream crossings and silted obsolete check weirs",
            "restoration_actions": [
                "De-silt and widen restrictive pipe culverts into open-bottom box culverts to match natural stream width.",
                "Construct step-pool rock ramps on existing drops > 0.5m so indigenous fish can swim upstream to spawn.",
                "Restore sediment continuity to prevent downstream channel incision and bed starvation.",
            ],
            "migratory_species_benefited": "Mahseer (Tor tor), Freshwater Eel (Anguilla), Indian Trout (Salmostoma), and local Barbs",
            "boq_items": [
                {
                    "item_code": "SOR-P3-01",
                    "pillar": "Pillar 3: Barrier Removal & Fish Passage",
                    "description": f"Ecological Culvert Retrofit & Fish-Passable Open Bottom Box Structures ({culverts_to_fix} sites)",
                    "quantity": f"{culverts_to_fix} units",
                    "unit": "units",
                    "unit_rate_lakhs": 1.25,
                    "total_cost_lakhs": cost_culvert,
                    "mandays": culvert_mandays,
                    "scheme": "PWD / Fisheries Department",
                },
            ],
            "coordinates": [round(lat - 0.005, 5), round(lon - 0.001, 5)],
        }

    @classmethod
    def _plan_road_and_erosion_control(
        cls,
        area_km2: float,
        slope: float,
        lat: float,
        lon: float,
        road_stabilize_lever: Optional[float] = None,
        check_dams_lever: Optional[int] = None,
        cct_lever: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Pillar 4: Dirt road runoff diversion, water bars, gully plugs, continuous contour trenches."""
        if road_stabilize_lever is not None and road_stabilize_lever > 0:
            road_km = round(float(road_stabilize_lever), 1)
        else:
            road_km = round(max(1.0, area_km2 * 0.45), 1)

        water_bars_count = int(road_km * 6)

        if check_dams_lever is not None and check_dams_lever > 0:
            gully_plugs = int(check_dams_lever)
        else:
            gully_plugs = max(3, int(area_km2 * 1.8))

        cct_pct = float(cct_lever) if cct_lever is not None and float(cct_lever) > 0 else 25.0
        cct_km = round(max(1.0, area_km2 * (cct_pct / 100.0) * 1.2), 1)

        road_cost = round(road_km * 1.10, 2)
        gully_cost = round(gully_plugs * 0.25, 2)
        cct_cost = round(cct_km * 0.85, 2)

        road_mandays = int(road_km * 90)
        gully_mandays = int(gully_plugs * 45)
        cct_mandays = int(cct_km * 88)

        return {
            "title": "Erosion & Dirt Road Runoff Control",
            "unpaved_roads_stabilized_km": road_km,
            "water_bars_planned": water_bars_count,
            "gully_plugs_count": gully_plugs,
            "cct_km": cct_km,
            "target_zone": "Unpaved hillside access tracks, upper slopes and active secondary gully incisions",
            "restoration_actions": [
                f"Install {water_bars_count} diagonal earth/timber water bars to eject storm sheetwash into vegetated filters.",
                "Construct broad-based dips and armored outfall turnouts to stop road ditch gully expansion.",
                f"Erect {gully_plugs} dry stone loose boulder gully plugs along first-order ravines.",
                f"Excavate {cct_km} km Continuous Contour Trenches (0.5m x 0.5m) along upper ridges to capture rainfall runoff.",
            ],
            "boq_items": [
                {
                    "item_code": "SOR-P4-01",
                    "pillar": "Pillar 4: Erosion & Dirt Road Control",
                    "description": f"Dirt Road Runoff Interception (Water bars, ditch turnouts & gravel stabilization for {road_km} km)",
                    "quantity": f"{road_km} km",
                    "unit": "km",
                    "unit_rate_lakhs": 1.10,
                    "total_cost_lakhs": road_cost,
                    "mandays": road_mandays,
                    "scheme": "PMGSY / Rural Development",
                },
                {
                    "item_code": "SOR-P4-02",
                    "pillar": "Pillar 4: Erosion & Dirt Road Control",
                    "description": f"Dry Boulder & Loose Stone Gully Plugs ({gully_plugs} structures)",
                    "quantity": f"{gully_plugs} units",
                    "unit": "units",
                    "unit_rate_lakhs": 0.25,
                    "total_cost_lakhs": gully_cost,
                    "mandays": gully_mandays,
                    "scheme": "MGNREGA",
                },
                {
                    "item_code": "SOR-P4-03",
                    "pillar": "Pillar 4: Erosion & Dirt Road Control",
                    "description": f"Continuous Contour Trenches (CCT) along slope contours ({cct_km} km @ 0.5m x 0.5m)",
                    "quantity": f"{cct_km} km",
                    "unit": "km",
                    "unit_rate_lakhs": 0.85,
                    "total_cost_lakhs": cct_cost,
                    "mandays": cct_mandays,
                    "scheme": "MGNREGA",
                },
            ],
            "coordinates": [round(lat + 0.004, 5), round(lon + 0.005, 5)],
        }

    @classmethod
    def _plan_farm_land_management(
        cls,
        area_km2: float,
        cropland_pct: float,
        twi: float,
        lat: float,
        lon: float,
        cover_crop_lever: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Pillar 5: Regenerative agriculture, cover cropping, contour bunding, farm ponds."""
        if cover_crop_lever is not None and cover_crop_lever > 0:
            participating_ha = round(max(5.0, area_km2 * (float(cover_crop_lever) / 100.0) * 15.0), 1)
        else:
            participating_ha = round(max(10.0, area_km2 * (cropland_pct / 100.0) * 15.0), 1)

        ponds_count = max(1, min(6, int(area_km2 * 0.25)))

        farm_incentive_cost = round(participating_ha * 0.12, 2)  # ₹12,000/ha subsidy
        pond_cost = round(ponds_count * 2.20, 2)

        farm_mandays = int(participating_ha * 25)
        pond_mandays = int(ponds_count * 530)

        return {
            "title": "Regenerative Farm & Soil Management",
            "cropland_enrolled_ha": participating_ha,
            "community_farm_ponds": ponds_count,
            "target_zone": "Mid-reach agricultural lands and natural surface depressions",
            "restoration_actions": [
                "Establish legume cover crops (Sunnhemp / Cowpea) during fallow windows to fix nitrogen and prevent bare soil bake.",
                "Subsidize zero-till seed drills to eliminate topsoil pulverization and chemical runoff.",
                f"Excavate {ponds_count} community percolation farm ponds ($1,500\\text{{ m}}^3$ each) in high-TWI depressions.",
            ],
            "boq_items": [
                {
                    "item_code": "SOR-P5-01",
                    "pillar": "Pillar 5: Regenerative Farming & Land Management",
                    "description": f"Cover Cropping & Conservation Tillage Farmer Partnership Subsidy ({participating_ha} ha)",
                    "quantity": f"{participating_ha} ha",
                    "unit": "ha",
                    "unit_rate_lakhs": 0.12,
                    "total_cost_lakhs": farm_incentive_cost,
                    "mandays": farm_mandays,
                    "scheme": "PMKSY / Agriculture Dept",
                },
                {
                    "item_code": "SOR-P5-02",
                    "pillar": "Pillar 5: Regenerative Farming & Land Management",
                    "description": f"Community Farm Ponds & Percolation Units ({ponds_count} units @ 1,500 m³ capacity)",
                    "quantity": f"{ponds_count} units",
                    "unit": "units",
                    "unit_rate_lakhs": 2.20,
                    "total_cost_lakhs": pond_cost,
                    "mandays": pond_mandays,
                    "scheme": "MGNREGA / Jal Shakti",
                },
            ],
            "coordinates": [round(lat + 0.001, 5), round(lon + 0.007, 5)],
        }

    @classmethod
    def _generate_phased_roadmap(cls, total_budget: float) -> List[Dict[str, Any]]:
        """Phased multi-year implementation milestones."""
        y1_budget = round(total_budget * 0.45, 2)
        y2_budget = round(total_budget * 0.40, 2)
        y3_budget = round(total_budget * 0.15, 2)

        return [
            {
                "phase": "Year 1 (Foundation & Erosion Arrest)",
                "budget_lakhs": y1_budget,
                "focus": "Dirt road drainage, water bars, gully plugs, culvert retrofits, and contour trench excavation before monsoon.",
                "milestones": [
                    "Survey and benchmark all unpaved roads and stream barrier sites.",
                    "Complete 100% of water bars and dry stone gully plugs.",
                    "Retrofit critical perched culverts for fish passage.",
                    "Pre-monsoon pitting and soil preparation on upper ridges.",
                ],
            },
            {
                "phase": "Year 2 (Vegetation & Stream Bio-Repair)",
                "budget_lakhs": y2_budget,
                "focus": "Native tree planting, coir bank geotextile placement, large woody debris anchor, and farmer cover-crop rollout.",
                "milestones": [
                    "Plant 800 native saplings/ha with community protection fences.",
                    "Establish continuous Vetiver grass hedges along riparian buffer.",
                    "Install large woody debris deflectors and bio-engineered bank coir mats.",
                    "Distribute cover crop seed kits to enrolled watershed farmers.",
                ],
            },
            {
                "phase": "Year 3 (Stewardship, Monitoring & Handover)",
                "budget_lakhs": y3_budget,
                "focus": "Sapling replacement for >85% survival rate, silt trap cleanouts, groundwater well monitoring, and Gram Panchayat handover.",
                "milestones": [
                    "Conduct survival audit for plantations and perform gap filling.",
                    "Measure peak discharge reduction in stream gauge post-monsoon.",
                    "Train village water user committees for annual maintenance.",
                    "Submit final Detailed Project Report (DPR) closure report to district authority.",
                ],
            },
        ]

