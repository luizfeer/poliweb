'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function MenuShareCard({ slug, businessName }: { slug: string; businessName: string }) {
  const [url, setUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // origin só existe no cliente (subdomínio da cidade em prod) — daí o efeito.
    const publicUrl = `${window.location.origin}/comercio/negocio/${slug}/cardapio`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(publicUrl);
    QRCode.toDataURL(publicUrl, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [slug]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado. Cole na bio do Instagram.');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Não consegui copiar. Copie manualmente.');
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `cardapio-${slug}-qr.png`;
    a.click();
  }

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <QrCode className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">Compartilhar o cardápio</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        QR pra mesa e link pra bio do Instagram. Aponta pra página pública do cardápio de {businessName}.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-xl border bg-white p-2">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code do cardápio" className="h-full w-full" />
          ) : (
            <QrCode className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{url || '—'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar link da bio
            </Button>
            <Button type="button" size="sm" className="gap-1.5" disabled={!qrDataUrl} onClick={downloadQr}>
              <Download className="h-4 w-4" /> Baixar QR (PNG)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
