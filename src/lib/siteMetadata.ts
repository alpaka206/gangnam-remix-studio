export const SITE_NAME = "Gangnam Remix Studio";

export const SITE_DESCRIPTION =
  "Play, pitch, and arrange 16 Gangnam-style sound pads over a main track in a browser remix studio.";

export const SITE_KEYWORDS = [
  "Gangnam remix",
  "remix studio",
  "launchpad",
  "soundboard",
  "browser audio editor",
  "music remix tool",
  "오디오 리믹스",
  "런치패드",
  "효과음",
];

export function getSiteUrl() {
  return new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://gangnam-remix-studio.vercel.app",
  );
}

export function getAbsoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}
