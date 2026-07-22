import type { MetadataRoute } from "next";

const personas = [
  "comerciantes",
  "prefeituras",
  "associacoes-comerciais",
  "moradores",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cidadeviva.com.br").replace(
    /\/$/,
    "",
  );
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/termos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/lgpd`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/excluir-conta`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const paraQuem: MetadataRoute.Sitemap = personas.map((slug) => ({
    url: `${base}/para-quem/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  return [...staticPages, ...paraQuem];
}
