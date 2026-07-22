'use client';

import './editor.css';
import '@/lib/studio/studio.css';

import { toPng } from 'html-to-image';
import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  AtSign,
  Hourglass,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Loader2,
  Megaphone,
  MoreVertical,
  Newspaper,
  Palette,
  Pencil,
  Plus,
  Save,
  Send,
  Sparkles,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { uploadDirectToProcessor } from '@/lib/media/direct-upload';
import { finalizeMediaUploadAction, requestMediaUploadTokenAction } from '@/lib/media/actions';
import { upsertEntityPostAction } from '@/lib/posts/actions';
import { SlideCanvas } from '@/lib/studio/templates';
import { buildBusinessCopy, KIND_SECTION, seedSlideContent } from '@/lib/studio/copy';
import {
  buildSlides,
  formatMeta,
  FORMATS,
  kindMeta,
  KINDS_BY_RAMO,
  makeSlide,
  newSlideId,
  POST_INTENTS,
  RAMOS,
  THEMES,
  type ArtPiece,
  type BusinessContext,
  type FormatId,
  type KindId,
  type PostIntentId,
  type RamoId,
  type Slide,
} from '@/lib/studio/types';
import { requestHomeBannerAction, saveArtPieceAction } from '@/lib/studio/actions';
import { generateArtCarouselAction } from '@/lib/studio/ai-actions';
import { ReelPreviewButton } from './reel-preview';

const RAMO_ICONS: Record<string, LucideIcon> = { UtensilsCrossed, Store, Wrench, BedDouble };
const KIND_ICONS: Record<string, LucideIcon> = {
  Image: ImageIcon, Tag: LayoutTemplate, LayoutGrid: Layers, StickyNote: Newspaper,
  Clock, CreditCard, Star,
  Megaphone, ListOrdered: Layers, MessageCircle: Send,
};

