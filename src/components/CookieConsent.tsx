"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Analytics } from "@vercel/analytics/next";

const STORAGE_KEY = "ezcsv-cookie-consent";

export type ConsentStatus = "pending" | "accepted" | "rejected";

interface CookieConsentContextValue {
  status: ConsentStatus;
  accept: () => void;
  reject: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
);

function getStoredStatus(): ConsentStatus {
  if (typeof window === "undefined") return "pending";
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === "accepted" || s === "rejected") return s;
  } catch {
    /* ignore */
  }
  return "pending";
}

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<ConsentStatus>("pending");

  useEffect(() => {
    setStatus(getStoredStatus());
  }, []);

  const accept = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setStatus("accepted");
  }, []);

  const reject = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "rejected");
    } catch {
      /* ignore */
    }
    setStatus("rejected");
  }, []);

  return (
    <CookieConsentContext.Provider value={{ status, accept, reject }}>
      {children}
      {status === "accepted" && <Analytics />}
      {status === "pending" && <CookieConsentBanner onAccept={accept} onReject={reject} />}
    </CookieConsentContext.Provider>
  );
}

function CookieConsentBanner({
  onAccept,
  onReject,
}: {
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="クッキー利用について"
      className="fixed bottom-0 left-0 right-0 z-[200] border-t border-stone-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:px-6"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-stone-700">
          本サイトではアクセス解析（Vercel Analytics）のためにデータを収集しています。
          <Link
            href="/privacy"
            className="ml-1 text-emerald-600 hover:underline"
          >
            プライバシーポリシー
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={onReject}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            拒否する
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            許可する
          </button>
        </div>
      </div>
    </div>
  );
}
