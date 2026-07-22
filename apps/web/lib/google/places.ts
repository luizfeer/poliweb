const PLACES_BASE_URL = 'https://places.googleapis.com/v1';

type GoogleText = {
  text?: string;
  languageCode?: string;
};

type GooglePlacePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: Array<{
    displayName?: string;
    uri?: string;
  }>;
};

type GooglePlaceReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: GoogleText;
  originalText?: GoogleText;
  publishTime?: string;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
};

type GoogleOpeningPoint = {
  day?: number;
  hour?: number;
  minute?: number;
};

type GoogleOpeningPeriod = {
  open?: GoogleOpeningPoint;
  close?: GoogleOpeningPoint;
};

type GoogleOpeningHours = {
  openNow?: boolean;
  periods?: GoogleOpeningPeriod[];
  weekdayDescriptions?: string[];
};

type GooglePriceRange = {
  startPrice?: GoogleMoney;
  endPrice?: GoogleMoney;
};

type GoogleMoney = {
  currencyCode?: string;
  units?: string;
  nanos?: number;
};

type GooglePlace = {
  id?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  displayName?: GoogleText;
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  priceRange?: GooglePriceRange;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  regularOpeningHours?: GoogleOpeningHours;
  currentOpeningHours?: GoogleOpeningHours;
  regularSecondaryOpeningHours?: GoogleOpeningHours[];
  currentSecondaryOpeningHours?: GoogleOpeningHours[];
  editorialSummary?: GoogleText;
  reviewSummary?: GoogleText;
  generativeSummary?: {
    overview?: GoogleText;
    description?: GoogleText;
  };
  paymentOptions?: Record<string, boolean | undefined>;
  parkingOptions?: Record<string, boolean | undefined>;
  takeout?: boolean;
  delivery?: boolean;
  dineIn?: boolean;
  curbsidePickup?: boolean;
  reservable?: boolean;
  outdoorSeating?: boolean;
  restroom?: boolean;
  allowsDogs?: boolean;
  goodForChildren?: boolean;
  goodForGroups?: boolean;
  goodForWatchingSports?: boolean;
  liveMusic?: boolean;
  servesBeer?: boolean;
  servesBreakfast?: boolean;
  servesBrunch?: boolean;
  servesCocktails?: boolean;
  servesCoffee?: boolean;
  servesDessert?: boolean;
  servesDinner?: boolean;
  servesLunch?: boolean;
  servesVegetarianFood?: boolean;
  servesWine?: boolean;
  photos?: GooglePlacePhoto[];
  reviews?: GooglePlaceReview[];
};

function toTextString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  if ('text' in value) return toTextString((value as { text?: unknown }).text);
  return '';
}

export type GooglePlaceCandidate = {
  placeId: string;
  name: string;
  address: string | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUrl: string | null;
};

export type GooglePlacePhotoCandidate = {
  name: string;
  width: number | null;
  height: number | null;
  attribution: string | null;
};

export type GooglePlaceReviewCandidate = {
  id: string;
  authorName: string | null;
  authorUrl: string | null;
  rating: number | null;
  text: string | null;
  relativeTime: string | null;
  publishedAt: string | null;
};

export type GoogleBusinessHours = Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', Array<{ open: string; close: string }>>>;

export type GooglePlaceAttribute = {
  key: string;
  label: string;
  value: boolean;
};

export type GooglePlaceSummary = {
  kind: 'editorial' | 'review' | 'generative';
  label: string;
  text: string;
};

export type GooglePlaceDetails = GooglePlaceCandidate & {
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  businessStatus: string | null;
  priceLevel: string | null;
  priceRange: string | null;
  streetViewUrl: string | null;
  openNow: boolean | null;
  hours: string[];
  hoursStructured: GoogleBusinessHours;
  currentHours: string[];
  secondaryHours: string[];
  summaries: GooglePlaceSummary[];
  amenities: string[];
  paymentMethods: string[];
  attributes: GooglePlaceAttribute[];
  photos: GooglePlacePhotoCandidate[];
  reviews: GooglePlaceReviewCandidate[];
};

function getPlacesApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('Configure GOOGLE_PLACES_API_KEY no ambiente do servidor.');
  }
  return key;
}

