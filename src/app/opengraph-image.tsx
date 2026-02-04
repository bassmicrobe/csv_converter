import { ImageResponse } from "next/og";

export const alt = "ezcsv - ブラウザで動くCSV編集ツール";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafaf9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            padding: 48,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#1c1917",
              letterSpacing: "-0.02em",
            }}
          >
            ezcsv
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#57534e",
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            ブラウザだけで動くCSV編集ツール
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#22c55e",
              fontWeight: 600,
            }}
          >
            データはサーバーに送信されません
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
