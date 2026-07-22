import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessCard } from '@/components/home/BusinessCard';
import { BusinessDetailHeader } from '@/components/businesses/BusinessDetailHeader';
import { BusinessPhotoGallery } from '@/components/businesses/BusinessPhotoGallery';
import {
  getBusinessDetail,
  invalidateBusinessDetail,
  prefetchBusinessDetail,
} from '@/lib/api/business-detail';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { BusinessDetail } from '@/lib/businesses/types';
import {
  AMENITY_META,
  HOURS_DAYS,
  PAYMENT_LABEL,
  formatHoursRange,
  getBusinessDisplayPhotoUrls,
  isVideoUrl,
  normalizeInstagram,
  normalizeWebsite,
  visibleBusinessAmenities,
  whatsappDigits,
} from '@/lib/businesses/labels';
import { openDirections, openDirectionsWith, MAP_PROVIDERS } from '@/lib/maps/navigation';
import { supabase } from '@/lib/supabase';
import { useTabBarScrollPadding } from '@/lib/ui/tab-bar-inset';
import { palette, radius } from '@/lib/theme/tokens';

type Props = { slug: string };

type Anchor = 'sobre' | 'contato' | 'horarios' | 'fotos' | 'mapa' | 'avaliacoes';

function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function webviewPath(slug: string): string {
  return `/webview/comercio-negocio-${encodeURIComponent(slug)}`;
}

