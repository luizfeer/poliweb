'use client';

import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  GUIDE_HIGHLIGHT_ICON_KEYS,
  GUIDE_HIGHLIGHT_ICON_MAP,
  resolveGuideHighlightIcon,
} from '@/lib/tourism/guide-highlight-icons';
import type {
  GuideContentBlock,
  GuideFaqItem,
  GuideHighlight,
  GuidePracticalItem,
} from '@/lib/tourism/types';

function parseSeo(raw: unknown): { title: string; description: string; keywordsLines: string } {
  if (!raw || typeof raw !== 'object') {
    return { title: '', description: '', keywordsLines: '' };
  }
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title : '';
  const description = typeof o.description === 'string' ? o.description : '';
  let keywordsLines = '';
  if (Array.isArray(o.keywords)) {
    keywordsLines = o.keywords.map((k) => String(k).trim()).filter(Boolean).join('\n');
  } else if (typeof o.keywords === 'string') {
    keywordsLines = o.keywords;
  }
  return { title, description, keywordsLines };
}

function serializeSeo(s: { title: string; description: string; keywordsLines: string }): string {
  const keywords = s.keywordsLines
    .split(/[\n,]+/)
    .map((k) => k.trim())
    .filter(Boolean);
  const payload: Record<string, unknown> = {};
  if (s.title.trim()) payload.title = s.title.trim();
  if (s.description.trim()) payload.description = s.description.trim();
  if (keywords.length) payload.keywords = keywords;
  return JSON.stringify(payload);
}

function parseHighlights(raw: unknown): GuideHighlight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as Record<string, unknown>;
      const title = typeof o.title === 'string' ? o.title : '';
      const description = typeof o.description === 'string' ? o.description : '';
      let icon = typeof o.icon === 'string' ? o.icon : 'pin';
      if (!GUIDE_HIGHLIGHT_ICON_MAP[icon]) icon = 'pin';
      if (!title && !description) return null;
      return { icon, title, description };
    })
    .filter((x): x is GuideHighlight => x !== null);
}

function parsePractical(raw: unknown): GuidePracticalItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as Record<string, unknown>;
      const title = typeof o.title === 'string' ? o.title : '';
      const text = typeof o.text === 'string' ? o.text : '';
      if (!title && !text) return null;
      return { title, text };
    })
    .filter((x): x is GuidePracticalItem => x !== null);
}

function parseFaq(raw: unknown): GuideFaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as Record<string, unknown>;
      const question = typeof o.question === 'string' ? o.question : '';
      const answer = typeof o.answer === 'string' ? o.answer : '';
      if (!question && !answer) return null;
      return { question, answer };
    })
    .filter((x): x is GuideFaqItem => x !== null);
}

function parseContentBlocks(raw: unknown): GuideContentBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const o = row as Record<string, unknown>;
      const type = o.type === 'quote' || o.type === 'banner' ? o.type : 'banner';
      const title = typeof o.title === 'string' ? o.title : '';
      const text = typeof o.text === 'string' ? o.text : '';
      let button: GuideContentBlock['button'] = null;
      if (o.button && typeof o.button === 'object') {
        const b = o.button as Record<string, unknown>;
        const label = typeof b.label === 'string' ? b.label : '';
        const href = typeof b.href === 'string' ? b.href : '';
        if (label || href) button = { label, href };
      }
      if (!title && !text && !button) return null;
      return { type, title, text, button };
    })
    .filter((x): x is GuideContentBlock => x !== null);
}

function parsePhotoUrls(raw: unknown): string {
  if (!Array.isArray(raw)) return '';
  return raw.map((u) => String(u).trim()).filter(Boolean).join('\n');
}

