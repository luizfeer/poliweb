import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AgentBlocksView } from '@/components/chat/AgentBlocksView';
import { ChatMarkdownText } from '@/components/chat/ChatMarkdownText';
import { ChatMessageActionSheet } from '@/components/chat/ChatMessageActionSheet';
import type { MessageFeedbackContext } from '@/lib/chat/types';
import { openPortalUrl } from '@/lib/navigation/open-portal-url';
import { plainTextFromBlocks } from '@/lib/chat/plain-text';
import type { CtaButton, SearchHit, StoredMessage } from '@/lib/chat/types';
import { palette, radius, shadows } from '@/lib/theme/tokens';

const TIME_FMT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
});

type Props = {
  message: StoredMessage;
  isLoading?: boolean;
  cityName: string;
  feedbackContext?: MessageFeedbackContext;
};

export function ChatMessageBubble({ message, isLoading, cityName, feedbackContext }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const now = TIME_FMT.format(new Date());

  function openMessageMenu() {
    if (isLoading) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuOpen(true);
  }

  if (message.role === 'user') {
    return (
      <>
        <View style={styles.userRow}>
          <Pressable
            onLongPress={openMessageMenu}
            delayLongPress={450}
            style={({ pressed }) => [
              styles.userBubble,
              pressed && styles.bubblePressed,
            ]}
          >
            <Text style={styles.userText}>{message.text}</Text>
            <Text style={styles.time}>{now}</Text>
          </Pressable>
        </View>
        <ChatMessageActionSheet
          visible={menuOpen}
          message={message}
          cityName={cityName}
          onClose={() => setMenuOpen(false)}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.assistantRow}>
        <View style={styles.assistantBubble}>
          <Text style={styles.typing}>● ● ●</Text>
        </View>
      </View>
    );
  }

  const hasBlocks = Boolean(message.blocks?.length);
  const bodyText =
    message.text?.trim() ||
    (!hasBlocks ? plainTextFromBlocks(message.blocks) : '') ||
    (message.hits.length > 0 ? 'Encontrei algumas opções para você:' : '');

  return (
    <>
      <View style={styles.assistantRow}>
        <Pressable
          onLongPress={openMessageMenu}
          delayLongPress={450}
          style={({ pressed }) => [
            styles.assistantBubble,
            pressed && styles.bubblePressed,
          ]}
        >
          {bodyText ? <ChatMarkdownText text={bodyText} style={styles.assistantText} /> : null}
          {message.blocks && message.blocks.length > 0 ? (
            <AgentBlocksView blocks={message.blocks} />
          ) : null}
          {message.hits.length > 0 ? <SearchHitsList hits={message.hits} /> : null}
          {message.cta && message.cta.length > 0 ? (
            <CtaRow buttons={message.cta} />
          ) : null}
          {message.aiNotice ? (
            <Text style={styles.aiNotice}>{message.aiNotice.label}</Text>
          ) : null}
          <Text style={styles.timeAssistant}>{now}</Text>
        </Pressable>
      </View>
      <ChatMessageActionSheet
        visible={menuOpen}
        message={message}
        cityName={cityName}
        feedbackContext={feedbackContext}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}

function SearchHitsList({ hits }: { hits: SearchHit[] }) {
  return (
    <View style={styles.hitsWrap}>
      {hits.slice(0, 8).map((hit) => (
        <Pressable
          key={`${hit.entityType}-${hit.entityId}`}
          onPress={() => openPortalUrl(hit.url)}
          style={({ pressed }) => [styles.hitRow, { opacity: pressed ? 0.9 : 1 }]}
        >
          {hit.coverUrl ? (
            <Image source={{ uri: hit.coverUrl }} style={styles.hitThumb} contentFit="cover" />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.hitTitle} numberOfLines={2}>
              {hit.title}
            </Text>
            {hit.subtitle ? (
              <Text style={styles.hitSub} numberOfLines={1}>
                {hit.subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function CtaRow({ buttons }: { buttons: CtaButton[] }) {
  return (
    <View style={styles.ctaRow}>
      {buttons.map((btn) => (
        <Pressable
          key={`${btn.label}-${btn.href}`}
          onPress={() => openPortalUrl(btn.href)}
          style={({ pressed }) => [
            btn.variant === 'secondary' ? styles.ctaSecondary : styles.ctaPrimary,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text
            style={
              btn.variant === 'secondary' ? styles.ctaSecondaryText : styles.ctaPrimaryText
            }
          >
            {btn.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: { alignItems: 'flex-end', paddingHorizontal: 4 },
  userBubble: {
    maxWidth: '88%',
    backgroundColor: '#DCF8C6',
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadows.card,
  },
  bubblePressed: { opacity: 0.92 },
  userText: { fontSize: 15, lineHeight: 21, color: palette.ink900 },
  assistantRow: { paddingHorizontal: 4 },
  assistantBubble: {
    width: '96%',
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    ...shadows.card,
  },
  assistantText: { fontSize: 15, lineHeight: 22, color: palette.ink900 },
  typing: { color: palette.ink400, letterSpacing: 2, fontSize: 12, paddingVertical: 4 },
  time: {
    marginTop: 4,
    fontSize: 10,
    color: palette.ink600,
    textAlign: 'right',
  },
  timeAssistant: { fontSize: 10, color: palette.ink600, textAlign: 'right' },
  aiNotice: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.ink600,
    borderTopWidth: 1,
    borderTopColor: palette.ink100,
    paddingTop: 6,
  },
  hitsWrap: { gap: 6 },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.paper,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.ink100,
    padding: 8,
  },
  hitThumb: { width: 40, height: 40, borderRadius: 8 },
  hitTitle: { fontSize: 13, fontWeight: '800', color: palette.ink900 },
  hitSub: { fontSize: 12, color: palette.ink600, marginTop: 2 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ctaPrimary: {
    backgroundColor: palette.cerrado700,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaPrimaryText: { color: palette.white, fontSize: 13, fontWeight: '800' },
  ctaSecondary: {
    backgroundColor: palette.paper,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.ink100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaSecondaryText: { color: palette.ink900, fontSize: 13, fontWeight: '800' },
});
