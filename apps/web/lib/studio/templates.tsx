'use client';

import {
  Car,
  Clock,
  Coffee,
  CreditCard,
  MapPin,
  Megaphone,
  MessageCircle,
  QrCode,
  Quote,
  Star,
  Truck,
  Users,
  Waves,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { resolveCopy, STUDIO_COPY, type RamoCopy } from './copy';
import { formatMeta, type RamoId, type Slide } from './types';

const ICONS: Record<string, LucideIcon> = {
  Car, Clock, Coffee, CreditCard, MapPin, Megaphone, MessageCircle, Star, Truck, Users, Waves, Wifi,
};

type EProps = {
  tag?: keyof React.JSX.IntrinsicElements;
  html: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Texto editável inline. Edições são visuais (entram na captura PNG). */
function E({ tag = 'span', html, className, style }: EProps) {
  const Tag = tag as React.ElementType;
  return (
    <Tag
      className={className}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function BrandRow({ copy }: { copy: RamoCopy }) {
  return (
    <div className="brand-row">
      <div className="logo">
        <span className="mk">{(copy.brand || '·')[0]}</span>
        <E html={copy.brand} />
      </div>
      <E html={copy.handle} />
    </div>
  );
}

function Footnote({ copy }: { copy: RamoCopy }) {
  return (
    <div className="footnote">
      <E html={`${copy.bairro} · ${copy.cidade}`} />
      <E html={copy.handle} />
    </div>
  );
}

function Hero({ copy, slide }: { copy: RamoCopy; slide: Slide }) {
  const h = copy.hero;
  return (
    <>
      <div
        className="ph full"
        data-label={slide.photo ? '' : `Foto · ${(copy.brand || 'capa').toUpperCase()}`}
        style={slide.photo ? { background: `url(${slide.photo}) center/cover` } : undefined}
      />
      <div className="hero-fg" />
      <BrandRow copy={copy} />
      <div className="hero-text">
        <E tag="span" className="tag" html={h.tag} />
        <E tag="h1" className="display" html={h.headline} />
        <E tag="p" className="sub" html={h.sub} />
      </div>
      <div className="hero-meta">
        <E html={h.meta[0]} />
        <E html={h.meta[1]} />
      </div>
    </>
  );
}

function Vitrine({ copy }: { copy: RamoCopy }) {
  const v = copy.vitrine;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <E tag="span" className="tag" style={{ marginBottom: 22 }} html={v.titulo} />
        <E tag="p" className="lede" style={{ marginBottom: 36 }} html={v.subtitulo} />
        <div className={`vitrine cols-${v.cols}`}>
          {v.items.slice(0, v.cols * 2).map((it, i) => (
            <div className="v-card" key={i}>
              <div className="ph" data-label={it.label} />
              <E tag="h3" className="name" html={it.name} />
              <div className="meta">
                <E html={it.meta} />
                <E tag="span" className="price" html={it.price} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footnote copy={copy} />
    </>
  );
}

function Ficha({ copy }: { copy: RamoCopy }) {
  const f = copy.ficha;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <E tag="h1" className="big-title" html={f.titulo} />
        <E tag="p" className="lede" style={{ marginBottom: 48 }} html={f.sub} />
        <div className="ficha-grid">
          {f.cells.map((c, i) => {
            const Icon = ICONS[c.icon] ?? Star;
            return (
              <div className="ficha-cell" key={i}>
                <div className="icn"><Icon strokeWidth={1.75} /></div>
                <E tag="div" className="lbl" html={c.lbl} />
                <div className="val">
                  <E html={c.val} />
                  {c.small ? <small><E html={c.small} /></small> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footnote copy={copy} />
    </>
  );
}

function Oferta({ copy }: { copy: RamoCopy }) {
  const o = copy.oferta;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <div className="offer-stack" style={{ marginTop: 36 }}>
          <E tag="span" className="tag" html={o.tag} />
          <E tag="h1" className="big-title" style={{ maxWidth: 820 }} html={o.title} />
          <E tag="p" className="lede" html={o.sub} />
        </div>
        <div className="offer-stack" style={{ marginTop: 'auto', marginBottom: 20 }}>
          <E tag="span" className="discount-pct" html={o.desconto} />
          <div className="price-row">
            <div className="price-col from-col">
              <span className="from">de</span>
              <E tag="span" className="old" html={o.de} />
            </div>
            <div className="price-col">
              <span className="from">por</span>
              <span className="new">
                <small>R$</small>
                <E html={String(o.por).replace(/^R\$\s*/, '')} />
              </span>
            </div>
          </div>
          <E tag="span" className="valid-row" html={o.validade} />
        </div>
      </div>
      <Footnote copy={copy} />
    </>
  );
}

function Roteiro({ copy }: { copy: RamoCopy }) {
  const r = copy.roteiro;
  if (!r) return <div className="tpl-empty">Este ramo não tem roteiro.</div>;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <E tag="h1" className="big-title sm" html={r.titulo} />
        <E tag="p" className="lede" style={{ marginBottom: 32 }} html={r.sub} />
        <div className="roteiro">
          {r.steps.map((s, i) => (
            <div className="step" key={i}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <E tag="div" className="label" html={s.label} />
                <E tag="div" className="ttl" html={s.ttl} />
              </div>
              <E tag="span" className="time" html={s.time} />
            </div>
          ))}
        </div>
      </div>
      <Footnote copy={copy} />
    </>
  );
}

function Novidade({ copy }: { copy: RamoCopy }) {
  const n = copy.novidade;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <div className="recado-stack">
          <span className="recado-icon"><Megaphone strokeWidth={1.75} /></span>
          <E tag="span" className="tag" html={n.tag} />
          <E tag="h1" className="big-title" style={{ maxWidth: 820 }} html={n.titulo} />
          <E tag="p" className="lede" html={n.texto} />
        </div>
        <E tag="span" className="valid-row" style={{ marginTop: 'auto', marginBottom: 20 }} html={n.meta} />
      </div>
      <Footnote copy={copy} />
    </>
  );
}

function Cta({ copy }: { copy: RamoCopy }) {
  const c = copy.cta;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <div className="cta-stack" style={{ marginTop: 72 }}>
          <div>
            <E tag="h1" className="big-title" style={{ maxWidth: 820, marginBottom: 16 }} html={c.headline} />
            <E tag="p" className="lede" html={c.sub} />
          </div>
          <div className="cta-bottom">
            <div className="pill-cloud">
              {c.pills.map((p, i) => (
                <E tag="span" className="pill" key={i} html={p} />
              ))}
            </div>
            <span className="cta-button">
              <E html={c.button} />
              <MessageCircle strokeWidth={1.75} />
            </span>
          </div>
        </div>
      </div>
      <Footnote copy={copy} />
    </>
  );
}

function Horario({ copy }: { copy: RamoCopy }) {
  const h = copy.horario;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <div className="horario-head">
          <span className="horario-icn"><Clock strokeWidth={1.75} /></span>
          <E tag="h1" className="big-title sm" html={h.titulo} />
          <E tag="p" className="lede" html={h.sub} />
        </div>
        <div className="horario-list">
          {h.rows.slice(0, 7).map((r, i) => (
            <div className="horario-row" key={i}>
              <E tag="span" className="hr-day" html={r.day} />
              <span className="hr-dot" />
              <E tag="span" className="hr-hours" html={r.hours} />
            </div>
          ))}
        </div>
        <E tag="span" className="valid-row" style={{ marginTop: 'auto' }} html={h.note} />
      </div>
      <Footnote copy={copy} />
    </>
  );
}

function Pix({ copy }: { copy: RamoCopy }) {
  const p = copy.pix;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <div className="pix-stack" style={{ marginTop: 28 }}>
          <span className="recado-icon"><QrCode strokeWidth={1.75} /></span>
          <E tag="h1" className="big-title" html={p.titulo} />
          <E tag="p" className="lede" html={p.sub} />
        </div>
        <div className="pix-key-card" style={{ marginTop: 'auto' }}>
          <E tag="span" className="pk-label" html={p.keyLabel} />
          <E tag="span" className="pk-key" html={p.key} />
          <E tag="span" className="pk-holder" html={p.holder} />
        </div>
        <E tag="span" className="valid-row" style={{ marginBottom: 4 }} html={p.foot} />
      </div>
      <Footnote copy={copy} />
    </>
  );
}

function Depoimento({ copy }: { copy: RamoCopy }) {
  const d = copy.depoimento;
  return (
    <>
      <BrandRow copy={copy} />
      <div className="pad">
        <div className="depo-stack" style={{ marginTop: 40 }}>
          <span className="depo-quote-icn"><Quote strokeWidth={1.75} /></span>
          <E tag="span" className="tag" html={d.tag} />
          <E tag="blockquote" className="depo-quote" html={d.quote} />
        </div>
        <div className="depo-foot" style={{ marginTop: 'auto', marginBottom: 12 }}>
          <E tag="span" className="depo-stars" html={d.stars} />
          <E tag="span" className="depo-author" html={d.author} />
          <E tag="span" className="valid-row" html={d.foot} />
        </div>
      </div>
      <Footnote copy={copy} />
    </>
  );
}

const TEMPLATES = {
  hero: Hero,
  vitrine: Vitrine,
  ficha: Ficha,
  oferta: Oferta,
  horario: Horario,
  pix: Pix,
  depoimento: Depoimento,
  roteiro: Roteiro,
  novidade: Novidade,
  cta: Cta,
};

/** Render do slide em tamanho nativo (1080×h). O pai aplica transform scale. */
export function SlideCanvas({ slide, ramo, innerRef }: { slide: Slide; ramo: RamoId; innerRef?: React.Ref<HTMLDivElement> }) {
  const fmt = formatMeta(slide.format);
  const copy = resolveCopy(STUDIO_COPY[ramo], slide.content);
  const Tpl = TEMPLATES[slide.kind] ?? Hero;
  return (
    <div
      ref={innerRef}
      className="studio"
      data-theme={slide.theme}
      style={{ width: fmt.w, height: fmt.h }}
    >
      <Tpl copy={copy} slide={slide} />
    </div>
  );
}
