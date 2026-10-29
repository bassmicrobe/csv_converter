"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "ezcsv-cookie-consent";

export type ConsentStatus = "pending" | "accepted" | "rejected";

interface CookieConsentContextValue {
  status: ConsentStatus;
  accept: () => void;
  reject: () => void;
  openPreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
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
  const consentRef = useRef<ConsentStatus>("pending");

  useEffect(() => {
    const syncConsent = () => {
      const storedStatus = getStoredStatus();
      consentRef.current = storedStatus;
      setStatus(storedStatus);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) syncConsent();
    };
    syncConsent();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const accept = useCallback(() => {
    consentRef.current = "accepted";
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setStatus("accepted");
  }, []);

  const reject = useCallback(() => {
    consentRef.current = "rejected";
    try {
      localStorage.setItem(STORAGE_KEY, "rejected");
    } catch {
      /* ignore */
    }
    setStatus("rejected");
  }, []);

  const openPreferences = useCallback(() => {
    consentRef.current = "pending";
    setStatus("pending");
  }, []);
  // The injected script can outlive the React component after consent is revoked.
  const beforeSend = useCallback(
    (event: BeforeSendEvent) =>
      consentRef.current === "accepted" ? event : null,
    [],
  );

  return (
    <CookieConsentContext.Provider
      value={{ status, accept, reject, openPreferences }}
    >
      {children}
      {status === "accepted" && <Analytics beforeSend={beforeSend} />}
      {status === "pending" && (
        <CookieConsentBanner onAccept={accept} onReject={reject} />
      )}
    </CookieConsentContext.Provider>
  );
}

export function CookiePreferencesButton() {
  const consent = useCookieConsent();
  return (
    <button
      type="button"
      onClick={consent?.openPreferences}
      className="min-h-11 cursor-pointer text-sm text-stone-600 underline-offset-4 hover:text-emerald-700 hover:underline"
    >
      アクセス解析の設定
    </button>
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
    <section
      aria-label="アクセス解析の設定"
      className="fixed bottom-0 left-0 right-0 z-[200] border-t border-stone-200 bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:px-6"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-stone-700">
          同意した場合に限り、アクセス解析（Vercel
          Analytics）を利用します。CSVデータは送信しません。
          <Link
            href="/privacy"
            className="ml-1 text-emerald-700 hover:underline"
          >
            プライバシーポリシー
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={onReject}
            className="min-h-11 cursor-pointer rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            拒否する
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="min-h-11 cursor-pointer rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            許可する
          </button>
        </div>
      </div>
    </section>
  );
}
