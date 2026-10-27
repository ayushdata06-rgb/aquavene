import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';
import { Watershed, PriorityCategory } from '../types';
import { Layers, Eye, Info } from 'lucide-react';

interface MapComponentProps {
  watersheds: Watershed[];
  selectedWatershedId?: string;
  onSelectWatershed?: (id: string) => void;
  height?: string;
}

const CATEGORY_COLORS: Record<PriorityCategory, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Moderate: '#eab308',
  Low: '#22c55e',
};

// Auto pan to selected watershed
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  watersheds,
  selectedWatershedId,
  onSelectWatershed,
  height = '500px',
}) => {
  const [activeLayer, setActiveLayer] = useState<'priority' | 'drainage' | 'satellite'>('priority');
  const [showBoundaries, setShowBoundaries] = useState(true);

  // Selected watershed or default center
  const selected = watersheds.find((w) => w.id === selectedWatershedId);
  const center: [number, number] = selected?.centroid || [16.5, 75.5];
  const zoom = selected ? 10 : 6;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      {/* Map Control Bar */}
      <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2 shadow-lg flex items-center space-x-2 text-xs">
        <div className="flex items-center space-x-1 pr-2 border-r border-slate-700 text-slate-400">
          <Layers className="h-3.5 w-3.5 text-aqua-400" />
          <span className="font-medium">Layers:</span>
        </div>
        <button
          onClick={() => setActiveLayer('priority')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
            activeLayer === 'priority'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Priority Score
        </button>
        <button
          onClick={() => setActiveLayer('drainage')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
            activeLayer === 'drainage'
              ? 'bg-aqua-500/20 text-aqua-300 border border-aqua-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Drainage Net
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-lg text-xs space-y-2">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
          <Info className="h-3 w-3 text-slate-400" />
          <span>Restoration Priority</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
            <span className="text-slate-300 text-[11px]">Critical (≥ 75)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>
            <span className="text-slate-300 text-[11px]">High (60-74)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
            <span className="text-slate-300 text-[11px]">Moderate (40-59)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 text-[11px]">Low (&lt; 40)</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        zoomControl={false}
      >
        <MapController center={center} zoom={zoom} />
        {/* CartoDB Dark Matter Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Polygons */}
        {watersheds.map((ws) => {
          if (!ws.coordinates || ws.coordinates.length === 0) return null;
          const isSelected = ws.id === selectedWatershedId;
          const color = ws.priority_category ? CATEGORY_COLORS[ws.priority_category] : '#3b82f6';

          return (
            <Polygon
              key={ws.id}
              positions={ws.coordinates}
              pathOptions={{
                color: isSelected ? '#38bdf8' : color,
                weight: isSelected ? 3 : 1.5,
                fillColor: color,
                fillOpacity: isSelected ? 0.6 : 0.35,
              }}
              eventHandlers={{
                click: () => onSelectWatershed && onSelectWatershed(ws.id),
              }}
            >
              <Tooltip sticky>
                <div className="text-xs">
                  <p className="font-bold text-white">{ws.name}</p>
                  <p className="text-slate-400">{ws.watershed_code} • {ws.basin_name}</p>
                  <p className="font-semibold text-brand-400 mt-1">
                    Score: {ws.overall_score ?? 'N/A'} ({ws.priority_category})
                  </p>
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2 space-y-2 min-w-[200px]">
                  <div className="border-b border-slate-700 pb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">
                      {ws.watershed_code}
                    </span>
                    <h4 className="font-bold text-sm text-white">{ws.name}</h4>
                    <p className="text-xs text-slate-400">{ws.district}, {ws.state}</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Area:</span>
                      <span className="font-medium text-slate-200">{ws.area_sq_km} km²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Basin:</span>
                      <span className="font-medium text-slate-200">{ws.basin_name}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-700/60">
                      <span className="text-slate-300">Priority Score:</span>
                      <span style={{ color }}>{ws.overall_score} ({ws.priority_category})</span>
                    </div>
                  </div>
                  {onSelectWatershed && (
                    <button
                      onClick={() => onSelectWatershed(ws.id)}
                      className="w-full mt-2 py-1.5 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Select Watershed
                    </button>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
};
