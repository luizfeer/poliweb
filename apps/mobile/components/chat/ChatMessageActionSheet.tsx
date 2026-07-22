import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { submitChatFeedback } from '@/lib/api/chat-feedback';
import { copyToClipboard } from '@/lib/clipboard';
import { buildShareText, getMessageCopyText } from '@/lib/chat/message-text';
import type { AgentBlock, MessageFeedbackContext, StoredMessage } from '@/lib/chat/types';
import { env } from '@/lib/env';
import { palette, radius } from '@/lib/theme/tokens';

type Props = {
  visible: boolean;
  message: StoredMessage | null;
  cityName: string;
  feedbackContext?: MessageFeedbackContext;
  onClose: () => void;
};

type SheetMode = 'actions' | 'feedback-down';

export function ChatMessageActionSheet({
  visible,
  message,
  cityName,
  feedbackContext,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<SheetMode>('actions');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setMode('actions');
      setComment('');
      setSending(false);
      setToast(null);
    }
  }, [visible]);

  const copyText = message ? getMessageCopyText(message) : '';
  const canCopy = copyText.length > 0;
  const canRate = message?.role === 'assistant' && Boolean(feedbackContext) && canCopy;

  function resetAndClose() {
    setMode('actions');
    setComment('');
    setSending(false);
    setToast(null);
    onClose();
  }

  async function handleCopy() {
    if (!canCopy) return;
    const ok = await copyToClipboard(copyText);
    if (ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast('Copiado');
      setTimeout(resetAndClose, 600);
      return;
    }
    try {
      await Share.share({ message: copyText });
      resetAndClose();
    } catch {
      setToast('Não foi possível copiar');
    }
  }

  async function handleShare() {
    if (!message) return;
    const portalUrl = `${env.webBaseUrl.replace(/\/$/, '')}/assistente`;
    const shareBody = buildShareText(message, cityName);
    try {
      await Share.share({
        title: `Assistente de ${cityName}`,
        message: `${shareBody}\n\n${portalUrl}`,
      });
      resetAndClose();
    } catch {
      await handleCopy();
    }
  }

  async function sendFeedback(rating: 'up' | 'down', finalComment: string | null) {
    if (!feedbackContext || !message) return;
    setSending(true);
    const result = await submitChatFeedback({
      sessionLocalId: feedbackContext.sessionLocalId,
      rating,
      query: feedbackContext.query,
      responseText: copyText || null,
      responseBlocks: message.blocks as AgentBlock[] | undefined,
      conversation: feedbackContext.conversation,
      comment: finalComment,
    });
    setSending(false);
    if (result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast('Obrigado pelo feedback');
      setTimeout(resetAndClose, 800);
    } else {
      setToast('Não foi possível enviar. Tente depois.');
    }
  }

  function handleRateUp() {
    void sendFeedback('up', null);
  }

  function openRateDown() {
    setMode('feedback-down');
    setComment('');
  }

  function handleRateDownSubmit() {
    void sendFeedback('down', comment.trim() || null);
  }

  if (!message) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
    >
      <Pressable style={styles.backdrop} onPress={resetAndClose} accessibilityLabel="Fechar menu" />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        {mode === 'actions' ? (
          <>
            <Text style={styles.sheetTitle}>
              {message.role === 'user' ? 'Sua mensagem' : 'Resposta do assistente'}
            </Text>

            <ActionRow
              icon="copy-outline"
              label="Copiar"
              disabled={!canCopy || sending}
              onPress={() => void handleCopy()}
            />
            <ActionRow
              icon="arrow-redo-outline"
              label="Encaminhar"
              disabled={!canCopy || sending}
              onPress={() => void handleShare()}
            />

            {canRate ? (
              <>
                <View style={styles.divider} />
                <ActionRow
                  icon="thumbs-up-outline"
                  label="Útil"
                  disabled={sending}
                  onPress={handleRateUp}
                />
                <ActionRow
                  icon="thumbs-down-outline"
                  label="Não ajudou"
                  disabled={sending}
                  onPress={openRateDown}
                />
              </>
            ) : null}

            {sending ? (
              <ActivityIndicator style={{ marginTop: 12 }} color={palette.cerrado700} />
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.sheetTitle}>O que faltou?</Text>
            <Text style={styles.sheetHint}>Opcional — nos ajuda a melhorar a TormentaIA.</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Descreva em poucas palavras"
              placeholderTextColor={palette.ink400}
              style={styles.commentInput}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <View style={styles.feedbackActions}>
              <Pressable
                onPress={() => setMode('actions')}
                style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.8 : 1 }]}
                disabled={sending}
              >
                <Text style={styles.secondaryBtnText}>Voltar</Text>
              </Pressable>
              <Pressable
                onPress={handleRateDownSubmit}
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Enviar</Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        <Pressable
          onPress={resetAndClose}
          style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionRow,
        { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color={palette.cerrado700} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 24, 20, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: palette.ink900,
    marginBottom: 8,
  },
  sheetHint: {
    fontSize: 13,
    color: palette.ink600,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  actionLabel: { fontSize: 16, fontWeight: '700', color: palette.ink900 },
  divider: {
    height: 1,
    backgroundColor: palette.ink100,
    marginVertical: 6,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '800', color: palette.ink600 },
  commentInput: {
    minHeight: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.ink100,
    backgroundColor: palette.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: palette.ink900,
    textAlignVertical: 'top',
  },
  feedbackActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.ink100,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '800', color: palette.ink700 },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: palette.cerrado700,
    alignItems: 'center',
  },
  primaryBtnText: { fontWeight: '800', color: palette.white },
  toast: {
    backgroundColor: palette.cerrado100,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 8,
  },
  toastText: { textAlign: 'center', fontWeight: '700', color: palette.cerrado700 },
});