function serializePhotoUrls(text: string): string {
  const urls = text
    .split(/[\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(urls);
}

type Props = {
  guide: Record<string, unknown>;
};

export function GuideStructuredFields({ guide }: Props) {
  const [seo, setSeo] = useState(() => parseSeo(guide.seo));
  const [highlights, setHighlights] = useState(() => parseHighlights(guide.highlights));
  const [practical, setPractical] = useState(() => parsePractical(guide.practical_info));
  const [faq, setFaq] = useState(() => parseFaq(guide.faq));
  const [blocks, setBlocks] = useState(() => parseContentBlocks(guide.content_blocks));
  const [photoLines, setPhotoLines] = useState(() => parsePhotoUrls(guide.photos));

  const seoJson = useMemo(() => serializeSeo(seo), [seo]);
  const highlightsJson = useMemo(() => JSON.stringify(highlights), [highlights]);
  const practicalJson = useMemo(() => JSON.stringify(practical), [practical]);
  const faqJson = useMemo(() => JSON.stringify(faq), [faq]);
  const blocksJson = useMemo(() => JSON.stringify(blocks), [blocks]);
  const photosJson = useMemo(() => serializePhotoUrls(photoLines), [photoLines]);

  return (
    <>
      <input type="hidden" name="seo_json" value={seoJson} />
      <input type="hidden" name="highlights_json" value={highlightsJson} />
      <input type="hidden" name="practical_info_json" value={practicalJson} />
      <input type="hidden" name="faq_json" value={faqJson} />
      <input type="hidden" name="content_blocks_json" value={blocksJson} />
      <input type="hidden" name="photos_json" value={photosJson} />

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">SEO</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Título e descrição para buscadores; palavras-chave — uma por linha.
        </p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="seo-title">Título (meta title)</Label>
        <Input
          id="seo-title"
          value={seo.title}
          onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))}
          placeholder="Ex.: Conheça Itaci | Guia do distrito..."
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="seo-description">Descrição (meta description)</Label>
        <textarea
          id="seo-description"
          value={seo.description}
          onChange={(e) => setSeo((s) => ({ ...s, description: e.target.value }))}
          rows={3}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="seo-keywords">Palavras-chave (uma por linha)</Label>
        <textarea
          id="seo-keywords"
          value={seo.keywordsLines}
          onChange={(e) => setSeo((s) => ({ ...s, keywordsLines: e.target.value }))}
          rows={4}
          className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
          placeholder={'Itaci\nLago de Furnas'}
        />
      </div>

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">Destaques</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Cards no topo da página: escolha o ícone, título e texto curto.
        </p>
      </div>

      <div className="md:col-span-2 space-y-4">
        {highlights.map((item, index) => (
          <div
            key={`${index}-${item.title}`}
            className="rounded-xl border bg-muted/30 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                <GripVertical className="size-3.5" aria-hidden="true" />
                Destaque {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive h-8 gap-1"
                onClick={() => setHighlights((list) => list.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-3.5" />
                Remover
              </Button>
            </div>
            <div className="mb-3">
              <Label className="mb-2 block text-xs">Ícone</Label>
              <div className="flex flex-wrap gap-1.5">
                {GUIDE_HIGHLIGHT_ICON_KEYS.map((key) => {
                  const Icon = resolveGuideHighlightIcon(key);
                  const selected = item.icon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={key}
                      onClick={() =>
                        setHighlights((list) =>
                          list.map((h, i) => (i === index ? { ...h, icon: key } : h)),
                        )
                      }
                      className={`flex size-10 items-center justify-center rounded-lg border transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background hover:bg-muted'
                      }`}
                    >
                      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Título</Label>
                <Input
                  value={item.title}
                  onChange={(e) =>
                    setHighlights((list) =>
                      list.map((h, i) => (i === index ? { ...h, title: e.target.value } : h)),
                    )
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Descrição</Label>
                <textarea
                  value={item.description}
                  onChange={(e) =>
                    setHighlights((list) =>
                      list.map((h, i) =>
                        i === index ? { ...h, description: e.target.value } : h,
                      ),
                    )
                  }
                  rows={3}
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() =>
            setHighlights((list) => [...list, { icon: 'pin', title: '', description: '' }])
          }
        >
          <Plus className="size-4" />
          Adicionar destaque
        </Button>
      </div>

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">Informações práticas</p>
      </div>

      <div className="md:col-span-2 space-y-4">
        {practical.map((item, index) => (
          <div key={`${index}-${item.title}`} className="rounded-xl border p-4">
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive h-8 gap-1"
                onClick={() => setPractical((list) => list.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-3.5" />
                Remover
              </Button>
            </div>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Título</Label>
                <Input
                  value={item.title}
                  onChange={(e) =>
                    setPractical((list) =>
                      list.map((p, i) => (i === index ? { ...p, title: e.target.value } : p)),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Texto</Label>
                <textarea
                  value={item.text}
                  onChange={(e) =>
                    setPractical((list) =>
                      list.map((p, i) => (i === index ? { ...p, text: e.target.value } : p)),
                    )
                  }
                  rows={3}
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setPractical((list) => [...list, { title: '', text: '' }])}
        >
          <Plus className="size-4" />
          Adicionar informação
        </Button>
      </div>

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">FAQ</p>
      </div>

      <div className="md:col-span-2 space-y-4">
        {faq.map((item, index) => (
          <div key={`${index}-${item.question}`} className="rounded-xl border p-4">
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive h-8 gap-1"
                onClick={() => setFaq((list) => list.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-3.5" />
                Remover
              </Button>
            </div>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Pergunta</Label>
                <Input
                  value={item.question}
                  onChange={(e) =>
                    setFaq((list) =>
                      list.map((f, i) => (i === index ? { ...f, question: e.target.value } : f)),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Resposta</Label>
                <textarea
                  value={item.answer}
                  onChange={(e) =>
                    setFaq((list) =>
                      list.map((f, i) => (i === index ? { ...f, answer: e.target.value } : f)),
                    )
                  }
                  rows={4}
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setFaq((list) => [...list, { question: '', answer: '' }])}
        >
          <Plus className="size-4" />
          Adicionar pergunta
        </Button>
      </div>

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">Blocos (citação / banner)</p>
      </div>

      <div className="md:col-span-2 space-y-4">
        {blocks.map((block, index) => (
          <div key={`${index}-${block.title}`} className="rounded-xl border p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <select
                value={block.type}
                onChange={(e) =>
                  setBlocks((list) =>
                    list.map((b, i) =>
                      i === index
                        ? { ...b, type: e.target.value as GuideContentBlock['type'] }
                        : b,
                    ),
                  )
                }
                className="bg-background rounded-lg border px-3 py-2 text-sm"
              >
                <option value="quote">Citação em destaque</option>
                <option value="banner">Banner com fundo</option>
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive h-8 gap-1"
                onClick={() => setBlocks((list) => list.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-3.5" />
                Remover
              </Button>
            </div>
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Título (banner; ignorado na citação simples)</Label>
                <Input
                  value={block.title}
                  onChange={(e) =>
                    setBlocks((list) =>
                      list.map((b, i) => (i === index ? { ...b, title: e.target.value } : b)),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Texto principal</Label>
                <textarea
                  value={block.text}
                  onChange={(e) =>
                    setBlocks((list) =>
                      list.map((b, i) => (i === index ? { ...b, text: e.target.value } : b)),
                    )
                  }
                  rows={block.type === 'quote' ? 4 : 3}
                  className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(block.button)}
                    onChange={(e) =>
                      setBlocks((list) =>
                        list.map((b, i) =>
                          i === index
                            ? {
                                ...b,
                                button: e.target.checked ? { label: '', href: '' } : null,
                              }
                            : b,
                        ),
                      )
                    }
                  />
                  Botão de chamada (banner)
                </label>
                {block.button ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Texto do botão"
                      value={block.button.label}
                      onChange={(e) =>
                        setBlocks((list) =>
                          list.map((b, i) =>
                            i === index && b.button
                              ? { ...b, button: { ...b.button, label: e.target.value } }
                              : b,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder="Link (href)"
                      value={block.button.href}
                      onChange={(e) =>
                        setBlocks((list) =>
                          list.map((b, i) =>
                            i === index && b.button
                              ? { ...b, button: { ...b.button, href: e.target.value } }
                              : b,
                          ),
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() =>
            setBlocks((list) => [...list, { type: 'banner', title: '', text: '', button: null }])
          }
        >
          <Plus className="size-4" />
          Adicionar bloco
        </Button>
      </div>

      <div className="md:col-span-2 border-t pt-4">
        <p className="text-muted-foreground text-sm font-semibold">URLs de fotos extras (legado)</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Uma URL por linha (mesmo formato que o JSON de fotos). Prefira a galeria CDN ao lado.
        </p>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Fotos por URL</Label>
        <textarea
          value={photoLines}
          onChange={(e) => setPhotoLines(e.target.value)}
          rows={5}
          className="bg-background font-mono w-full rounded-lg border px-3 py-2 text-xs"
          placeholder={'https://...\n/images/itaci/foto.jpg'}
        />
      </div>
    </>
  );
}
