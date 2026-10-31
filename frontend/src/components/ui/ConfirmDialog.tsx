import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  danger = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-up">
      <div className="relative w-full max-w-md rounded-2xl bg-hydro-card border border-hydro-border p-6 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl border ${
              danger
                ? 'bg-rose-950/80 border-rose-600/40 text-rose-400'
                : 'bg-amber-950/80 border-amber-600/40 text-amber-400'
            }`}
          >
            {danger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">{message}</p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-hydro-panel hover:bg-slate-700/60 border border-hydro-border text-xs font-semibold text-slate-300 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-lg transition-all ${
                  danger
                    ? 'bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 shadow-rose-950/50'
                    : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-950/50'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
