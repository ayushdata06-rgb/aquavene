import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Compass,
  Search,
  Sliders,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Undo2,
  CheckCircle2,
  Info,
  Waves,
  Mountain,
  Trees,
  ShieldAlert,
  Fish,
  Shield,
  BookOpen,
  CloudRain,
  Activity,
  Maximize2,
  HelpCircle,
  X,
  ExternalLink,
  TrendingDown,
  Gauge,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useResearch, FourPointMarker } from '../context/ResearchContext';
import { FIXTURE_WATERSHEDS } from '../api/client';

export const MapTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeArea,
    fourPoints,
    addFourPoint,
    updateFourPoint,
    removeLastFourPoint,
    clearFourPoints,
    analyzeFourPointsAOI,
    selectWatershed,
    loadPresetCatchment,
    isAnalyzing,
  } = useResearch();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Basemap & Layer states (100% Free, Zero API Key Leaflet Tile Layers)
  const [activeBasemap, setActiveBasemap] = useState<'osm' | 'terrain' | 'dark' | 'light'>('osm');
  const [layerOpacity, setLayerOpacity] = useState<number>(90);
  const [showStreams, setShowStreams] = useState<boolean>(true);
  const [showFlowVectors, setShowFlowVectors] = useState<boolean>(true);
  const [showVegetation, setShowVegetation] = useState<boolean>(true);
  const [showBarriers, setShowBarriers] = useState<boolean>(true);
  const [showDirtRoads, setShowDirtRoads] = useState<boolean>(true);
  const [showWorks, setShowWorks] = useState<boolean>(true);
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(8);

  // Live map rain slider
  const [simulatedRainfallMm, setSimulatedRainfallMm] = useState<number>(45);

  // UI Interactive Drawers & Modals
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<{
    category: 'stream' | 'barrier' | 'road' | 'vegetation' | 'station';
    title: string;
    properties: Record<string, any>;
  } | null>(null);

  // Hovered station on elevation chart for map pin
  const [activeHoverStation, setActiveHoverStation] = useState<{ lat: number; lon: number; name: string } | null>(null);

  // Leaflet Layer References
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const streamsLayerRef = useRef<L.GeoJSON | null>(null);
  const flowVectorsLayerRef = useRef<L.LayerGroup | null>(null);
  const vegetationLayerRef = useRef<L.GeoJSON | null>(null);
  const barriersLayerRef = useRef<L.LayerGroup | null>(null);
  const dirtRoadsLayerRef = useRef<L.GeoJSON | null>(null);
  const worksMarkersRef = useRef<L.LayerGroup | null>(null);
  const stationPinRef = useRef<L.CircleMarker | null>(null);

  // Corner hints
  const cornerNames = ['North-West', 'North-East', 'South-East', 'South-West'];
  const nextCornerHint =
    fourPoints.length < 4
      ? `Click corner ${fourPoints.length + 1} of 4 (${cornerNames[fourPoints.length]}) on the map.`
      : 'All 4 corners placed! Click "Analyze Catchment" to stream live terrain and history.';

  // Initialize Native Leaflet Canvas
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = activeArea?.coordinates?.[0]?.[0] || 15.15;
    const initialLon = activeArea?.coordinates?.[0]?.[1] || 74.35;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Layer groups
    markersGroupRef.current = L.layerGroup().addTo(map);
    flowVectorsLayerRef.current = L.layerGroup().addTo(map);
    barriersLayerRef.current = L.layerGroup().addTo(map);
    worksMarkersRef.current = L.layerGroup().addTo(map);

    // Initial tile layer: 100% Free OpenStreetMap (Standard Leaflet, zero API key)
    baseTileLayerRef.current = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }
    ).addTo(map);

    // Mouse coordinate listener
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({
        lat: Math.round(e.latlng.lat * 10000) / 10000,
        lng: Math.round(e.latlng.lng * 10000) / 10000,
      });
    });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // Map Click Handler for 4-Point Drawing
    map.on('click', (e: L.LeafletMouseEvent) => {
      addFourPoint(e.latlng.lat, e.latlng.lng);
    });

    // Invalidate size on container layout changes to avoid grey/blank canvas
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles (All 100% Free Open-Source Leaflet Layers)
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    const tileConfigs = {
      osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      terrain: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    };

    baseTileLayerRef.current.setUrl(tileConfigs[activeBasemap]);
  }, [activeBasemap]);

  // Update 4-Point Drawing Markers and Connecting Polygon
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    if (polygonLayerRef.current) {
      mapInstanceRef.current.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (fourPoints.length === 0) return;

    const latlngs: [number, number][] = [];

    fourPoints.forEach((pt) => {
      latlngs.push([pt.lat, pt.lon]);

      const customIcon = L.divIcon({
        className: 'custom-corner-pin',
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-grab">
            <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-2xl flex items-center justify-center text-white font-extrabold text-xs">
              ${pt.id}
            </div>
            <div class="absolute -bottom-6 bg-slate-900/95 text-[10px] text-white px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap shadow-xl">
              ${pt.name}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pt.lat, pt.lon], {
        icon: customIcon,
        draggable: true,
      });

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        updateFourPoint(pt.id, newPos.lat, newPos.lng);
      });

      marker.bindTooltip(`Corner ${pt.id}: ${pt.name}<br>Lat: ${pt.lat}, Lon: ${pt.lon}<br>Drag to adjust corner`, {
        direction: 'top',
        offset: [0, -16],
      });

      markersGroupRef.current?.addLayer(marker);
    });

    if (latlngs.length >= 2) {
      const isComplete = latlngs.length === 4;
      const poly = L.polygon(latlngs, {
        color: '#10b981',
        weight: 3,
        dashArray: isComplete ? undefined : '6, 6',
        fillColor: '#10b981',
        fillOpacity: isComplete ? 0.20 : 0.08,
      }).addTo(mapInstanceRef.current);

      polygonLayerRef.current = poly;

      if (isComplete && fourPoints.length === 4) {
        mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [fourPoints]);

  // Render Vegetation Canopy Zones (Rasterio / ESA WorldCover Zones)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (vegetationLayerRef.current) {
      mapInstanceRef.current.removeLayer(vegetationLayerRef.current);
      vegetationLayerRef.current = null;
    }

    if (showVegetation && activeArea?.hydrology_network?.vegetation_zones) {
      vegetationLayerRef.current = L.geoJSON(activeArea.hydrology_network.vegetation_zones as any, {
        style: (feature) => ({
          color: feature?.properties?.color || '#10b981',
          weight: 1.5,
          fillColor: feature?.properties?.color || '#10b981',
          fillOpacity: (feature?.properties?.fill_opacity || 0.25) * (layerOpacity / 100),
        }),
        onEachFeature: (feature, layer) => {
          layer.on('click', () => {
            setSelectedFeature({
              category: 'vegetation',
              title: feature.properties.name,
              properties: feature.properties,
            });
          });
          layer.bindTooltip(`
            <div class="p-1 text-xs">
              <strong>${feature.properties.name}</strong><br>
              <span class="text-emerald-400 font-semibold">${feature.properties.prescription}</span>
            </div>
          `);
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [activeArea?.id, showVegetation, layerOpacity]);

  // Render Animated Flowing Streams (Reacts dynamically to simulated rainfall)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (streamsLayerRef.current) {
      mapInstanceRef.current.removeLayer(streamsLayerRef.current);
      streamsLayerRef.current = null;
    }

    if (showStreams && activeArea?.hydrology_network?.streams) {
      const isDeluge = simulatedRainfallMm >= 75;
      const rainScale = Math.sqrt(simulatedRainfallMm / 45);

      streamsLayerRef.current = L.geoJSON(activeArea.hydrology_network.streams as any, {
        style: (feature) => {
          const baseWidth = feature?.properties?.stroke_width || 3.5;
          const dynamicWeight = Math.min(10, Math.max(2, baseWidth * rainScale * (layerOpacity / 100)));
          const animClass = isDeluge
            ? 'stream-flowing-surging'
            : feature?.properties?.is_main_stem
            ? 'stream-flowing-trunk'
            : 'stream-flowing';

          return {
            color: feature?.properties?.color || '#38bdf8',
            weight: dynamicWeight,
            className: animClass,
            opacity: 0.95,
          };
        },
        onEachFeature: (feature, layer) => {
          layer.on('click', () => {
            setSelectedFeature({
              category: 'stream',
              title: feature.properties.name,
              properties: feature.properties,
            });
          });
          layer.bindTooltip(`
            <div class="p-1 space-y-0.5 text-xs">
              <strong class="text-cyan-400">${feature.properties.name}</strong>
              <div class="text-slate-300">Strahler Order ${feature.properties.strahler_order} • ${feature.properties.flow_rate_m3s} m³/s</div>
            </div>
          `);
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [activeArea?.id, showStreams, layerOpacity, simulatedRainfallMm]);

  // Render D8 Flow Direction Vectors
  useEffect(() => {
    if (!mapInstanceRef.current || !flowVectorsLayerRef.current) return;

    flowVectorsLayerRef.current.clearLayers();

    if (showFlowVectors && activeArea?.hydrology_network?.flow_vectors) {
      activeArea.hydrology_network.flow_vectors.features.forEach((v: any) => {
        const bearing = v.properties.bearing_deg;
        const icon = L.divIcon({
          className: 'flow-arrow-icon',
          html: `
            <div style="transform: rotate(${bearing}deg);" class="text-sky-400 font-black text-sm drop-shadow-md select-none opacity-85 hover:opacity-100 hover:scale-150 transition-all cursor-pointer">
              ➤
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([v.geometry.coordinates[1], v.geometry.coordinates[0]], { icon });
        marker.bindTooltip(
          `D8 Downhill Flow: ${v.properties.velocity_ms} m/s (${v.properties.flow_intensity} gradient)`,
          { direction: 'top' }
        );
        flowVectorsLayerRef.current?.addLayer(marker);
      });
    }
  }, [activeArea?.id, showFlowVectors]);

  // Render Silted Fish Barriers & Culverts
  useEffect(() => {
    if (!mapInstanceRef.current || !barriersLayerRef.current) return;

    barriersLayerRef.current.clearLayers();

    if (showBarriers && activeArea?.hydrology_network?.barriers) {
      activeArea.hydrology_network.barriers.features.forEach((b: any) => {
        const icon = L.divIcon({
          className: 'barrier-pin',
          html: `
            <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs cursor-pointer hover:scale-125 transition-all">
              🐟
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([b.geometry.coordinates[1], b.geometry.coordinates[0]], { icon });
        marker.on('click', () => {
          setSelectedFeature({
            category: 'barrier',
            title: b.properties.title,
            properties: b.properties,
          });
        });
        marker.bindTooltip(`
          <div class="p-1 text-xs">
            <strong class="text-rose-400">${b.properties.title}</strong><br>
            <span class="text-slate-300">Click to view fishway retrofit</span>
          </div>
        `);
        barriersLayerRef.current?.addLayer(marker);
      });
    }
  }, [activeArea?.id, showBarriers]);

  // Render Dirt Roads with Sediment Bleed
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (dirtRoadsLayerRef.current) {
      mapInstanceRef.current.removeLayer(dirtRoadsLayerRef.current);
      dirtRoadsLayerRef.current = null;
    }

    if (showDirtRoads && activeArea?.hydrology_network?.dirt_roads) {
      dirtRoadsLayerRef.current = L.geoJSON(activeArea.hydrology_network.dirt_roads as any, {
        style: {
          color: '#f97316',
          weight: 3.5,
          className: 'dirt-road-eroding',
          opacity: 0.9,
        },
        onEachFeature: (feature, layer) => {
          layer.on('click', () => {
            setSelectedFeature({
              category: 'road',
              title: feature.properties.road_name,
              properties: feature.properties,
            });
          });
          layer.bindTooltip(`
            <div class="p-1 text-xs">
              <strong class="text-orange-400">${feature.properties.road_name}</strong><br>
              <span class="text-slate-300">${feature.properties.erosion_risk}</span>
            </div>
          `);
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [activeArea?.id, showDirtRoads]);

  // Render Proposed Restoration Works Pins
  useEffect(() => {
    if (!mapInstanceRef.current || !worksMarkersRef.current) return;

    worksMarkersRef.current.clearLayers();

    if (showWorks && activeArea?.prescribed_interventions) {
      activeArea.prescribed_interventions.forEach((work) => {
        let iconHtml = '🧱';
        let iconBg = 'bg-amber-600';

        if (work.type === 'contour_trenching') {
          iconHtml = '〰️';
          iconBg = 'bg-orange-600';
        } else if (work.type === 'farm_ponds') {
          iconHtml = '💧';
          iconBg = 'bg-blue-600';
        } else if (work.type === 'afforestation') {
          iconHtml = '🌱';
          iconBg = 'bg-emerald-600';
        }

        const icon = L.divIcon({
          className: 'work-pin',
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-all">
              <div class="w-7 h-7 rounded-lg ${iconBg} border border-white text-white shadow-xl flex items-center justify-center text-xs">
                ${iconHtml}
              </div>
            </div>
          `,
          iconSize: [28, 28],
        });

        const pin = L.marker(work.coordinates, { icon });
        pin.bindPopup(`
          <div class="p-1.5 space-y-1 text-xs">
            <strong class="text-white block">${work.title}</strong>
            <p class="text-slate-300">${work.quantity} • ₹${work.estimated_cost_lakhs_inr} Lakhs</p>
            <p class="text-slate-400 text-[11px]">${work.impact}</p>
          </div>
        `);

        worksMarkersRef.current?.addLayer(pin);
      });
    }
  }, [activeArea?.id, activeArea?.prescribed_interventions, showWorks]);

  // Elevation Profile Station Pin Overlay on Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (stationPinRef.current) {
      mapInstanceRef.current.removeLayer(stationPinRef.current);
      stationPinRef.current = null;
    }

    if (activeHoverStation && activeHoverStation.lat && activeHoverStation.lon) {
      const pin = L.circleMarker([activeHoverStation.lat, activeHoverStation.lon], {
        radius: 9,
        color: '#38bdf8',
        weight: 3,
        fillColor: '#0284c7',
        fillOpacity: 0.9,
      }).addTo(mapInstanceRef.current);

      pin.bindTooltip(`Station: ${activeHoverStation.name}`, { permanent: true, direction: 'top' });
      stationPinRef.current = pin;
    }
  }, [activeHoverStation]);

  // Search Jump handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const match = FIXTURE_WATERSHEDS.find(
      (w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.watershed_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (match && match.centroid && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(match.centroid, 11, { duration: 1.5 });
      selectWatershed(match);
    }
  };

  // Interactive Live Streamflow Calculation (Rational Method)
  const calculatedDischargeM3s = useMemo(() => {
    const area = activeArea?.area_sq_km || 42.5;
    const cRunoff = 0.45;
    return Math.round(((cRunoff * simulatedRainfallMm * area) / 3.6) * 10) / 10;
  }, [activeArea?.area_sq_km, simulatedRainfallMm]);

  // Handle Preset Catchment Jump
  const handlePresetSelect = async (key: string) => {
    await loadPresetCatchment(key);
    if (mapInstanceRef.current) {
      const coordsMap: Record<string, [number, number]> = {
        kali: [15.15, 74.35],
        bhagirathi: [30.40, 78.42],
        narmada: [22.75, 77.72],
        palar: [12.92, 79.13],
      };
      if (coordsMap[key]) {
        mapInstanceRef.current.flyTo(coordsMap[key], 11, { duration: 1.5 });
      }
    }
  };

  const elevationData = activeArea?.hydrology_network?.elevation_profile || [];

  return (
    <div className="relative h-[calc(100vh-6rem)] w-full overflow-hidden flex flex-col font-sans select-none">
      {/* Top Floating Command Bar & Quick Presets */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Search, Draw Toggle & Preset Catchments */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Quick Preset Catchments Ribbon */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase px-2">Presets:</span>
            <button
              onClick={() => handlePresetSelect('kali')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-all"
            >
              🌿 Kali Basin (KA)
            </button>
            <button
              onClick={() => handlePresetSelect('bhagirathi')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-all"
            >
              🏔️ Bhagirathi (UK)
            </button>
            <button
              onClick={() => handlePresetSelect('narmada')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-all"
            >
              🌊 Narmada (MP)
            </button>
            <button
              onClick={() => handlePresetSelect('palar')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-all"
            >
              🌾 Palar (TN)
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Indian village, river..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-48 sm:w-60 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 shadow-xl focus:outline-none focus:border-emerald-500"
            />
          </form>

          {/* Draw 4 Points Toggle Button */}
          <button
            onClick={() => setIsDrawMode(!isDrawMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all ${
              isDrawMode
                ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-400'
                : 'bg-slate-900/95 text-slate-200 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isDrawMode ? 'Drawing 4 Corners...' : 'Draw 4-Corner Area'}</span>
          </button>

          {/* Undo Point / Clear */}
          {fourPoints.length > 0 && (
            <div className="flex items-center space-x-1 bg-slate-900/95 border border-slate-700 rounded-xl p-1 shadow-xl">
              <button
                onClick={removeLastFourPoint}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1"
                title="Undo last placed corner point"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Undo</span>
              </button>
              <button
                onClick={clearFourPoints}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800 text-xs"
                title="Reset points"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* "How It Works" Visual Guide Trigger */}
          <button
            onClick={() => setShowHowItWorksModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700 hover:bg-slate-800 text-sky-400 text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">How It Works</span>
          </button>
        </div>

        {/* Right: Check Area & Step 2 Forward Button */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {fourPoints.length === 4 && (
            <button
              onClick={() => analyzeFourPointsAOI()}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-xl shadow-emerald-600/30 flex items-center gap-1.5 transition-all animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? 'Detecting Location & Live APIs...' : 'Analyze Catchment'}</span>
            </button>
          )}

          {activeArea && (
            <button
              onClick={() => navigate('/history')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore History & News (Tab 2)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating 4-Point Drawing Assistant Card */}
      {isDrawMode && fourPoints.length < 4 && (
        <div className="absolute top-16 left-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-4 shadow-2xl max-w-sm space-y-2 pointer-events-auto">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <Compass className="w-4 h-4 animate-spin" />
            <span>4-Corner Boundary Mode</span>
          </div>
          <p className="text-xs text-white leading-relaxed font-medium">{nextCornerHint}</p>
          <div className="flex items-center space-x-1.5 pt-1">
            {[1, 2, 3, 4].map((num) => (
              <span
                key={num}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  fourPoints.length >= num
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {fourPoints.length >= num ? '✓' : num}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Left Floating Controls Dock: Layers, Basemaps & Rain Simulator */}
      <div className="absolute bottom-12 left-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl space-y-3 max-w-xs pointer-events-auto text-xs">
        <div>
          <span className="font-semibold text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
            Basemap
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'osm', label: 'OpenStreetMap' },
              { id: 'terrain', label: 'Terrain (HOT)' },
              { id: 'dark', label: 'Dark Canvas' },
              { id: 'light', label: 'Light Canvas' },
            ].map((bm) => (
              <button
                key={bm.id}
                onClick={() => setActiveBasemap(bm.id as any)}
                className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all ${
                  activeBasemap === bm.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {bm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hydrology & Water Flow Visualization Layers */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
              Hydrology & Terrain Layers
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Live D8</span>
          </div>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showStreams}
              onChange={(e) => setShowStreams(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-medium">Animated Flowing Streams</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showFlowVectors}
              onChange={(e) => setShowFlowVectors(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>D8 Flow Downhill Arrows</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showVegetation}
              onChange={(e) => setShowVegetation(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Vegetation Canopy & Ridges</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showBarriers}
              onChange={(e) => setShowBarriers(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
            />
            <Fish className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Fish Barriers & Culverts</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showDirtRoads}
              onChange={(e) => setShowDirtRoads(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
            />
            <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>Dirt Roads Erosion Bleed</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showWorks}
              onChange={(e) => setShowWorks(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Proposed Restoration Works</span>
          </label>
        </div>

        {/* Live Rainfall-to-Discharge Dial */}
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-sky-400" />
              Storm Rain Test
            </span>
            <strong className="text-sky-400">{simulatedRainfallMm} mm</strong>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={simulatedRainfallMm}
            onChange={(e) => setSimulatedRainfallMm(Number(e.target.value))}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>Peak Flow Rate:</span>
            <strong className="text-white text-xs">{calculatedDischargeM3s} m³/s</strong>
          </div>
        </div>

        {/* Elevation Cross-Section Toggle Button */}
        {elevationData.length > 0 && (
          <button
            onClick={() => setShowElevationProfile(!showElevationProfile)}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all"
          >
            <Mountain className="w-3 h-3 text-cyan-400" />
            <span>{showElevationProfile ? 'Hide Elevation Profile' : 'Stream Longitudinal Profile'}</span>
            {showElevationProfile ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Interactive Hydrological Feature Inspector Drawer */}
      {selectedFeature && (
        <div className="absolute top-16 right-3 z-[450] bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 shadow-2xl max-w-sm space-y-3 pointer-events-auto text-xs animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {selectedFeature.category === 'stream' && <Waves className="w-4 h-4 text-cyan-400" />}
              {selectedFeature.category === 'barrier' && <Fish className="w-4 h-4 text-rose-400" />}
              {selectedFeature.category === 'road' && <Shield className="w-4 h-4 text-orange-400" />}
              {selectedFeature.category === 'vegetation' && <Trees className="w-4 h-4 text-emerald-400" />}
              <span className="font-bold text-white text-sm truncate max-w-[220px]">
                {selectedFeature.title}
              </span>
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedFeature.category === 'stream' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Strahler Stream Order</span>
                  <strong className="text-cyan-300 text-xs font-mono">Order {selectedFeature.properties.strahler_order}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Discharge Capacity</span>
                  <strong className="text-white text-xs font-mono">{selectedFeature.properties.flow_rate_m3s} m³/s</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Flow Velocity</span>
                  <strong className="text-emerald-400 text-xs font-mono">{selectedFeature.properties.velocity_ms || 1.15} m/s</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Manning's Roughness (n)</span>
                  <strong className="text-amber-400 text-xs font-mono">{selectedFeature.properties.mannings_n || 0.035}</strong>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bank Stability Diagnosis</span>
                <p className="text-white font-medium">{selectedFeature.properties.bank_stability || 'Moderate Scour Risk'}</p>
                <p className="text-cyan-400 text-[11px]">{selectedFeature.properties.prescription || 'Large woody debris deflectors'}</p>
              </div>
            </div>
          )}

          {selectedFeature.category === 'barrier' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Head Drop</span>
                  <strong className="text-rose-400 text-xs font-mono">{selectedFeature.properties.head_drop_m || 1.8} m</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Migration Status</span>
                  <strong className="text-amber-300 text-xs">Severely Blocked</strong>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recommended Intervention</span>
                <p className="text-emerald-400 font-bold">{selectedFeature.properties.action}</p>
                <p className="text-slate-300 text-[11px]">{selectedFeature.properties.fish_impact}</p>
              </div>
            </div>
          )}

          {selectedFeature.category === 'road' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Road Surface</span>
                  <strong className="text-orange-400 text-xs">{selectedFeature.properties.surface}</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Sediment Delivery</span>
                  <strong className="text-rose-400 text-xs font-mono">380 tonnes/yr</strong>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Erosion Prescription</span>
                <p className="text-orange-300 font-bold">{selectedFeature.properties.intervention}</p>
              </div>
            </div>
          )}

          {selectedFeature.category === 'vegetation' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Bare Topsoil</span>
                  <strong className="text-amber-400 text-xs font-mono">{selectedFeature.properties.bare_soil_pct || 35}%</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Canopy Cover</span>
                  <strong className="text-emerald-400 text-xs font-mono">{selectedFeature.properties.tree_cover_pct || 65}%</strong>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ecological Action</span>
                <p className="text-emerald-300 font-bold">{selectedFeature.properties.prescription}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Active Area Zonal Stats HUD */}
      {activeArea && (
        <div className="absolute top-16 right-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl max-w-xs space-y-3 pointer-events-auto text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{activeArea.location?.locality || activeArea.name}</span>
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                activeArea.score >= 75
                  ? 'bg-rose-500/20 text-rose-300'
                  : activeArea.score >= 60
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              Score: {activeArea.score}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">River Basin</span>
              <strong className="text-cyan-300 text-xs truncate block">{activeArea.location?.river_basin || 'Peninsular Basin'}</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Area Size</span>
              <strong className="text-white text-xs">{activeArea.area_sq_km} km²</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Average Slope</span>
              <strong className="text-white text-xs">{activeArea.slope_deg}°</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Bare Topsoil</span>
              <strong className="text-rose-400 text-xs">{activeArea.bare_soil_pct}%</strong>
            </div>
          </div>

          <button
            onClick={() => navigate('/history')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 transition-all"
          >
            <span>Proceed to Tab 2: History & News</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Collapsible Stream Longitudinal Profile Tray */}
      {showElevationProfile && elevationData.length > 0 && (
        <div className="absolute bottom-8 left-3 right-3 z-[410] bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-xs">
                Stream Longitudinal Elevation & Flow Velocity Profile (Summit to Outlet)
              </h3>
            </div>
            <button
              onClick={() => setShowElevationProfile(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={elevationData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                onMouseMove={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const d = e.activePayload[0].payload;
                    setActiveHoverStation({ lat: d.lat, lon: d.lon, name: d.station });
                  }
                }}
                onMouseLeave={() => setActiveHoverStation(null)}
              >
                <defs>
                  <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="distance_km" stroke="#64748b" tick={{ fontSize: 10 }} unit=" km" />
                <YAxis yAxisId="elev" stroke="#38bdf8" tick={{ fontSize: 10 }} unit=" m" domain={['auto', 'auto']} />
                <YAxis yAxisId="flow" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} unit=" m³/s" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  labelFormatter={(v) => `Distance: ${v} km`}
                />
                <Area yAxisId="elev" type="monotone" dataKey="elevation_m" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#elevGradient)" name="Elevation (m)" />
                <Line yAxisId="flow" type="monotone" dataKey="flow_m3s" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Discharge (m³/s)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Summit Ridge (High Energy Headwaters)</span>
            <span className="text-cyan-400">Hover graph to locate station on map</span>
            <span>Basin Outlet (Alluvial Floodplain)</span>
          </div>
        </div>
      )}

      {/* "How It Works" Interactive Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-[600] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">How AquaVane Works</h2>
                  <p className="text-xs text-slate-400">Pairing Open-Source Satellite GIS with Nature-Based Solutions</p>
                </div>
              </div>
              <button
                onClick={() => setShowHowItWorksModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">1</span>
                  <span>Draw or Select Any Catchment</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Click 4 points on the map enclosing any valley or village, or click one of the quick presets (Kali, Bhagirathi, Narmada, Palar).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">2</span>
                  <span>Live Geospatial Ingestion</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  OpenStreetMap identifies the locality; Wikipedia GeoSearch pulls local water history; Open-Meteo streams 30-day precipitation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[10px]">3</span>
                  <span>Whitebox D8 Hydrology Routing</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  GeoPandas & Whitebox algorithms delineate Strahler stream orders (1, 2, 3), downhill flow vectors, and sediment-bleeding dirt roads.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">4</span>
                  <span>5 Restoration Pillars & Budget</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Design native tree buffers, large woody debris, fishway retrofits, water bars, and farm ponds with MGNREGA-ready BoQ export.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHowItWorksModal(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                Got It! Let's Explore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Native Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[400] bg-slate-950/90 backdrop-blur-md border-t border-slate-800 px-4 py-1.5 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center space-x-3">
          <span>
            GPS Position:{' '}
            <strong className="text-slate-200">
              {mouseCoords ? `${mouseCoords.lat}° N, ${mouseCoords.lng}° E` : 'Hover on map'}
            </strong>
          </span>
          <span>•</span>
          <span>
            Zoom: <strong className="text-slate-200">{zoomLevel}x</strong>
          </span>
          <span>•</span>
          <span>
            Corners Placed: <strong className="text-emerald-400">{fourPoints.length} of 4</strong>
          </span>
        </div>
        <div>
          <span>WGS84 • Whitebox D8 Flow Routing & Live Open-Elevation/Meteo Integration</span>
        </div>
      </div>
    </div>
  );
};
