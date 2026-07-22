'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Copy, Image as ImageIcon, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DirectMediaUpload } from '@/components/admin/media/direct-media-upload';
import { updateHomeBlockAction } from '@/lib/home/actions';
import type {
  AssistantCtaConfig,
  BannerCarouselConfig,
  CategoryGridConfig,
  CategoryTone,
  CtaGridConfig,
  CtaTone,
  CustomHeroBannerAnimation,
  CustomHeroBannerConfig,
  CustomHeroBannerFont,
  CustomHeroBannerImagePlacement,
  CustomHeroBannerLayout,
  CustomHeroBannerObjectFit,
  EntityListConfig,
  FeatureTone,
  FeaturedPromoGridConfig,
  FeaturedPromoTone,
  FeaturesGridConfig,
  HeroCompositeConfig,
  HeroCompositeCtaTone,
  HomeBlockEditable,
  ListIconBg,
  ListIconFg,
  NewsletterCtaConfig,
  PromoStripConfig,
  RawHtmlConfig,
  RawHtmlGalleryItem,
  ServiceListConfig,
  TileStripConfig,
  WideBannerConfig,
} from '@/lib/home';
import { sanitizeRawHtmlPreview } from '@/lib/home/sanitize-raw-html-client';
import { IconPicker } from './icon-picker';

const CATEGORY_TONES: CategoryTone[] = ['clay', 'cerrado', 'sky', 'sun', 'paper-deep'];
const FEATURE_TONES: FeatureTone[] = ['cerrado', 'clay', 'sky', 'sun', 'paper-deep'];
const CTA_TONES: CtaTone[] = ['cerrado', 'clay', 'sky', 'sun'];
const FEATURED_PROMO_TONES: FeaturedPromoTone[] = ['cerrado', 'sky', 'clay', 'sun'];
const HERO_CTA_TONES: HeroCompositeCtaTone[] = ['clay', 'cerrado', 'sky', 'ink'];
const ICON_BG: ListIconBg[] = ['paper', 'clay-50', 'cerrado-100', 'sky-100', 'sun-100'];
const ICON_FG: ListIconFg[] = ['ink-900', 'clay-600', 'cerrado-700', 'sky-700'];
const ASPECT_RATIOS: readonly string[] = ['16:9', '4:5', '1:1', '3:1', '9:16', '5:1'];
const CUSTOM_HERO_LAYOUTS: CustomHeroBannerLayout[] = [
  'text_left',
  'text_center',
  'text_right',
  'split_left',
  'split_right',
];
const CUSTOM_HERO_FONTS: CustomHeroBannerFont[] = ['display', 'sans', 'serif', 'mono'];
const CUSTOM_HERO_ANIMATIONS: CustomHeroBannerAnimation[] = ['shine', 'soft', 'float', 'none'];
const CUSTOM_HERO_FITS: CustomHeroBannerObjectFit[] = ['cover', 'contain'];
const CUSTOM_HERO_IMAGE_PLACEMENTS: CustomHeroBannerImagePlacement[] = [
  'background',
  'left',
  'right',
];
const CUSTOM_HERO_LAYOUT_CLASS: Record<CustomHeroBannerLayout, string> = {
  text_left: 'items-start justify-center text-left',
  text_center: 'items-center justify-center text-center',
  text_right: 'items-end justify-center text-right',
  split_left: 'items-start justify-center text-left md:max-w-[58%]',
  split_right: 'items-start justify-center text-left md:ml-auto md:max-w-[52%]',
};
const CUSTOM_HERO_FONT_CLASS: Record<CustomHeroBannerFont, string> = {
  display: 'font-display',
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
};
const CUSTOM_HERO_TITLE_SIZE_CLASS: Record<NonNullable<CustomHeroBannerConfig['headlineSize']>, string> = {
  sm: 'text-[24px] md:text-[34px]',
  md: 'text-[30px] md:text-[44px]',
  lg: 'text-[36px] md:text-[56px]',
};

const CUSTOM_HERO_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  config: CustomHeroBannerConfig;
}> = [
  {
    id: 'merchant',
    label: 'Comercio',
    description: 'Captacao estilo hero comercial, com CTA forte.',
    config: {
      template: 'merchant',
      layout: 'text_left',
      height: 'standard',
      fullBleed: false,
      imagePlacement: 'background',
      imageFit: 'cover',
      imagePositionX: 66,
      imagePositionY: 50,
      overlayOpacity: 68,
      overlayDirection: 'left',
      backgroundColor: '#7a2d14',
      accentColor: '#f4a23a',
      textColor: '#ffffff',
      eyebrow: 'Pro seu comercio',
      headline: 'Apareca no Portal Carmelitano',
      subtitle: 'Uma vitrine local com imagem, destaque e chamada pra conversao.',
      badge: '1 mes gratis',
      ctaLabel: 'Quero cadastrar',
      footerNote: 'Oferta de lancamento em Carmo do Rio Claro/MG',
      font: 'display',
      headlineSize: 'lg',
      animation: 'shine',
    },
  },
  {
    id: 'event',
    label: 'Evento',
    description: 'Chamada vibrante pra agenda, shows e festas.',
    config: {
      template: 'event',
      layout: 'text_center',
      height: 'tall',
      fullBleed: true,
      imagePlacement: 'background',
      imageFit: 'cover',
      imagePositionX: 50,
      imagePositionY: 42,
      overlayOpacity: 58,
      overlayDirection: 'bottom',
      backgroundColor: '#1f2937',
      accentColor: '#f59e0b',
      textColor: '#ffffff',
      eyebrow: 'Agenda da cidade',
      headline: 'Fim de semana no centro',
      subtitle: 'Use imagem grande, titulo curto e CTA pra levar direto ao evento.',
      badge: 'Ao vivo',
      ctaLabel: 'Ver detalhes',
      secondaryLabel: 'Compartilhar',
      footerNote: '',
      font: 'display',
      headlineSize: 'lg',
      animation: 'float',
    },
  },
  {
    id: 'tourism',
    label: 'Turismo',
    description: 'Visual aberto pra pousadas, passeios e Furnas.',
    config: {
      template: 'tourism',
      layout: 'split_right',
      height: 'standard',
      fullBleed: false,
      imagePlacement: 'left',
      imageFit: 'cover',
      imagePositionX: 38,
      imagePositionY: 50,
      overlayOpacity: 62,
      overlayDirection: 'right',
      backgroundColor: '#1f4d3a',
      accentColor: '#93c572',
      textColor: '#ffffff',
      eyebrow: 'Experiencia local',
      headline: 'Descubra Carmo por outro angulo',
      subtitle: 'Ideal pra hospedagens, atracoes e roteiros com foto forte.',
      badge: 'Turismo',
      ctaLabel: 'Explorar',
      secondaryLabel: '',
      footerNote: '',
      font: 'serif',
      headlineSize: 'md',
      animation: 'soft',
    },
  },
  {
    id: 'offer',
    label: 'Oferta',
    description: 'Banner promocional direto, com cores de campanha.',
    config: {
      template: 'offer',
      layout: 'text_right',
      height: 'compact',
      fullBleed: false,
      imagePlacement: 'right',
      imageFit: 'cover',
      imagePositionX: 28,
      imagePositionY: 50,
      overlayOpacity: 70,
      overlayDirection: 'right',
      backgroundColor: '#831843',
      accentColor: '#f9a8d4',
      textColor: '#ffffff',
      eyebrow: 'Oferta da semana',
      headline: 'Promocao relampago',
      subtitle: 'Bom pra cupom, campanha sazonal ou chamada de parceiro.',
      badge: 'Imperdivel',
      ctaLabel: 'Aproveitar',
      secondaryLabel: '',
      footerNote: '',
      font: 'sans',
      headlineSize: 'md',
      animation: 'shine',
    },
  },
];

