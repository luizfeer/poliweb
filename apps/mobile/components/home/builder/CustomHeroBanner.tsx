import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Dimensions,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { CustomHeroBannerConfig, HomeBanner } from '@/lib/home/types';
import { portalHrefToMobile } from '@/lib/home/portal-href';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;

const HEIGHT_PX: Record<NonNullable<CustomHeroBannerConfig['height']>, number> = {
  compact: 280,
  standard: 380,
  tall: 500,
};

const TITLE_SIZE: Record<NonNullable<CustomHeroBannerConfig['headlineSize']>, number> = {
  sm: 30,
  md: 38,
  lg: 48,
};

const ALIGN: Record<NonNullable<CustomHeroBannerConfig['layout']>, StyleProp<ViewStyle>> = {
  text_left: { alignItems: 'flex-start' },
  text_center: { alignItems: 'center' },
  text_right: { alignItems: 'flex-end' },
  split_left: { alignItems: 'flex-start' },
  split_right: { alignItems: 'flex-start' },
};

const TEXT_ALIGN: Record<NonNullable<CustomHeroBannerConfig['layout']>, TextStyle['textAlign']> = {
  text_left: 'left',
  text_center: 'center',
  text_right: 'right',
  split_left: 'left',
  split_right: 'left',
};

const FONT_WEIGHT_HEAD: Record<NonNullable<CustomHeroBannerConfig['font']>, TextStyle['fontWeight']> = {
  display: '900',
  sans: '800',
  serif: '800',
  mono: '700',
};

const FONT_STYLE_HEAD: Record<NonNullable<CustomHeroBannerConfig['font']>, TextStyle['fontStyle']> = {
  display: 'normal',
  sans: 'normal',
  serif: 'italic',
  mono: 'normal',
};

function clampPercent(v: number | undefined, fallback: number): number {
  const n = Number.isFinite(v) ? (v as number) : fallback;
  return Math.min(100, Math.max(0, n));
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

function overlayColors(
  direction: NonNullable<CustomHeroBannerConfig['overlayDirection']>,
  color: string,
  opacity: number,
): { colors: [string, string, string]; start: { x: number; y: number }; end: { x: number; y: number } } | null {
  if (direction === 'none') return null;
  const { r, g, b } = hexToRgb(color);
  const strong = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  const soft = `rgba(${r}, ${g}, ${b}, ${Math.max(0, opacity - 0.32)})`;
  const clear = `rgba(${r}, ${g}, ${b}, 0)`;
  const axis = {
    left: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
    right: { start: { x: 1, y: 0.5 }, end: { x: 0, y: 0.5 } },
    bottom: { start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } },
  }[direction];
  return { colors: [strong, soft, clear], start: axis.start, end: axis.end };
}

function openBanner(banner: HomeBanner) {
  if (banner.linkType === 'none' || !banner.linkUrl) return;
  if (banner.linkType === 'external') {
    Linking.openURL(banner.linkUrl).catch(() => undefined);
    return;
  }
  router.push(portalHrefToMobile(banner.linkUrl) as never);
}

function openSecondary(href?: string) {
  if (!href) return;
  if (/^https?:/.test(href)) {
    Linking.openURL(href).catch(() => undefined);
    return;
  }
  router.push(portalHrefToMobile(href) as never);
}

type Props = {
  banner: HomeBanner;
  config: CustomHeroBannerConfig;
};

