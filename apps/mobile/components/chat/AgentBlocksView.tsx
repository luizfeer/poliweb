import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChatMarkdownText } from '@/components/chat/ChatMarkdownText';
import { openPortalUrl } from '@/lib/navigation/open-portal-url';
import type { AgentBlock } from '@/lib/chat/types';
import { palette, radius } from '@/lib/theme/tokens';

const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const WEEKDAY_SHORT: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

const WEEKDAY_LONG: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

const GARBAGE_TYPE_LABELS: Record<string, string> = {
  common: 'Comum',
  recyclable: 'Reciclável',
  organic: 'Orgânico',
};

const TRADITION_LABELS: Record<string, string> = {
  catholic: 'Católica',
  evangelical: 'Evangélica',
  spiritist: 'Espírita',
  other: 'Comunidade',
};

type Props = {
  blocks: AgentBlock[];
};

type EntityHoursBlock = Extract<AgentBlock, { type: 'entity_hours' }>;
type EntityDetailsBlock = Extract<AgentBlock, { type: 'entity_details' }>;
type GarbageScheduleBlockData = Extract<AgentBlock, { type: 'garbage_schedule' }>;
type ChurchesBlockData = Extract<AgentBlock, { type: 'churches' }>;
type FerryBlockData = Extract<AgentBlock, { type: 'ferry' }>;

export function AgentBlocksView({ blocks }: Props) {
  return (
    <View style={styles.wrap}>
      {blocks.map((block, index) => (
        <BlockItem key={`${block.type}-${index}`} block={block} />
      ))}
    </View>
  );
}

