import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Compass,
  Search,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Undo2,
  CheckCircle2,
  Info,
  Maximize2,
  Minimize2,
  Waves,
  Mountain,
  Trees,
  ShieldAlert,
  Fish,
  Shield,
  BookOpen,
} from 'lucide-react';
import { useResearch, FourPointMarker } from '../context/ResearchContext';
import { FIXTURE_RANKINGS, FIXTURE_WATERSHEDS } from '../api/client';

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
    loadSampleArea,
    isAnalyzing,
  } = useResearch();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Basemap & Layer states
  const [activeBasemap, setActiveBasemap] = useState<'satellite' | 'dark' | 'osm' | 'topo'>('satellite');
  const [layerOpacity, setLayerOpacity] = useState<number>(85);
  const [showStreams, setShowStreams] = useState<boolean>(true);
  const [showBarriers, setShowBarriers] = useState<boolean>(true);
  const [showDirtRoads, setShowDirtRoads] = useState<boolean>(true);
  const [showWorks, setShowWorks] = useState<boolean>(true);
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(7);

  // Leaflet Layer References
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const watershedPolysRef = useRef<L.LayerGroup | null>(null);
  const streamsLayerRef = useRef<L.GeoJSON | null>(null);
  const barriersLayerRef = useRef<L.LayerGroup | null>(null);
  const dirtRoadsLayerRef = useRef<L.GeoJSON | null>(null);
  const worksMarkersRef = useRef<L.LayerGroup | null>(null);

  // Corner hints
  const cornerNames = ['North-West', 'North-East', 'South-East', 'South-West'];
  const nextCornerHint =
    fourPoints.length < 4
      ? `Click corner ${fourPoints.length + 1} of 4 (${cornerNames[fourPoints.length]}) on the map.`
      : 'All 4 corners placed! Click "Check This Area" to inspect the land.';

  // Initialize Native Leaflet Canvas
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = activeArea?.coordinates?.[0]?.[0] || 15.15;
    const initialLon = activeArea?.coordinates?.[0]?.[1] || 74.35;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Layer groups
    markersGroupRef.current = L.layerGroup().addTo(map);
    watershedPolysRef.current = L.layerGroup().addTo(map);
    barriersLayerRef.current = L.layerGroup().addTo(map);
    worksMarkersRef.current = L.layerGroup().addTo(map);

    // Initial tile layer (Esri Satellite)
    baseTileLayerRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
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

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    const tileConfigs = {
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
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
            <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-extrabold text-xs">
              ${pt.id}
            </div>
            <div class="absolute -bottom-6 bg-slate-900/90 text-[10px] text-white px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap shadow-md">
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

      marker.bindTooltip(`Corner ${pt.id}: ${pt.name}<br>Lat: ${pt.lat}, Lon: ${pt.lon}<br>Drag to adjust`, {
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

  // Render Streams & Hydrology Network
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (streamsLayerRef.current) {
      mapInstanceRef.current.removeLayer(streamsLayerRef.current);
      streamsLayerRef.current = null;
    }

    if (showStreams && activeArea?.hydrology_network?.streams) {
      streamsLayerRef.current = L.geoJSON(activeArea.hydrology_network.streams as any, {
        style: (feature) => ({
          color: feature?.properties?.color || '#38bdf8',
          weight: (feature?.properties?.stroke_width || 3) * (layerOpacity / 100),
          opacity: 0.95,
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <div class="p-1 space-y-1 text-xs">
              <strong class="text-white block">${feature.properties.name}</strong>
              <p class="text-cyan-300">Strahler Order ${feature.properties.strahler_order} • ${feature.properties.flow_rate_m3s} m³/s flow</p>
            </div>
          `);
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [activeArea?.id, showStreams, layerOpacity]);

  // Render Dirt Roads
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
          dashArray: '6, 6',
          opacity: 0.9,
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`
            <div class="p-1 space-y-1 text-xs">
              <strong class="text-orange-300 block">${feature.properties.road_name}</strong>
              <p class="text-slate-200">${feature.properties.erosion_risk}</p>
              <p class="text-slate-400 text-[11px]">${feature.properties.intervention}</p>
            </div>
          `);
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [activeArea?.id, showDirtRoads]);

  // Render Barriers & Fish Blocked Culverts
  useEffect(() => {
    if (!mapInstanceRef.current || !barriersLayerRef.current) return;

    barriersLayerRef.current.clearLayers();

    if (showBarriers && activeArea?.hydrology_network?.barriers) {
      activeArea.hydrology_network.barriers.features.forEach((b: any) => {
        const icon = L.divIcon({
          className: 'barrier-pin',
          html: `
            <div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs cursor-pointer">
              🐟
            </div>
          `,
          iconSize: [28, 28],
        });

        const marker = L.marker([b.geometry.coordinates[1], b.geometry.coordinates[0]], { icon });
        marker.bindPopup(`
          <div class="p-1 space-y-1 text-xs">
            <strong class="text-rose-400 block">${b.properties.title}</strong>
            <p class="text-slate-200">${b.properties.action}</p>
            <p class="text-slate-400 text-[11px]">${b.properties.fish_impact}</p>
          </div>
        `);
        barriersLayerRef.current?.addLayer(marker);
      });
    }
  }, [activeArea?.id, showBarriers]);

  // Render Recommended Civil Structure Pins on Map
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
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
              <div class="w-7 h-7 rounded-lg ${iconBg} border border-white text-white shadow-lg flex items-center justify-center text-xs">
                ${iconHtml}
              </div>
            </div>
          `,
          iconSize: [28, 28],
        });

        const pin = L.marker(work.coordinates, { icon });
        pin.bindPopup(`
          <div class="p-1 space-y-1 text-xs">
            <strong class="text-white block">${work.title}</strong>
            <p class="text-slate-300">${work.quantity} • ₹${work.estimated_cost_lakhs_inr} Lakhs</p>
            <p class="text-slate-400 text-[11px]">${work.impact}</p>
          </div>
        `);

        worksMarkersRef.current?.addLayer(pin);
      });
    }
  }, [activeArea?.id, activeArea?.prescribed_interventions, showWorks]);

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

  return (
    <div className="relative h-[calc(100vh-6rem)] w-full overflow-hidden flex flex-col font-sans select-none">
      {/* Top Floating Command Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Search & Starting Guide */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Indian village, district, or river..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-56 sm:w-72 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 shadow-xl focus:outline-none focus:border-emerald-500"
            />
          </form>

          {/* Draw 4 Points Toggle Button */}
          <button
            onClick={() => setIsDrawMode(!isDrawMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all ${
              isDrawMode
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-slate-900/90 text-slate-200 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isDrawMode ? 'Click 4 Corners on Map...' : 'Draw 4-Corner Area'}</span>
          </button>

          {/* Undo Point / Clear */}
          {fourPoints.length > 0 && (
            <div className="flex items-center space-x-1 bg-slate-900/90 border border-slate-700 rounded-xl p-1 shadow-xl">
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
              <span>{isAnalyzing ? 'Detecting Area & Live APIs...' : 'Analyze Catchment'}</span>
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

      {/* Left Floating Controls Dock: Basemap & Layers */}
      <div className="absolute bottom-10 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl space-y-3.5 max-w-xs pointer-events-auto text-xs">
        <div>
          <span className="font-semibold text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
            Basemap
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'satellite', label: 'Satellite' },
              { id: 'dark', label: 'Dark Canvas' },
              { id: 'osm', label: 'Street Map' },
              { id: 'topo', label: 'Topographic' },
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

        {/* Layer Toggles */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <span className="font-semibold text-slate-400 block mb-1 uppercase text-[10px] tracking-wider">
            Restoration Layers
          </span>
          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showStreams}
              onChange={(e) => setShowStreams(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Water Flow & Streams</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showBarriers}
              onChange={(e) => setShowBarriers(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
            />
            <Fish className="w-3.5 h-3.5 text-rose-400" />
            <span>Fish Barriers & Blocked Culverts</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showDirtRoads}
              onChange={(e) => setShowDirtRoads(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
            />
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <span>Dirt Roads Erosion Bleed</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showWorks}
              onChange={(e) => setShowWorks(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Proposed Restoration Works</span>
          </label>
        </div>
      </div>

      {/* Floating Active Area Zonal Stats HUD */}
      {activeArea && (
        <div className="absolute top-16 right-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl max-w-xs space-y-3 pointer-events-auto text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{activeArea.name}</span>
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
              <span className="text-slate-400 block text-[10px]">Basin</span>
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
          <span>WGS84 • Live Open-Meteo & Open-Elevation Stream</span>
        </div>
      </div>
    </div>
  );
};