/** Converte uma URL remota (R2/CDN) em data URL pra captura PNG não tingir o canvas. */
async function toDataUrlSafe(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : url);
      reader.onerror = () => reject(new Error('read'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

type Tool = 'modelos' | 'cores' | 'foto' | 'cards';
const TOOLS: { id: Tool; label: string; icon: LucideIcon; title: string; desc: string }[] = [
  { id: 'modelos', label: 'Modelos', icon: LayoutTemplate, title: 'Modelos', desc: 'O tipo deste card' },
  { id: 'cores', label: 'Cores', icon: Palette, title: 'Cores', desc: 'Tema deste card' },
  { id: 'foto', label: 'Foto', icon: ImageIcon, title: 'Foto', desc: 'Imagem da capa' },
  { id: 'cards', label: 'Cards', icon: Layers, title: 'Carrossel', desc: 'Ordene e adicione' },
];

type Props = {
  businessId: string;
  businessName: string;
  pieces: ArtPiece[];
  context: BusinessContext;
};

export function StudioEditor({ businessId, businessName, pieces, context }: Props) {
  const initial = pieces[0];
  const initialRamo = initial?.ramo ?? context.ramo;
  const initialFormat = initial?.format ?? 'feed-45';
  const [pieceId, setPieceId] = useState<string | undefined>(initial?.id);
  const [ramo, setRamo] = useState<RamoId>(initialRamo);
  const [format, setFormat] = useState<FormatId>(initialFormat);
  const [projectName, setProjectName] = useState(initial?.name ?? `Arte · ${context.name}`);

  // Copy preenchido com os dados reais do comércio para o ramo atual.
  const businessCopy = useMemo(() => buildBusinessCopy({ ...context, ramo }), [context, ramo]);
  const firstCopy = useMemo(() => buildBusinessCopy({ ...context, ramo: initialRamo }), [context, initialRamo]);

  const [slides, setSlides] = useState<Slide[]>(
    () => initial?.document.slides ?? buildSlides(initialRamo, initialFormat, firstCopy),
  );
  const [activeId, setActiveId] = useState<string>(() => slides[0].id);
  const [tool, setTool] = useState<Tool>('modelos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const active = slides.find((s) => s.id === activeId) ?? slides[0];
  const activeIndex = slides.findIndex((s) => s.id === active.id);
  const fmt = formatMeta(format);

  const slideRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      const pad = el.clientWidth < 600 ? 24 : 52;
      const s = Math.min((el.clientWidth - pad * 2) / fmt.w, (el.clientHeight - pad * 2) / fmt.h, 0.95);
      setScale(Math.max(0.06, s));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fmt.w, fmt.h, sheetOpen]);

  const changeFormat = (f: FormatId) => {
    setFormat(f);
    setSlides((c) => c.map((s) => ({ ...s, format: f })));
  };

  // ── edits ──
  const update = (patch: Partial<Slide>) => setSlides((c) => c.map((s) => (s.id === active.id ? { ...s, ...patch } : s)));
  const applyThemeAll = (theme: Slide['theme']) => setSlides((c) => c.map((s) => ({ ...s, theme })));
  const switchRamo = (r: RamoId) => {
    const copy = buildBusinessCopy({ ...context, ramo: r });
    const next = buildSlides(r, format, copy);
    setRamo(r); setSlides(next); setActiveId(next[0].id);
  };
  // Troca o tipo do card preenchendo a seção nova com os dados reais do comércio.
  const changeKind = (kind: KindId) => {
    const seed = seedSlideContent(kind, businessCopy) ?? {};
    const section = KIND_SECTION[kind];
    setSlides((c) =>
      c.map((s) => {
        if (s.id !== active.id) return s;
        const content: Record<string, unknown> = { ...seed, ...(s.content ?? {}) };
        if (!content[section]) content[section] = (seed as Record<string, unknown>)[section];
        return { ...s, kind, content: content as Slide['content'] };
      }),
    );
  };
  const addSlide = (kind: KindId) => {
    const ns = makeSlide(kind, active.theme, format, seedSlideContent(kind, businessCopy));
    setSlides((c) => { const i = c.findIndex((s) => s.id === activeId); const n = [...c]; n.splice(i + 1, 0, ns); return n; });
    setActiveId(ns.id);
  };
  const duplicateSlide = (id: string) => {
    const i = slides.findIndex((s) => s.id === id);
    if (i < 0) return;
    const copy: Slide = { ...slides[i], id: newSlideId() };
    setSlides((c) => { const n = [...c]; n.splice(i + 1, 0, copy); return n; });
    setActiveId(copy.id);
  };
  const moveSlide = (id: string, dir: -1 | 1) => {
    setSlides((c) => {
      const i = c.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= c.length) return c;
      const n = [...c];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  };
  const removeSlide = (id: string) => {
    if (slides.length <= 1) return;
    const i = slides.findIndex((s) => s.id === id);
    const next = slides.filter((s) => s.id !== id);
    setSlides(next);
    if (id === activeId) setActiveId(next[Math.max(0, i - 1)].id);
  };

  // ── IA: gerar carrossel a partir do briefing ──
  async function runGenerate(payload: {
    intent: PostIntentId;
    freeText?: string;
    hasInstagram: boolean;
    handle?: string;
    pixKey?: string;
    assets: { useCover: boolean; useLogo: boolean; galleryUrls: string[]; productIds: string[]; reviewId: string | null };
  }) {
    setGenerating(true);
    try {
      const res = await generateArtCarouselAction({ businessId, format, ...payload });
      if (!res.ok || !res.slides?.length) {
        toast.error(res.error ?? 'Não consegui montar o carrossel.');
        return;
      }
      const out = await Promise.all(
        res.slides.map(async (s) =>
          s.photo && !s.photo.startsWith('data:') ? { ...s, photo: await toDataUrlSafe(s.photo) } : s,
        ),
      );
      setSlides(out);
      setActiveId(out[0].id);
      setBriefOpen(false);
      toast.success(res.usedAI ? 'Carrossel criado com IA — revise e ajuste à vontade.' : (res.note ?? 'Carrossel montado com seus dados.'));
    } finally {
      setGenerating(false);
    }
  }

  // ── incluir foto da galeria/capa do comércio ──
  async function setActivePhotoFromUrl(url: string) {
    update({ photo: await toDataUrlSafe(url) });
  }
  const go = (dir: number) => {
    const i = activeIndex + dir;
    if (i >= 0 && i < slides.length) setActiveId(slides[i].id);
  };
  const openTool = (t: Tool) => { setTool(t); setSheetOpen(true); };

  // ── save ──
  const doSave = () =>
    new Promise<string | undefined>((resolve) => {
      startSave(async () => {
        const res = await saveArtPieceAction({ id: pieceId, businessId, name: projectName, ramo, format, document: { slides } });
        if (res.ok) {
          if (res.id) setPieceId(res.id);
          toast.success('Arte salva.');
          resolve(res.id ?? pieceId);
        } else {
          toast.error(res.error ?? 'Falha ao salvar.');
          resolve(undefined);
        }
      });
    });

  // ── capture ──
  async function captureActive(): Promise<{ dataUrl: string; file: File }> {
    const node = slideRef.current;
    if (!node) throw new Error('Card não encontrado.');
    const dataUrl = await toPng(node, { pixelRatio: 1, cacheBust: true, width: fmt.w, height: fmt.h });
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `arte-${Date.now()}.png`, { type: 'image/png' });
    return { dataUrl, file };
  }

  // ── publish destinations ──
  async function onInstagram() {
    setBusy('insta');
    try {
      const { dataUrl } = await captureActive();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
      toast.success('Imagem baixada. É só postar no Instagram.');
      setPublishOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao gerar a imagem.');
    } finally { setBusy(null); }
  }

  async function onPost() {
    setBusy('post');
    try {
      const { file } = await captureActive();
      const fd = new FormData();
      fd.set('id', crypto.randomUUID());
      fd.set('entity_type', 'business');
      fd.set('entity_id', businessId);
      fd.set('title', projectName);
      fd.set('image_file', file);
      const res = await upsertEntityPostAction(fd);
      if (res.ok) {
        toast.success('Publicado nas Novidades do seu negócio.');
        setPublishOpen(false);
      } else {
        toast.error(res.error ?? 'Falha ao publicar.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao publicar.');
    } finally { setBusy(null); }
  }

  async function onBanner() {
    setBusy('banner');
    try {
      const savedId = await doSave();
      const { file } = await captureActive();
      const token = await requestMediaUploadTokenAction({ entityType: 'business', entityId: businessId, role: 'ad' });
      const processed = await uploadDirectToProcessor({ file, token });
      const media = await finalizeMediaUploadAction({
        entityType: 'business', entityId: businessId, role: 'ad', processed,
      });
      const res = await requestHomeBannerAction({
        businessId, artPieceId: savedId ?? pieceId ?? null,
        imageUrl: media.url, imageAssetId: media.id, title: projectName,
      });
      if (res.ok) {
        toast.success('Pedido enviado. O banner entra na home após a aprovação.');
        setPublishOpen(false);
      } else {
        toast.error(res.error ?? 'Falha ao enviar pedido.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao enviar pedido.');
    } finally { setBusy(null); }
  }

  const RamoChipIcon = RAMO_ICONS[RAMOS.find((r) => r.id === ramo)?.icon ?? 'Store'] ?? Store;

  return (
    <div className="studio-editor">
      {/* topbar */}
      <div className="topbar">
        <span className="brand-mk">S</span>
        <span className="ramo-chip">
          <RamoChipIcon className="size-4" />
          <select value={ramo} onChange={(e) => switchRamo(e.target.value as RamoId)}>
            {RAMOS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </span>
        <span className="sep" />
        <span
          className="proj-name" contentEditable suppressContentEditableWarning spellCheck={false}
          onBlur={(e) => setProjectName(e.currentTarget.textContent?.trim() || 'Nova arte')}
        >{projectName}</span>
        <span className="grow" />
        <button type="button" className="btn btn-ai" onClick={() => setBriefOpen(true)}>
          <Sparkles /> Criar com IA
        </button>
        <ReelPreviewButton businessId={businessId} slides={slides} ramo={ramo} />
        <button type="button" className="btn btn-ghost" onClick={() => void doSave()} disabled={isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save />} Salvar
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setPublishOpen(true)}>
          <Send /> Publicar
        </button>
      </div>

      {/* rail */}
      <div className="rail">
        {TOOLS.map((t) => (
          <button key={t.id} type="button" className="rail-item" aria-pressed={tool === t.id} onClick={() => setTool(t.id)}>
            <t.icon /><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* work */}
      <div className="work">
        <div className="stage" ref={stageRef}>
          <div className="format-float">
            {FORMATS.map((f) => (
              <button key={f.id} type="button" aria-pressed={format === f.id} onClick={() => changeFormat(f.id)}>{f.label}</button>
            ))}
          </div>
          {slides.length > 1 && (
            <>
              <button type="button" className="stage-nav prev" disabled={activeIndex === 0} onClick={() => go(-1)}><ChevronLeft /></button>
              <button type="button" className="stage-nav next" disabled={activeIndex === slides.length - 1} onClick={() => go(1)}><ChevronRight /></button>
            </>
          )}
          <div className="canvas-wrap" style={{ width: fmt.w * scale, height: fmt.h * scale }}>
            <div className="canvas-chrome">
              <span>{fmt.label} · {fmt.w}×{fmt.h}</span>
              <span className="idx">{String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
            </div>
            <div className="canvas-frame" style={{ width: fmt.w * scale, height: fmt.h * scale }}>
              <div className="slide-scaler" style={{ transform: `scale(${scale})`, width: fmt.w, height: fmt.h }}>
                <SlideCanvas slide={active} ramo={ramo} innerRef={slideRef} />
              </div>
            </div>
          </div>
        </div>

        <div className="strip">
          <span className="strip-label">Cards</span>
          {slides.map((s, i) => (
            <CardThumb
              key={s.id}
              slide={s}
              index={i}
              total={slides.length}
              ramo={ramo}
              fmt={fmt}
              active={s.id === activeId}
              onSelect={() => setActiveId(s.id)}
              onDuplicate={() => duplicateSlide(s.id)}
              onDelete={() => removeSlide(s.id)}
              onMove={(d) => moveSlide(s.id, d)}
            />
          ))}
          <button type="button" className="thumb-add" title="Adicionar card" onClick={() => addSlide('vitrine')}><Plus /></button>
        </div>
      </div>

      {/* inspector */}
      <div className={`inspector ${sheetOpen ? 'open' : ''}`}>
        <div className="insp-head">
          <div>
            <h3>{TOOLS.find((t) => t.id === tool)?.title}</h3>
            <p>{TOOLS.find((t) => t.id === tool)?.desc}</p>
          </div>
          <button type="button" className="insp-close" onClick={() => setSheetOpen(false)}><X /></button>
        </div>
        <div className="insp-body">
          {tool === 'modelos' && <ModelosPanel ramo={ramo} active={active} onPick={changeKind} onBrief={() => setBriefOpen(true)} />}
          {tool === 'cores' && <CoresPanel active={active} onTheme={(t) => update({ theme: t })} onAll={applyThemeAll} />}
          {tool === 'foto' && (
            <FotoPanel active={active} context={context} onPhoto={(p) => update({ photo: p })} onPickUrl={setActivePhotoFromUrl} />
          )}
          {tool === 'cards' && (
            <CardsPanel
              ramo={ramo}
              slides={slides}
              activeId={activeId}
              onSelect={setActiveId}
              onAdd={addSlide}
              onRemove={removeSlide}
              onDuplicate={duplicateSlide}
              onMove={moveSlide}
            />
          )}
        </div>
      </div>

      {/* mobile tab bar */}
      <div className="tabbar">
        {TOOLS.slice(0, 2).map((t) => (
          <button key={t.id} type="button" className="tab" aria-pressed={sheetOpen && tool === t.id} onClick={() => openTool(t.id)}><t.icon /><span>{t.label}</span></button>
        ))}
        <button type="button" className="tab tab-publish" onClick={() => setPublishOpen(true)}><span className="tab-pub-icn"><Send /></span><span>Publicar</span></button>
        {TOOLS.slice(2).map((t) => (
          <button key={t.id} type="button" className="tab" aria-pressed={sheetOpen && tool === t.id} onClick={() => openTool(t.id)}><t.icon /><span>{t.label}</span></button>
        ))}
      </div>

      {publishOpen && (
        <PublishSheet
          businessName={businessName}
          busy={busy}
          onClose={() => setPublishOpen(false)}
          onInstagram={onInstagram}
          onPost={onPost}
          onBanner={onBanner}
        />
      )}

      {briefOpen && (
        <BriefingSheet
          context={context}
          generating={generating}
          onClose={() => setBriefOpen(false)}
          onGenerate={runGenerate}
        />
      )}
    </div>
  );
}

// ── panels ──
function ModelosPanel({ ramo, active, onPick, onBrief }: { ramo: RamoId; active: Slide; onPick: (k: KindId) => void; onBrief: () => void }) {
  return (
    <>
      <button type="button" className="ai-cta" onClick={onBrief}>
        <span className="ai-cta-icn"><Sparkles /></span>
        <span className="ai-cta-text">
          <strong>Criar carrossel com IA</strong>
          <span>A IA monta o post usando os dados, fotos e avaliações do seu negócio.</span>
        </span>
      </button>
      <div className="hint-card"><Pencil /><span>Clique direto no texto da arte pra reescrever. Tudo é editável.</span></div>
      <div className="model-grid">
        {KINDS_BY_RAMO[ramo].map((id) => {
          const k = kindMeta(id);
          const Icon = KIND_ICONS[k.icon] ?? LayoutTemplate;
          return (
            <button key={id} type="button" className="model-card" aria-pressed={active.kind === id} onClick={() => onPick(id)}>
              <span className="mc-icn"><Icon /></span>
              <strong>{k.label}</strong>
              <span>{k.sub}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function CoresPanel({ active, onTheme, onAll }: { active: Slide; onTheme: (t: Slide['theme']) => void; onAll: (t: Slide['theme']) => void }) {
  return (
    <>
      <p className="hint">A cor de fundo deste card. Combine cards claros e escuros no carrossel.</p>
      <div className="swatch-row">
        {THEMES.map((t) => (
          <button key={t.id} type="button" className="swatch" aria-pressed={active.theme === t.id} onClick={() => onTheme(t.id)} style={{ background: t.swatch }}>
            <span className="swatch-label" style={{ color: t.text, background: `${t.text}1A` }}>{t.label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-outline" onClick={() => onAll(active.theme)}>Aplicar em todos os cards</button>
    </>
  );
}

function FotoPanel({
  active,
  context,
  onPhoto,
  onPickUrl,
}: {
  active: Slide;
  context: BusinessContext;
  onPhoto: (p: string | null) => void;
  onPickUrl: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPhoto(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };
  const fromBusiness = [
    ...(context.coverUrl ? [{ url: context.coverUrl, tag: 'Capa' }] : []),
    ...(context.logoUrl ? [{ url: context.logoUrl, tag: 'Logo' }] : []),
    ...context.photos.map((url) => ({ url, tag: 'Galeria' })),
  ];
  return (
    <>
      <p className="insp-sub">Foto da capa</p>
      <div className={`photo-slot ${active.photo ? 'has-img' : ''}`}>
        {active.photo
          // eslint-disable-next-line @next/next/no-img-element -- preview de data URL local, não vai pro CDN
          ? <img src={active.photo} alt="" />
          : <span className="ps-label"><Camera />Sem foto ainda</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      <div className="row-actions">
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}><ImageIcon /> Enviar foto</button>
        {active.photo && <button type="button" className="btn btn-outline" onClick={() => onPhoto(null)}>Remover</button>}
      </div>
      {fromBusiness.length > 0 && (
        <>
          <p className="insp-sub" style={{ marginTop: 8 }}>Fotos do seu negócio</p>
          <div className="gal-grid">
            {fromBusiness.map((p, i) => (
              <button
                key={`${p.url}-${i}`}
                type="button"
                className="gal-item"
                title={`Usar ${p.tag.toLowerCase()}`}
                onClick={() => onPickUrl(p.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- thumb do CDN do próprio comércio */}
                <img src={p.url} alt="" />
                <span className="gal-tag">{p.tag}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {active.kind !== 'hero' && (
        <div className="hint-card"><LayoutTemplate /><span>A foto preenche o fundo do modelo <strong>Capa</strong>. Troque este card pra Capa em Modelos.</span></div>
      )}
    </>
  );
}

function CardsPanel({ ramo, slides, activeId, onSelect, onAdd, onRemove, onDuplicate, onMove }: {
  ramo: RamoId; slides: Slide[]; activeId: string;
  onSelect: (id: string) => void; onAdd: (k: KindId) => void; onRemove: (id: string) => void;
  onDuplicate: (id: string) => void; onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <>
      <p className="insp-sub">Cards do carrossel</p>
      <p className="hint">Reordene com as setas. Use os 3 pontinhos pra duplicar ou apagar.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slides.map((s, i) => (
          <div key={s.id} className="slide-row" aria-pressed={s.id === activeId}>
            <span className="sr-num">{String(i + 1).padStart(2, '0')}</span>
            <button type="button" className="sr-name" onClick={() => onSelect(s.id)}>{kindMeta(s.kind).label}</button>
            <button type="button" className="sr-move" title="Subir" disabled={i === 0} onClick={() => onMove(s.id, -1)}><ArrowUp /></button>
            <button type="button" className="sr-move" title="Descer" disabled={i === slides.length - 1} onClick={() => onMove(s.id, 1)}><ArrowDown /></button>
            <RowMenu canDelete={slides.length > 1} onDuplicate={() => onDuplicate(s.id)} onDelete={() => onRemove(s.id)} />
          </div>
        ))}
      </div>
      <p className="insp-sub" style={{ marginTop: 8 }}>Adicionar card</p>
      <div className="model-grid">
        {KINDS_BY_RAMO[ramo].map((id) => {
          const k = kindMeta(id);
          const Icon = KIND_ICONS[k.icon] ?? Plus;
          return (
            <button key={id} type="button" className="model-card" onClick={() => onAdd(id)}>
              <span className="mc-icn"><Icon /></span>
              <strong>{k.label}</strong>
              <span>{k.sub}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function CardThumb({ slide, index, total, ramo, fmt, active, onSelect, onDuplicate, onDelete, onMove }: {
  slide: Slide; index: number; total: number; ramo: RamoId; fmt: { w: number; h: number };
  active: boolean; onSelect: () => void; onDuplicate: () => void; onDelete: () => void; onMove: (d: -1 | 1) => void;
}) {
  const [menu, setMenu] = useState(false);
  const tScale = Math.min(50 / fmt.w, 62 / fmt.h);
  return (
    <div className="thumb-wrap">
      <button type="button" className="thumb" aria-pressed={active} onClick={onSelect}>
        <div className="thumb-shrink" style={{ width: fmt.w, height: fmt.h, transform: `scale(${tScale})` }}>
          <SlideCanvas slide={slide} ramo={ramo} />
        </div>
        <span className="thumb-num">{String(index + 1).padStart(2, '0')}</span>
      </button>
      <button type="button" className="thumb-menu-btn" title="Opções do card" onClick={() => setMenu((v) => !v)}><MoreVertical /></button>
      {menu && (
        <>
          <div className="menu-backdrop" onClick={() => setMenu(false)} role="presentation" />
          <div className="card-menu">
            <button type="button" disabled={index === 0} onClick={() => { onMove(-1); setMenu(false); }}><ArrowUp /> Mover pra esquerda</button>
            <button type="button" disabled={index === total - 1} onClick={() => { onMove(1); setMenu(false); }}><ArrowDown /> Mover pra direita</button>
            <button type="button" onClick={() => { onDuplicate(); setMenu(false); }}><Copy /> Duplicar</button>
            <button type="button" className="danger" disabled={total <= 1} onClick={() => { onDelete(); setMenu(false); }}><Trash2 /> Apagar</button>
          </div>
        </>
      )}
    </div>
  );
}

function RowMenu({ canDelete, onDuplicate, onDelete }: { canDelete: boolean; onDuplicate: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="row-menu">
      <button type="button" className="sr-menu" title="Opções do card" onClick={() => setOpen((v) => !v)}><MoreVertical /></button>
      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} role="presentation" />
          <div className="card-menu right">
            <button type="button" onClick={() => { onDuplicate(); setOpen(false); }}><Copy /> Duplicar</button>
            <button type="button" className="danger" disabled={!canDelete} onClick={() => { onDelete(); setOpen(false); }}><Trash2 /> Apagar</button>
          </div>
        </>
      )}
    </div>
  );
}

type BriefPayload = {
  intent: PostIntentId;
  freeText?: string;
  hasInstagram: boolean;
  handle?: string;
  pixKey?: string;
  assets: { useCover: boolean; useLogo: boolean; galleryUrls: string[]; productIds: string[]; reviewId: string | null };
};

function BriefingSheet({ context, generating, onClose, onGenerate }: {
  context: BusinessContext; generating: boolean; onClose: () => void; onGenerate: (p: BriefPayload) => void;
}) {
  const [hasInsta, setHasInsta] = useState(context.hasInstagram);
  const [handle, setHandle] = useState(context.instagram ?? '');
  const [intent, setIntent] = useState<PostIntentId>('institucional');
  const [freeText, setFreeText] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [useCover, setUseCover] = useState(Boolean(context.coverUrl));
  const [useLogo, setUseLogo] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>(context.products.map((p) => p.id));
  const [reviewId, setReviewId] = useState<string | null>(context.reviews[0]?.id ?? null);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = () =>
    onGenerate({
      intent,
      freeText: freeText.trim() || undefined,
      hasInstagram: hasInsta,
      handle: hasInsta ? handle.trim() || undefined : undefined,
      pixKey: pixKey.trim() || undefined,
      assets: { useCover, useLogo, galleryUrls: gallery, productIds, reviewId },
    });

  return (
    <div className="studio-editor-overlay" onClick={onClose} role="presentation">
      <div className="studio-editor-sheet brief" onClick={(e) => e.stopPropagation()} role="presentation">
        <div className="sheet-head">
          <div>
            <h2>Criar carrossel com IA</h2>
            <p>Responda rapidinho e a IA monta o post com os dados de <strong>{context.name}</strong>.</p>
          </div>
          <button type="button" className="sheet-close" onClick={onClose}><X /></button>
        </div>

        <div className="sheet-body">
          {/* Instagram */}
          <div className="brief-field">
            <span className="brief-label"><AtSign /> O comércio tem Instagram?</span>
            <div className="seg">
              <button type="button" aria-pressed={hasInsta} onClick={() => setHasInsta(true)}>Tem</button>
              <button type="button" aria-pressed={!hasInsta} onClick={() => setHasInsta(false)}>Não tem</button>
            </div>
            {hasInsta ? (
              <input className="brief-input" value={handle} placeholder="@seuperfil" onChange={(e) => setHandle(e.target.value)} />
            ) : (
              <p className="hint">Sem problema — vamos assinar a arte com o nome <strong>{context.name}</strong>.</p>
            )}
          </div>

          {/* Intenção */}
          <div className="brief-field">
            <span className="brief-label">Qual a intenção do post?</span>
            <div className="intent-grid">
              {POST_INTENTS.map((it) => (
                <button key={it.id} type="button" className="intent-card" aria-pressed={intent === it.id} onClick={() => setIntent(it.id)}>
                  {it.label}
                </button>
              ))}
            </div>
            <textarea
              className="brief-input"
              rows={2}
              value={freeText}
              placeholder="Quer dizer algo específico? (ex: promoção de sexta, novo prato...)"
              onChange={(e) => setFreeText(e.target.value)}
            />
          </div>

          {/* Itens do negócio */}
          <div className="brief-field">
            <span className="brief-label">Incluir do seu negócio</span>
            <div className="chip-row">
              {context.coverUrl && (
                <button type="button" className="chip" aria-pressed={useCover} onClick={() => setUseCover((v) => !v)}>Foto de capa</button>
              )}
              {context.logoUrl && (
                <button type="button" className="chip" aria-pressed={useLogo} onClick={() => setUseLogo((v) => !v)}>Logo</button>
              )}
            </div>

            {context.photos.length > 0 && (
              <>
                <p className="hint" style={{ marginTop: 6 }}>Fotos da galeria</p>
                <div className="gal-grid">
                  {context.photos.map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      type="button"
                      className="gal-item"
                      aria-pressed={gallery.includes(url)}
                      onClick={() => toggle(gallery, setGallery, url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- thumb do CDN do próprio comércio */}
                      <img src={url} alt="" />
                      {gallery.includes(url) && <span className="gal-check"><Check /></span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            {context.products.length > 0 && (
              <>
                <p className="hint" style={{ marginTop: 6 }}>Produtos / itens do cardápio</p>
                <div className="brief-list">
                  {context.products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="brief-list-item"
                      aria-pressed={productIds.includes(p.id)}
                      onClick={() => toggle(productIds, setProductIds, p.id)}
                    >
                      <span>{p.name}{p.price ? ` · ${p.price}` : ''}</span>
                      {productIds.includes(p.id) && <Check />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {context.reviews.length > 0 && (
              <>
                <p className="hint" style={{ marginTop: 6 }}>Avaliação de cliente</p>
                <div className="brief-list">
                  <button type="button" className="brief-list-item" aria-pressed={reviewId === null} onClick={() => setReviewId(null)}>
                    <span>Não usar avaliação</span>
                    {reviewId === null && <Check />}
                  </button>
                  {context.reviews.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="brief-list-item"
                      aria-pressed={reviewId === r.id}
                      onClick={() => setReviewId(r.id)}
                    >
                      <span>{'★'.repeat(Math.max(1, Math.min(5, r.rating)))} {r.author.split(' ')[0]} — “{r.comment.slice(0, 50)}{r.comment.length > 50 ? '…' : ''}”</span>
                      {reviewId === r.id && <Check />}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="brief-pix">
              <CreditCard />
              <input
                className="brief-input"
                value={pixKey}
                placeholder="Chave Pix (pra plaquinha Pix) — opcional"
                onChange={(e) => setPixKey(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="brief-foot">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={generating}>Cancelar</button>
          <button type="button" className="btn btn-ai" onClick={submit} disabled={generating}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles />} {generating ? 'Montando…' : 'Criar carrossel'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishSheet({ businessName, busy, onClose, onInstagram, onPost, onBanner }: {
  businessName: string; busy: string | null; onClose: () => void;
  onInstagram: () => void; onPost: () => void; onBanner: () => void;
}) {
  const spin = (k: string) => busy === k;
  return (
    <div className="studio-editor-overlay" onClick={onClose}>
      <div className="studio-editor-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>Publicar a arte</h2>
            <p>O card atual de <strong>{businessName}</strong>. Você pode mandar pra mais de um lugar.</p>
          </div>
          <button type="button" className="sheet-close" onClick={onClose}><X /></button>
        </div>
        <div className="sheet-body">
          <button type="button" className="dest" onClick={onInstagram} disabled={!!busy}>
            <span className="dest-icn insta">{spin('insta') ? <Loader2 className="animate-spin" /> : <Download />}</span>
            <span className="dest-text"><strong>Baixar pro Instagram</strong><span>Salva o card em PNG 1080px pra postar no feed, story ou status.</span></span>
            <span className="dest-badge">PNG</span>
          </button>
          <button type="button" className="dest" onClick={onPost} disabled={!!busy}>
            <span className="dest-icn post">{spin('post') ? <Loader2 className="animate-spin" /> : <Newspaper />}</span>
            <span className="dest-text"><strong>Publicar nas Novidades</strong><span>Aparece na página do seu negócio e no app, na aba Novidades.</span></span>
            <span className="dest-badge" style={{ background: 'var(--carmo-cerrado-100)', color: 'var(--carmo-cerrado-700)' }}>No ar na hora</span>
          </button>
          <button type="button" className="dest" onClick={onBanner} disabled={!!busy}>
            <span className="dest-icn banner">{spin('banner') ? <Loader2 className="animate-spin" /> : <Megaphone />}</span>
            <span className="dest-text"><strong>Pedir banner na home</strong><span>Entra na fila pra virar banner na página inicial da cidade.</span></span>
            <span className="dest-badge"><Hourglass style={{ width: 11, height: 11, marginRight: 3, verticalAlign: '-1px' }} />Aprovação</span>
          </button>
        </div>
        <div className="sheet-foot"><Check style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />As artes ficam salvas no seu Studio — dá pra reusar e editar quando quiser.</div>
      </div>
    </div>
  );
}
