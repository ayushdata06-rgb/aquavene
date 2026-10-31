import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export interface PVIComponents {
  E: number; // Erosion
  R: number; // Runoff
  L: number; // Land Degradation
  W: number; // Water Stress / Rainfall
  D: number; // Drainage / Downstream Exposure
}

export interface PVIRadarChartProps {
  components: PVIComponents;
  animated?: boolean;
  size?: number;
  className?: string;
}

export const PVIRadarChart: React.FC<PVIRadarChartProps> = ({
  components,
  size = 240,
  className = '',
}) => {
  const radarData = [
    { subject: 'Erosion (E)', value: Math.round(components.E ?? 65), fullMark: 100 },
    { subject: 'Runoff (R)', value: Math.round(components.R ?? 75), fullMark: 100 },
    { subject: 'Degradation (L)', value: Math.round(components.L ?? 55), fullMark: 100 },
    { subject: 'Rain Pressure (W)', value: Math.round(components.W ?? 80), fullMark: 100 },
    { subject: 'Downstream Exp (D)', value: Math.round(components.D ?? 70), fullMark: 100 },
  ];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div style={{ width: '100%', height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#1e3a5a" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#475569', fontSize: 9 }}
              stroke="#1e3a5a"
            />
            <Radar
              name="Vulnerability Component"
              dataKey="value"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-slate-400 font-mono text-center mt-1">
        PVI Composite Pentagon (0 = Prone, 100 = Critical)
      </p>
    </div>
  );
};