type Props = {
  block: HomeBlockEditable;
};

export function BlockConfigEditor({ block }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(block.title ?? '');
  const [config, setConfig] = useState<unknown>(block.config);
  const [groupWithNext, setGroupWithNext] = useState(block.groupWithNext);
  const [groupTitle, setGroupTitle] = useState(block.groupTitle ?? '');
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!showSaved) return;
    const timeout = window.setTimeout(() => setShowSaved(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [showSaved]);

  function save() {
    setError(null);
    const formData = new FormData();
    formData.set('block_id', block.id);
    formData.set('title', title);
    formData.set('config', JSON.stringify(config));
    formData.set('group_with_next', groupWithNext ? 'true' : 'false');
    formData.set('group_title', groupTitle);
    startTransition(async () => {
      try {
        await updateHomeBlockAction(formData);
        setShowSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao salvar.');
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="block-title">Titulo (opcional)</Label>
        <Input
          id="block-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <p className="text-muted-foreground text-xs">
          Exibido como cabecalho do bloco na home. Vazio = sem cabecalho.
        </p>
      </div>

      <ConfigFormByType block={block} value={config} onChange={setConfig} />

      <section className="grid gap-2 rounded-xl border bg-paper p-3">
        <header>
          <h3 className="text-sm font-semibold">Agrupar com o próximo (desktop)</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Quando marcado, este bloco e o próximo aparecem lado-a-lado no desktop (2/3 + 1/3).
            No mobile cada um continua empilhado normalmente.
          </p>
        </header>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={groupWithNext}
            onChange={(e) => setGroupWithNext(e.target.checked)}
            className="h-4 w-4"
          />
          Agrupar este bloco com o próximo
        </label>
        {groupWithNext ? (
          <div className="grid gap-1.5">
            <Label htmlFor="group-title">Título do par (opcional)</Label>
            <Input
              id="group-title"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              maxLength={120}
              placeholder="Ex.: Transparência pública & comunidade"
            />
            <p className="text-muted-foreground text-xs">
              Substitui os títulos individuais dos dois blocos no desktop. Deixe os títulos de cada bloco em branco pra evitar duplicação.
            </p>
          </div>
        ) : null}
      </section>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar configuracao'}
        </Button>
        {showSaved ? (
          <span className="text-sm font-semibold text-emerald-600">✓ Salvo</span>
        ) : null}
      </div>
    </div>
  );
}

function ConfigFormByType({
  block,
  value,
  onChange,
}: {
  block: HomeBlockEditable;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (block.type) {
    case 'category_grid':
      return <CategoryGridForm value={value as CategoryGridConfig} onChange={onChange} />;
    case 'features_grid':
      return <FeaturesGridForm value={value as FeaturesGridConfig} onChange={onChange} />;
    case 'tile_strip':
      return <TileStripForm value={value as TileStripConfig} onChange={onChange} />;
    case 'featured_promo_grid':
      return (
        <FeaturedPromoGridForm
          value={value as FeaturedPromoGridConfig}
          onChange={onChange}
          blockId={block.id}
        />
      );
    case 'hero_composite':
      return (
        <HeroCompositeForm
          value={value as HeroCompositeConfig}
          onChange={onChange}
          blockId={block.id}
        />
      );
    case 'service_list':
      return <ServiceListForm value={value as ServiceListConfig} onChange={onChange} />;
    case 'cta_grid':
      return <CtaGridForm value={value as CtaGridConfig} onChange={onChange} />;
    case 'assistant_cta':
      return <AssistantCtaForm value={value as AssistantCtaConfig} onChange={onChange} />;
    case 'entity_list':
      return <EntityListForm value={value as EntityListConfig} onChange={onChange} />;
    case 'promo_strip':
      return <PromoStripForm value={value as PromoStripConfig} onChange={onChange} />;
    case 'banner_carousel':
      return <BannerCarouselForm value={value as BannerCarouselConfig} onChange={onChange} />;
    case 'wide_banner':
      return <WideBannerForm value={value as WideBannerConfig} onChange={onChange} />;
    case 'custom_hero_banner':
      return (
        <CustomHeroBannerForm
          value={value as CustomHeroBannerConfig}
          imageUrl={block.banners[0]?.imageUrl}
          imageAlt={block.banners[0]?.imageAlt}
          onChange={onChange}
        />
      );
    case 'newsletter_cta':
      return <NewsletterCtaForm value={value as NewsletterCtaConfig} onChange={onChange} />;
    case 'raw_html':
      return (
        <RawHtmlForm
          value={value as RawHtmlConfig}
          onChange={onChange}
          blockId={block.id}
        />
      );
    default:
      return (
        <p className="text-muted-foreground text-sm">
          Esse bloco nao precisa de configuracao extra alem do titulo.
        </p>
      );
  }
}

// ── Helpers de items list (reordenar/remover) ───────────────────────────────

function ItemActions<T>({
  items,
  index,
  onChange,
}: {
  items: T[];
  index: number;
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={index === 0}
        aria-label="Subir"
        onClick={() => {
          const next = [...items];
          [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
          onChange(next);
        }}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={index === items.length - 1}
        aria-label="Descer"
        onClick={() => {
          const next = [...items];
          [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
          onChange(next);
        }}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive"
        aria-label="Remover"
        onClick={() => {
          onChange(items.filter((_, i) => i !== index));
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: readonly string[];
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="border-ink-200 h-9 rounded-md border bg-white px-2 text-xs"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectBox({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <SelectInput value={value} options={options} onChange={onChange} />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-[44px_1fr] gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 rounded-md border bg-white p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>
        {label}: {value}
      </Label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

// ── Forms por tipo ──────────────────────────────────────────────────────────

function CategoryGridForm({
  value,
  onChange,
}: {
  value: CategoryGridConfig;
  onChange: (v: CategoryGridConfig) => void;
}) {
  const items = value?.items ?? [];

  return (
    <section className="rounded-xl border bg-paper p-3">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Atalhos ({items.length})</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              items: [...items, { label: 'Novo', icon: 'Tag', href: '/', tone: 'clay' }],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </header>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="grid items-center gap-2 rounded-md border bg-white p-2 sm:grid-cols-[140px_120px_1fr_120px_auto]"
          >
            <Input
              value={item.label}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...item, label: e.target.value };
                onChange({ items: next });
              }}
              placeholder="Label"
            />
            <IconPicker
              value={item.icon}
              onChange={(icon) => {
                const next = [...items];
                next[index] = { ...item, icon };
                onChange({ items: next });
              }}
            />
            <Input
              value={item.href}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...item, href: e.target.value };
                onChange({ items: next });
              }}
              placeholder="/comercio"
            />
            <SelectInput
              value={item.tone}
              ariaLabel="Tom"
              options={CATEGORY_TONES}
              onChange={(tone) => {
                const next = [...items];
                next[index] = { ...item, tone: tone as CategoryTone };
                onChange({ items: next });
              }}
            />
            <ItemActions
              items={items}
              index={index}
              onChange={(next) => onChange({ items: next })}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeaturesGridForm({
  value,
  onChange,
}: {
  value: FeaturesGridConfig;
  onChange: (v: FeaturesGridConfig) => void;
}) {
  const items = value?.items ?? [];

  return (
    <section className="grid gap-3 rounded-xl border bg-paper p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Kicker (sub-titulo cinza)</Label>
          <Input
            value={value?.kicker ?? ''}
            onChange={(e) => onChange({ ...value, items, kicker: e.target.value || undefined })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Colunas</Label>
          <SelectInput
            value={String(value?.columns ?? 2)}
            options={['2', '3']}
            onChange={(c) => onChange({ ...value, items, columns: Number(c) as 2 | 3 })}
          />
        </div>
      </div>

      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cards ({items.length})</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...value,
              items: [...items, { title: 'Novo card', text: 'Descricao...', href: '/', icon: 'Sparkles', tone: 'cerrado' }],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </header>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li key={index} className="grid gap-2 rounded-md border bg-white p-2">
            <div className="grid gap-2 sm:grid-cols-[140px_1fr_120px_auto]">
              <IconPicker
                value={item.icon}
                onChange={(icon) => {
                  const next = [...items];
                  next[index] = { ...item, icon };
                  onChange({ ...value, items: next });
                }}
              />
              <Input
                value={item.title}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, title: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="Titulo"
              />
              <SelectInput
                value={item.tone}
                ariaLabel="Tom"
                options={FEATURE_TONES}
                onChange={(tone) => {
                  const next = [...items];
                  next[index] = { ...item, tone: tone as FeatureTone };
                  onChange({ ...value, items: next });
                }}
              />
              <ItemActions
                items={items}
                index={index}
                onChange={(next) => onChange({ ...value, items: next })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={item.text}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, text: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="Texto curto"
              />
              <Input
                value={item.href}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, href: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="/destino"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TileStripForm({
  value,
  onChange,
}: {
  value: TileStripConfig;
  onChange: (v: TileStripConfig) => void;
}) {
  const items = value?.items ?? [];

  return (
    <section className="rounded-xl border bg-paper p-3">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tiles ({items.length})</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              items: [...items, { title: 'Novo tile', illo: '✨', href: '/' }],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </header>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="grid items-center gap-2 rounded-md border bg-white p-2 sm:grid-cols-[60px_1fr_1fr_1fr_auto]"
          >
            <Input
              value={item.illo ?? ''}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...item, illo: e.target.value };
                onChange({ items: next });
              }}
              placeholder="🎉"
              className="text-center text-lg"
            />
            <Input
              value={item.title}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...item, title: e.target.value };
                onChange({ items: next });
              }}
              placeholder="Titulo"
            />
            <Input
              value={item.subtitle ?? ''}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...item, subtitle: e.target.value };
                onChange({ items: next });
              }}
              placeholder="Subtitulo"
            />
            <Input
              value={item.href}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...item, href: e.target.value };
                onChange({ items: next });
              }}
              placeholder="/destino"
            />
            <ItemActions items={items} index={index} onChange={(next) => onChange({ items: next })} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ServiceListForm({
  value,
  onChange,
}: {
  value: ServiceListConfig;
  onChange: (v: ServiceListConfig) => void;
}) {
  const items = value?.items ?? [];

  return (
    <section className="grid gap-3 rounded-xl border bg-paper p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Link do CTA (Ver tudo)</Label>
          <Input
            value={value?.actionHref ?? ''}
            onChange={(e) => onChange({ ...value, items, actionHref: e.target.value || undefined })}
            placeholder="/servicos"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Label do CTA</Label>
          <Input
            value={value?.actionLabel ?? ''}
            onChange={(e) => onChange({ ...value, items, actionLabel: e.target.value || undefined })}
            placeholder="Ver tudo"
          />
        </div>
      </div>

      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Itens ({items.length})</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...value,
              items: [...items, { icon: 'Tag', title: 'Novo item', href: '/' }],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </header>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li key={index} className="grid gap-2 rounded-md border bg-white p-2">
            <div className="grid gap-2 sm:grid-cols-[140px_1fr_140px_120px_auto]">
              <IconPicker
                value={item.icon}
                onChange={(icon) => {
                  const next = [...items];
                  next[index] = { ...item, icon };
                  onChange({ ...value, items: next });
                }}
              />
              <Input
                value={item.title}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, title: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="Titulo"
              />
              <SelectInput
                value={item.iconBg}
                ariaLabel="Cor de fundo do icone"
                options={ICON_BG}
                onChange={(iconBg) => {
                  const next = [...items];
                  next[index] = { ...item, iconBg: iconBg as ListIconBg };
                  onChange({ ...value, items: next });
                }}
              />
              <SelectInput
                value={item.iconFg}
                ariaLabel="Cor do icone"
                options={ICON_FG}
                onChange={(iconFg) => {
                  const next = [...items];
                  next[index] = { ...item, iconFg: iconFg as ListIconFg };
                  onChange({ ...value, items: next });
                }}
              />
              <ItemActions
                items={items}
                index={index}
                onChange={(next) => onChange({ ...value, items: next })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={item.sub ?? ''}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, sub: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="Subtexto"
              />
              <Input
                value={item.href}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, href: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="/destino"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CtaGridForm({ value, onChange }: { value: CtaGridConfig; onChange: (v: CtaGridConfig) => void }) {
  const items = value?.items ?? [];

  return (
    <section className="grid gap-3 rounded-xl border bg-paper p-3">
      <div className="grid gap-1.5 sm:max-w-[180px]">
        <Label>Colunas</Label>
        <SelectInput
          value={String(value?.columns ?? 2)}
          options={['1', '2']}
          onChange={(c) => onChange({ ...value, items, columns: Number(c) as 1 | 2 })}
        />
      </div>

      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">CTAs ({items.length})</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...value,
              items: [
                ...items,
                {
                  icon: 'Sparkles',
                  title: 'Novo CTA',
                  description: 'Descricao...',
                  cta: 'Abrir',
                  href: '/',
                  tone: 'cerrado',
                },
              ],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </header>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li key={index} className="grid gap-2 rounded-md border bg-white p-2">
            <div className="grid gap-2 sm:grid-cols-[140px_1fr_120px_auto]">
              <IconPicker
                value={item.icon}
                onChange={(icon) => {
                  const next = [...items];
                  next[index] = { ...item, icon };
                  onChange({ ...value, items: next });
                }}
              />
              <Input
                value={item.title}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, title: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="Titulo"
              />
              <SelectInput
                value={item.tone}
                options={CTA_TONES}
                onChange={(tone) => {
                  const next = [...items];
                  next[index] = { ...item, tone: tone as CtaTone };
                  onChange({ ...value, items: next });
                }}
              />
              <ItemActions
                items={items}
                index={index}
                onChange={(next) => onChange({ ...value, items: next })}
              />
            </div>
            <Input
              value={item.description}
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...item, description: e.target.value };
                onChange({ ...value, items: next });
              }}
              placeholder="Descricao"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={item.cta}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, cta: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="Texto do botao"
              />
              <Input
                value={item.href}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, href: e.target.value };
                  onChange({ ...value, items: next });
                }}
                placeholder="/destino"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AssistantCtaForm({
  value,
  onChange,
}: {
  value: AssistantCtaConfig;
  onChange: (v: AssistantCtaConfig) => void;
}) {
  const questions = value?.questions ?? [];

  return (
    <section className="grid gap-3 rounded-xl border bg-paper p-3">
      <div className="grid gap-1.5">
        <Label>Link do assistente</Label>
        <Input
          value={value?.href ?? ''}
          onChange={(e) => onChange({ ...value, questions, href: e.target.value || undefined })}
          placeholder="/assistente"
        />
      </div>

      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Perguntas-exemplo ({questions.length})</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...value, questions: [...questions, 'Nova pergunta?'] })}
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </header>
      <ul className="grid gap-2">
        {questions.map((q, index) => (
          <li key={index} className="grid items-center gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={q}
              onChange={(e) => {
                const next = [...questions];
                next[index] = e.target.value;
                onChange({ ...value, questions: next });
              }}
            />
            <ItemActions
              items={questions}
              index={index}
              onChange={(next) => onChange({ ...value, questions: next })}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EntityListForm({
  value,
  onChange,
}: {
  value: EntityListConfig;
  onChange: (v: EntityListConfig) => void;
}) {
  return (
    <section className="grid gap-3 rounded-xl border bg-paper p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Fonte de dados</Label>
          <SelectInput
            value={value?.source ?? 'businesses_featured'}
            options={[
              'businesses_featured',
              'businesses_recent',
              'tourism_attractions',
              'tourism_lodgings',
              'city_promotions',
            ]}
            onChange={(source) =>
              onChange({ ...value, source: source as EntityListConfig['source'] })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Limite</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={value?.limit ?? 8}
            onChange={(e) => onChange({ ...value, limit: Number(e.target.value) })}
          />
        </div>
        {value?.source === 'tourism_lodgings' ? (
          <div className="grid gap-1.5">
            <Label>Slug da categoria</Label>
            <Input
              value={value?.categorySlug ?? 'pousadas'}
              onChange={(e) => onChange({ ...value, categorySlug: e.target.value })}
            />
          </div>
        ) : null}
        <div className="grid gap-1.5">
          <Label>Link &quot;Ver tudo&quot;</Label>
          <Input
            value={value?.actionHref ?? ''}
            onChange={(e) => onChange({ ...value, actionHref: e.target.value || undefined })}
            placeholder="/comercio"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Label do CTA</Label>
          <Input
            value={value?.actionLabel ?? ''}
            onChange={(e) => onChange({ ...value, actionLabel: e.target.value || undefined })}
            placeholder="Ver tudo"
          />
        </div>
      </div>
    </section>
  );
}

function PromoStripForm({
  value,
  onChange,
}: {
  value: PromoStripConfig;
  onChange: (v: PromoStripConfig) => void;
}) {
  return (
    <section className="rounded-xl border bg-paper p-3 sm:max-w-[280px]">
      <Label>Limite de cupons</Label>
      <Input
        type="number"
        min={1}
        max={20}
        value={value?.limit ?? 8}
        onChange={(e) => onChange({ limit: Number(e.target.value) })}
      />
    </section>
  );
}

function BannerCarouselForm({
  value,
  onChange,
}: {
  value: BannerCarouselConfig;
  onChange: (v: BannerCarouselConfig) => void;
}) {
  return (
    <section className="rounded-xl border bg-paper p-3 sm:max-w-[280px]">
      <Label>Proporcao dos slides</Label>
      <SelectInput
        value={value?.aspectRatio ?? '16:9'}
        options={ASPECT_RATIOS}
        onChange={(r) => onChange({ ...value, aspectRatio: r as BannerCarouselConfig['aspectRatio'] })}
      />
      <p className="text-muted-foreground mt-1 text-xs">
        Use 9:16 pra banners verticais (854x1368). 4:5 pra retrato medio. 16:9 pra paisagem.
      </p>
    </section>
  );
}

function WideBannerForm({
  value,
  onChange,
}: {
  value: WideBannerConfig;
  onChange: (v: WideBannerConfig) => void;
}) {
  return (
    <section className="grid gap-3 rounded-xl border bg-paper p-3 sm:max-w-[420px]">
      <div className="grid gap-1.5">
        <Label>Proporcao</Label>
        <SelectInput
          value={value?.aspectRatio ?? '5:1'}
          options={ASPECT_RATIOS}
          onChange={(r) => onChange({ ...value, aspectRatio: r as WideBannerConfig['aspectRatio'] })}
        />
        <p className="text-muted-foreground text-xs">
          Banners 3000x600 = 5:1. Banners 2000x500 = 4:1 (use 3:1 mais proximo).
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value?.fullBleed !== false}
          onChange={(e) => onChange({ ...value, fullBleed: e.target.checked })}
        />
        Full-bleed (sem padding lateral)
      </label>
    </section>
  );
}

function CustomHeroBannerPreview({
  config,
  imageUrl,
  imageAlt,
}: {
  config: CustomHeroBannerConfig;
  imageUrl: string | undefined;
  imageAlt: string | null | undefined;
}) {
  const layout = config.layout ?? 'text_left';
  const font = config.font ?? 'display';
  const headlineSize = config.headlineSize ?? 'lg';
  const accentColor = config.accentColor ?? '#f4a23a';
  const backgroundColor = config.backgroundColor ?? '#7a2d14';
  const textColor = config.textColor ?? '#ffffff';
  const imagePositionX = clampPercent(config.imagePositionX ?? 50);
  const imagePositionY = clampPercent(config.imagePositionY ?? 50);
  const overlayOpacity = clampPercent(config.overlayOpacity ?? 64) / 100;
  const imagePlacement = config.imagePlacement ?? 'background';
  const isSideImage = imagePlacement === 'left' || imagePlacement === 'right';
  const textContent = (
    <div
      className={`relative z-10 flex min-h-[260px] flex-col px-5 py-7 md:px-8 ${
        CUSTOM_HERO_LAYOUT_CLASS[layout]
      }`}
    >
      {config.badge ? (
        <span
          className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold uppercase text-ink-900 shadow-sm"
          style={{ color: backgroundColor }}
        >
          <Sparkles className="size-3" aria-hidden />
          {config.badge}
        </span>
      ) : null}
      {config.eyebrow ? (
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] drop-shadow">
          {config.eyebrow}
        </p>
      ) : null}
      <h2
        className={`max-w-[720px] text-balance font-extrabold leading-[0.96] drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] ${
          CUSTOM_HERO_FONT_CLASS[font]
        } ${CUSTOM_HERO_TITLE_SIZE_CLASS[headlineSize]}`}
      >
        {config.headline || 'Banner em destaque'}
      </h2>
      {config.subtitle ? (
        <p className="mt-3 max-w-[580px] text-sm font-semibold leading-snug text-white/92 drop-shadow md:text-base">
          {config.subtitle}
        </p>
      ) : null}
      {(config.ctaLabel || config.secondaryLabel) ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {config.ctaLabel ? (
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold text-ink-900 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {config.ctaLabel}
              <ArrowRight className="size-4" aria-hidden />
            </span>
          ) : null}
          {config.secondaryLabel ? (
            <span className="rounded-full bg-white/14 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/35 backdrop-blur-sm">
              {config.secondaryLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      {config.footerNote ? (
        <p className="mt-4 max-w-[560px] text-xs font-semibold text-white/82">
          {config.footerNote}
        </p>
      ) : null}
    </div>
  );
  const imageContent = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={imageAlt ?? config.headline ?? ''}
      className={`h-full w-full ${config.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
      style={{ objectPosition: `${imagePositionX}% ${imagePositionY}%` }}
    />
  ) : (
    <div
      className="h-full w-full"
      style={{
        backgroundImage: `linear-gradient(135deg, ${backgroundColor}, ${accentColor})`,
      }}
      aria-hidden
    />
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Preview ao vivo</h3>
        <p className="text-muted-foreground text-xs">
          {imageUrl ? 'Usando a imagem enviada.' : 'Sem imagem enviada ainda.'}
        </p>
      </div>
      <div
        className={`relative isolate min-h-[260px] overflow-hidden rounded-lg border shadow-card ${
          config.fullBleed !== false ? 'md:rounded-none' : ''
        }`}
        style={{ backgroundColor, color: textColor }}
      >
        {isSideImage ? (
          <div
            className={`grid min-h-[260px] md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] ${
              imagePlacement === 'right' ? 'md:[&>*:first-child]:order-2' : ''
            }`}
          >
            <div className="min-h-[180px] bg-black/10">{imageContent}</div>
            <div className="relative overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background: getHeroPreviewOverlay('left', backgroundColor, overlayOpacity),
                }}
                aria-hidden
              />
              {textContent}
            </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0">{imageContent}</div>
            <div
              className="absolute inset-0"
              style={{
                background: getHeroPreviewOverlay(
                  config.overlayDirection ?? 'left',
                  backgroundColor,
                  overlayOpacity,
                ),
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_34%)]"
              aria-hidden
            />
            {config.animation === 'shine' ? <div className="custom-hero-shine" aria-hidden /> : null}
            {config.animation === 'float' ? (
              <Sparkles
                className="custom-hero-sparkle absolute right-8 top-8 size-5"
                style={{ color: accentColor }}
                aria-hidden
              />
            ) : null}
            {textContent}
          </>
        )}
      </div>
    </div>
  );
}

function CustomHeroBannerForm({
  value,
  imageUrl,
  imageAlt,
  onChange,
}: {
  value: CustomHeroBannerConfig;
  imageUrl: string | undefined;
  imageAlt: string | null | undefined;
  onChange: (v: CustomHeroBannerConfig) => void;
}) {
  const config = {
    ...CUSTOM_HERO_PRESETS[0]!.config,
    ...value,
  };

  function patch(next: Partial<CustomHeroBannerConfig>) {
    onChange({ ...config, ...next });
  }

  return (
    <section className="grid gap-4 rounded-xl border bg-paper p-3">
      <CustomHeroBannerPreview config={config} imageUrl={imageUrl} imageAlt={imageAlt} />

      <div>
        <h3 className="text-sm font-semibold">Galeria de modelos</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          {CUSTOM_HERO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.config)}
              className={`rounded-lg border bg-white p-3 text-left transition hover:border-primary ${
                config.template === preset.config.template ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
            >
              <span className="text-sm font-bold">{preset.label}</span>
              <span className="text-muted-foreground mt-1 block text-xs leading-snug">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="Selo"
          value={config.badge}
          onChange={(badge) => patch({ badge })}
          placeholder="Ex: Novo"
        />
        <TextField
          label="Eyebrow"
          value={config.eyebrow}
          onChange={(eyebrow) => patch({ eyebrow })}
          placeholder="Ex: Oferta da semana"
        />
        <TextField
          label="Titulo principal"
          value={config.headline}
          onChange={(headline) => patch({ headline })}
          placeholder="Titulo do banner"
        />
        <TextField
          label="Subtitulo"
          value={config.subtitle}
          onChange={(subtitle) => patch({ subtitle })}
          placeholder="Texto de apoio"
        />
        <TextField
          label="CTA principal"
          value={config.ctaLabel}
          onChange={(ctaLabel) => patch({ ctaLabel })}
          placeholder="Ex: Ver detalhes"
        />
        <TextField
          label="CTA secundario"
          value={config.secondaryLabel}
          onChange={(secondaryLabel) => patch({ secondaryLabel })}
          placeholder="Opcional"
        />
        <TextField
          label="Link secundario"
          value={config.secondaryHref}
          onChange={(secondaryHref) => patch({ secondaryHref })}
          placeholder="/agenda"
        />
        <TextField
          label="Nota de rodape"
          value={config.footerNote}
          onChange={(footerNote) => patch({ footerNote })}
          placeholder="Opcional"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SelectBox
          label="Layout"
          value={config.layout ?? 'text_left'}
          options={CUSTOM_HERO_LAYOUTS}
          onChange={(layout) => patch({ layout: layout as CustomHeroBannerLayout })}
        />
        <SelectBox
          label="Altura"
          value={config.height ?? 'standard'}
          options={['compact', 'standard', 'tall']}
          onChange={(height) => patch({ height: height as CustomHeroBannerConfig['height'] })}
        />
        <SelectBox
          label="Fonte"
          value={config.font ?? 'display'}
          options={CUSTOM_HERO_FONTS}
          onChange={(font) => patch({ font: font as CustomHeroBannerFont })}
        />
        <SelectBox
          label="Tamanho do titulo"
          value={config.headlineSize ?? 'lg'}
          options={['sm', 'md', 'lg']}
          onChange={(headlineSize) =>
            patch({ headlineSize: headlineSize as CustomHeroBannerConfig['headlineSize'] })
          }
        />
        <SelectBox
          label="Animacao"
          value={config.animation ?? 'shine'}
          options={CUSTOM_HERO_ANIMATIONS}
          onChange={(animation) => patch({ animation: animation as CustomHeroBannerAnimation })}
        />
        <SelectBox
          label="Uso da imagem"
          value={config.imagePlacement ?? 'background'}
          options={CUSTOM_HERO_IMAGE_PLACEMENTS}
          onChange={(imagePlacement) =>
            patch({ imagePlacement: imagePlacement as CustomHeroBannerImagePlacement })
          }
        />
        <SelectBox
          label="Ajuste da imagem"
          value={config.imageFit ?? 'cover'}
          options={CUSTOM_HERO_FITS}
          onChange={(imageFit) => patch({ imageFit: imageFit as CustomHeroBannerObjectFit })}
        />
        <SelectBox
          label="Overlay"
          value={config.overlayDirection ?? 'left'}
          options={['left', 'right', 'bottom', 'none']}
          onChange={(overlayDirection) =>
            patch({
              overlayDirection:
                overlayDirection as CustomHeroBannerConfig['overlayDirection'],
            })
          }
        />
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={config.fullBleed !== false}
            onChange={(e) => patch({ fullBleed: e.target.checked })}
          />
          Full-bleed
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ColorField
          label="Cor de fundo/overlay"
          value={config.backgroundColor ?? '#7a2d14'}
          onChange={(backgroundColor) => patch({ backgroundColor })}
        />
        <ColorField
          label="Cor de destaque"
          value={config.accentColor ?? '#f4a23a'}
          onChange={(accentColor) => patch({ accentColor })}
        />
        <ColorField
          label="Cor do texto"
          value={config.textColor ?? '#ffffff'}
          onChange={(textColor) => patch({ textColor })}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <RangeField
          label="Imagem X"
          value={config.imagePositionX ?? 50}
          onChange={(imagePositionX) => patch({ imagePositionX })}
        />
        <RangeField
          label="Imagem Y"
          value={config.imagePositionY ?? 50}
          onChange={(imagePositionY) => patch({ imagePositionY })}
        />
        <RangeField
          label="Forca do overlay"
          value={config.overlayOpacity ?? 64}
          onChange={(overlayOpacity) => patch({ overlayOpacity })}
        />
      </div>
    </section>
  );
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { r: 0, g: 0, b: 0 };
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function getHeroPreviewOverlay(
  direction: NonNullable<CustomHeroBannerConfig['overlayDirection']>,
  color: string,
  opacity: number,
): string {
  if (direction === 'none') return 'transparent';
  const { r, g, b } = hexToRgb(color);
  const strong = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  const soft = `rgba(${r}, ${g}, ${b}, ${Math.max(0, opacity - 0.32)})`;
  const clear = `rgba(${r}, ${g}, ${b}, 0)`;
  const angle = {
    left: '90deg',
    right: '270deg',
    bottom: '0deg',
  }[direction];
  return `linear-gradient(${angle}, ${strong} 0%, ${soft} 42%, ${clear} 100%)`;
}

function RawHtmlForm({
  value,
  onChange,
  blockId,
}: {
  value: RawHtmlConfig;
  onChange: (v: RawHtmlConfig) => void;
  blockId: string;
}) {
  const html = value?.html ?? '';
  const padding = value?.padding ?? 'comfortable';
  const gallery: RawHtmlGalleryItem[] = value?.gallery ?? [];
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  function patch(next: Partial<RawHtmlConfig>) {
    onChange({ html, padding, gallery, ...next });
  }

  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      patch({ html: html + '\n' + snippet });
      return;
    }
    const start = el.selectionStart ?? html.length;
    const end = el.selectionEnd ?? html.length;
    const next = html.slice(0, start) + snippet + html.slice(end);
    patch({ html: next });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function copyUrl(url: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      window.setTimeout(() => setCopiedUrl((current) => (current === url ? null : current)), 1800);
    }
  }

  return (
    <section className="grid gap-4 rounded-xl border bg-paper p-3">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="raw-html-source">HTML do bloco</Label>
          <div className="flex items-center gap-1.5">
            <Label htmlFor="raw-html-padding" className="text-xs text-muted-foreground">
              Padding
            </Label>
            <SelectInput
              value={padding}
              options={['none', 'tight', 'comfortable']}
              onChange={(p) => patch({ padding: p as RawHtmlConfig['padding'] })}
              ariaLabel="Padding"
            />
          </div>
        </div>
        <textarea
          id="raw-html-source"
          ref={textareaRef}
          value={html}
          onChange={(e) => patch({ html: e.target.value })}
          rows={12}
          spellCheck={false}
          className="border-ink-200 min-h-[260px] rounded-md border bg-white px-3 py-2 font-mono text-[13px] leading-relaxed"
          placeholder="<p>Conteudo do bloco em HTML...</p>"
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Tags permitidas: <code>p, h1-h4, ul/ol/li, a, img, strong/em, blockquote, hr, code, figure</code>.
          Tags perigosas (<code>script</code>, <code>iframe</code>) e handlers <code>on*</code> sao removidos no render.
          Links abrem em nova aba por padrao.
        </p>
      </div>

      <div className="grid gap-2">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Galeria de imagens ({gallery.length})</h3>
            <p className="text-muted-foreground text-xs">
              Envie aqui pra ter URL pronta. Botao &quot;Inserir&quot; cola um <code>&lt;img&gt;</code> no HTML acima.
            </p>
          </div>
        </header>

        <DirectMediaUpload
          entityType="home_block"
          entityId={blockId}
          role="gallery"
          accept="image/jpeg,image/png,image/webp,image/avif"
          ctaLabel="Enviar imagem pra galeria"
          helpText="JPG, PNG, WebP ou AVIF. Recomendado: largura 1200px."
          contextLabel="Bloco raw HTML"
          onUploaded={(media, processed) => {
            const next: RawHtmlGalleryItem[] = [
              { assetId: media.id, url: processed.cdnUrl },
              ...gallery,
            ];
            patch({ gallery: next });
          }}
        />

        {gallery.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed bg-white px-3 py-6 text-center text-xs">
            Nenhuma imagem na galeria ainda.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {gallery.map((item, index) => (
              <li
                key={item.assetId}
                className="flex items-start gap-2 rounded-md border bg-white p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt ?? ''}
                  className="h-16 w-20 flex-none rounded object-cover"
                />
                <div className="grid min-w-0 flex-1 gap-1">
                  <code className="block truncate text-[11px]">{item.url}</code>
                  <Input
                    value={item.alt ?? ''}
                    onChange={(e) => {
                      const next = [...gallery];
                      next[index] = { ...item, alt: e.target.value };
                      patch({ gallery: next });
                    }}
                    placeholder="Texto alternativo (alt)"
                    className="h-7 text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        insertAtCursor(
                          `<img src="${item.url}" alt="${escapeHtmlAttr(item.alt ?? '')}" />`,
                        )
                      }
                    >
                      <ImageIcon className="h-3 w-3" />
                      Inserir
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => copyUrl(item.url)}
                    >
                      <Copy className="h-3 w-3" />
                      {copiedUrl === item.url ? 'Copiado!' : 'URL'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        patch({ gallery: gallery.filter((_, i) => i !== index) });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-2">
        <h3 className="text-sm font-semibold">Preview (sanitizado)</h3>
        <div
          className="home-raw-html rounded-md border bg-white p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: sanitizeRawHtmlPreview(html) }}
        />
      </div>
    </section>
  );
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function NewsletterCtaForm({
  value,
  onChange,
}: {
  value: NewsletterCtaConfig;
  onChange: (v: NewsletterCtaConfig) => void;
}) {
  return (
    <section className="grid gap-3 rounded-xl border bg-paper p-3">
      <div className="grid gap-1.5">
        <Label>Source (tag de analytics)</Label>
        <Input
          value={value?.source ?? 'home'}
          onChange={(e) => onChange({ ...value, source: e.target.value })}
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Descricao acima do form</Label>
        <Input
          value={value?.description ?? ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </div>
    </section>
  );
}

function FeaturedPromoGridForm({
  value,
  onChange,
  blockId,
}: {
  value: FeaturedPromoGridConfig;
  onChange: (v: FeaturedPromoGridConfig) => void;
  blockId: string;
}) {
  const items = value?.items ?? [];
  const columns = value?.columns ?? 3;

  return (
    <section className="grid gap-3 rounded-xl border bg-paper p-3">
      <div className="grid gap-1.5 sm:max-w-[240px]">
        <Label>Colunas no desktop</Label>
        <div className="flex gap-1">
          {[2, 3].map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => onChange({ items, columns: c as 2 | 3 })}
              className={`rounded-md border px-3 py-1 text-sm ${
                columns === c ? 'border-clay-500 bg-clay-50 font-semibold' : 'border-ink-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cards ({items.length})</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              columns,
              items: [
                ...items,
                {
                  badge: 'Novo destaque',
                  title: 'Título do card',
                  subtitle: 'Subtítulo curto',
                  href: '/',
                  tone: FEATURED_PROMO_TONES[items.length % FEATURED_PROMO_TONES.length],
                },
              ],
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </header>

      <ul className="grid gap-3">
        {items.map((item, index) => (
          <li key={index} className="grid gap-2 rounded-md border bg-white p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label className="text-xs">Badge (chip no topo)</Label>
                <Input
                  value={item.badge ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...item, badge: e.target.value };
                    onChange({ columns, items: next });
                  }}
                  placeholder="FESTIVAL DA TILÁPIA"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Tom (cor de fundo)</Label>
                <div className="flex gap-1">
                  {FEATURED_PROMO_TONES.map((tone) => (
                    <button
                      type="button"
                      key={tone}
                      onClick={() => {
                        const next = [...items];
                        next[index] = { ...item, tone };
                        onChange({ columns, items: next });
                      }}
                      className={`h-7 w-7 rounded-full border-2 ${
                        item.tone === tone ? 'border-ink-900' : 'border-transparent'
                      } ${
                        tone === 'cerrado'
                          ? 'bg-cerrado-700'
                          : tone === 'sky'
                            ? 'bg-sky-700'
                            : tone === 'clay'
                              ? 'bg-clay-600'
                              : 'bg-sun-300'
                      }`}
                      title={tone}
                      aria-label={tone}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Título</Label>
              <Input
                value={item.title}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, title: e.target.value };
                  onChange({ columns, items: next });
                }}
                placeholder="Rodízio a R$ 49,90 · sáb & dom no Aterro"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Subtítulo (opcional)</Label>
              <Input
                value={item.subtitle ?? ''}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, subtitle: e.target.value };
                  onChange({ columns, items: next });
                }}
                placeholder="8 restaurantes participam..."
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Imagem (opcional)</Label>
              {item.imageUrl ? (
                <div className="flex items-start gap-3 rounded-md border bg-paper p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-20 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <code className="block max-w-full truncate text-[11px]">{item.imageUrl}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-destructive"
                      onClick={() => {
                        const next = [...items];
                        next[index] = { ...item, imageUrl: undefined, imageAssetId: null };
                        onChange({ columns, items: next });
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Remover
                    </Button>
                  </div>
                </div>
              ) : (
                <DirectMediaUpload
                  entityType="home_block"
                  entityId={blockId}
                  role="gallery"
                  accept="image/jpeg,image/png,image/webp"
                  ctaLabel="Enviar imagem do card"
                  helpText="Recomendado: 800x600. JPG, PNG ou WebP."
                  contextLabel={`Promo · ${item.badge || item.title || `card ${index + 1}`}`}
                  onUploaded={(media, processed) => {
                    const next = [...items];
                    next[index] = {
                      ...item,
                      imageUrl: processed.cdnUrl,
                      imageAssetId: media.id,
                    };
                    onChange({ columns, items: next });
                  }}
                />
              )}
              <Input
                value={item.imageUrl ?? ''}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = {
                    ...item,
                    imageUrl: e.target.value || undefined,
                    imageAssetId: null,
                  };
                  onChange({ columns, items: next });
                }}
                placeholder="Ou cole uma URL externa (https://...)"
                className="text-xs"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Link</Label>
              <Input
                value={item.href}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, href: e.target.value };
                  onChange({ columns, items: next });
                }}
                placeholder="/comercio?promo=..."
              />
            </div>
            <div className="flex justify-end">
              <ItemActions
                items={items}
                index={index}
                onChange={(next) => onChange({ columns, items: next })}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HeroCompositeForm({
  value,
  onChange,
  blockId,
}: {
  value: HeroCompositeConfig;
  onChange: (v: HeroCompositeConfig) => void;
  blockId: string;
}) {
  const hero = value?.hero ?? { headline: '', actions: [] };
  const cta = value?.cta ?? { headline: '', ctaLabel: '', ctaHref: '' };

  function patchHero(p: Partial<HeroCompositeConfig['hero']>) {
    onChange({ ...value, hero: { ...hero, ...p } });
  }
  function patchCta(p: Partial<HeroCompositeConfig['cta']>) {
    onChange({ ...value, cta: { ...cta, ...p } });
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-xl border bg-paper p-3">
        <header>
          <h3 className="text-sm font-semibold">Hero (lado esquerdo)</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Use <code>*assim*</code> no headline para destacar trechos em itálico + cor sun.
          </p>
        </header>
        <div className="grid gap-2">
          <Label>Imagem de fundo</Label>
          {hero.imageUrl ? (
            <div className="flex items-start gap-3 rounded-xl border bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.imageUrl}
                alt={hero.imageAlt ?? ''}
                className="h-20 w-32 rounded-md object-cover"
              />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs">
                  Imagem atual:
                </p>
                <code className="block max-w-full truncate text-[11px]">{hero.imageUrl}</code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-destructive"
                  onClick={() => patchHero({ imageUrl: '', imageAssetId: null })}
                >
                  <X className="h-3.5 w-3.5" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <DirectMediaUpload
              entityType="home_block"
              entityId={blockId}
              role="cover"
              accept="image/jpeg,image/png,image/webp"
              ctaLabel="Enviar imagem do hero"
              helpText="Recomendado: 1600x900 (16:9). JPG, PNG ou WebP."
              contextLabel="Hero composto"
              onUploaded={(media, processed) =>
                patchHero({ imageUrl: processed.cdnUrl, imageAssetId: media.id })
              }
            />
          )}
          <Input
            value={hero.imageUrl ?? ''}
            onChange={(e) => patchHero({ imageUrl: e.target.value, imageAssetId: null })}
            placeholder="Ou cole uma URL externa (https://...)"
            className="text-xs"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Alt da imagem</Label>
            <Input
              value={hero.imageAlt ?? ''}
              onChange={(e) => patchHero({ imageAlt: e.target.value })}
              placeholder="Vista da cidade ao entardecer"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Kicker (chip superior)</Label>
            <Input
              value={hero.kicker ?? ''}
              onChange={(e) => patchHero({ kicker: e.target.value })}
              placeholder="Mar de Minas · Aterro Santa Quitéria"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Headline (use *itálico*)</Label>
          <Input
            value={hero.headline}
            onChange={(e) => patchHero({ headline: e.target.value })}
            placeholder="Carmo do Rio Claro, *pertinho do* mar de Minas."
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Subtítulo</Label>
          <textarea
            value={hero.subtitle ?? ''}
            onChange={(e) => patchHero({ subtitle: e.target.value })}
            rows={3}
            className="border-ink-200 rounded-md border bg-white px-3 py-2 text-sm"
            placeholder="Onde a Represa de Furnas vira praia..."
          />
        </div>

        <div className="grid gap-2">
          <header className="flex items-center justify-between">
            <Label>Atalhos (chips no hero) — até 4</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={hero.actions.length >= 4}
              onClick={() =>
                patchHero({
                  actions: [...hero.actions, { label: 'Novo atalho', href: '/', icon: 'ArrowRight' }],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </header>
          <ul className="grid gap-2">
            {hero.actions.map((action, index) => (
              <li
                key={index}
                className="grid items-center gap-2 rounded-md border bg-white p-2 sm:grid-cols-[140px_1fr_1fr_auto]"
              >
                <IconPicker
                  value={action.icon ?? ''}
                  onChange={(icon) => {
                    const next = [...hero.actions];
                    next[index] = { ...action, icon };
                    patchHero({ actions: next });
                  }}
                />
                <Input
                  value={action.label}
                  onChange={(e) => {
                    const next = [...hero.actions];
                    next[index] = { ...action, label: e.target.value };
                    patchHero({ actions: next });
                  }}
                  placeholder="Guia de turismo"
                />
                <Input
                  value={action.href}
                  onChange={(e) => {
                    const next = [...hero.actions];
                    next[index] = { ...action, href: e.target.value };
                    patchHero({ actions: next });
                  }}
                  placeholder="/turismo"
                />
                <ItemActions
                  items={hero.actions}
                  index={index}
                  onChange={(next) => patchHero({ actions: next })}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border bg-paper p-3">
        <header>
          <h3 className="text-sm font-semibold">CTA destacado (canto superior direito)</h3>
        </header>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Cor de fundo</Label>
            <div className="flex flex-wrap gap-1">
              {HERO_CTA_TONES.map((tone) => (
                <button
                  type="button"
                  key={tone}
                  onClick={() => patchCta({ tone })}
                  className={`rounded-md border px-3 py-1.5 text-xs capitalize ${
                    (cta.tone ?? 'clay') === tone
                      ? 'border-ink-900 bg-ink-900 font-semibold text-white'
                      : 'border-ink-200'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Badge (chip pequeno)</Label>
            <Input
              value={cta.badge ?? ''}
              onChange={(e) => patchCta({ badge: e.target.value })}
              placeholder="1º mês grátis"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Headline</Label>
          <Input
            value={cta.headline}
            onChange={(e) => patchCta({ headline: e.target.value })}
            placeholder="Apareça no Portal antes do feriado."
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Descrição</Label>
          <textarea
            value={cta.description ?? ''}
            onChange={(e) => patchCta({ description: e.target.value })}
            rows={3}
            className="border-ink-200 rounded-md border bg-white px-3 py-2 text-sm"
            placeholder="Cadastre seu comércio em 2 minutos..."
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Texto do botão</Label>
            <Input
              value={cta.ctaLabel}
              onChange={(e) => patchCta({ ctaLabel: e.target.value })}
              placeholder="Quero cadastrar"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Link do botão</Label>
            <Input
              value={cta.ctaHref}
              onChange={(e) => patchCta({ ctaHref: e.target.value })}
              placeholder="/comercio/cadastro"
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Nota de rodapé (opcional)</Label>
          <Input
            value={cta.footerNote ?? ''}
            onChange={(e) => patchCta({ footerNote: e.target.value })}
            placeholder="Aprovação manual · oferta de lançamento"
          />
        </div>
      </section>

      <section className="grid gap-2 rounded-xl border bg-paper p-3">
        <header>
          <h3 className="text-sm font-semibold">Grid 2x2 (canto inferior direito)</h3>
        </header>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Esta seção é <strong>preenchida automaticamente</strong> com dados ao vivo da cidade:
          coleta de lixo do dia, farmácia de plantão, próximo evento da agenda e última sessão da
          câmara. Cacheada por 10–30min. Não precisa configurar nada aqui — quando os módulos
          (utilities, transparency, eventos) estiverem com dados, os 4 cards aparecem sozinhos.
        </p>
      </section>
    </div>
  );
}

