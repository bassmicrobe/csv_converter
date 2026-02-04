"use client";

import { useRef, useState } from "react";

interface FileLoaderProps {
  onLoad: (file: File) => Promise<void>;
  onCreateNew?: () => void;
  loadError: string | null;
  disabled?: boolean;
}

export function FileLoader({ onLoad, onCreateNew, loadError, disabled }: FileLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    await onLoad(file);
    setLoading(false);
    e.target.value = "";
  };

  const triggerSelect = () => inputRef.current?.click();

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-700">
        CSV読み込み
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={triggerSelect}
          disabled={disabled || loading}
          className="cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "linear-gradient(to right, #8b5cf6, #a855f7, #d946ef)",
          }}
        >
          {loading ? "読み込み中..." : "ファイルを選択"}
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          disabled={disabled || !onCreateNew}
          className="cursor-pointer rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          新たに作成
        </button>
        <span className="text-sm text-stone-500">
          文字コード・区切り文字などは自動判別されます（エクスポート時に変更可能）
        </span>
      </div>
      {loadError && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}
    </section>
  );
}
