import React, { useEffect, useState } from 'react';
import { Loader2, Waves } from 'lucide-react';
import { apiClient } from '../../api/client';

export interface LoadingOverlayProps {
  message?: string;
  progress?: number;
  jobId?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Executing Geospatial & Whitebox Analysis...',
  progress: externalProgress,
  jobId,
  className = '',
}) => {
  const [internalProgress, setInternalProgress] = useState<number>(externalProgress || 15);
  const [statusMsg, setStatusMsg] = useState<string>(message);

  useEffect(() => {
    if (!jobId) {
      if (externalProgress !== undefined) {
        setInternalProgress(externalProgress);
      }
      return;
    }

    // Poll background job
    const interval = setInterval(async () => {
      try {
        const job = await apiClient.pollJob(jobId);
        if (job) {
          setInternalProgress(job.progress_pct || 50);
          if (job.status === 'completed') {
            setStatusMsg('Processing complete!');
            clearInterval(interval);
          } else if (job.status === 'failed') {
            setStatusMsg(job.error_message || 'Job encountered an error');
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.warn('Error polling job status:', e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, externalProgress]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-hydro-surface/85 backdrop-blur-md ${className}`}
    >
      <div className="relative flex flex-col items-center max-w-md w-full mx-4 p-8 rounded-2xl bg-hydro-panel border border-aqua-500/30 shadow-2xl text-center">
        {/* Animated Water Ripple */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-aqua-500/20 animate-ping opacity-75"></div>
          <div className="relative p-4 rounded-full bg-aqua-950 border border-aqua-500/40 text-aqua-400">
            <Waves className="w-8 h-8 animate-pulse text-aqua-400" />
          </div>
        </div>

        <h3 className="text-base font-bold text-white mb-2">{statusMsg}</h3>
        <p className="text-xs text-slate-400 mb-6">
          Running WhiteboxTools 2.3 Hydrological Pit-Filling, D8 Stream Network Extraction & XGBoost Vulnerability inference.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden border border-hydro-border">
          <div
            className="bg-gradient-to-r from-aqua-500 to-sky-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, internalProgress))}%` }}
          />
        </div>
        <div className="w-full flex justify-between items-center text-[11px] font-mono text-slate-400">
          <span>Processing Pipeline</span>
          <span className="text-aqua-400 font-semibold">{internalProgress}%</span>
        </div>
      </div>
    </div>
  );
};
