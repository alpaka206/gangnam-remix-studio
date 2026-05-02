import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/siteMetadata";

export const alt = `${SITE_NAME} launchpad remix editor preview`;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const padColors = [
  "#e879f9",
  "#fb7185",
  "#f97316",
  "#facc15",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#38bdf8",
  "#60a5fa",
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#d946ef",
  "#f472b6",
  "#f43f5e",
];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#111315",
        color: "#fafafa",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: 56,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          border: "1px solid #3f3f46",
          background: "#18181b",
        }}
      >
        <div
          style={{
            width: 430,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 42,
            borderRight: "1px solid #3f3f46",
            background: "#09090b",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                color: "#fbbf24",
                fontSize: 20,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Browser Remix Studio
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 66,
                lineHeight: 1,
                fontWeight: 800,
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                display: "flex",
                color: "#d4d4d8",
                fontSize: 25,
                lineHeight: 1.35,
              }}
            >
              {SITE_DESCRIPTION}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              color: "#a1a1aa",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex" }}>16 pads</div>
            <div style={{ display: "flex" }}>/</div>
            <div style={{ display: "flex" }}>pitch</div>
            <div style={{ display: "flex" }}>/</div>
            <div style={{ display: "flex" }}>timeline</div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 42,
            gap: 24,
          }}
        >
          <div
            style={{
              height: 92,
              display: "flex",
              alignItems: "center",
              border: "1px solid #52525b",
              background: "#27272a",
            }}
          >
            <div
              style={{
                width: 110,
                height: "100%",
                display: "flex",
                alignItems: "center",
                paddingLeft: 22,
                color: "#fbbf24",
                fontSize: 20,
                fontWeight: 800,
                borderRight: "1px solid #52525b",
              }}
            >
              Main
            </div>
            <div
              style={{
                flex: 1,
                height: 30,
                display: "flex",
                margin: 28,
                background: "#fbbf24",
              }}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {padColors.map((color, index) => (
              <div
                key={color}
                style={{
                  width: 154,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 18px",
                  border: "1px solid #3f3f46",
                  background: "#27272a",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 48,
                    display: "flex",
                    background: color,
                  }}
                />
                <div style={{ display: "flex", fontSize: 22, fontWeight: 800 }}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
