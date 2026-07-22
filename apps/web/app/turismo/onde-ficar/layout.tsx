import 'maplibre-gl/dist/maplibre-gl.css';

export default function OndeFicarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div id="onde-ficar-shell">{children}</div>
      <style>
        {`
          body:has(#onde-ficar-shell) {
            padding-bottom: 0;
          }
        `}
      </style>
    </>
  );
}
