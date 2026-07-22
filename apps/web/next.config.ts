import type { NextConfig } from 'next';
import path from 'node:path';

const r2PublicHostname = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? process.env.R2_PUBLIC_BASE_URL;
const r2CdnHostname = r2PublicHostname ? new URL(r2PublicHostname).hostname : null;

// Permite que builds disparados por agentes (Claude, CI local, etc.) escrevam
// em um diretório separado do `.next` usado pelo `pnpm dev`. Sem isso, rodar
// `pnpm build` enquanto o dev está vivo causa loop de HMR no navegador.
const isAgentBuild = process.env.NEXT_AGENT_BUILD === 'true';

const monorepoRoot = path.join(__dirname, '..', '..');

const nextConfig: NextConfig = {
  distDir: isAgentBuild ? '.next-agent' : '.next',
  outputFileTracingRoot: monorepoRoot,
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  // Lock workspace root to silence multi-lockfile warning when
  // there are unrelated lockfiles higher in the user's home directory.
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    // Supabase Storage avatars/photos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'www.carmodorioclaro.mg.gov.br',
      },
      {
        protocol: 'https',
        hostname: 'www.carmodorioclaro.cam.mg.gov.br',
      },
      {
        protocol: 'https',
        hostname: 'www.cliqueiachei.com.br',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cidadeviva.app',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
      },
      ...(r2CdnHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: r2CdnHostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
