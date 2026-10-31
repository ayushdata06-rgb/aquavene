import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Compass,
  Search,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Undo2,
  CheckCircle2,
  Waves,
  Mountain,
  Trees,
  Fish,
  Shield,
  BookOpen,
  CloudRain,
  Activity,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  Scale,
  BarChart3,
  ShieldCheck,
  Minimize2,
  Maximize2,
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
import { useResearch } from '../context/ResearchContext';
import { FIXTURE_WATERSHEDS } from '../api/client';
import { SiteDiagnosticModal } from '../components/SiteDiagnosticModal';
import { DataResolutionModal } from '../components/DataResolutionModal';
import { useAuth } from '../context/AuthContext';

export const MapTab: React.FC = () => {
  const navigate = useNavigate();
  const { user, signInWithRole } = useAuth();
  const {
    activeArea,
    fourPoints,
    addFourPoint,
    updateFourPoint,
    removePoint,
    removeLastFourPoint,
    clearFourPoints,
    removeIntervention,
    updateInterventionCoord,
    removeBarrier,
    analyzeFourPointsAOI,
    selectWatershed,
    loadPresetCatchment,
    isAnalyzing,
  } = useResearch();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Basemap & Layer states (100% Free, Zero API Key Leaflet Tile Layers)
  const [activeBasemap, setActiveBasemap] = useState<'osm' | 'terrain' | 'dark' | 'light'>('osm');
  const [layerOpacity] = useState<number>(90);
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
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);
  const [showResolutionModal, setShowResolutionModal] = useState<boolean>(false);
  const [showRankingsDrawer, setShowRankingsDrawer] = useState<boolean>(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);
  const [isLeftDockCollapsed, setIsLeftDockCollapsed] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<{
    category: 'stream' | 'barrier' | 'road' | 'vegetation' | 'station' | 'intervention';
    title: string;
    properties: Record<string, any>;
    geometry?: any;
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
  const selectedHighlightLayerRef = useRef<L.LayerGroup | null>(null);
  const stationPinRef = useRef<L.CircleMarker | null>(null);

  // Corner hints
  const cornerNames = ['North-West', 'North-East', 'South-East', 'South-West'];
  const nextCornerHint =
    fourPoints.length < 4
      ? `Click corner ${fourPoints.length + 1} of 4 (${cornerNames[fourPoints.length]}) on the map.`
      : 'All 4 corners placed! Drag any corner to reshape, or click "Analyze Catchment".';

  const fourPointsRef = useRef(fourPoints);
  useEffect(() => {
    fourPointsRef.current = fourPoints;
  }, [fourPoints]);

  const isDrawModeRef = useRef(isDrawMode);
  useEffect(() => {
    isDrawModeRef.current = isDrawMode;
  }, [isDrawMode]);

  const addFourPointRef = useRef(addFourPoint);
  useEffect(() => {
    addFourPointRef.current = addFourPoint;
  }, [addFourPoint]);

  // Adjust Leaflet map cursor dynamically when placing corner points
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const container = mapInstanceRef.current.getContainer();
    if (isDrawMode || fourPoints.length < 4) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
  }, [isDrawMode, fourPoints.length]);

  // Automatically exit draw mode once all 4 corners are placed
  useEffect(() => {
    if (fourPoints.length === 4 && isDrawMode) {
      setIsDrawMode(false);
    }
  }, [fourPoints.length, isDrawMode]);

  const handleToggleDrawMode = () => {
    if (!isDrawMode) {
      clearFourPoints();
      setSelectedFeature(null);
      setIsDrawMode(true);
    } else {
      setIsDrawMode(false);
    }
  };

  // Initialize Native Leaflet Canvas
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

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
      selectedHighlightLayerRef.current = L.layerGroup().addTo(map);

      // Initial tile layer: 100% Free OpenStreetMap
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

      // Map Click Handler for 4-Point Drawing & Deselect
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (isDrawModeRef.current || fourPointsRef.current.length < 4) {
          const ping = L.circleMarker([e.latlng.lat, e.latlng.lng], {
            radius: 12,
            color: '#10b981',
            fillColor: '#34d399',
            fillOpacity: 0.85,
            weight: 2,
            className: 'animate-ping pointer-events-none',
          }).addTo(map);
          setTimeout(() => {
            try {
              map.removeLayer(ping);
            } catch {}
          }, 500);

          addFourPointRef.current(e.latlng.lat, e.latlng.lng);
        } else {
          // Click background to deselect feature
          setSelectedFeature(null);
        }
      });
    } catch (err) {
      console.warn('Leaflet map initialization caught error:', err);
    }

    const resizeObserver = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap Tiles
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

  // Selected Feature Highlight Halo on Map Canvas
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedHighlightLayerRef.current) return;
    selectedHighlightLayerRef.current.clearLayers();

    if (!selectedFeature) return;

    try {
      const geom = selectedFeature.geometry;
      if (geom) {
        if (geom.type === 'LineString') {
          const latlngs = geom.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          const glowLine = L.polyline(latlngs, {
            color: '#38bdf8',
            weight: 9,
            opacity: 0.85,
            className: 'feature-selected-glow',
          });
          selectedHighlightLayerRef.current.addLayer(glowLine);
        } else if (geom.type === 'Polygon') {
          const latlngs = geom.coordinates[0].map((c: [number, number]) => [c[1], c[0]]);
          const glowPoly = L.polygon(latlngs, {
            color: '#34d399',
            weight: 4,
            fillColor: '#10b981',
            fillOpacity: 0.5,
            className: 'feature-selected-glow',
          });
          selectedHighlightLayerRef.current.addLayer(glowPoly);
        } else if (geom.type === 'Point') {
          const glowCircle = L.circleMarker([geom.coordinates[1], geom.coordinates[0]], {
            radius: 18,
            color: '#f43f5e',
            weight: 3.5,
            fillColor: '#f43f5e',
            fillOpacity: 0.45,
            className: 'animate-ping',
          });
          selectedHighlightLayerRef.current.addLayer(glowCircle);
        }
      } else if (selectedFeature.properties?.coordinates) {
        const coords = selectedFeature.properties.coordinates;
        const glowCircle = L.circleMarker([coords[0], coords[1]], {
          radius: 18,
          color: '#10b981',
          weight: 3.5,
          fillColor: '#34d399',
          fillOpacity: 0.45,
          className: 'animate-ping',
        });
        selectedHighlightLayerRef.current.addLayer(glowCircle);
      }
    } catch (err) {
      console.warn('Error highlighting feature:', err);
    }
  }, [selectedFeature]);

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
          <div class="relative w-8 h-8 flex items-center justify-center cursor-move select-none group">
            <div class="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 border-2 border-white shadow-2xl flex items-center justify-center text-white font-extrabold text-xs transition-transform">
              ${pt.id}
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-[10px] text-slate-200 px-2 py-0.5 rounded-md border border-slate-700 whitespace-nowrap shadow-xl pointer-events-none">
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

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
      });
      marker.on('mousedown', (e) => {
        L.DomEvent.stopPropagation(e);
      });

      marker.on('drag', (e) => {
        const newPos = e.target.getLatLng();
        if (polygonLayerRef.current) {
          const polyCoords = polygonLayerRef.current.getLatLngs() as any;
          const flatCoords = Array.isArray(polyCoords[0]) ? polyCoords[0] : polyCoords;
          const idx = fourPoints.findIndex((p) => p.id === pt.id);
          if (idx !== -1 && flatCoords[idx]) {
            flatCoords[idx] = newPos;
            polygonLayerRef.current.setLatLngs(flatCoords);
          }
        }
      });

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        updateFourPoint(pt.id, newPos.lat, newPos.lng);
      });

      marker.on('contextmenu', (e) => {
        L.DomEvent.stopPropagation(e);
        removePoint(pt.id);
      });

      marker.bindTooltip(`
        <div class="text-xs">
          <strong>Corner ${pt.id} (${pt.name})</strong><br>
          <span class="text-slate-300">Drag to reshape • Right-click to delete</span>
        </div>
      `, {
        direction: 'top',
        offset: [0, -18],
      });

      markersGroupRef.current?.addLayer(marker);
    });

    if (latlngs.length >= 2) {
      const isComplete = latlngs.length === 4;
      const poly = L.polygon(latlngs, {
        color: '#10b981',
        weight: 3.5,
        dashArray: isComplete ? undefined : '6, 6',
        fillColor: '#10b981',
        fillOpacity: isComplete ? 0.20 : 0.08,
        className: isComplete ? 'aoi-boundary-active' : undefined,
        interactive: false,
      }).addTo(mapInstanceRef.current);

      polygonLayerRef.current = poly;

      if (isComplete && fourPoints.length === 4) {
        try {
          mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [60, 60], maxZoom: 12 });
        } catch {}
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
          weight: 1.8,
          fillColor: feature?.properties?.color || '#10b981',
          fillOpacity: (feature?.properties?.fill_opacity || 0.28) * (layerOpacity / 100),
        }),
        onEachFeature: (feature, layer) => {
          layer.on('mouseover', () => {
            (layer as L.Path).setStyle({
              fillOpacity: 0.55,
              weight: 2.5,
              color: '#34d399',
            });
          });
          layer.on('mouseout', () => {
            (layer as L.Path).setStyle({
              fillOpacity: (feature?.properties?.fill_opacity || 0.28) * (layerOpacity / 100),
              weight: 1.8,
              color: feature?.properties?.color || '#10b981',
            });
          });
          layer.on('click', (e: any) => {
            if (isDrawModeRef.current || fourPointsRef.current.length < 4) {
              if (e.latlng) {
                addFourPointRef.current(e.latlng.lat, e.latlng.lng);
              }
              return;
            }
            L.DomEvent.stopPropagation(e);
            setSelectedFeature({
              category: 'vegetation',
              title: feature.properties.name,
              properties: feature.properties,
              geometry: feature.geometry,
            });
          });
          layer.bindTooltip(`
            <div class="space-y-1 text-xs">
              <div class="flex items-center gap-1.5 font-bold text-emerald-300">
                <span>🌳</span>
                <span>${feature.properties.name}</span>
              </div>
              <div class="text-[10px] text-slate-300">
                Canopy: <strong class="text-white">${feature.properties.tree_cover_pct || 65}%</strong> • Bare: <strong class="text-amber-400">${feature.properties.bare_soil_pct || 15}%</strong>
              </div>
              <div class="text-[9px] text-cyan-300 font-medium">Click to inspect ecological prescription</div>
            </div>
          `);
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [activeArea?.id, showVegetation, layerOpacity]);

  // Render Animated Flowing Streams (GeoPandas Whitebox Strahler Orders)
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
          const dynamicWeight = Math.min(10, Math.max(2.5, baseWidth * rainScale * (layerOpacity / 100)));
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
          layer.on('mouseover', () => {
            (layer as L.Path).setStyle({
              weight: Math.min(12, (feature?.properties?.stroke_width || 3.5) * rainScale * 1.5),
              color: '#67e8f9',
            });
          });
          layer.on('mouseout', () => {
            const baseWidth = feature?.properties?.stroke_width || 3.5;
            const dynamicWeight = Math.min(10, Math.max(2.5, baseWidth * rainScale * (layerOpacity / 100)));
            (layer as L.Path).setStyle({
              weight: dynamicWeight,
              color: feature?.properties?.color || '#38bdf8',
            });
          });
          layer.on('click', (e: any) => {
            if (isDrawModeRef.current || fourPointsRef.current.length < 4) {
              if (e.latlng) {
                addFourPointRef.current(e.latlng.lat, e.latlng.lng);
              }
              return;
            }
            L.DomEvent.stopPropagation(e);
            setSelectedFeature({
              category: 'stream',
              title: feature.properties.name,
              properties: feature.properties,
              geometry: feature.geometry,
            });
          });
          layer.bindTooltip(`
            <div class="space-y-1 text-xs">
              <div class="flex items-center gap-1.5 font-bold text-cyan-300">
                <span>🌊</span>
                <span>${feature.properties.name}</span>
              </div>
              <div class="text-[10px] text-slate-300 flex items-center justify-between gap-3">
                <span>Strahler Order ${feature.properties.strahler_order}</span>
                <span class="text-white font-mono">${feature.properties.flow_rate_m3s} m³/s</span>
              </div>
              <div class="text-[9px] text-emerald-400 font-medium">Click to inspect channel stability & prescription</div>
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
            <div style="transform: rotate(${bearing}deg);" class="flow-arrow-marker text-cyan-400 font-black text-sm drop-shadow-md select-none hover:scale-150 transition-all cursor-pointer">
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
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="absolute w-8 h-8 rounded-full bg-rose-500/40 barrier-ping-radar pointer-events-none"></div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-700 to-rose-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs hover:scale-125 transition-transform">
                🐟
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([b.geometry.coordinates[1], b.geometry.coordinates[0]], { icon });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedFeature({
            category: 'barrier',
            title: b.properties.title,
            properties: b.properties,
            geometry: b.geometry,
          });
        });
        marker.on('mousedown', (e) => {
          L.DomEvent.stopPropagation(e);
        });
        marker.bindTooltip(`
          <div class="space-y-1 text-xs">
            <div class="flex items-center gap-1.5 font-bold text-rose-400">
              <span>🐟</span>
              <span>${b.properties.title}</span>
            </div>
            <div class="text-[10px] text-slate-300">
              Head Drop: <strong class="text-white">${b.properties.head_drop_m}m</strong> • Silted Migration Barrier
            </div>
            <div class="text-[9px] text-emerald-400 font-medium">Click to inspect fishway retrofit</div>
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
          layer.on('mouseover', () => {
            (layer as L.Path).setStyle({
              weight: 5.5,
              color: '#fdba74',
            });
          });
          layer.on('mouseout', () => {
            (layer as L.Path).setStyle({
              weight: 3.5,
              color: '#f97316',
            });
          });
          layer.on('click', (e: any) => {
            if (isDrawModeRef.current || fourPointsRef.current.length < 4) {
              if (e.latlng) {
                addFourPointRef.current(e.latlng.lat, e.latlng.lng);
              }
              return;
            }
            L.DomEvent.stopPropagation(e);
            setSelectedFeature({
              category: 'road',
              title: feature.properties.road_name,
              properties: feature.properties,
              geometry: feature.geometry,
            });
          });
          layer.bindTooltip(`
            <div class="space-y-1 text-xs">
              <div class="flex items-center gap-1.5 font-bold text-orange-400">
                <span>🚗</span>
                <span>${feature.properties.road_name}</span>
              </div>
              <div class="text-[10px] text-rose-300 font-semibold">
                ${feature.properties.erosion_risk}
              </div>
              <div class="text-[9px] text-cyan-300 font-medium">Click to view water bar retrofit</div>
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
        if (!work.coordinates) return;
        const workId = work.id || work.title;

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

        const pin = L.marker(work.coordinates, {
          icon,
          draggable: true,
        });

        pin.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          updateInterventionCoord(workId, newPos.lat, newPos.lng);
        });

        pin.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedFeature({
            category: 'intervention',
            title: work.title,
            properties: {
              ...work,
              id: workId,
              isIntervention: true,
            },
          });
        });
        pin.on('mousedown', (e) => {
          L.DomEvent.stopPropagation(e);
        });

        pin.bindTooltip(`
          <div class="space-y-0.5 text-xs">
            <strong class="text-white">${work.title}</strong>
            <div class="text-[10px] text-emerald-400">₹${work.estimated_cost_lakhs_inr} Lakhs • Drag to move</div>
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
    setSelectedFeature(null);
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
    <div className="relative flex-1 w-full h-full min-h-[550px] overflow-hidden flex flex-col font-sans select-none">
      {/* =========================================================================
          Top Sleek Glass Command Strip
          ========================================================================= */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Toolbar Cluster */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          {/* Active Role Segmented Switcher */}
          <div className="flex items-center space-x-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl">
            {(['admin', 'officer', 'planner', 'viewer'] as const).map((r) => {
              const isActive = user?.role === r;
              const labels = {
                admin: { icon: '🛡️', text: 'Admin' },
                officer: { icon: '📋', text: 'Officer' },
                planner: { icon: '📊', text: 'Planner' },
                viewer: { icon: '👁️', text: 'Viewer' },
              };
              const activeStyles = {
                admin: 'bg-purple-600 text-white shadow-purple-600/30 ring-1 ring-purple-400',
                officer: 'bg-teal-600 text-white shadow-teal-600/30 ring-1 ring-teal-400',
                planner: 'bg-cyan-600 text-white shadow-cyan-600/30 ring-1 ring-cyan-400',
                viewer: 'bg-slate-700 text-white ring-1 ring-slate-500',
              };
              return (
                <button
                  key={r}
                  onClick={() => signInWithRole(r)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    isActive ? activeStyles[r] : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Switch mode to ${r.toUpperCase()}`}
                >
                  <span>{labels[r].icon}</span>
                  <span className="hidden sm:inline">{labels[r].text}</span>
                </button>
              );
            })}
          </div>

          {/* Preset Catchment Quick Selector */}
          <div className="flex items-center space-x-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl">
            <span className="text-[10px] text-slate-400 font-semibold uppercase px-1.5 hidden xl:inline">Presets:</span>
            <button
              onClick={() => handlePresetSelect('kali')}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-emerald-400 transition-colors"
              title="Kali River Catchment Basin, Western Ghats Karnataka"
            >
              🌿 Kali
            </button>
            <button
              onClick={() => handlePresetSelect('bhagirathi')}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-cyan-400 transition-colors"
              title="Bhagirathi Himalayan Watershed, Uttarakhand"
            >
              🏔️ Bhagirathi
            </button>
            <button
              onClick={() => handlePresetSelect('narmada')}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-sky-400 transition-colors hidden md:inline-block"
              title="Narmada Basin Micro-Catchment, MP"
            >
              🌊 Narmada
            </button>
            <button
              onClick={() => handlePresetSelect('palar')}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-amber-400 transition-colors hidden lg:inline-block"
              title="Palar Semi-Arid Basin, Tamil Nadu"
            >
              🌾 Palar
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search river, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-36 sm:w-48 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 shadow-2xl focus:outline-none focus:border-emerald-500"
            />
          </form>

          {/* Draw 4 Corners Action Button */}
          <button
            onClick={handleToggleDrawMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all ${
              isDrawMode
                ? 'bg-emerald-500 text-white shadow-emerald-500/40 ring-2 ring-emerald-300 animate-pulse'
                : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/50'
            }`}
            title="Click to place or redraw 4 corner pins directly on the map"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>
              {isDrawMode
                ? `Placing Corner ${fourPoints.length + 1}...`
                : fourPoints.length === 4
                ? 'Redraw AOI'
                : 'Draw 4 Corners'}
            </span>
          </button>

          {/* Undo / Clear Controls */}
          {(fourPoints.length > 0 || activeArea !== null) && (
            <div className="flex items-center space-x-1 bg-slate-900/95 border border-slate-700/80 rounded-xl p-1 shadow-xl">
              {fourPoints.length > 0 && fourPoints.length < 4 && (
                <button
                  onClick={removeLastFourPoint}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1"
                  title="Undo last placed corner point"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => {
                  clearFourPoints();
                  setSelectedFeature(null);
                }}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 border border-rose-500/20 transition-colors"
                title="Reset active catchment, boundary, and works"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="text-[11px]">Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Toolbar Cluster: Quick Tools & Step Forward CTA */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          {/* How It Works Button */}
          <button
            onClick={() => setShowHowItWorksModal(true)}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/95 border border-slate-700/80 hover:bg-slate-800 text-sky-400 text-xs font-semibold flex items-center gap-1 shadow-xl transition-all"
            title="How AquaVane Works"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">How It Works</span>
          </button>

          {/* Ranked Watersheds Slide-Over Toggle */}
          <button
            onClick={() => setShowRankingsDrawer(!showRankingsDrawer)}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xl transition-all ${
              showRankingsDrawer
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'bg-slate-900/95 border border-slate-700/80 hover:bg-slate-800 text-emerald-400'
            }`}
            title="Open Priority Watershed Rankings Matrix"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Rankings</span>
          </button>

          {/* Data Uncertainty Modal Toggle */}
          <button
            onClick={() => setShowResolutionModal(true)}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/95 border border-slate-700/80 hover:bg-slate-800 text-cyan-400 text-xs font-semibold flex items-center gap-1 shadow-xl transition-all"
            title="Inspect Data Resolution & Uncertainty Notes"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Data Specs</span>
          </button>

          {/* Step CTA: Analyze or Proceed to History */}
          {fourPoints.length === 4 && (
            <button
              onClick={() => analyzeFourPointsAOI()}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-xl shadow-emerald-600/30 flex items-center gap-1.5 transition-all animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? 'Computing Live GIS...' : 'Analyze Catchment'}</span>
            </button>
          )}

          {activeArea && (
            <button
              onClick={() => navigate('/history')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History & News</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          Drawing Assistant Banner (Centered under top bar, zero overlap)
          ========================================================================= */}
      {(isDrawMode || (fourPoints.length > 0 && fourPoints.length < 4)) && fourPoints.length < 4 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[420] bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl px-4 py-2.5 shadow-2xl pointer-events-auto flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
            <Compass className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Draw Catchment AOI:</span>
          </div>

          <p className="text-xs text-white font-medium">{nextCornerHint}</p>

          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4].map((num) => (
              <span
                key={num}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                  fourPoints.length >= num
                    ? 'bg-emerald-500 text-white border-emerald-400 scale-105 shadow-sm shadow-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {fourPoints.length >= num ? '✓' : num}
              </span>
            ))}
          </div>

          <button
            onClick={() => {
              setIsDrawMode(false);
              clearFourPoints();
            }}
            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* =========================================================================
          Native Leaflet Map Canvas
          ========================================================================= */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0 cursor-crosshair"
        style={{ minHeight: '100%', height: '100%', width: '100%' }}
      />

      {/* =========================================================================
          Left Floating Controls Dock: Layers, Basemaps & Rain Simulator
          ========================================================================= */}
      <div className="absolute bottom-9 left-2.5 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2.5 max-w-xs pointer-events-auto text-xs">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>GIS Map Controls</span>
          </span>
          <button
            onClick={() => setIsLeftDockCollapsed(!isLeftDockCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            {isLeftDockCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {!isLeftDockCollapsed && (
          <>
            <div>
              <span className="font-semibold text-slate-400 block mb-1 text-[10px] uppercase">
                Basemap
              </span>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 'osm', label: 'OpenStreetMap' },
                  { id: 'terrain', label: 'Terrain (HOT)' },
                  { id: 'dark', label: 'Dark Canvas' },
                  { id: 'light', label: 'Light Canvas' },
                ].map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => setActiveBasemap(bm.id as any)}
                    className={`px-2 py-1 rounded-lg text-left text-[10px] font-medium transition-all ${
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
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block">
                Hydrology & Terrain Layers
              </span>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showStreams}
                  onChange={(e) => setShowStreams(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Animated Flowing Streams</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showFlowVectors}
                  onChange={(e) => setShowFlowVectors(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
                />
                <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>D8 Flow Downhill Arrows</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showVegetation}
                  onChange={(e) => setShowVegetation(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Vegetation Canopy & Ridges</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showBarriers}
                  onChange={(e) => setShowBarriers(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
                />
                <Fish className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Fish Barriers & Culverts</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showDirtRoads}
                  onChange={(e) => setShowDirtRoads(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
                />
                <Shield className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Dirt Roads Erosion Bleed</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
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

            {/* Live Rainfall-to-Discharge Simulation Dial */}
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-sky-400" />
                  Storm Rain Dial
                </span>
                <strong className="text-sky-400 font-mono">{simulatedRainfallMm} mm</strong>
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
                <span>Peak Discharge (Q):</span>
                <strong className="text-emerald-400 font-mono text-xs">{calculatedDischargeM3s} m³/s</strong>
              </div>
            </div>

            {/* Elevation Cross-Section Toggle Button */}
            {elevationData.length > 0 && (
              <button
                onClick={() => setShowElevationProfile(!showElevationProfile)}
                className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                <Mountain className="w-3 h-3 text-cyan-400" />
                <span>{showElevationProfile ? 'Hide Elevation Profile' : 'Stream Profile (D8)'}</span>
                {showElevationProfile ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}
          </>
        )}
      </div>

      {/* =========================================================================
          Unified Right Side Intelligence Dock
          (Single authoritative panel: Feature Inspector OR Catchment HUD OR Rankings)
          ========================================================================= */}
      <div className="absolute top-16 right-2.5 bottom-10 z-[430] w-80 sm:w-96 pointer-events-auto flex flex-col justify-start">
        {/* Panel 1: Ranked Watersheds Slide-Over View */}
        {showRankingsDrawer && (
          <div className="bg-slate-900/98 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 shadow-2xl flex flex-col space-y-3 max-h-full animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ranked Catchments</h3>
                  <p className="text-[10px] text-slate-400">PVI Composite Hydrological Priority</p>
                </div>
              </div>
              <button
                onClick={() => setShowRankingsDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar text-xs">
              {FIXTURE_WATERSHEDS.map((ws, idx) => {
                const isSelected = activeArea?.code === ws.watershed_code || activeArea?.name === ws.name;
                return (
                  <div
                    key={ws.id || ws.watershed_code}
                    onClick={() => {
                      selectWatershed(ws);
                      if (ws.centroid && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(ws.centroid, 11, { duration: 1.5 });
                      }
                      setShowRankingsDrawer(false);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 shadow-md ring-1 ring-emerald-400'
                        : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-emerald-400 font-mono text-[11px]">#{idx + 1}</span>
                        <span>{ws.name}</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (ws.priority_score || 70) >= 75
                            ? 'bg-rose-500/20 text-rose-300'
                            : (ws.priority_score || 70) >= 60
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        PVI: {ws.priority_score || 72}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{ws.district}, {ws.state}</span>
                      <span className="font-mono text-cyan-400">{ws.watershed_code}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => navigate('/rankings')}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Open Full Rankings Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Panel 2: Interactive Feature Inspector (when feature is selected on map) */}
        {!showRankingsDrawer && selectedFeature && (
          <div className="bg-slate-900/98 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 shadow-2xl space-y-3 text-xs animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                {selectedFeature.category === 'stream' && <Waves className="w-4 h-4 text-cyan-400" />}
                {selectedFeature.category === 'barrier' && <Fish className="w-4 h-4 text-rose-400" />}
                {selectedFeature.category === 'road' && <Shield className="w-4 h-4 text-orange-400" />}
                {selectedFeature.category === 'vegetation' && <Trees className="w-4 h-4 text-emerald-400" />}
                {selectedFeature.category === 'intervention' && <Sparkles className="w-4 h-4 text-amber-400" />}
                <span className="font-bold text-white text-sm truncate max-w-[200px]">
                  {selectedFeature.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Return to Catchment Overview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedFeature.category === 'stream' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Strahler Order</span>
                    <strong className="text-cyan-300 text-xs font-mono">Order {selectedFeature.properties.strahler_order}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Design Discharge</span>
                    <strong className="text-white text-xs font-mono">{selectedFeature.properties.flow_rate_m3s} m³/s</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Mean Velocity</span>
                    <strong className="text-emerald-400 text-xs font-mono">{selectedFeature.properties.velocity_ms || 1.15} m/s</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Channel Type</span>
                    <strong className="text-amber-300 text-xs">{selectedFeature.properties.is_main_stem ? 'Main Drainage Stem' : 'Hill Tributary'}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bank Stability Diagnosis</span>
                  <p className="text-white font-medium">{selectedFeature.properties.bank_stability || 'Moderate Scour Risk'}</p>
                  <p className="text-cyan-400 text-[11px] font-medium">{selectedFeature.properties.prescription || 'Large woody debris deflectors & riparian buffer'}</p>
                </div>
              </div>
            )}

            {selectedFeature.category === 'barrier' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Head Drop</span>
                    <strong className="text-rose-400 text-xs font-mono">{selectedFeature.properties.head_drop_m || 1.8} m</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Migration Status</span>
                    <strong className="text-amber-300 text-xs">Fish Blockade</strong>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ecological Retrofit</span>
                  <p className="text-emerald-400 font-bold">{selectedFeature.properties.action || selectedFeature.properties.title}</p>
                  <p className="text-slate-300 text-[11px]">{selectedFeature.properties.fish_impact || selectedFeature.properties.impact}</p>
                </div>

                <button
                  onClick={() => {
                    removeBarrier(selectedFeature.properties.id || selectedFeature.properties.barrier_id);
                    setSelectedFeature(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Decommission & Restore Fishway</span>
                </button>
              </div>
            )}

            {selectedFeature.category === 'intervention' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Estimated Cost</span>
                    <strong className="text-emerald-400 text-xs font-mono">₹{selectedFeature.properties.estimated_cost_lakhs_inr} Lakhs</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Target Zone</span>
                    <strong className="text-white text-xs truncate block">{selectedFeature.properties.target_zone}</strong>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scope & Impact</span>
                  <p className="text-white font-medium">{selectedFeature.properties.quantity}</p>
                  <p className="text-slate-300 text-[11px]">{selectedFeature.properties.impact}</p>
                </div>

                <button
                  onClick={() => {
                    removeIntervention(selectedFeature.properties.id);
                    setSelectedFeature(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/20"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove This Intervention</span>
                </button>
              </div>
            )}

            {selectedFeature.category === 'road' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Surface Type</span>
                    <strong className="text-orange-400 text-xs">{selectedFeature.properties.surface}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Sediment Silt Delivery</span>
                    <strong className="text-rose-400 text-xs font-mono">{selectedFeature.properties.sediment_delivery_t_yr || 420} t/yr</strong>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Engineering Prescription</span>
                  <p className="text-orange-300 font-bold">{selectedFeature.properties.intervention}</p>
                </div>
              </div>
            )}

            {selectedFeature.category === 'vegetation' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Bare Topsoil</span>
                    <strong className="text-amber-400 text-xs font-mono">{selectedFeature.properties.bare_soil_pct || 35}%</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Canopy Density</span>
                    <strong className="text-emerald-400 text-xs font-mono">{selectedFeature.properties.tree_cover_pct || 65}%</strong>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ecological Action</span>
                  <p className="text-emerald-300 font-bold">{selectedFeature.properties.prescription}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedFeature(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>✕ Close & Return to Overview</span>
            </button>
          </div>
        )}

        {/* Panel 3: Active Catchment Zonal Stats HUD (when no feature is inspected) */}
        {!showRankingsDrawer && !selectedFeature && activeArea && (
          <div className="bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl space-y-3 text-xs animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{activeArea.location?.locality || activeArea.name}</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeArea.score >= 75
                      ? 'bg-rose-500/20 text-rose-300'
                      : activeArea.score >= 60
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  PVI: {activeArea.score}
                </span>
                <button
                  onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title={isRightPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  {isRightPanelCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {!isRightPanelCollapsed && (
              <>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">River Basin</span>
                    <strong className="text-cyan-300 text-xs truncate block">{activeArea.location?.river_basin || 'Peninsular Catchment'}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Catchment Size</span>
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

                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={() => setShowDiagnosticModal(true)}
                    className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Diagnostic Scorecard (Why this score?)</span>
                  </button>

                  <button
                    onClick={() => navigate('/simulator')}
                    className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Scale className="w-3.5 h-3.5 text-purple-400" />
                    <span>Test Alternate Policy Weights</span>
                  </button>
                </div>

                <button
                  onClick={() => navigate('/history')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 transition-all"
                >
                  <span>Proceed to Tab 2: History & News</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Panel 4: Clean Empty Prompt (when no catchment is selected) */}
        {!showRankingsDrawer && !selectedFeature && !activeArea && (
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl space-y-2.5 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Compass className="w-4 h-4" />
              <span>Catchment Explorer</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Click <strong>Draw 4 Corners</strong> on the toolbar above to outline any valley, or choose a preset like <strong>Kali Basin</strong> to stream live Whitebox D8 hydrology layers.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => handlePresetSelect('kali')}
                className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
              >
                Load Kali Basin Demo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          Bottom Collapsible Stream Longitudinal Elevation Profile Tray
          ========================================================================= */}
      {showElevationProfile && elevationData.length > 0 && (
        <div className="absolute bottom-8 left-2.5 right-2.5 sm:left-72 sm:right-96 z-[410] bg-slate-900/98 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-xs">
                Stream Longitudinal Elevation & Flow Discharge Profile (Summit to Outlet)
              </h3>
            </div>
            <button
              onClick={() => setShowElevationProfile(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-40 w-full">
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
                  labelFormatter={(v) => `Distance along stream: ${v} km`}
                />
                <Area yAxisId="elev" type="monotone" dataKey="elevation_m" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#elevGradient)" name="Elevation (m)" />
                <Line yAxisId="flow" type="monotone" dataKey="flow_m3s" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Discharge (m³/s)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Summit Ridge Crest (High Energy Headwaters)</span>
            <span className="text-cyan-400">Hover graph to highlight station on map</span>
            <span>Valley Basin Outlet (Alluvial Floodplain)</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          "How It Works" Interactive Modal
          ========================================================================= */}
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

      {/* Site Diagnostic Breakdown Modal */}
      <SiteDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        area={activeArea}
      />

      {/* Transparent Data Resolution Notes & Uncertainty Modal */}
      <DataResolutionModal
        isOpen={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
      />

      {/* =========================================================================
          Bottom Status Bar
          ========================================================================= */}
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
