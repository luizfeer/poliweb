import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Fraunces, Inter, Syne } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cidadeviva.com.br";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-body",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-city-body",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cidade Viva – A tecnologia que sua cidade merece",
  description:
    "A Cidade Viva reúne turismo, comércio, eventos, serviços públicos e comunidade em um portal local feito sob medida para cada cidade.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable} ${syne.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
