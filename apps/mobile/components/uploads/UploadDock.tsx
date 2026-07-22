import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Check, ChevronDown, ChevronUp, RefreshCw, Upload, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/lib/theme/tokens';
import { UploadQueue } from '@/lib/uploads/queue';
import type { UploadJob } from '@/lib/uploads/types';

const DOCK_HEIGHT_COLLAPSED = 56;
const TAB_BAR_HEIGHT = 60;

function countByStatus(jobs: UploadJob[]) {
  let uploading = 0;
  let done = 0;
  let failed = 0;
  let pending = 0;
  for (const j of jobs) {
    if (j.status === 'uploading' || j.status === 'processing') uploading += 1;
    else if (j.status === 'done') done += 1;
    else if (j.status === 'failed') failed += 1;
    else if (j.status === 'pending') pending += 1;
  }
  return { uploading, done, failed, pending };
}

export function UploadDock() {
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    void UploadQueue.init();
    const unsub = UploadQueue.subscribe(setJobs);
    return () => {
      unsub();
    };
  }, []);

  const visibleJobs = useMemo(
    () => jobs.filter((j) => j.status !== 'cancelled'),
    [jobs],
  );
  const counts = useMemo(() => countByStatus(visibleJobs), [visibleJobs]);
  const totalActive = counts.uploading + counts.pending;
  const hasAny = visibleJobs.length > 0;
  const allFinished = totalActive === 0 && counts.failed === 0 && counts.done > 0;

  useEffect(() => {
    if (!allFinished) return;
    const timeout = setTimeout(() => {
      UploadQueue.clearDone();
      setExpanded(false);
    }, 2800);
    return () => clearTimeout(timeout);
  }, [allFinished]);
  const hasActiveVideo = visibleJobs.some(
    (job) =>
      job.asset.kind === 'video' &&
      (job.status === 'pending' || job.status === 'uploading' || job.status === 'processing'),
  );

  if (!hasAny) return null;

  const bottomOffset = Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT + 8;

  const summary = allFinished
    ? `${counts.done} envio${counts.done > 1 ? 's' : ''} concluído${counts.done > 1 ? 's' : ''}`
    : totalActive > 0
      ? `Enviando ${totalActive} arquivo${totalActive > 1 ? 's' : ''}${counts.failed ? ` · ${counts.failed} com erro` : ''}`
      : counts.failed > 0
        ? `${counts.failed} falha${counts.failed > 1 ? 's' : ''} no envio`
        : 'Envios';

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: bottomOffset }]}>
      <View style={[styles.card, expanded && styles.cardExpanded]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 90}
          tint={Platform.OS === 'ios' ? 'systemChromeMaterial' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glassTint} pointerEvents="none" />
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={({ pressed }) => [styles.header, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Recolher envios' : 'Ver envios'}
        >
          <View style={styles.headerIcon}>
            {allFinished ? (
              <Check size={18} color={palette.white} strokeWidth={2.6} />
            ) : (
              <Upload size={18} color={palette.white} strokeWidth={2.6} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.summary} numberOfLines={1}>
              {summary}
            </Text>
            {totalActive > 0 ? (
              <Text style={styles.subline} numberOfLines={1}>
                {hasActiveVideo
                  ? 'Vídeos podem demorar para enviar e processar.'
                  : 'Pode usar o app normalmente, vamos continuar enviando.'}
              </Text>
            ) : null}
          </View>
          {expanded ? (
            <ChevronDown size={18} color={palette.ink600} />
          ) : (
            <ChevronUp size={18} color={palette.ink600} />
          )}
        </Pressable>

        {expanded ? (
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {visibleJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
            {allFinished ? (
              <Pressable
                onPress={() => UploadQueue.clearDone()}
                style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
              >
                <Text style={styles.clearBtnText}>Limpar concluídos</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

function JobRow({ job }: { job: UploadJob }) {
  const pct = Math.round(job.progress * 100);
  return (
    <View style={styles.row}>
      <View style={styles.thumbWrap}>
        {job.asset.kind === 'image' ? (
          <Image source={{ uri: job.asset.uri }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbVideo]}>
            <Text style={styles.thumbVideoText}>VID</Text>
          </View>
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {job.label ?? job.asset.fileName}
        </Text>
        {job.label ? (
          <Text style={styles.rowFile} numberOfLines={1}>
            {job.asset.fileName}
          </Text>
        ) : null}
        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.max(2, pct)}%`,
                backgroundColor:
                  job.status === 'failed'
                    ? palette.destructive
                    : job.status === 'done'
                      ? palette.cerrado500
                      : palette.clay500,
              },
            ]}
          />
        </View>
        <Text style={styles.rowStatus} numberOfLines={1}>
          {labelFor(job)}
        </Text>
      </View>
      <View style={styles.rowActions}>
        {job.status === 'failed' ? (
          <Pressable
            onPress={() => UploadQueue.retry(job.id)}
            style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
            accessibilityLabel="Tentar novamente"
          >
            <RefreshCw size={16} color={palette.ink700} />
          </Pressable>
        ) : null}
        {job.status === 'pending' || job.status === 'uploading' || job.status === 'failed' ? (
          <Pressable
            onPress={() => UploadQueue.cancel(job.id)}
            style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
            accessibilityLabel="Cancelar envio"
          >
            <X size={16} color={palette.ink700} />
          </Pressable>
        ) : null}
        {job.status === 'done' ? <Check size={18} color={palette.cerrado500} /> : null}
      </View>
    </View>
  );
}

function labelFor(job: UploadJob): string {
  switch (job.status) {
    case 'pending':
      return 'Na fila…';
    case 'uploading': {
      const pct = Math.round(job.progress * 100);
      if (job.asset.kind === 'video' && pct <= 1) return 'Preparando vídeo para envio...';
      if (pct <= 1) return 'Preparando envio...';
      return `Enviando ${pct}%`;
    }
    case 'processing':
      return job.asset.kind === 'video'
        ? 'Processando vídeo no servidor...'
        : 'Processando no servidor…';
    case 'done':
      return 'Enviado';
    case 'failed':
      return job.error ? `Falhou: ${job.error.slice(0, 40)}` : 'Falhou';
    case 'cancelled':
      return 'Cancelado';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    minHeight: DOCK_HEIGHT_COLLAPSED,
    zIndex: 50,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.62)',
  },
  cardExpanded: {
    maxHeight: 380,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, minWidth: 0 },
  summary: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  subline: { fontSize: 11, color: palette.ink600, marginTop: 1 },
  pressed: { opacity: 0.7 },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.ink100,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  thumbWrap: { width: 40, height: 40, borderRadius: 8, overflow: 'hidden' },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: palette.paperDeep },
  thumbVideo: { alignItems: 'center', justifyContent: 'center' },
  thumbVideoText: { color: palette.ink600, fontSize: 10, fontWeight: '800' },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 12, color: palette.ink900, fontWeight: '700' },
  rowFile: { fontSize: 10, color: palette.ink400, marginTop: 1 },
  bar: {
    marginTop: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.paperDeep,
    overflow: 'hidden',
  },
  barFill: { height: 4, borderRadius: 2 },
  rowStatus: { fontSize: 10, color: palette.ink600, marginTop: 4 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconAction: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: palette.paperDeep,
  },
  clearBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearBtnText: { color: palette.ink600, fontSize: 12, fontWeight: '700' },
});
