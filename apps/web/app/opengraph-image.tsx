import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#FAF8F5',
          color: '#191919',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          padding: 80,
          width: '100%',
        }}
      >
        <div style={{ color: '#C84810', fontSize: 34, fontWeight: 700 }}>Portal Carmelitano</div>
        <div style={{ fontSize: 72, fontWeight: 800, marginTop: 28, textAlign: 'center' }}>
          Portal hiperlocal de Carmo do Rio Claro
        </div>
        <div style={{ color: '#5A5A5A', fontSize: 30, marginTop: 28 }}>
          Comercio, turismo, servicos, comunidade e transparencia
        </div>
      </div>
    ),
    size,
  );
}