export async function searchGooglePlaces(query: string): Promise<GooglePlaceCandidate[]> {
  const response = await fetch(`${PLACES_BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getPlacesApiKey(),
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
        'places.googleMapsUri',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'pt-BR',
      regionCode: 'BR',
      maxResultCount: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(await formatGooglePlacesError(response));
  }

  const payload = await response.json() as { places?: GooglePlace[] };
  return (payload.places ?? []).map(toCandidate).filter((place): place is GooglePlaceCandidate => Boolean(place));
}

export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
  const response = await fetch(`${PLACES_BASE_URL}/places/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': getPlacesApiKey(),
      'X-Goog-FieldMask': [
        'id',
        'displayName',
        'formattedAddress',
        'nationalPhoneNumber',
        'internationalPhoneNumber',
        'websiteUri',
        'businessStatus',
        'rating',
        'userRatingCount',
        'priceLevel',
        'priceRange',
        'location',
        'currentOpeningHours.openNow',
        'currentOpeningHours.periods',
        'currentOpeningHours.weekdayDescriptions',
        'regularOpeningHours.periods',
        'regularOpeningHours.weekdayDescriptions',
        'regularSecondaryOpeningHours.weekdayDescriptions',
        'currentSecondaryOpeningHours.weekdayDescriptions',
        'googleMapsUri',
        'editorialSummary',
        'reviewSummary',
        'generativeSummary',
        'paymentOptions',
        'parkingOptions',
        'takeout',
        'delivery',
        'dineIn',
        'curbsidePickup',
        'reservable',
        'outdoorSeating',
        'restroom',
        'allowsDogs',
        'goodForChildren',
        'goodForGroups',
        'goodForWatchingSports',
        'liveMusic',
        'servesBeer',
        'servesBreakfast',
        'servesBrunch',
        'servesCocktails',
        'servesCoffee',
        'servesDessert',
        'servesDinner',
        'servesLunch',
        'servesVegetarianFood',
        'servesWine',
        'photos.name',
        'photos.widthPx',
        'photos.heightPx',
        'photos.authorAttributions',
        'reviews.name',
        'reviews.rating',
        'reviews.text',
        'reviews.originalText',
        'reviews.relativePublishTimeDescription',
        'reviews.publishTime',
        'reviews.authorAttribution',
      ].join(','),
    },
  });

  if (!response.ok) {
    throw new Error(await formatGooglePlacesError(response));
  }

  const place = await response.json() as GooglePlace;
  const candidate = toCandidate(place);
  if (!candidate) {
    throw new Error('Lugar do Google nao encontrado.');
  }

  const reviews = toReviews(place);
  const fallbackReviews = reviews.length > 0 ? [] : await getLegacyGooglePlaceReviews(placeId);
  const lat = place.location?.latitude ?? null;
  const lng = place.location?.longitude ?? null;

  return {
    ...candidate,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    lat,
    lng,
    businessStatus: place.businessStatus ?? null,
    priceLevel: place.priceLevel ?? null,
    priceRange: formatPriceRange(place.priceRange),
    streetViewUrl: lat !== null && lng !== null ? buildStreetViewUrl(lat, lng) : null,
    openNow: place.currentOpeningHours?.openNow ?? null,
    hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
    hoursStructured: toBusinessHours(place.regularOpeningHours?.periods ?? place.currentOpeningHours?.periods ?? []),
    currentHours: place.currentOpeningHours?.weekdayDescriptions ?? [],
    secondaryHours: [
      ...(place.regularSecondaryOpeningHours ?? []).flatMap((hours) => hours.weekdayDescriptions ?? []),
      ...(place.currentSecondaryOpeningHours ?? []).flatMap((hours) => hours.weekdayDescriptions ?? []),
    ],
    summaries: toSummaries(place),
    amenities: toAmenities(place),
    paymentMethods: toPaymentMethods(place.paymentOptions),
    attributes: toAttributes(place),
    photos: (place.photos ?? [])
      .filter((photo): photo is GooglePlacePhoto & { name: string } => typeof photo.name === 'string')
      .map((photo) => ({
        name: photo.name,
        width: photo.widthPx ?? null,
        height: photo.heightPx ?? null,
        attribution: photo.authorAttributions?.map((item) => item.displayName).filter(Boolean).join(', ') || null,
      })),
    reviews: reviews.length > 0 ? reviews : fallbackReviews,
  };
}

