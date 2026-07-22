import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Dimensions, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HScroll } from '@/components/home/HScroll';
import type { BannerAspectRatio, HomeBanner } from '@/lib/home/types';
import { portalHrefToMobile } from '@/lib/home/portal-href';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;

const ASPECT: Record<BannerAspectRatio, number> = {
  '16:9': 16 / 9,
  '4:5': 4 / 5,
  '1:1': 1,
  '3:1': 3,
  '9:16': 9 / 16,
  '5:1': 5,
};

type Props = {
  banners: HomeBanner[];
  aspectRatio?: BannerAspectRatio;
  title?: string | null;
};

function slideWidth(ratio: BannerAspectRatio): number {
  if (ratio === '9:16' || ratio === '4:5' || ratio === '1:1') {
    return Math.min(SCREEN_W * 0.72, 320);
  }
  return Math.min(SCREEN_W * 0.88, 680);
}

function openBanner(banner: HomeBanner) {
  if (banner.linkType === 'none' || !banner.linkUrl) return;
  if (banner.linkType === 'external') {
    Linking.openURL(banner.linkUrl).catch(() => undefined);
    return;
  }
  router.push(portalHrefToMobile(banner.linkUrl) as never);
}

export function BannerCarousel({ banners, aspectRatio = '4:5', title }: Props) {
  if (banners.length === 0) return null;

  const ratio = ASPECT[aspectRatio] ?? ASPECT['4:5'];
  const width = slideWidth(aspectRatio);
  const height = width / ratio;

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <HScroll>
        {banners.map((banner) => (
          <BannerSlide key={banner.id} banner={banner} width={width} height={height} />
        ))}
      </HScroll>
    </View>
  );
}

type SlideProps = { banner: HomeBanner; width: number; height: number };

function BannerSlide({ banner, width, height }: SlideProps) {
  return (
    <Pressable
      onPress={() => openBanner(banner)}
      style={({ pressed }) => [
        styles.slide,
        { width, height, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <Image
        source={{ uri: banner.imageUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityLabel={banner.imageAlt ?? banner.title ?? 'Banner'}
      />
      {banner.videoUrl ? <BannerVideoLayer videoUrl={banner.videoUrl} /> : null}
      {(banner.title || banner.subtitle) && (
        <View style={styles.caption}>
          {banner.title ? (
            <Text style={styles.captionTitle} numberOfLines={2}>
              {banner.title}
            </Text>
          ) : null}
          {banner.subtitle ? (
            <Text style={styles.captionSub} numberOfLines={2}>
              {banner.subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

function BannerVideoLayer({ videoUrl }: { videoUrl: string }) {
  const [hidden, setHidden] = useState(false);
  const [errored, setErrored] = useState(false);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => setHidden(true));
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    if (status === 'error') {
      setErrored(true);
      setHidden(true);
    }
  }, [status]);

  const replay = () => {
    if (errored) return;
    try {
      player.currentTime = 0;
      player.play();
      setHidden(false);
    } catch {
      // ignora
    }
  };

  if (errored) return null;

  return (
    <>
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, hidden ? styles.videoHidden : null]}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {hidden ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            replay();
          }}
          hitSlop={8}
          style={styles.replayBtn}
          accessibilityRole="button"
          accessibilityLabel="Rever vídeo"
        >
          <Ionicons name="play" size={14} color={palette.white} />
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  title: {
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '800',
    color: palette.ink900,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  slide: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: palette.ink100,
    ...shadows.card,
  },
  videoHidden: { opacity: 0 },
  replayBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(25,25,25,0.55)',
  },
  captionTitle: { color: palette.white, fontSize: 14, fontWeight: '800' },
  captionSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
});