export function CustomHeroBanner({ banner, config }: Props) {
  const layout = config.layout ?? 'text_left';
  const height = HEIGHT_PX[config.height ?? 'standard'];
  const font = config.font ?? 'display';
  const headlineSize = TITLE_SIZE[config.headlineSize ?? 'lg'];
  const accentColor = config.accentColor ?? '#f4a23a';
  const textColor = config.textColor ?? '#ffffff';
  const backgroundColor = config.backgroundColor ?? '#7a2d14';
  const overlayOpacity = clampPercent(config.overlayOpacity, 64) / 100;
  const imagePlacement = config.imagePlacement ?? 'background';
  const isSideImage = imagePlacement === 'left' || imagePlacement === 'right';
  const fullBleed = config.fullBleed !== false;
  const imageFit = config.imageFit === 'contain' ? 'contain' : 'cover';
  const posX = clampPercent(config.imagePositionX, 50);
  const posY = clampPercent(config.imagePositionY, 50);
  const overlayDir = config.overlayDirection ?? 'left';

  const overlay = overlayColors(overlayDir, backgroundColor, overlayOpacity);

  const headline = config.headline || banner.title || 'Banner em destaque';
  const subtitle = config.subtitle || banner.subtitle;

  const imageNode = (
    <Image
      source={{ uri: banner.imageUrl }}
      style={StyleSheet.absoluteFill}
      contentFit={imageFit}
      contentPosition={{ left: `${posX}%`, top: `${posY}%` }}
      accessibilityLabel={banner.imageAlt ?? headline}
    />
  );

  const textBlock = (
    <View style={[styles.textBlock, { minHeight: isSideImage ? undefined : height }, ALIGN[layout]]}>
      {config.badge ? (
        <View style={[styles.badge, { shadowColor: '#000' }]}>
          <Ionicons name="sparkles" size={11} color={backgroundColor} />
          <Text style={[styles.badgeText, { color: backgroundColor }]} numberOfLines={1}>
            {config.badge}
          </Text>
        </View>
      ) : null}
      {config.eyebrow ? (
        <Text
          style={[styles.eyebrow, { color: textColor, textAlign: TEXT_ALIGN[layout] }]}
          numberOfLines={2}
        >
          {config.eyebrow.toUpperCase()}
        </Text>
      ) : null}
      <Text
        style={[
          styles.headline,
          {
            color: textColor,
            fontSize: headlineSize,
            lineHeight: Math.round(headlineSize * 1.02),
            fontWeight: FONT_WEIGHT_HEAD[font],
            fontStyle: FONT_STYLE_HEAD[font],
            textAlign: TEXT_ALIGN[layout],
          },
        ]}
      >
        {headline}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { color: textColor, textAlign: TEXT_ALIGN[layout] },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
      {(config.ctaLabel || config.secondaryLabel) ? (
        <View style={[styles.ctaRow, layoutToFlex(layout)]}>
          {config.ctaLabel ? (
            <View style={[styles.cta, { backgroundColor: accentColor }]}>
              <Text style={styles.ctaText} numberOfLines={1}>
                {config.ctaLabel}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={palette.ink900} />
            </View>
          ) : null}
          {config.secondaryLabel ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                openSecondary(config.secondaryHref);
              }}
              style={styles.secondary}
            >
              <Text style={styles.secondaryText} numberOfLines={1}>
                {config.secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {config.footerNote ? (
        <Text
          style={[
            styles.footerNote,
            { color: textColor, textAlign: TEXT_ALIGN[layout] },
          ]}
        >
          {config.footerNote}
        </Text>
      ) : null}
    </View>
  );

  const content = (
    <View
      style={[
        styles.section,
        {
          backgroundColor,
          minHeight: height,
          marginHorizontal: fullBleed ? 0 : 14,
          borderRadius: fullBleed ? 0 : radius.lg,
        },
        fullBleed ? null : shadows.card,
      ]}
    >
      {isSideImage ? (
        <View style={styles.splitWrap}>
          <View style={[styles.splitImage, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
            {imageNode}
          </View>
          <View style={styles.splitText}>
            {overlay ? (
              <LinearGradient
                colors={overlay.colors}
                start={overlay.start}
                end={overlay.end}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            {textBlock}
          </View>
        </View>
      ) : (
        <>
          {imageNode}
          {overlay ? (
            <LinearGradient
              colors={overlay.colors}
              start={overlay.start}
              end={overlay.end}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          {textBlock}
        </>
      )}
    </View>
  );

  const hasLink = banner.linkType !== 'none' && banner.linkUrl;

  return (
    <View style={{ marginTop: 8, width: fullBleed ? SCREEN_W : undefined }}>
      {hasLink ? (
        <Pressable onPress={() => openBanner(banner)} style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}>
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}

function layoutToFlex(layout: NonNullable<CustomHeroBannerConfig['layout']>): StyleProp<ViewStyle> {
  if (layout === 'text_center') return { justifyContent: 'center' };
  if (layout === 'text_right') return { justifyContent: 'flex-end' };
  return { justifyContent: 'flex-start' };
}

const styles = StyleSheet.create({
  section: {
    overflow: 'hidden',
    position: 'relative',
  },
  splitWrap: {
    flex: 1,
  },
  splitImage: {
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  splitText: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  textBlock: {
    position: 'relative',
    zIndex: 2,
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 0,
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 8,
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 8,
    opacity: 0.95,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  headline: {
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    opacity: 0.95,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  ctaText: {
    color: palette.ink900,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  secondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  secondaryText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800',
  },
  footerNote: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.82,
  },
});
