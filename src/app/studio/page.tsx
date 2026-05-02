import type { Metadata } from "next";

import { StudioShell } from "@/components/studio/StudioShell";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/siteMetadata";

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/studio",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/studio",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} launchpad remix editor preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image"],
  },
};

export default function StudioPage() {
  return <StudioShell />;
}
