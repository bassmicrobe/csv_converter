"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
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
          className="fixed bottom-6 right-6 z-[100] rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-lg"
        >
          <p className="text-sm font-medium text-stone-800">{message}</p>
        </div>
      )}
    </ToastContext.Provider>
  );
}
