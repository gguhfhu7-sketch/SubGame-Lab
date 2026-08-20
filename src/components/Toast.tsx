import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2.5 max-w-lg w-[92%] sm:w-auto pointer-events-none items-center">
      {toasts.map((toast) => {
        let containerStyle = 'bg-slate-900 text-white border-slate-700 shadow-xl';
        let Icon = Info;
        let iconColor = 'text-indigo-400';

        if (toast.type === 'success') {
          containerStyle = 'bg-emerald-700 text-white border-emerald-500 shadow-emerald-900/30';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-200';
        } else if (toast.type === 'error') {
          containerStyle = 'bg-rose-700 text-white border-rose-500 shadow-rose-900/30';
          Icon = XCircle;
          iconColor = 'text-rose-200';
        } else if (toast.type === 'warning') {
          containerStyle = 'bg-amber-600 text-white border-amber-400 shadow-amber-900/30';
          Icon = AlertTriangle;
          iconColor = 'text-amber-100';
        }

        const msgText = typeof toast.message === 'string' ? toast.message : String(toast.message || '');

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 text-sm font-medium animate-slide-up transition-all ${containerStyle}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <span className="leading-snug break-words text-white font-medium select-text">
                {msgText || 'پیغام دریافت شد'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

