'use client';

import { Check, ExternalLink, Loader2, MapPin, Search, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { GooglePlaceCandidate, GooglePlaceDetails } from '@/lib/google/places';
import { formatGoogleImportReviewTime } from '@/lib/format/google-import-review-time';
import {
  applyGoogleChurchImportAction,
  getGoogleChurchDetailsAction,
  searchGoogleChurchCandidatesAction,
} from './actions';

type GoogleChurchImportProps = {
  churchId: string;
  defaultQuery: string;
};

const FIELD_OPTIONS = [
  { value: 'name', label: 'Nome' },
  { value: 'address', label: 'Endereco' },
  { value: 'phone', label: 'Telefone e WhatsApp' },
  { value: 'website', label: 'Site' },
  { value: 'google_maps_url', label: 'Google Maps' },
  { value: 'street_view', label: 'Link 360' },
  { value: 'lat_lng', label: 'Mapa' },
  { value: 'hours', label: 'Horarios' },
  { value: 'secondary_hours', label: 'Horarios extras' },
  { value: 'rating', label: 'Nota e avaliacoes' },
  { value: 'reviews', label: 'Comentarios selecionados' },
  { value: 'summaries', label: 'Resumos do Google' },
  { value: 'attributes', label: 'Caracteristicas' },
  { value: 'price', label: 'Faixa de preco' },
] as const;

type FieldName = typeof FIELD_OPTIONS[number]['value'];

export function GoogleChurchImport({ churchId, defaultQuery }: GoogleChurchImportProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [candidates, setCandidates] = useState<GooglePlaceCandidate[]>([]);
  const [details, setDetails] = useState<GooglePlaceDetails | null>(null);
  const [selectedFields, setSelectedFields] = useState<FieldName[]>([
    'address',
    'phone',
    'website',
    'google_maps_url',
    'street_view',
    'lat_lng',
    'hours',
    'rating',
  ]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [visiblePhotoCount, setVisiblePhotoCount] = useState(6);
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [pendingLabel, setPendingLabel] = useState('');
  const [isPending, startTransition] = useTransition();

  const availableFields = useMemo(() => {
    if (!details) return FIELD_OPTIONS;
    return FIELD_OPTIONS.filter((field) => {
      if (field.value === 'address') return Boolean(details.address);
      if (field.value === 'phone') return Boolean(details.phone);
      if (field.value === 'website') return Boolean(details.website);
      if (field.value === 'google_maps_url') return Boolean(details.googleMapsUrl);
      if (field.value === 'street_view') return Boolean(details.streetViewUrl);
      if (field.value === 'lat_lng') return details.lat !== null && details.lng !== null;
      if (field.value === 'hours') return details.hours.length > 0 || Object.keys(details.hoursStructured).length > 0;
      if (field.value === 'secondary_hours') return details.secondaryHours.length > 0;
      if (field.value === 'rating') return details.rating !== null || details.userRatingCount !== null;
      if (field.value === 'reviews') return details.reviews.length > 0;
      if (field.value === 'summaries') return details.summaries.length > 0;
      if (field.value === 'attributes') return details.attributes.length > 0;
      if (field.value === 'price') return Boolean(details.priceLevel || details.priceRange);
      return true;
    });
  }, [details]);

  function searchCandidates() {
    setIsOpen(true);
    startTransition(async () => {
      setMessage('');
      setPendingLabel('Buscando no Google...');
      setDetails(null);
      setSelectedReviews([]);
      const result = await searchGoogleChurchCandidatesAction({ churchId, query });
      setCandidates(result.candidates);
      if (result.error) setMessage(result.error);
      if (!result.error && result.candidates.length === 0) setMessage('Nada encontrado no Google para essa busca.');
      setPendingLabel('');
    });
  }

  function loadDetails(placeId: string) {
    startTransition(async () => {
      setMessage('');
      setPendingLabel('Carregando dados, fotos e comentarios...');
      const result = await getGoogleChurchDetailsAction({ churchId, placeId });
      if (result.details) {
        setDetails(result.details);
        setVisiblePhotoCount(6);
        setSelectedPhotos(result.details.photos.slice(0, 3).map((photo) => photo.name));
        setSelectedReviews(result.details.reviews.slice(0, 3).map((review) => review.id));
      }
      if (result.error) setMessage(result.error);
      setPendingLabel('');
    });
  }

  function applyImport() {
    if (!details) return;

    startTransition(async () => {
      setMessage('Aplicando campos e guardando fotos/comentarios selecionados...');
      setPendingLabel('Aplicando importacao...');
      const result = await applyGoogleChurchImportAction({
        churchId,
        placeId: details.placeId,
        fields: selectedFields,
        photos: selectedPhotos,
        reviews: selectedReviews,
      });
      setMessage(
        result.ok
          ? `Importacao aplicada: ${result.applied?.fields ?? 0} campos e ${result.applied?.photos ?? 0} fotos na galeria.`
          : result.error ?? 'Falha ao aplicar.',
      );
      if (result.ok) {
        toast.success('Importação aplicada com sucesso.');
        setCandidates([]);
        setDetails(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Falha ao aplicar importação.');
      }
      setPendingLabel('');
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          className="min-w-0 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome da igreja, endereco ou ponto de referencia"
        />
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600 disabled:opacity-50"
          onClick={searchCandidates}
          disabled={isPending || query.trim().length < 2}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
          Buscar
        </button>
      </div>

      {message && !isOpen ? <p className="rounded-lg bg-white px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}

      {isOpen ? (
        <div className="fixed inset-0 z-[90] bg-ink-900/45 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-church-import-title"
            className="mx-auto grid max-h-[calc(100svh-1.5rem)] w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-ink-100 bg-paper shadow-pop sm:max-h-[calc(100svh-3rem)]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-ink-100 bg-white p-4">
              <div className="min-w-0">
                <h2 id="google-church-import-title" className="text-base font-semibold">
                  Importar dados do Google
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aprove apenas o que deve entrar na ficha da igreja.
                </p>
              </div>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-white hover:bg-muted"
                aria-label="Fechar"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>

            <div className="overflow-y-auto p-4">
              {isPending ? (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {pendingLabel || 'Processando...'}
                </div>
              ) : null}

              {message ? <p className="mb-3 rounded-lg bg-white px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}

              {candidates.length > 0 ? (
                <div className="grid gap-2">
                  <p className="text-sm font-semibold">Resultados encontrados</p>
                  {candidates.map((candidate) => (
                    <button
                      key={candidate.placeId}
                      type="button"
                      className="grid gap-1 rounded-xl border border-ink-100 bg-white p-3 text-left hover:bg-clay-50"
                      onClick={() => loadDetails(candidate.placeId)}
                    >
                      <span className="font-semibold">{candidate.name}</span>
                      {candidate.address ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" aria-hidden="true" />
                          {candidate.address}
                        </span>
                      ) : null}
                      {candidate.rating ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-ink-700">
                          <Star className="size-3 fill-sun-500 text-sun-500" aria-hidden="true" />
                          {candidate.rating.toFixed(1)} ({candidate.userRatingCount ?? 0})
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}

              {details ? (
                <div className="mt-3 grid gap-3 rounded-xl border border-ink-100 bg-white p-3">
                  <div className="grid gap-1">
                    <p className="font-semibold">{details.name}</p>
                    <p className="text-xs text-muted-foreground">{details.address}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {details.rating ? <span>{details.rating.toFixed(1)} estrelas ({details.userRatingCount ?? 0})</span> : null}
                      {details.openNow !== null ? <span>{details.openNow ? 'Aberto agora' : 'Fechado agora'}</span> : null}
                      {details.priceRange ?? details.priceLevel ? <span>{details.priceRange ?? details.priceLevel}</span> : null}
                      {details.streetViewUrl ? (
                        <a className="inline-flex items-center gap-1 font-medium text-sky-700" href={details.streetViewUrl} target="_blank" rel="noreferrer">
                          Link 360 <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <fieldset className="grid gap-2">
                    <legend className="text-sm font-semibold">Campos para importar</legend>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {availableFields.map((field) => (
                        <label key={field.value} className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.value)}
                            onChange={(event) => {
                              setSelectedFields((current) =>
                                event.target.checked
                                  ? [...current, field.value]
                                  : current.filter((item) => item !== field.value),
                              );
                            }}
                          />
                          {field.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <GoogleDataPreview details={details} />

                  {details.photos.length > 0 ? (
                    <fieldset className="grid gap-2">
                      <legend className="text-sm font-semibold">Fotos para guardar</legend>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {details.photos.slice(0, visiblePhotoCount).map((photo, index) => (
                          <label key={photo.name} className="grid gap-2 overflow-hidden rounded-lg border border-ink-100 bg-paper p-2 text-sm">
                            <span className="relative block aspect-video overflow-hidden rounded-md bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/google-place-photo?name=${encodeURIComponent(photo.name)}&w=520`}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </span>
                            <span className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selectedPhotos.includes(photo.name)}
                                onChange={(event) => {
                                  setSelectedPhotos((current) =>
                                    event.target.checked
                                      ? [...current, photo.name]
                                      : current.filter((item) => item !== photo.name),
                                  );
                                }}
                              />
                              <span>
                                <span className="block font-medium">Foto {index + 1}</span>
                                {photo.attribution ? <span className="block text-xs text-muted-foreground">{photo.attribution}</span> : null}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {visiblePhotoCount < details.photos.length ? (
                        <button
                          type="button"
                          className="w-fit rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-medium hover:bg-clay-50"
                          onClick={() => setVisiblePhotoCount((count) => Math.min(count + 6, details.photos.length))}
                        >
                          Carregar mais fotos
                        </button>
                      ) : null}
                    </fieldset>
                  ) : null}

                  <GoogleReviewsSelector
                    reviews={details.reviews}
                    selectedReviews={selectedReviews}
                    onChange={setSelectedReviews}
                  />

                  <button
                    type="button"
                    className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-clay-600 disabled:opacity-50"
                    onClick={applyImport}
                    disabled={isPending || (selectedFields.length === 0 && selectedPhotos.length === 0 && selectedReviews.length === 0)}
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                    Aplicar selecionados
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoogleDataPreview({ details }: { details: GooglePlaceDetails }) {
  return (
    <section className="grid gap-2 rounded-lg border border-ink-100 bg-paper p-3">
      <h3 className="text-sm font-semibold">Dados extras encontrados</h3>
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <PreviewBlock title="Horarios" items={[...details.hours, ...details.currentHours]} empty="Sem horario estruturado." />
        <PreviewBlock title="Horarios extras" items={details.secondaryHours} empty="Sem horarios secundarios." />
        <PreviewBlock title="Caracteristicas" items={details.attributes.map((item) => `${item.label}: ${item.value ? 'sim' : 'nao'}`)} empty="Sem caracteristicas extras." />
        <PreviewBlock title="Resumos" items={details.summaries.map((summary) => `${summary.label}: ${summary.text}`)} empty="Sem resumo no Google." />
      </div>
    </section>
  );
}

function PreviewBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-md bg-white p-2">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-1 grid gap-1">
          {items.slice(0, 8).map((item) => (
            <li key={item} className="text-sm">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function GoogleReviewsSelector({
  reviews,
  selectedReviews,
  onChange,
}: {
  reviews: GooglePlaceDetails['reviews'];
  selectedReviews: string[];
  onChange: (reviews: string[]) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold">Comentarios do Google para guardar</legend>
      {reviews.length > 0 ? (
        <div className="grid gap-2">
          {reviews.map((review) => {
            const timeLabel = formatGoogleImportReviewTime({
              relativeTime: review.relativeTime,
              publishedAt: review.publishedAt,
            });
            return (
            <label key={review.id} className="grid gap-2 rounded-lg border border-ink-100 bg-paper p-3 text-sm">
              <span className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedReviews.includes(review.id)}
                  onChange={(event) => {
                    onChange(
                      event.target.checked
                        ? [...selectedReviews, review.id].slice(0, 5)
                        : selectedReviews.filter((item) => item !== review.id),
                    );
                  }}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{review.authorName ?? 'Usuario do Google'}</span>
                    {review.rating ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700">
                        <Star className="size-3 fill-sun-500 text-sun-500" aria-hidden="true" />
                        {review.rating.toFixed(1)}
                      </span>
                    ) : null}
                    {timeLabel ? <span className="text-xs text-muted-foreground">{timeLabel}</span> : null}
                  </span>
                  {review.text ? <span className="mt-1 block leading-relaxed text-ink-700">{review.text}</span> : null}
                </span>
              </span>
            </label>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-paper px-3 py-2 text-sm text-muted-foreground">
          O Google nao retornou comentarios para este lugar.
        </p>
      )}
    </fieldset>
  );
}
