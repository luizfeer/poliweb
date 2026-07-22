'use client';

import { Check, Loader2, MapPin, Search, Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { GooglePlaceCandidate, GooglePlaceDetails } from '@/lib/google/places';
import {
  applyGoogleAttractionImportAction,
  getGoogleAttractionDetailsAction,
  searchGoogleAttractionCandidatesAction,
} from '../actions';

type GoogleAttractionImportProps = {
  attractionId: string;
  defaultQuery: string;
};

const FIELD_OPTIONS = [
  { value: 'name', label: 'Nome' },
  { value: 'address', label: 'Endereço' },
  { value: 'phone', label: 'Telefone e WhatsApp' },
  { value: 'website', label: 'Site' },
  { value: 'google_maps_url', label: 'Google Maps' },
  { value: 'street_view', label: 'Link 360' },
  { value: 'lat_lng', label: 'Mapa' },
  { value: 'hours', label: 'Horários' },
  { value: 'rating', label: 'Nota e avaliações' },
  { value: 'summaries', label: 'Resumo Google' },
  { value: 'attributes', label: 'Características' },
  { value: 'amenities', label: 'Comodidades' },
  { value: 'price', label: 'Faixa de preço' },
] as const;

type FieldName = (typeof FIELD_OPTIONS)[number]['value'];

export function GoogleAttractionImport({
  attractionId,
  defaultQuery,
}: GoogleAttractionImportProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const [candidates, setCandidates] = useState<GooglePlaceCandidate[]>([]);
  const [details, setDetails] = useState<GooglePlaceDetails | null>(null);
  const [selectedFields, setSelectedFields] = useState<FieldName[]>([
    'address',
    'phone',
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
      if (field.value === 'hours') return details.hours.length > 0;
      if (field.value === 'rating')
        return details.rating !== null || details.userRatingCount !== null;
      if (field.value === 'summaries') return details.summaries.length > 0;
      if (field.value === 'attributes') return details.attributes.length > 0;
      if (field.value === 'amenities') return details.amenities.length > 0;
      if (field.value === 'price') return Boolean(details.priceRange || details.priceLevel);
      return true;
    });
  }, [details]);

  function closeModal() {
    setOpen(false);
    setMessage('');
    setCandidates([]);
    setDetails(null);
  }

  function searchCandidates() {
    startTransition(async () => {
      setMessage('');
      setDetails(null);
      const result = await searchGoogleAttractionCandidatesAction({ attractionId, query });
      setCandidates(result.candidates);
      if (result.error) setMessage(result.error);
      if (!result.error && result.candidates.length === 0)
        setMessage('Nada encontrado no Google para essa busca.');
    });
  }

  function loadDetails(placeId: string) {
    startTransition(async () => {
      setMessage('');
      const result = await getGoogleAttractionDetailsAction({ attractionId, placeId });
      if (result.details) {
        setDetails(result.details);
        setVisiblePhotoCount(6);
        setSelectedPhotos(result.details.photos.slice(0, 3).map((photo) => photo.name));
        setSelectedReviews(result.details.reviews.slice(0, 3).map((review) => review.id));
      }
      if (result.error) setMessage(result.error);
    });
  }

  function applyImport() {
    if (!details) return;
    startTransition(async () => {
      setMessage('Aplicando importação...');
      const result = await applyGoogleAttractionImportAction({
        attractionId,
        placeId: details.placeId,
        fields: selectedFields,
        photos: selectedPhotos,
        reviews: selectedReviews,
      });
      setMessage(
        result.ok
          ? `Importação aplicada: ${result.applied?.fields ?? 0} campos e ${result.applied?.photos ?? 0} fotos na galeria.`
          : (result.error ?? 'Falha ao aplicar.'),
      );
      if (result.ok) {
        toast.success('Importação aplicada com sucesso.');
        router.refresh();
        closeModal();
      } else {
        toast.error(result.error ?? 'Falha ao aplicar importação.');
      }
    });
  }

  return (
    <>
      <section className="bg-card rounded-xl border p-5">
        <p className="text-muted-foreground text-sm">Google Places</p>
        <h2 className="mt-1 font-semibold">Importar dados do Google</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Busque a ficha no Google, revise os campos e aplique somente o que fizer sentido.
        </p>
        <button
          type="button"
          className="bg-primary text-primary-foreground mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4" />
          Abrir importação
        </button>
      </section>

      {open ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <section className="bg-card max-h-[92svh] w-full max-w-5xl overflow-hidden rounded-xl border shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b p-4">
              <div>
                <p className="text-muted-foreground text-sm">Google Places</p>
                <h2 className="text-xl font-semibold">Importar dados da atração</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="bg-background inline-flex h-9 w-9 items-center justify-center rounded-lg border"
                aria-label="Fechar importação"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="max-h-[calc(92svh-74px)] overflow-y-auto p-4">
              <div className="grid gap-4">
                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    className="bg-background rounded-lg border px-3 py-2 text-sm"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <button
                    type="button"
                    className="bg-primary text-primary-foreground inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                    onClick={searchCandidates}
                    disabled={isPending || query.trim().length < 2}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar Google
                  </button>
                </div>

                {message ? (
                  <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
                    {message}
                  </p>
                ) : null}

                {candidates.length > 0 ? (
                  <div className="grid gap-2">
                    {candidates.map((candidate) => (
                      <button
                        key={candidate.placeId}
                        type="button"
                        className="bg-background hover:bg-muted rounded-lg border p-3 text-left text-sm"
                        onClick={() => loadDetails(candidate.placeId)}
                      >
                        <strong>{candidate.name}</strong>
                        {candidate.address ? (
                          <span className="text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {candidate.address}
                          </span>
                        ) : null}
                        {candidate.rating ? (
                          <span className="mt-1 flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {candidate.rating.toFixed(1)} ({candidate.userRatingCount ?? 0})
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}

                {details ? (
                  <div className="bg-background grid gap-4 rounded-xl border p-4">
                    <div>
                      <h3 className="font-semibold">{details.name}</h3>
                      <p className="text-muted-foreground text-sm">{details.address}</p>
                    </div>
                    <fieldset className="grid gap-2">
                      <legend className="text-sm font-semibold">Campos</legend>
                      <div className="grid gap-2 md:grid-cols-3">
                        {availableFields.map((field) => (
                          <label
                            key={field.value}
                            className="bg-card flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(field.value)}
                              onChange={(event) =>
                                setSelectedFields((current) =>
                                  event.target.checked
                                    ? [...current, field.value]
                                    : current.filter((item) => item !== field.value),
                                )
                              }
                            />
                            {field.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    {details.photos.length > 0 ? (
                      <fieldset className="grid gap-2">
                        <legend className="text-sm font-semibold">Fotos</legend>
                        <div className="grid gap-2 md:grid-cols-3">
                          {details.photos.slice(0, visiblePhotoCount).map((photo, index) => (
                            <label
                              key={photo.name}
                              className="bg-card grid gap-2 rounded-lg border p-2 text-sm"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/google-place-photo?name=${encodeURIComponent(photo.name)}&w=520`}
                                alt=""
                                className="h-28 w-full rounded-md object-cover"
                              />
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedPhotos.includes(photo.name)}
                                  onChange={(event) =>
                                    setSelectedPhotos((current) =>
                                      event.target.checked
                                        ? [...current, photo.name]
                                        : current.filter((item) => item !== photo.name),
                                    )
                                  }
                                />
                                Foto {index + 1}
                              </span>
                            </label>
                          ))}
                        </div>
                        {visiblePhotoCount < details.photos.length ? (
                          <button
                            type="button"
                            className="bg-card hover:bg-muted w-fit rounded-lg border px-3 py-2 text-sm font-medium"
                            onClick={() => setVisiblePhotoCount((count) => Math.min(count + 6, details.photos.length))}
                          >
                            Carregar mais fotos
                          </button>
                        ) : null}
                      </fieldset>
                    ) : null}

                    {details.reviews.length > 0 ? (
                      <fieldset className="grid gap-2">
                        <legend className="text-sm font-semibold">Comentários</legend>
                        {details.reviews.slice(0, 5).map((review) => (
                          <label
                            key={review.id}
                            className="bg-card flex gap-2 rounded-lg border p-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedReviews.includes(review.id)}
                              onChange={(event) =>
                                setSelectedReviews((current) =>
                                  event.target.checked
                                    ? [...current, review.id].slice(0, 5)
                                    : current.filter((item) => item !== review.id),
                                )
                              }
                            />
                            <span>
                              <strong>{review.authorName ?? 'Usuário do Google'}</strong>
                              {review.text ? (
                                <span className="text-muted-foreground block">{review.text}</span>
                              ) : null}
                            </span>
                          </label>
                        ))}
                      </fieldset>
                    ) : null}

                    <button
                      type="button"
                      className="bg-primary text-primary-foreground inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                      onClick={applyImport}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Aplicar selecionados
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
