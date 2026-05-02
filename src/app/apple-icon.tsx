import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
          width: 132,
          height: 132,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbbf24",
          color: "#111315",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 76,
          fontWeight: 900,
        }}
      >
        G
      </div>
    </div>,
    size,
  );
}
