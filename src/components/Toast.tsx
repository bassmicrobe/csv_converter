"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

export type ToastVariant = "success" | "error";

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  return ctx;
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-emerald-400 bg-emerald-50 ring-emerald-200/80 text-emerald-900",
  error:
    "border-red-400 bg-red-50 ring-red-200/80 text-red-900",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<ToastVariant>("success");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, v: ToastVariant = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setVariant(v);
    timerRef.current = setTimeout(() => {
      setMessage(null);
      timerRef.current = null;
    }, 2000);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message != null && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-6 right-6 z-[100] rounded-lg border-2 px-4 py-3 shadow-xl ring-2 ${variantStyles[variant]}`}
        >
          <p className="text-sm font-semibold">{message}</p>
        </div>
      )}
    </ToastContext.Provider>
  );
}
