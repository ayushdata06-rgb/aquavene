import React from 'react';

export interface ProgressRingProps {
  value: number; // 0 to 100
  color?: string; // hex or tailwind class
  size?: number; // diameter in px
  strokeWidth?: number;
  label?: string;
  unit?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  color = '#06b6d4', // aqua-500
  size = 90,
  strokeWidth = 8,
  label,
  unit = '%',
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e3a5a"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-bold text-white font-mono leading-none">
            {Math.round(clampedValue)}
            <span className="text-xs text-slate-400 font-normal ml-0.5">{unit}</span>
          </span>
        </div>
      </div>

      {label && (
        <span className="mt-2 text-xs font-medium text-slate-400 text-center tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};