export async function getGooglePlacePhotoFile(photoName: string, filename: string): Promise<File> {
  const url = new URL(`${PLACES_BASE_URL}/${photoName}/media`);
  url.searchParams.set('maxWidthPx', '1600');
  url.searchParams.set('key', getPlacesApiKey());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await formatGooglePlacesError(response));
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const blob = await response.blob();
  return new File([blob], filename, { type: contentType });
}

/** IDs da API nova vêm como `places/ChIJ…`; a Place Details legada espera só `ChIJ…`. */
function toLegacyGooglePlaceId(placeId: string): string {
  return placeId.startsWith('places/') ? placeId.slice('places/'.length) : placeId;
}

async function getLegacyGooglePlaceReviews(placeId: string): Promise<GooglePlaceReviewCandidate[]> {
  const legacyId = toLegacyGooglePlaceId(placeId);
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', legacyId);
  url.searchParams.set('fields', 'reviews');
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('key', getPlacesApiKey());

  const response = await fetch(url);
  if (!response.ok) return [];
  const payload = await response.json() as {
    status?: string;
    result?: {
      reviews?: Array<{
        author_name?: string;
        author_url?: string;
        rating?: number;
        relative_time_description?: string;
        text?: string;
        time?: number;
      }>;
    };
  };
  if (payload.status && payload.status !== 'OK') return [];

  return (payload.result?.reviews ?? []).slice(0, 5).map((review, index) => ({
    id: review.author_url ?? `${legacyId}-legacy-review-${index}`,
    authorName: review.author_name ?? null,
    authorUrl: review.author_url ?? null,
    rating: review.rating ?? null,
    text: review.text ?? null,
    relativeTime: review.relative_time_description ?? null,
    publishedAt: review.time ? new Date(review.time * 1000).toISOString() : null,
  }));
}

async function formatGooglePlacesError(response: Response): Promise<string> {
  const fallback = `Google Places retornou ${response.status}.`;

  try {
    const payload = await response.json() as {
      error?: {
        message?: string;
        status?: string;
        details?: Array<{ reason?: string; metadata?: Record<string, string> }>;
      };
    };
    const message = payload.error?.message;
    const status = payload.error?.status;
    const reason = payload.error?.details?.find((detail) => detail.reason)?.reason;
    return [fallback, status, reason, message].filter(Boolean).join(' ');
  } catch {
    return fallback;
  }
}

function toCandidate(place: GooglePlace): GooglePlaceCandidate | null {
  if (!place.id || !place.displayName?.text) return null;

  return {
    placeId: place.id,
    name: place.displayName.text,
    address: place.formattedAddress ?? null,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    googleMapsUrl: place.googleMapsUri ?? null,
  };
}

function toReviews(place: GooglePlace): GooglePlaceReviewCandidate[] {
  return (place.reviews ?? []).slice(0, 5).map((review, index) => ({
    id: review.name ?? `${place.id}-review-${index}`,
    authorName: review.authorAttribution?.displayName ?? null,
    authorUrl: review.authorAttribution?.uri ?? null,
    rating: review.rating ?? null,
    text: (() => {
      const primary = toTextString(review.text);
      const fallback = toTextString(review.originalText);
      const output = (primary || fallback).trim();
      return output.length > 0 ? output : null;
    })(),
    relativeTime: review.relativePublishTimeDescription ?? null,
    publishedAt: review.publishTime ?? null,
  }));
}

function toBusinessHours(periods: GoogleOpeningPeriod[]): GoogleBusinessHours {
  const output: GoogleBusinessHours = {};
  for (const period of periods) {
    const day = dayKey(period.open?.day);
    const open = timeString(period.open);
    const close = timeString(period.close);
    if (!day || !open || !close) continue;
    output[day] = [...(output[day] ?? []), { open, close }];
  }
  return output;
}

function dayKey(day: number | undefined): keyof GoogleBusinessHours | null {
  const keys: Array<keyof GoogleBusinessHours> = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return typeof day === 'number' ? keys[day] ?? null : null;
}

function timeString(point: GoogleOpeningPoint | undefined): string | null {
  if (typeof point?.hour !== 'number') return null;
  const hour = String(point.hour).padStart(2, '0');
  const minute = String(point.minute ?? 0).padStart(2, '0');
  return `${hour}:${minute}`;
}

