import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/home/AlertBanner';
import { ChurchScheduleCard } from '@/components/home/ChurchScheduleCard';
import { HomeRenderer } from '@/components/home/builder';
import { HomeStickyHeader } from '@/components/home/HomeStickyHeader';
import { VideoAdHero } from '@/components/home/VideoAdHero';
import { TabsScreen } from '@/components/ui/TabsScreen';
import {
  fetchHomeScreen,
  getHomeScreenPersisted,
  invalidateHomeScreenCache,
  type HomeScreenPayload,
} from '@/lib/home/fetch-home-screen';
import { palette } from '@/lib/theme/tokens';
import { useTabBarScrollPadding } from '@/lib/ui/tab-bar-inset';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen() {
  const tabBarPad = useTabBarScrollPadding();
  const [screen, setScreen] = useState<HomeScreenPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [videoVisible, setVideoVisible] = useState(true);
  const [tabFocused, setTabFocused] = useState(true);
  const [appActive, setAppActive] = useState(true);
  const scrollOffsetRef = useRef(0);

  const load = useCallback(async (force = false, showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    try {
      if (force) {
        invalidateHomeScreenCache();
      }
      const payload = await fetchHomeScreen();
      setScreen(payload);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persisted = await getHomeScreenPersisted();
      if (cancelled) return;
      if (persisted) {
        setScreen(persisted);
        // Revalida em background sem piscar o pull-to-refresh.
        void load(false, false);
      } else {
        void load();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      setTabFocused(true);
      return () => setTabFocused(false);
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  const cityName = screen?.city?.name ?? 'Carmo do Rio Claro';
  const greeting = `${getGreeting()} em ${cityName}`;
  const layout = screen?.layout;
  const hasBuilderLayout = Boolean(layout && layout.blocks.length > 0);

  const alertTitle = screen?.data.alertTitle;
  const alertArea = screen?.data.alertArea;

  return (
    <TabsScreen style={styles.root}>
      <HomeStickyHeader cityName={cityName} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPad }]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollOffsetRef.current = y;
          const visible = y < 420;
          setVideoVisible((prev) => (prev === visible ? prev : visible));
        }}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={palette.clay500} />
        }
      >
        {alertTitle ? <AlertBanner title={alertTitle} affectedArea={alertArea} /> : null}

        {hasBuilderLayout && screen?.city ? (
          <HomeRenderer
            layout={layout!}
            city={screen.city}
            data={screen.data}
            greeting={greeting}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Configure a home em /painel/cidade/home para ver o layout desta cidade.
            </Text>
          </View>
        )}

        {/* Mobile-only: fora do Home Builder — decidir depois */}
        <View style={styles.mobileOnlySection}>
          {screen?.mobileExtras.videoAds && screen.mobileExtras.videoAds.length > 0 ? (
            <View style={styles.block}>
              <VideoAdHero
                ads={screen.mobileExtras.videoAds}
                sectionVisible={videoVisible && tabFocused && appActive}
              />
            </View>
          ) : null}

          {screen?.mobileExtras.churchSchedule &&
          screen.mobileExtras.churchSchedule.length > 0 ? (
            <ChurchScheduleCard events={screen.mobileExtras.churchSchedule} />
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Portal Carmelitano</Text>
          <Text style={styles.footerText}>Portal hiperlocal de {cityName}</Text>
          <Text style={styles.footerLinks}>Sobre · Anuncie · Termos · Privacidade · LGPD</Text>
        </View>
      </ScrollView>
    </TabsScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  scroll: {},
  block: { marginTop: 12 },
  placeholder: {
    marginHorizontal: 12,
    marginTop: 24,
    padding: 16,
    backgroundColor: palette.paperDeep,
    borderRadius: 16,
  },
  placeholderText: { fontSize: 13, color: palette.ink600, lineHeight: 18 },
  mobileOnlySection: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.ink100,
  },
  footer: { padding: 28, alignItems: 'center', gap: 4, marginTop: 8 },
  footerBrand: { fontSize: 13, color: palette.ink900, fontWeight: '900' },
  footerText: { fontSize: 12, color: palette.ink600 },
  footerLinks: { fontSize: 11, color: palette.ink400, marginTop: 6 },
});
