import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatMock } from '@/components/onboarding/mocks/ChatMock';
import { ExploreMock } from '@/components/onboarding/mocks/ExploreMock';
import { HomeMock } from '@/components/onboarding/mocks/HomeMock';
import { WelcomeMock } from '@/components/onboarding/mocks/WelcomeMock';
import { PhoneFrame } from '@/components/onboarding/PhoneFrame';
import { Logo } from '@/components/ui/Logo';
import { markOnboardingSeen } from '@/lib/onboarding/state';
import { palette, radius, spacing } from '@/lib/theme/tokens';

type Slide = {
  key: string;
  tint: string;
  bgFrom: string;
  bgTo: string;
  eyebrow: string;
  title: string;
  body: string;
  mock: ReactNode;
};

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    tint: palette.cerrado700,
    bgFrom: palette.cerrado100,
    bgTo: palette.paper,
    eyebrow: 'Carmo do Rio Claro · MG',
    title: 'A cidade,\nno seu bolso',
    body: 'Eventos, comércios, turismo e serviços públicos — tudo num só app, feito pra Carmo.',
    mock: <WelcomeMock />,
  },
  {
    key: 'ai',
    tint: palette.sky700,
    bgFrom: palette.sky100,
    bgTo: palette.paper,
    eyebrow: 'Assistente IA',
    title: 'Pergunte sobre\nCarmo, na hora',
    body: 'Treinada na cidade: horários, missas, pousadas, comércios, plantões e mais.',
    mock: <ChatMock />,
  },
  {
    key: 'explore',
    tint: palette.clay600,
    bgFrom: palette.clay50,
    bgTo: palette.paper,
    eyebrow: 'Explorar',
    title: 'O que tem\nperto de você',
    body: 'Comércios, atrações e pousadas no mapa, com fotos, avaliações e contato direto.',
    mock: <ExploreMock />,
  },
  {
    key: 'home',
    tint: palette.sky700,
    bgFrom: palette.sky100,
    bgTo: palette.paper,
    eyebrow: 'Tudo num só lugar',
    title: 'A cidade aberta\ntoda manhã',
    body: 'Tela inicial com eventos, ofertas, comunicados e destaques de Carmo, atualizados todo dia.',
    mock: <HomeMock />,
  },
];

const { width: WINDOW_W } = Dimensions.get('window');

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / WINDOW_W);
    setIndex(next);
  }, []);

  const finish = useCallback(async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/entrar');
  }, []);

  const goNext = useCallback(() => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [index, finish]);

  const isLast = index === SLIDES.length - 1;
  const activeSlide = SLIDES[index] ?? SLIDES[0]!;

  const renderItem = useCallback(({ item }: { item: Slide }) => {
    return (
      <View style={[styles.slide, { width: WINDOW_W }]}>
        <View style={styles.previewWrap}>
          <View style={styles.glow}>
            <LinearGradient
              colors={[`${item.tint}40`, `${item.tint}00`]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
          <PhoneFrame fadeColor={item.bgTo} width={260} height={340}>
            {item.mock}
          </PhoneFrame>
        </View>

        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: item.tint }]}>{item.eyebrow}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.text}>{item.body}</Text>
        </View>
      </View>
    );
  }, []);

  const dots = useMemo(
    () =>
      SLIDES.map((s, i) => (
        <View key={s.key} style={[styles.dot, i === index ? styles.dotActive : null]} />
      )),
    [index],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[activeSlide.bgFrom, activeSlide.bgTo]}
        style={styles.pageGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]} edges={['bottom']}>
      <View style={styles.topBar}>
        <Logo size={26} />
        <Pressable onPress={finish} hitSlop={12} accessibilityRole="button">
          <Text style={styles.skip}>Pular</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>{dots}</View>

        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.ctaText}>{isLast ? 'Começar' : 'Próximo'}</Text>
          <Ionicons
            name={isLast ? 'checkmark' : 'arrow-forward'}
            size={20}
            color={palette.white}
          />
        </Pressable>
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  safe: { flex: 1 },
  pageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 470,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  skip: { color: palette.ink600, fontWeight: '800', fontSize: 14 },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  previewWrap: {
    width: '100%',
    height: 380,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: palette.ink900,
    letterSpacing: -0.6,
    lineHeight: 36,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: palette.ink600,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 340,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.ink100,
  },
  dotActive: {
    width: 24,
    backgroundColor: palette.clay500,
  },
  cta: {
    backgroundColor: palette.clay500,
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
