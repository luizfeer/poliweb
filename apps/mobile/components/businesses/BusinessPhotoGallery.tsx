import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isVideoUrl } from '@/lib/businesses/labels';
import { palette, radius } from '@/lib/theme/tokens';

type Props = {
  photos: string[];
  name: string;
};

const SCREEN = Dimensions.get('window');
const STORY_DURATION_MS = 5500;
const TICK_MS = 50;
const GRID_GAP = 6;
const GRID_COLS = 3;
const TILE = Math.floor((SCREEN.width - 32 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS);

/** Grade de mídia + visor estilo stories (tap nas laterais, swipe, vídeo nativo). */
export function BusinessPhotoGallery({ photos, name }: Props) {
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<FlatList<string>>(null);
  const [active, setActive] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeIsVideo = active !== null && isVideoUrl(photos[active] ?? '');

  const open = useCallback((index: number) => {
    setProgress(0);
    setPaused(false);
    setActive(index);
  }, []);

  const close = useCallback(() => {
    setActive(null);
    setProgress(0);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const target = ((index % photos.length) + photos.length) % photos.length;
      setProgress(0);
      pagerRef.current?.scrollToIndex({ index: target, animated: true });
    },
    [photos.length],
  );

  // Auto-avanço (pausa em vídeo — deixa o vídeo tocar).
  useEffect(() => {
    if (active === null || paused || activeIsVideo) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = p + TICK_MS / STORY_DURATION_MS;
        if (next >= 1) {
          goTo((active ?? 0) + 1);
          return 0;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [active, paused, activeIsVideo, goTo]);

  const onMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN.width);
    setActive((prev) => (prev === index ? prev : index));
    setProgress(0);
  }, []);

  if (photos.length === 0) return null;

  return (
    <View style={styles.grid}>
      {photos.map((uri, index) => {
        const video = isVideoUrl(uri);
        return (
          <Pressable key={uri + index} onPress={() => open(index)} style={styles.tile}>
            <Image source={{ uri }} style={styles.tileImage} contentFit="cover" transition={150} />
            {video ? (
              <View style={styles.playBadge}>
                <Ionicons name="play" size={16} color={palette.white} />
              </View>
            ) : null}
          </Pressable>
        );
      })}

      <Modal visible={active !== null} animationType="fade" onRequestClose={close} statusBarTranslucent>
        <View style={styles.viewer}>
          <StatusBar hidden />

          {active !== null ? (
            <FlatList
              ref={pagerRef}
              data={photos}
              horizontal
              pagingEnabled
              extraData={active}
              initialScrollIndex={active}
              getItemLayout={(_, i) => ({ length: SCREEN.width, offset: SCREEN.width * i, index: i })}
              keyExtractor={(uri, i) => uri + i}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumEnd}
              renderItem={({ item, index }) =>
                isVideoUrl(item) ? (
                  <VideoPage uri={item} active={index === active} />
                ) : (
                  <View style={styles.page}>
                    <Image source={{ uri: item }} style={styles.pageMedia} contentFit="contain" transition={120} />
                  </View>
                )
              }
            />
          ) : null}

          {/* Zonas de toque: laterais navegam (centro fica livre pro swipe/vídeo) */}
          <Pressable style={[styles.tapZone, styles.tapLeft]} onPress={() => goTo((active ?? 0) - 1)} />
          <Pressable style={[styles.tapZone, styles.tapRight]} onPress={() => goTo((active ?? 0) + 1)} />

          {/* Barras de progresso */}
          <View style={[styles.progressRow, { top: insets.top + 8 }]} pointerEvents="box-none">
            {photos.map((uri, index) => {
              const current = active ?? 0;
              const fill = index < current ? 1 : index === current ? (activeIsVideo ? 1 : progress) : 0;
              return (
                <Pressable key={uri + index} style={styles.progressTrack} onPress={() => goTo(index)}>
                  <View style={[styles.progressFill, { width: `${fill * 100}%` }]} />
                </Pressable>
              );
            })}
          </View>

          {/* Cabeçalho */}
          <View style={[styles.viewerHeader, { top: insets.top + 22 }]} pointerEvents="box-none">
            <View style={styles.viewerHeaderLeft}>
              <View style={styles.viewerHeaderIcon}>
                <Ionicons name="images" size={15} color={palette.white} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.viewerTitle}>Galeria</Text>
                <Text style={styles.viewerSubtitle} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            </View>
            {!activeIsVideo ? (
              <Pressable style={styles.viewerBtn} onPress={() => setPaused((p) => !p)} hitSlop={8}>
                <Ionicons name={paused ? 'play' : 'pause'} size={20} color={palette.white} />
              </Pressable>
            ) : null}
            <Pressable style={styles.viewerBtn} onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color={palette.white} />
            </Pressable>
          </View>

          {/* Rodapé */}
          <View style={[styles.viewerFooter, { paddingBottom: insets.bottom + 16 }]} pointerEvents="none">
            <Text style={styles.viewerCounter}>
              {(active ?? 0) + 1} de {photos.length}
            </Text>
            <Text style={styles.viewerHint}>Toque nas laterais ou arraste</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function VideoPage({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  return (
    <View style={styles.page}>
      <VideoView player={player} style={styles.pageMedia} contentFit="contain" nativeControls />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: palette.paperDeep,
  },
  tileImage: { width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewer: { flex: 1, backgroundColor: '#000' },
  page: { width: SCREEN.width, height: SCREEN.height, alignItems: 'center', justifyContent: 'center' },
  pageMedia: { width: SCREEN.width, height: SCREEN.height },

  tapZone: { position: 'absolute', top: SCREEN.height * 0.16, bottom: SCREEN.height * 0.16, width: SCREEN.width * 0.28, zIndex: 15 },
  tapLeft: { left: 0 },
  tapRight: { right: 0 },

  progressRow: { position: 'absolute', left: 10, right: 10, zIndex: 20, flexDirection: 'row', gap: 4 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.28)' },
  progressFill: { height: '100%', backgroundColor: palette.white },

  viewerHeader: { position: 'absolute', left: 12, right: 12, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewerHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  viewerHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerTitle: { color: palette.white, fontSize: 13, fontWeight: '900' },
  viewerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' },
  viewerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewerFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, paddingHorizontal: 16, paddingTop: 30, gap: 2 },
  viewerCounter: { color: palette.white, fontSize: 14, fontWeight: '700' },
  viewerHint: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
});