function BlockItem({ block }: { block: AgentBlock }) {
  if (block.type === 'text' || block.type === 'fallback') {
    const text = typeof block.text === 'string' ? block.text : '';
    if (!text) return null;
    return <ChatMarkdownText text={text} style={styles.paragraph} />;
  }

  if (block.type === 'search_results' && Array.isArray(block.items)) {
    return (
      <View style={styles.list}>
        {block.items.map((item) => {
          const name = typeof item.name === 'string' ? item.name : 'Ver mais';
          const url = typeof item.url === 'string' ? item.url : null;
          const cover =
            typeof item.cover_url === 'string' && item.cover_url ? item.cover_url : null;
          return (
            <Pressable
              key={`${item.entity_type}-${item.entity_id}`}
              onPress={() => url && openPortalUrl(url)}
              style={({ pressed }: { pressed: boolean }) => [styles.hitCard, { opacity: pressed ? 0.9 : 1 }]}
            >
              {cover ? (
                <Image source={{ uri: cover }} style={styles.hitThumb} contentFit="cover" />
              ) : null}
              <Text style={styles.hitTitle} numberOfLines={2}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (block.type === 'faq' && Array.isArray(block.items)) {
    return (
      <View style={styles.list}>
        {block.items.map((item) => (
          <View key={item.question} style={styles.faqCard}>
            <Text style={styles.faqQ}>{item.question}</Text>
            <Text style={styles.faqA}>{item.answer}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'events' && Array.isArray(block.items)) {
    return (
      <View style={styles.list}>
        {block.items.map((item) => {
          const when = item.starts_at ? DATE_FMT.format(new Date(item.starts_at)) : null;
          return (
            <Pressable
              key={`${item.slug ?? item.title}`}
              onPress={() => item.slug && openPortalUrl(`/comunidade/agenda/${item.slug}`)}
              style={styles.eventCard}
            >
              {when ? <Text style={styles.meta}>{when}</Text> : null}
              <Text style={styles.hitTitle}>{item.title}</Text>
              {item.location ? <Text style={styles.meta}>{item.location}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (block.type === 'news' && Array.isArray(block.items)) {
    return (
      <View style={styles.list}>
        {block.items.map((item) => (
          <Pressable
            key={item.slug ?? item.title}
            onPress={() => item.slug && openPortalUrl(`/noticias/${item.slug}`)}
            style={styles.eventCard}
          >
            <Text style={styles.hitTitle}>{item.title}</Text>
            {item.excerpt ? <Text style={styles.meta}>{item.excerpt}</Text> : null}
          </Pressable>
        ))}
      </View>
    );
  }

  if (block.type === 'entity_hours') {
    const hoursBlock = block as EntityHoursBlock;
    const entityUrl = hoursBlock.entity.url;
    return (
      <InfoCard
        icon="time"
        title={hoursBlock.entity.name}
        subtitle={hoursBlock.status_label}
        tone={hoursBlock.is_open_now === true ? 'success' : hoursBlock.is_open_now === false ? 'danger' : 'neutral'}
        onPress={entityUrl ? () => openPortalUrl(entityUrl) : undefined}
      >
        <View style={styles.detailList}>
          {hoursBlock.hours.map((hour, index) => (
            <View key={`${hour.weekday}-${index}`} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{String(hour.label).split(':')[0]}</Text>
              <Text style={styles.detailValue}>
                {hour.starts_at ?? '--:--'} às {hour.ends_at ?? '--:--'}
              </Text>
            </View>
          ))}
        </View>
      </InfoCard>
    );
  }

  if (block.type === 'entity_details') {
    const detailsBlock = block as EntityDetailsBlock;
    const entityUrl = detailsBlock.entity.url;
    return (
      <InfoCard
        icon="location"
        title={detailsBlock.entity.name}
        subtitle={detailsBlock.address ?? 'Detalhes do local'}
        onPress={entityUrl ? () => openPortalUrl(entityUrl) : undefined}
      >
        <View style={styles.pillRow}>
          {detailsBlock.phone ? <ContactPill icon="call" label={detailsBlock.phone} /> : null}
          {detailsBlock.whatsapp ? <ContactPill icon="logo-whatsapp" label={detailsBlock.whatsapp} /> : null}
          {detailsBlock.instagram ? <ContactPill icon="logo-instagram" label={`@${detailsBlock.instagram}`} /> : null}
        </View>
      </InfoCard>
    );
  }

  if (block.type === 'garbage_schedule' && Array.isArray(block.items)) {
    const garbageBlock = block as GarbageScheduleBlockData;
    return (
      <View style={styles.list}>
        <BlockHeading icon="trash" title="Coleta de lixo" />
        {garbageBlock.items.map((item, index) => {
          const districts = item.districts.map((district) => district.name).filter(Boolean);
          const visibleDistricts = districts.slice(0, 6);
          const remaining = districts.length - visibleDistricts.length;
          return (
            <View key={`${item.day_of_week}-${item.type}-${index}`} style={styles.eventCard}>
              <View style={styles.cardTitleRow}>
                <Ionicons
                  name={item.type === 'recyclable' ? 'leaf' : 'trash'}
                  size={17}
                  color={palette.cerrado700}
                />
                <Text style={styles.hitTitle}>
                  {WEEKDAY_LONG[item.day_of_week] ?? 'Dia'} · {GARBAGE_TYPE_LABELS[item.type] ?? item.type}
                </Text>
              </View>
              <Text style={styles.meta}>{formatGarbageTime(item)}</Text>
              {visibleDistricts.length > 0 ? (
                <View style={styles.pillRow}>
                  {visibleDistricts.map((name) => (
                    <View key={name} style={styles.softPill}>
                      <Text style={styles.softPillText}>{name}</Text>
                    </View>
                  ))}
                  {remaining > 0 ? <Text style={styles.meta}>+{remaining} bairros</Text> : null}
                </View>
              ) : null}
              {item.notes ? <Text style={styles.meta}>{item.notes}</Text> : null}
            </View>
          );
        })}
      </View>
    );
  }

  if (block.type === 'churches' && Array.isArray(block.items)) {
    const churchesBlock = block as ChurchesBlockData;
    return (
      <View style={styles.list}>
        <BlockHeading icon="business" title="Igrejas e cultos" />
        {churchesBlock.items.map((item) => {
          const today = item.weekly_schedule.filter((schedule) => schedule.is_today);
          const schedule = (today.length > 0 ? today : item.weekly_schedule).slice(0, 3);
          return (
            <View key={item.id} style={styles.eventCard}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="business" size={17} color={palette.cerrado700} />
                <Text style={styles.hitTitle}>{item.name}</Text>
              </View>
              <Text style={styles.meta}>{TRADITION_LABELS[item.tradition] ?? item.tradition}</Text>
              {item.address ? <Text style={styles.meta}>{item.address}</Text> : null}
              {schedule.length > 0 ? (
                <View style={styles.pillRow}>
                  {schedule.map((entry, index) => (
                    <View
                      key={`${item.id}-${entry.weekday}-${entry.starts_at}-${index}`}
                      style={[styles.softPill, entry.is_today && styles.activePill]}
                    >
                      <Text style={[styles.softPillText, entry.is_today && styles.activePillText]}>
                        {WEEKDAY_SHORT[entry.weekday] ?? 'Dia'} {formatScheduleTime(entry.starts_at)} · {entry.title}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  if (block.type === 'ferry' && Array.isArray(block.items)) {
    const ferryBlock = block as FerryBlockData;
    return (
      <View style={styles.list}>
        <BlockHeading icon="boat" title="Balsas" />
        {ferryBlock.items.map((item) => {
          const directions = Object.entries(item.schedules_by_direction);
          return (
            <Pressable
              key={item.slug}
              onPress={() => openPortalUrl(item.public_url)}
              style={({ pressed }: { pressed: boolean }) => [styles.eventCard, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={styles.cardTitleRow}>
                <Ionicons name="boat" size={17} color={palette.sky700} />
                <Text style={styles.hitTitle} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={styles.meta}>{item.endpoints}</Text>
              {item.fare_summary ? <Text style={styles.meta}>{item.fare_summary}</Text> : null}
              {directions.slice(0, 2).map(([direction, times]) => (
                <View key={direction} style={styles.directionBlock}>
                  <Text style={styles.detailLabel}>{direction}</Text>
                  <View style={styles.pillRow}>
                    {times.slice(0, 5).map((time) => (
                      <View key={`${direction}-${time.time}`} style={[styles.softPill, time.isNext && styles.activePill]}>
                        <Text style={[styles.softPillText, time.isNext && styles.activePillText]}>
                          {time.time}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </Pressable>
          );
        })}
      </View>
    );
  }

  return null;
}

type InfoTone = 'neutral' | 'success' | 'danger';

function InfoCard({
  icon,
  title,
  subtitle,
  tone = 'neutral',
  children,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tone?: InfoTone;
  children?: ReactNode;
  onPress?: () => void;
}) {
  const iconColor = tone === 'success' ? palette.cerrado700 : tone === 'danger' ? palette.destructive : palette.sky700;
  const content = (
    <>
      <View style={styles.cardTitleRow}>
        <View style={[styles.infoIcon, { backgroundColor: tone === 'danger' ? '#FBECEC' : palette.cerrado100 }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hitTitle}>{title}</Text>
          <Text style={styles.meta}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }: { pressed: boolean }) => [styles.infoCard, pressed ? { opacity: 0.9 } : null]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.infoCard}>
      {content}
    </View>
  );
}

function ContactPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.softPill}>
      <Ionicons name={icon} size={13} color={palette.ink600} />
      <Text style={styles.softPillText}>{label}</Text>
    </View>
  );
}

function BlockHeading({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.cardTitleRow}>
      <Ionicons name={icon} size={15} color={palette.ink700} />
      <Text style={styles.heading}>{title}</Text>
    </View>
  );
}

function formatScheduleTime(value: string): string {
  return value.slice(0, 5);
}

function formatGarbageTime(item: { start_time: string | null; end_time: string | null; notes: string | null }): string {
  const start = item.start_time?.slice(0, 5) ?? null;
  const end = item.end_time?.slice(0, 5) ?? null;
  if (start || end) return [start, end].filter(Boolean).join(' às ');

  const notes = item.notes?.toLowerCase() ?? '';
  if (notes.includes('antes do almoço')) return 'Antes do almoço';
  if (notes.includes('noite')) return 'À noite';
  return 'Horário não informado';
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  paragraph: { fontSize: 15, lineHeight: 22, color: palette.ink900 },
  list: { gap: 8 },
  hitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.paper,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 10,
  },
  hitThumb: { width: 44, height: 44, borderRadius: 8 },
  hitTitle: { flex: 1, flexShrink: 1, fontSize: 14, fontWeight: '800', color: palette.ink900 },
  faqCard: {
    backgroundColor: palette.paper,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 10,
    gap: 4,
  },
  faqQ: { fontSize: 13, fontWeight: '800', color: palette.ink900 },
  faqA: { fontSize: 13, lineHeight: 19, color: palette.ink700 },
  eventCard: {
    backgroundColor: palette.paper,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 10,
    gap: 6,
  },
  meta: { fontSize: 12, fontWeight: '600', color: palette.ink600 },
  heading: { fontSize: 13, fontWeight: '900', color: palette.ink900 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoCard: {
    backgroundColor: palette.paper,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 10,
    gap: 10,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailList: { gap: 6 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: palette.ink100,
    paddingTop: 6,
  },
  detailLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: palette.ink600 },
  detailValue: { fontSize: 12, fontWeight: '800', color: palette.ink900 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  softPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.ink100,
    backgroundColor: palette.white,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  softPillText: { fontSize: 11, fontWeight: '800', color: palette.ink700 },
  activePill: { backgroundColor: palette.cerrado100, borderColor: palette.cerrado500 },
  activePillText: { color: palette.cerrado700 },
  directionBlock: { gap: 5 },
});
