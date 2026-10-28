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
  const [layerOpacity, setLayerOpacity] = useState<number>(75);
  const [showTerrain, setShowTerrain] = useState<boolean>(true);
  const [showStreams, setShowStreams] = useState<boolean>(true);
  const [showLandCover, setShowLandCover] = useState<boolean>(false);
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(7);

  // Leaflet Layer References
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const watershedPolysRef = useRef<L.LayerGroup | null>(null);
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

    // Custom 4-Point Drawing Click Listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      // Access current points length from ref or DOM check
      const currentCount = (markersGroupRef.current?.getLayers().length || 0);
      if (currentCount < 4) {
        addFourPoint(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    let tileUrl = '';
    switch (activeBasemap) {
      case 'satellite':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        break;
      case 'dark':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
        break;
      case 'osm':
        tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        break;
      case 'topo':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        break;
    }

    baseTileLayerRef.current.setUrl(tileUrl);
  }, [activeBasemap]);

  // Render Pre-loaded Catchments on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !watershedPolysRef.current) return;

    watershedPolysRef.current.clearLayers();

    FIXTURE_WATERSHEDS.forEach((ws) => {
      const isSelected = activeArea?.id === ws.id || activeArea?.code === ws.watershed_code;
      const rank = FIXTURE_RANKINGS.find((r) => r.watershed_id === ws.id);
      const score = ws.overall_score || rank?.overall_score || 65;
      const fillColor = score >= 75 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#eab308' : '#10b981';

      if (ws.coordinates && ws.coordinates.length > 0) {
        const poly = L.polygon(ws.coordinates, {
          color: isSelected ? '#38bdf8' : fillColor,
          weight: isSelected ? 3.5 : 1.5,
          opacity: 0.9,
          fillColor: fillColor,
          fillOpacity: (layerOpacity / 100) * (isSelected ? 0.45 : 0.25),
          dashArray: isSelected ? '6, 6' : undefined,
        });

        poly.bindTooltip(
          `<strong>${ws.name}</strong><br>Urgency: ${score.toFixed(1)} (${score >= 75 ? 'Critical' : score >= 60 ? 'High' : 'Moderate'})<br>Click to choose this area`,
          { sticky: true }
        );

        poly.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          selectWatershed(ws);
        });

        watershedPolysRef.current?.addLayer(poly);
      }
    });
  }, [activeArea?.id, layerOpacity]);

  // Update 4-Point Drawing Markers and Connecting Polygon
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // Remove old polygon if exists
    if (polygonLayerRef.current) {
      mapInstanceRef.current.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (fourPoints.length === 0) return;

    const latlngs: [number, number][] = [];

    fourPoints.forEach((pt) => {
      latlngs.push([pt.lat, pt.lon]);

      // Custom HTML badge marker for each point
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

    // Draw connecting lines or completed polygon
    if (latlngs.length >= 2) {
      const isComplete = latlngs.length === 4;
      const poly = L.polygon(latlngs, {
        color: '#10b981',
        weight: 3,
        dashArray: isComplete ? undefined : '6, 6',
        fillColor: '#10b981',
        fillOpacity: isComplete ? 0.25 : 0.1,
      }).addTo(mapInstanceRef.current);

      polygonLayerRef.current = poly;

      if (isComplete && fourPoints.length === 4) {
        mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [fourPoints]);

  // Render Recommended Civil Structure Pins on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !worksMarkersRef.current) return;

    worksMarkersRef.current.clearLayers();

    if (activeArea?.prescribed_interventions) {
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
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
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
  }, [activeArea?.id, activeArea?.prescribed_interventions]);

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
              placeholder="Find village, district, or catchment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-56 sm:w-72 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 shadow-xl focus:outline-none focus:border-emerald-500"
            />
          </form>

          {/* Draw 4 Points Toggle Button */}
          <button
            onClick={() => {
              setIsDrawMode(!isDrawMode);
              if (!isDrawMode && fourPoints.length === 0) {
                // Keep ready
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all ${
              isDrawMode
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-slate-900/90 text-slate-200 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isDrawMode ? 'Drawing 4 Corners...' : 'Draw My Area'}</span>
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
                title="Reset all 4 points"
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
              <span>{isAnalyzing ? 'Checking Land...' : 'Check This Area'}</span>
            </button>
          )}

          {activeArea && (
            <button
              onClick={() => navigate('/rankings')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 transition-all"
            >
              <span>See how urgent this area is</span>
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

      {/* Left Floating Controls Dock */}
      <div className="absolute bottom-10 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl space-y-3.5 max-w-xs pointer-events-auto text-xs">
        {/* Basemap Switcher */}
        <div>
          <span className="font-semibold text-slate-400 block mb-1.5 uppercase text-[10px] tracking-wider">
            Map Style
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

        {/* Layer Toggles with Plain Language */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <span className="font-semibold text-slate-400 block mb-1 uppercase text-[10px] tracking-wider">
            Show Land Layers
          </span>
          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showTerrain}
              onChange={(e) => setShowTerrain(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <Mountain className="w-3.5 h-3.5 text-amber-400" />
            <span>Show land height & slope</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showStreams}
              onChange={(e) => setShowStreams(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Show streams (small to main river)</span>
          </label>

          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showLandCover}
              onChange={(e) => setShowLandCover(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>Show land use (trees & bare soil)</span>
          </label>
        </div>

        {/* Opacity Slider */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Layer strength</span>
            <span className="font-bold text-white">{layerOpacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={layerOpacity}
            onChange={(e) => setLayerOpacity(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Floating Active Area Zonal Stats HUD (When Area is Chosen) */}
      {activeArea && (
        <div className="absolute top-16 right-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl max-w-xs space-y-3 pointer-events-auto text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {activeArea.name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
              <span className="text-slate-400 block text-[10px]">Area Size</span>
              <strong className="text-white text-xs">{activeArea.area_sq_km} km²</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Average Slope</span>
              <strong className="text-white text-xs">{activeArea.slope_deg}°</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Bare Soil</span>
              <strong className="text-rose-400 text-xs">{activeArea.bare_soil_pct}%</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Soil Lost/Year</span>
              <strong className="text-white text-xs">{activeArea.soil_loss_t_ha_yr} t/ha</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
            <strong className="text-amber-400 block mb-0.5">Primary problem:</strong>
            {activeArea.main_problem}
          </div>

          <button
            onClick={() => navigate('/rankings')}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
          >
            <span>See how urgent this area is</span>
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
            Coordinates:{' '}
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
            Boundary Points: <strong className="text-emerald-400">{fourPoints.length} of 4</strong>
          </span>
        </div>
        <div>
          <span>Map system: WGS84 (standard GPS coordinates)</span>
        </div>
      </div>
    </div>
  );
};

