"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-remove após 4.5 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const toastMethods = React.useMemo(
    () => ({
      success: (msg: string) => addToast("success", msg),
      error: (msg: string) => addToast("error", msg),
      info: (msg: string) => addToast("info", msg),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* Container fixo de Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-slide-up ${
              item.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                : item.type === "error"
                ? "bg-rose-50/95 border-rose-200 text-rose-900"
                : "bg-blue-50/95 border-blue-200 text-blue-900"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {item.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
              {item.type === "info" && (
                <Info className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {item.message}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser utilizado dentro de um ToastProvider");
  }
  return context.toast;
}
