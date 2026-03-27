"use client";

import dynamic from "next/dynamic";

export const ContactForm = dynamic(
  () => import("./ContactForm").then((m) => ({ default: m.ContactForm })),
  {
    ssr: false,
    loading: () => (
      <div className="mt-8 h-48 animate-pulse rounded-lg bg-stone-200" />
    ),
  },
);
