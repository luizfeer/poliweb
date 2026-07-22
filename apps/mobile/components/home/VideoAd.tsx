import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { trackAdEvent } from '@/lib/api/ads';
import type { HomeVideoAd } from '@/lib/api/home';
import { env } from '@/lib/env';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = {
  ad: HomeVideoAd;
  /** Quando false, o player pausa (usado por seção inteira fora do viewport). */
  active?: boolean;
  /** Largura do card. */
  width?: number;
};

export function VideoAd({ ad, active = true, width }: Props) {
  const [muted, setMuted] = useState(ad.muteDefault);
  const completedRef = useRef(false);

  const player = useVideoPlayer(ad.videoUrl, (p) => {
    p.loop = true;
    p.muted = ad.muteDefault;
    p.playbackRate = 1;
    if (active) p.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const status = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  useEffect(() => {
    if (status.status === 'readyToPlay') {
      trackAdEvent(ad.id, 'impression');
    }
  }, [status.status, ad.id]);

  useEffect(() => {
    if (isPlaying && !completedRef.current) {
      trackAdEvent(ad.id, 'play');
    }
  }, [isPlaying, ad.id]);

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      if (!completedRef.current) {
        completedRef.current = true;
        trackAdEvent(ad.id, 'complete');
      }
    });
    return () => sub.remove();
  }, [player, ad.id]);

  const handleOpen = useCallback(() => {
    trackAdEvent(ad.id, 'click');
    const url = ad.clickUrl;
    if (!url) return;
    try {
      const u = new URL(url.startsWith('http') ? url : `${env.webBaseUrl}${url}`);
      const sameOrigin = u.hostname.endsWith(new URL(env.webBaseUrl).hostname);
      if (sameOrigin) {
        const slug = u.pathname.replace(/^\//, '').replaceAll('/', '-') + (u.search ?? '');
        router.push(`/webview/${encodeURIComponent(slug)}` as never);
      } else {
        Linking.openURL(u.toString()).catch(() => undefined);
      }
    } catch {
      Linking.openURL(url).catch(() => undefined);
    }
  }, [ad.id, ad.clickUrl]);

  const aspect = ad.aspectRatio > 0 ? ad.aspectRatio : 16 / 9;

  return (
    <Pressable
      style={[styles.card, width ? { width } : undefined]}
      onPress={handleOpen}
      accessibilityRole="button"
      accessibilityLabel={`Anúncio: ${ad.title}. ${ad.ctaLabel}.`}
    >
      <View style={[styles.videoWrap, { aspectRatio: aspect }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />

        {/* Top gradient + AD tag */}
        <View pointerEvents="none" style={styles.topShade} />
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={styles.adTag}>
            <Text style={styles.adTagText}>Anúncio</Text>
          </View>
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            style={styles.muteBtn}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Ativar áudio' : 'Silenciar'}
          >
            <Ionicons
              name={muted ? 'volume-mute' : 'volume-high'}
              size={16}
              color={palette.white}
            />
          </Pressable>
        </View>

        {/* Bottom gradient + label */}
        <View pointerEvents="none" style={styles.bottomShade} />
        <View style={styles.bottomBlock} pointerEvents="none">
          <Text style={styles.title} numberOfLines={2}>
            {ad.title}
          </Text>
          {ad.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {ad.subtitle}
            </Text>
          ) : null}
          <View style={styles.ctaRow}>
            <Text style={styles.cta}>{ad.ctaLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color={palette.white} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: palette.ink900,
    overflow: 'hidden',
    ...shadows.pop,
  },
  videoWrap: { width: '100%', backgroundColor: '#000' },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  adTagText: { color: palette.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  muteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  bottomBlock: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    gap: 2,
  },
  title: { color: palette.white, fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  subtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: '600' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  cta: { color: palette.white, fontSize: 13, fontWeight: '800' },
});
