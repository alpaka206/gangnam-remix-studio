import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "@/lib/siteMetadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getAbsoluteUrl("/studio"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