export function BusinessDetailScreen({ slug }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const bottomPad = useTabBarScrollPadding(24);
  const scrollRef = useRef<ScrollView>(null);
  const anchorsRef = useRef<Partial<Record<Anchor, number>>>({});

  const [detail, setDetail] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChip, setActiveChip] = useState<Anchor | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const load = useCallback(async () => {
    const data = await getBusinessDetail(slug);
    setDetail(data);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    getBusinessDetail(slug).then((data) => {
      if (!cancelled) {
        setDetail(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Dono/admin? Mostra atalho "Editar comércio" (RPC só responde true pra quem gerencia).
  useEffect(() => {
    let cancelled = false;
    const businessId = detail?.business.id;
    if (!session || !businessId) {
      setCanEdit(false);
      return;
    }
    supabase
      .rpc('manages_business', { p_business_id: businessId })
      .then(({ data }) => {
        if (!cancelled) setCanEdit(Boolean(data));
      });
    return () => {
      cancelled = true;
    };
  }, [session, detail?.business.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await invalidateBusinessDetail(slug);
    await load();
    setRefreshing(false);
  }, [slug, load]);

  const captureAnchor = useCallback(
    (anchor: Anchor) => (event: LayoutChangeEvent) => {
      anchorsRef.current[anchor] = event.nativeEvent.layout.y;
    },
    [],
  );

  const jumpTo = useCallback((anchor: Anchor) => {
    const y = anchorsRef.current[anchor];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y + 80;
    const entries = Object.entries(anchorsRef.current) as [Anchor, number][];
    let current: Anchor | null = null;
    for (const [anchor, top] of entries.sort((a, b) => a[1] - b[1])) {
      if (y >= top) current = anchor;
    }
    setActiveChip((prev) => (prev === current ? prev : current));
  }, []);

  const openWebview = useCallback(() => {
    router.push(webviewPath(slug) as never);
  }, [slug]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={palette.cerrado700} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="storefront-outline" size={40} color={palette.ink400} />
        <Text style={styles.emptyTitle}>Negócio não encontrado</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const { business, promotions, reviews, posts, related } = detail;
  const displayPhotos = getBusinessDisplayPhotoUrls(business);
  const cover = business.coverUrl ?? business.logoUrl ?? displayPhotos[0] ?? null;
  const categoryLabel = business.categoryNames[0] ?? null;
  const wpp = whatsappDigits(business.whatsapp);
  const phoneDigits = whatsappDigits(business.phone);
  const amenities = visibleBusinessAmenities(business);
  const website = normalizeWebsite(business.website);
  const instagram = normalizeInstagram(business.instagram);
  const gallery = displayPhotos;
  const videoCount = gallery.filter(isVideoUrl).length;
  const photoCount = gallery.length - videoCount;
  const galleryKicker =
    videoCount > 0
      ? `${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} · ${videoCount} ${videoCount === 1 ? 'vídeo' : 'vídeos'}`
      : `${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'}`;
  const hasHours = business.hours && Object.keys(business.hours).length > 0;

  const chips: { anchor: Anchor; label: string }[] = [
    ...(business.description ? [{ anchor: 'sobre' as const, label: 'Sobre' }] : []),
    { anchor: 'contato', label: 'Contato' },
    ...(hasHours ? [{ anchor: 'horarios' as const, label: 'Horários' }] : []),
    ...(gallery.length > 0 ? [{ anchor: 'fotos' as const, label: 'Galeria' }] : []),
    ...(business.lat && business.lng ? [{ anchor: 'mapa' as const, label: 'Mapa' }] : []),
    { anchor: 'avaliacoes', label: 'Avaliações' },
  ];

  return (
    <View style={styles.root}>
      <BusinessDetailHeader
        chips={chips.map((c) => ({ id: c.anchor, label: c.label }))}
        activeChipId={activeChip}
        onChipPress={(id) => jumpTo(id as Anchor)}
        onShare={() => void Share.share({ message: business.name })}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={64}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.cerrado700} />}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {cover ? (
            <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <LinearGradient colors={[palette.cerrado500, palette.cerrado700]} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBody}>
            <View style={styles.badgeRow}>
              {business.featured ? (
                <View style={[styles.badge, { backgroundColor: palette.clay500 }]}>
                  <Ionicons name="star" size={11} color={palette.white} />
                  <Text style={styles.badgeText}>Destaque</Text>
                </View>
              ) : null}
              {business.verified ? (
                <View style={[styles.badge, { backgroundColor: palette.sky500 }]}>
                  <Ionicons name="checkmark-circle" size={11} color={palette.white} />
                  <Text style={styles.badgeText}>Verificado</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroName} numberOfLines={3}>
              {business.name}
            </Text>
            <View style={styles.heroMetaRow}>
              {categoryLabel ? <Text style={styles.heroMeta}>{categoryLabel}</Text> : null}
              {business.district ? <Text style={styles.heroMeta}>· {business.district}</Text> : null}
              {typeof business.rating === 'number' ? (
                <View style={styles.heroRating}>
                  <Ionicons name="star" size={12} color={palette.sun500} />
                  <Text style={styles.heroRatingText}>{formatRating(business.rating)}</Text>
                  {business.reviewsCount ? (
                    <Text style={styles.heroRatingCount}>({business.reviewsCount})</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Resumo: descrição curta + stats (nota / avaliações / fotos) */}
        <View style={styles.summary}>
          {business.shortDescription ? (
            <Text style={styles.shortDesc}>{business.shortDescription}</Text>
          ) : null}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>
                {typeof business.rating === 'number' ? formatRating(business.rating) : 'Novo'}
              </Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < Math.round(business.rating ?? 0) ? 'star' : 'star-outline'}
                    size={11}
                    color={business.rating ? palette.sun500 : palette.ink400}
                  />
                ))}
              </View>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{business.reviewsCount ?? 0}</Text>
              <Text style={styles.statLabel}>avaliações</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{displayPhotos.length}</Text>
              <Text style={styles.statLabel}>fotos</Text>
            </View>
          </View>
        </View>

        {/* Botões de contato (CTAs grandes, como no web) */}
        <View style={styles.ctaGrid}>
          {wpp ? (
            <CtaButton
              icon="logo-whatsapp"
              label="WhatsApp"
              variant="solid"
              color={palette.cerrado500}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/55${wpp}?text=${encodeURIComponent('Olá! Vi seu contato no Portal Carmelitano e gostaria de mais informações.')}`,
                )
              }
            />
          ) : null}
          {phoneDigits ? (
            <CtaButton
              icon="call"
              label="Ligar"
              variant="solid"
              color={palette.clay500}
              onPress={() => Linking.openURL(`tel:${business.phone}`)}
            />
          ) : null}
          {business.lat && business.lng ? (
            <CtaButton
              icon="navigate"
              label="Como chegar"
              variant="outline"
              onPress={() => openDirections({ lat: business.lat!, lng: business.lng!, name: business.name })}
            />
          ) : null}
          <CtaButton
            icon="share-social"
            label="Compartilhar"
            variant="outline"
            onPress={() => void Share.share({ message: business.name })}
          />
        </View>

        {/* Cardápio CTA */}
        {business.orderingEnabled ? (
          <View style={styles.deliveryRow}>
            <Pressable
              style={styles.deliveryBtn}
              onPress={() => router.push(`/comercio/${business.slug}/cardapio` as never)}
            >
              <Ionicons name="restaurant" size={17} color={palette.white} />
              <Text style={styles.deliveryBtnText}>Ver cardápio e pedir</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Promoções */}
        {promotions.length > 0 ? (
          <Section title="Promoções ativas" kicker="Cupons e ofertas">
            <View style={{ gap: 8 }}>
              {promotions.map((promo) => (
                <View key={promo.id} style={styles.promoCard}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  {promo.description ? <Text style={styles.promoDesc}>{promo.description}</Text> : null}
                  <View style={styles.promoTags}>
                    {promo.discountPercent ? (
                      <Text style={styles.promoTag}>{promo.discountPercent}% OFF</Text>
                    ) : null}
                    {promo.couponCode ? (
                      <Text style={styles.promoTag}>Cupom: {promo.couponCode}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {/* Novidades */}
        {posts.length > 0 ? (
          <Section title="Novidades">
            <View style={{ gap: 10 }}>
              {posts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} style={styles.postImage} contentFit="cover" />
                  ) : null}
                  <View style={{ padding: 12, gap: 4 }}>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    {post.body ? (
                      <Text style={styles.postBody} numberOfLines={4}>
                        {post.body}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {/* Sobre */}
        {business.description ? (
          <View onLayout={captureAnchor('sobre')}>
            <Section title="Sobre o negócio">
              <Text style={styles.bodyText}>{business.description}</Text>
            </Section>
          </View>
        ) : null}

        {/* Contato e endereço */}
        <View onLayout={captureAnchor('contato')}>
          <Section title="Contato e endereço">
            <View style={{ gap: 10 }}>
              {business.address ? (
                <InfoRow
                  icon="location-outline"
                  label={[business.address, business.district].filter(Boolean).join(' · ')}
                  onPress={
                    business.googleMapsUrl ? () => Linking.openURL(business.googleMapsUrl!) : undefined
                  }
                />
              ) : null}
              {business.email ? (
                <InfoRow icon="mail-outline" label={business.email} onPress={() => Linking.openURL(`mailto:${business.email}`)} />
              ) : null}
              {website ? (
                <InfoRow icon="globe-outline" label={website.label} onPress={() => Linking.openURL(website.href)} />
              ) : null}
              {instagram ? (
                <InfoRow
                  icon="logo-instagram"
                  label={`instagram.com/${instagram}`}
                  onPress={() => Linking.openURL(`https://instagram.com/${instagram}`)}
                />
              ) : null}
            </View>
            <Pressable style={styles.reportLink} onPress={openWebview}>
              <Ionicons name="flag-outline" size={14} color={palette.ink600} />
              <Text style={styles.reportLinkText}>Reportar erro nas informações</Text>
            </Pressable>
          </Section>
        </View>

        {/* Horários */}
        {hasHours ? (
          <View onLayout={captureAnchor('horarios')}>
            <Section title="Horários" kicker="Funcionamento">
              <View>
                {HOURS_DAYS.map(({ key, label }) => (
                  <View key={key} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{label}</Text>
                    <Text style={styles.hoursValue}>{formatHoursRange(business.hours?.[key])}</Text>
                  </View>
                ))}
              </View>
            </Section>
          </View>
        ) : null}

        {/* Comodidades */}
        {amenities.length > 0 ? (
          <Section title="Comodidades">
            <View style={styles.pillWrap}>
              {amenities.map((a) => {
                const meta = AMENITY_META[a];
                return (
                  <View key={a} style={[styles.pill, { backgroundColor: palette.cerrado100 }]}>
                    <Ionicons name={meta.icon} size={13} color={palette.cerrado700} />
                    <Text style={[styles.pillText, { color: palette.cerrado700 }]}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>
          </Section>
        ) : null}

        {/* Formas de pagamento */}
        {business.paymentMethods && business.paymentMethods.length > 0 ? (
          <Section title="Formas de pagamento">
            <View style={styles.pillWrap}>
              {business.paymentMethods.map((m) => (
                <View key={m} style={[styles.pill, { backgroundColor: palette.paperDeep }]}>
                  <Ionicons name="card-outline" size={13} color={palette.ink900} />
                  <Text style={[styles.pillText, { color: palette.ink900 }]}>{PAYMENT_LABEL[m]}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {/* Mapa */}
        {business.lat && business.lng ? (
          <View onLayout={captureAnchor('mapa')}>
            <Section title="Mapa">
              <Pressable
                style={styles.mapWrap}
                onPress={() => openDirections({ lat: business.lat!, lng: business.lng!, name: business.name })}
              >
                <MapView
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                  initialRegion={{
                    latitude: business.lat,
                    longitude: business.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker coordinate={{ latitude: business.lat, longitude: business.lng }} />
                </MapView>
                <View style={styles.mapHint}>
                  <Ionicons name="navigate" size={14} color={palette.white} />
                  <Text style={styles.mapHintText}>Abrir rotas</Text>
                </View>
              </Pressable>
              <View style={styles.mapProviders}>
                {MAP_PROVIDERS.map((provider) => (
                  <Pressable
                    key={provider.id}
                    style={styles.mapProviderBtn}
                    onPress={() =>
                      void openDirectionsWith(provider.id, {
                        lat: business.lat!,
                        lng: business.lng!,
                        name: business.name,
                      })
                    }
                  >
                    <Ionicons name="navigate-outline" size={15} color={palette.sky700} />
                    <Text style={styles.mapProviderText}>{provider.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Section>
          </View>
        ) : null}

        {/* Avaliações */}
        <View onLayout={captureAnchor('avaliacoes')}>
          <Section title="Avaliações" kicker={`${reviews.length} publicadas`}>
            <View style={{ gap: 8 }}>
              {reviews.length === 0 ? (
                <Text style={styles.bodyText}>Ainda não há avaliações publicadas.</Text>
              ) : (
                reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHead}>
                      <View style={{ flexDirection: 'row' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < review.rating ? 'star' : 'star-outline'}
                            size={13}
                            color={palette.sun500}
                          />
                        ))}
                      </View>
                      <Text style={styles.reviewAuthor}>por {review.authorName ?? 'cidadão'}</Text>
                    </View>
                    {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
                    {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                    {review.replyOwner ? (
                      <View style={styles.reviewReply}>
                        <Text style={styles.reviewReplyText}>Resposta do negócio: {review.replyOwner}</Text>
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </View>
            <Pressable style={styles.secondaryBtn} onPress={openWebview}>
              <Ionicons name="create-outline" size={16} color={palette.cerrado700} />
              <Text style={styles.secondaryBtnText}>Avaliar este negócio</Text>
            </Pressable>
          </Section>
        </View>

        {/* Galeria (fotos + vídeos, visor estilo stories) */}
        {gallery.length > 0 ? (
          <View onLayout={captureAnchor('fotos')}>
            <Section title="Galeria" kicker={galleryKicker}>
              <BusinessPhotoGallery photos={gallery} name={business.name} />
            </Section>
          </View>
        ) : null}

        {/* Reivindicação */}
        {!business.claimed ? (
          <View style={styles.claimCard}>
            <Text style={styles.claimTitle}>É o dono(a) deste negócio?</Text>
            <Text style={styles.claimBody}>
              Reivindique a página de {business.name} e mantenha seus dados sempre atualizados. É grátis.
            </Text>
            <Pressable style={styles.claimBtn} onPress={openWebview}>
              <Text style={styles.claimBtnText}>Reivindicar agora</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Relacionados */}
        {related.length > 0 ? (
          <Section title={`Outros em ${categoryLabel ?? 'comércio'}`}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedRow}>
              {related.map((item) => (
                <BusinessCard
                  key={item.id}
                  slug={item.slug}
                  name={item.name}
                  category={item.categoryLabel}
                  district={item.district}
                  rating={item.rating}
                  reviewsCount={item.reviewsCount}
                  coverUrl={item.coverUrl}
                  onPress={() => router.push(`/comercio/${item.slug}` as never)}
                  onPressIn={() => prefetchBusinessDetail(item.slug)}
                />
              ))}
            </ScrollView>
          </Section>
        ) : null}
      </ScrollView>

      {/* Atalho do dono — abre o admin do comércio no WebView (mesma rota dos demais) */}
      {canEdit ? (
        <Pressable
          style={({ pressed }) => [
            styles.editFab,
            { bottom: insets.bottom + 84 },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => router.push(`/webview/painel-comercio-${business.id}` as never)}
          accessibilityLabel="Editar comércio"
        >
          <View style={styles.editFabIcon}>
            <Ionicons name="pencil" size={15} color={palette.clay600} />
          </View>
          <Text style={styles.editFabText}>Editar comércio</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CtaButton({
  icon,
  label,
  variant,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  variant: 'solid' | 'outline';
  color?: string;
  onPress: () => void;
}) {
  const solid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        solid ? { backgroundColor: color } : styles.ctaOutline,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Ionicons name={icon} size={18} color={solid ? palette.white : palette.ink900} />
      <Text style={[styles.ctaLabel, solid ? { color: palette.white } : { color: palette.ink900 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Section({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionDivider} />
      {kicker ? <Text style={styles.sectionKicker}>{kicker}</Text> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={17} color={palette.ink600} style={{ marginTop: 1 }} />
      <Text style={[styles.infoLabel, onPress ? { color: palette.sky700 } : null]}>{label}</Text>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: palette.paper },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: palette.ink900 },
  primaryBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.pill, backgroundColor: palette.cerrado700 },
  primaryBtnText: { color: palette.white, fontWeight: '800' },

  hero: { height: 240, backgroundColor: palette.paperDeep, justifyContent: 'flex-end' },
  heroBody: { padding: 16, gap: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: palette.white, fontSize: 11, fontWeight: '800' },
  heroName: { color: palette.white, fontSize: 26, fontWeight: '900', letterSpacing: -0.5, lineHeight: 30 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  heroMeta: { color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '700' },
  heroRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 },
  heroRatingText: { color: palette.white, fontSize: 13, fontWeight: '900' },
  heroRatingCount: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  editFab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.clay500,
    shadowColor: palette.clay600,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 9,
  },
  editFabIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editFabText: { color: palette.white, fontSize: 13, fontWeight: '900' },

  mapProviders: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  mapProviderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.ink100,
  },
  mapProviderText: { fontSize: 13, fontWeight: '700', color: palette.sky700 },

  summary: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  shortDesc: { fontSize: 14, lineHeight: 21, color: palette.ink700 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.ink100,
    backgroundColor: palette.white,
  },
  statValue: { fontSize: 16, fontWeight: '900', color: palette.ink900 },
  statLabel: { fontSize: 11, fontWeight: '600', color: palette.ink600 },
  starsRow: { flexDirection: 'row', gap: 1 },

  ctaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  cta: {
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  ctaOutline: { backgroundColor: palette.white, borderWidth: 1, borderColor: palette.ink100 },
  ctaLabel: { fontSize: 14, fontWeight: '800' },

  deliveryRow: { paddingHorizontal: 16, paddingBottom: 8 },
  deliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: palette.clay500,
  },
  deliveryBtnText: { color: palette.white, fontSize: 14, fontWeight: '900' },

  section: { paddingHorizontal: 16, paddingTop: 14 },
  sectionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.ink100, marginBottom: 14 },
  sectionKicker: { fontSize: 11, fontWeight: '800', color: palette.clay500, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: palette.ink900 },

  bodyText: { fontSize: 14, lineHeight: 21, color: palette.ink700 },

  promoCard: { borderWidth: 1, borderColor: palette.clay100, backgroundColor: palette.clay50, borderRadius: radius.md, padding: 12 },
  promoTitle: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  promoDesc: { fontSize: 12, lineHeight: 17, color: palette.ink700, marginTop: 2 },
  promoTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  promoTag: { fontSize: 11, fontWeight: '800', color: palette.clay600 },

  postCard: { borderRadius: radius.md, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.ink100, overflow: 'hidden' },
  postImage: { width: '100%', height: 160 },
  postTitle: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  postBody: { fontSize: 13, lineHeight: 19, color: palette.ink700 },

  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoLabel: { flex: 1, fontSize: 13, lineHeight: 19, color: palette.ink900 },
  reportLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  reportLinkText: { fontSize: 12, fontWeight: '700', color: palette.ink600 },

  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.ink100,
  },
  hoursDay: { fontSize: 13, color: palette.ink700 },
  hoursValue: { fontSize: 13, fontWeight: '600', color: palette.ink900 },

  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  pillText: { fontSize: 12, fontWeight: '700' },

  mapWrap: { height: 160, borderRadius: radius.md, overflow: 'hidden', backgroundColor: palette.sky100 },
  mapHint: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  mapHintText: { color: palette.white, fontSize: 12, fontWeight: '800' },

  reviewCard: { borderWidth: 1, borderColor: palette.ink100, borderRadius: radius.md, backgroundColor: palette.white, padding: 12 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewAuthor: { fontSize: 12, color: palette.ink600 },
  reviewTitle: { fontSize: 14, fontWeight: '800', color: palette.ink900, marginTop: 4 },
  reviewComment: { fontSize: 13, lineHeight: 19, color: palette.ink700, marginTop: 2 },
  reviewReply: { backgroundColor: palette.paperDeep, borderRadius: radius.sm, padding: 8, marginTop: 8 },
  reviewReplyText: { fontSize: 12, color: palette.ink700 },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: radius.pill,
    backgroundColor: palette.cerrado100,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '800', color: palette.cerrado700 },

  claimCard: {
    margin: 16,
    marginBottom: 4,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: palette.sky100,
    borderWidth: 1,
    borderColor: 'rgba(46,120,194,0.3)',
  },
  claimTitle: { fontSize: 14, fontWeight: '800', color: palette.sky700 },
  claimBody: { fontSize: 12, lineHeight: 18, color: palette.ink700, marginTop: 4 },
  claimBtn: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: palette.sky500 },
  claimBtnText: { color: palette.white, fontSize: 12, fontWeight: '800' },

  relatedRow: { gap: 12, paddingVertical: 2, paddingRight: 8 },
});
