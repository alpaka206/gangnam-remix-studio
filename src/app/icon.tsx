import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111315",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbbf24",
          color: "#111315",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 28,
          fontWeight: 900,
        }}
      >
        G
      </div>
    </div>,
    size,
  );
}