function toSummaries(place: GooglePlace): GooglePlaceSummary[] {
  return [
    { kind: 'editorial' as const, label: 'Resumo editorial', text: toTextString(place.editorialSummary) },
    { kind: 'review' as const, label: 'Resumo das avaliacoes', text: toTextString(place.reviewSummary) },
    {
      kind: 'generative' as const,
      label: 'Resumo gerado pelo Google',
      text: toTextString(place.generativeSummary?.overview) || toTextString(place.generativeSummary?.description),
    },
  ]
    .map((item) => ({ ...item, text: item.text.trim() }))
    .filter((item) => item.text.length > 0);
}

function toAttributes(place: GooglePlace): GooglePlaceAttribute[] {
  const attrs: Array<[keyof GooglePlace, string]> = [
    ['takeout', 'Retirada no local'],
    ['delivery', 'Entrega'],
    ['dineIn', 'Consumo no local'],
    ['curbsidePickup', 'Retirada na porta'],
    ['reservable', 'Aceita reservas'],
    ['outdoorSeating', 'Area externa'],
    ['restroom', 'Banheiro'],
    ['allowsDogs', 'Aceita caes'],
    ['goodForChildren', 'Bom para criancas'],
    ['goodForGroups', 'Bom para grupos'],
    ['goodForWatchingSports', 'Bom para assistir esportes'],
    ['liveMusic', 'Musica ao vivo'],
    ['servesBeer', 'Serve cerveja'],
    ['servesBreakfast', 'Serve cafe da manha'],
    ['servesBrunch', 'Serve brunch'],
    ['servesCocktails', 'Serve drinks'],
    ['servesCoffee', 'Serve cafe'],
    ['servesDessert', 'Serve sobremesa'],
    ['servesDinner', 'Serve jantar'],
    ['servesLunch', 'Serve almoco'],
    ['servesVegetarianFood', 'Opcoes vegetarianas'],
    ['servesWine', 'Serve vinho'],
  ];

  return attrs
    .filter(([key]) => typeof place[key] === 'boolean')
    .map(([key, label]) => ({ key: String(key), label, value: Boolean(place[key]) }));
}

function toAmenities(place: GooglePlace): string[] {
  const values = new Set<string>();
  if (place.delivery) values.add('delivery');
  if (place.takeout || place.curbsidePickup) values.add('retirada');
  if (place.dineIn) values.add('consumo_local');
  if (place.outdoorSeating) values.add('area_externa');
  if (place.restroom) values.add('banheiro');
  if (place.allowsDogs) values.add('pet_friendly');
  if (place.goodForChildren) values.add('criancas');
  if (place.goodForGroups) values.add('grupos');
  if (place.reservable) values.add('reservas');
  if (place.liveMusic) values.add('musica_ao_vivo');
  if (place.parkingOptions && Object.values(place.parkingOptions).some(Boolean)) values.add('estacionamento');
  return Array.from(values);
}

function toPaymentMethods(paymentOptions: Record<string, boolean | undefined> | undefined): string[] {
  if (!paymentOptions) return [];
  const values = new Set<string>();
  if (paymentOptions.acceptsCreditCards) values.add('credito');
  if (paymentOptions.acceptsDebitCards) values.add('debito');
  if (paymentOptions.acceptsCashOnly) values.add('dinheiro');
  if (paymentOptions.acceptsNfc) values.add('aproximacao');
  return Array.from(values);
}

function formatPriceRange(priceRange: GooglePriceRange | undefined): string | null {
  const start = formatMoney(priceRange?.startPrice);
  const end = formatMoney(priceRange?.endPrice);
  if (start && end) return `${start} a ${end}`;
  return start ?? end;
}

function formatMoney(value: GoogleMoney | undefined): string | null {
  if (!value?.currencyCode || !value.units) return null;
  const amount = Number(value.units) + (value.nanos ?? 0) / 1_000_000_000;
  if (!Number.isFinite(amount)) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: value.currencyCode }).format(amount);
}

function buildStreetViewUrl(lat: number, lng: number): string {
  const url = new URL('https://www.google.com/maps/@');
  url.searchParams.set('api', '1');
  url.searchParams.set('map_action', 'pano');
  url.searchParams.set('viewpoint', `${lat},${lng}`);
  return url.toString();
}
