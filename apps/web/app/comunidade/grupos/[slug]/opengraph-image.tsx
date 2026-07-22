import { ImageResponse } from 'next/og';
import { getCurrentCity } from '@/lib/cities';
import { getCommunityGroupBySlug } from '@/lib/community/queries';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function OpenGraphImage({ params }: PageProps) {
  const city = await getCurrentCity();
  const { slug } = await params;
  const group = city ? await getCommunityGroupBySlug({ city_id: city.id, slug }) : null;

  const title = group?.name ?? 'Grupo da comunidade';
  const subtitle =
    group?.shortDescription ??
    group?.description ??
    'Diretório hiperlocal de grupos, coletivos e WhatsApp da cidade.';
  const badge = group?.type === 'whatsapp_group' ? 'Grupo de WhatsApp' : 'Coletivo local';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#F6F0E7',
          color: '#191919',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {group?.coverUrl ? (
          <img
            src={group.coverUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: group?.coverUrl
              ? 'linear-gradient(135deg, rgba(25,25,25,0.82), rgba(200,72,16,0.74))'
              : 'linear-gradient(135deg, #C84810, #6C7D35)',
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '54px 64px',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                padding: '10px 18px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.16)',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              Carmo Local
            </div>
            <div
              style={{
                display: 'flex',
                padding: '10px 18px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {badge}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900 }}>
            <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
            <div style={{ fontSize: 28, lineHeight: 1.35, color: 'rgba(255,255,255,0.9)' }}>
              {subtitle.slice(0, 180)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.85)' }}>
              {group?.category ? `Tema: ${group.category}` : 'Comunidade local'}
            </div>
            <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.85)' }}>
              {city ? `${city.name}/${city.state}` : 'Carmo do Rio Claro/MG'}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
