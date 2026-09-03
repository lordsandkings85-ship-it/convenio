import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Trash2 } from 'lucide-react';

/* ─── Context ─────────────────────────────────────────────── */
const DialogContext = createContext(null);

export function useDialog() {
  return useContext(DialogContext);
}

/* ─── Provider (wrap your app root with this) ─────────────── */
export function DialogProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirm({
        message,
        danger: options.danger ?? false,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        onConfirm: () => { setConfirm(null); resolve(true); },
        onCancel:  () => { setConfirm(null); resolve(false); },
      });
    });
  }, []);

  return (
    <DialogContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* ── Toast ── */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Confirm Dialog ── */}
      {confirm && <ConfirmDialog {...confirm} />}
    </DialogContext.Provider>
  );
}

/* ─── Toast ───────────────────────────────────────────────── */
const toastConfig = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'border-l-emerald-500', icon_color: 'text-emerald-500', text: 'text-emerald-800' },
  error:   { icon: XCircle,      bg: 'bg-primary/5',     border: 'border-primary/15',     accent: 'border-l-primary',     icon_color: 'text-primary',     text: 'text-primary-hover'     },
  warning: { icon: AlertTriangle,bg: 'bg-amber-50',   border: 'border-amber-200',   accent: 'border-l-amber-500',   icon_color: 'text-amber-500',   text: 'text-amber-800'   },
  info:    { icon: Info,         bg: 'bg-blue-50',    border: 'border-blue-200',    accent: 'border-l-blue-500',    icon_color: 'text-blue-500',    text: 'text-blue-800'    },
};

function Toast({ type, message, onClose }) {
  const cfg = toastConfig[type] || toastConfig.info;
  const Icon = cfg.icon;
  return (
    <div className="fixed bottom-6 right-6 z-[200] toast-enter">
      <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-elevated border max-w-sm ${cfg.bg} ${cfg.border} border-l-4 ${cfg.accent}`}>
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.icon_color}`} />
        <p className={`text-sm font-medium flex-1 leading-relaxed ${cfg.text}`}>{message}</p>
        <button onClick={onClose} className={`${cfg.icon_color} hover:opacity-70 transition-opacity p-0.5`}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Confirm Dialog ──────────────────────────────────────── */
function ConfirmDialog({ message, danger, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-sm border border-borderMuted/40 overflow-hidden anim-scale-in">
        {/* Icon bar */}
        <div className={`px-6 pt-6 flex justify-center`}>
          <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-sm ${danger ? 'bg-primary/10 shadow-primary/10' : 'bg-amber-50 shadow-amber-500/10'}`}>
            {danger
              ? <Trash2 className="h-7 w-7 text-primary" />
              : <AlertTriangle className="h-7 w-7 text-amber-500" />
            }
          </div>
        </div>
        {/* Body */}
        <div className="px-6 py-4 text-center">
          <p className="text-ink text-sm leading-relaxed font-medium">{message}</p>
        </div>
        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-borderMuted/60 text-sm font-bold text-inkLight hover:bg-surface transition-all duration-200 active:scale-[0.98] btn-press"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 shadow-sm active:scale-[0.98] btn-press ${
              danger ? 'bg-gradient-to-r from-primary to-[#b8151d] hover:shadow-md hover:shadow-primary/20' : 'bg-gradient-to-r from-navy to-[#1a2542] hover:shadow-lg'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
