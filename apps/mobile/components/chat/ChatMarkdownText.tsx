import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { hasSimpleMarkdown } from '@/lib/chat/markdown';
import { palette } from '@/lib/theme/tokens';

type Props = {
  text: string;
  style?: TextStyle;
};

export function ChatMarkdownText({ text, style }: Props) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (!hasSimpleMarkdown(trimmed)) {
    return <Text style={style}>{text}</Text>;
  }

  return <View style={styles.wrap}>{renderBlocks(text, style)}</View>;
}

function renderBlocks(text: string, baseStyle?: TextStyle): ReactNode[] {
  const lines = text.split('\n');
  const result: ReactNode[] = [];
  const listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    result.push(
      <View key={`ul-${result.length}`} style={styles.list}>
        {listBuffer.map((item, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={[baseStyle, styles.bullet]}>•</Text>
            <Text style={[baseStyle, styles.listItem]}>{renderInline(item, baseStyle)}</Text>
          </View>
        ))}
      </View>,
    );
    listBuffer.length = 0;
  };

  lines.forEach((line, i) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1]!.length;
      const headingStyle =
        level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
      result.push(
        <Text key={`h-${i}`} style={[baseStyle, headingStyle]}>
          {renderInline(headingMatch[2]!, baseStyle)}
        </Text>,
      );
      return;
    }

    const listMatch = line.match(/^[-*•]\s+(.+)/);
    if (listMatch) {
      listBuffer.push(listMatch[1]!);
      return;
    }

    flushList();

    if (line.trim() === '') {
      if (i > 0 && lines[i - 1]?.trim() !== '') {
        result.push(<View key={`gap-${i}`} style={styles.paragraphGap} />);
      }
      return;
    }

    result.push(
      <Text key={`p-${i}`} style={baseStyle}>
        {renderInline(line, baseStyle)}
      </Text>,
    );
  });

  flushList();
  return result;
}

function renderInline(text: string, baseStyle?: TextStyle): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={[baseStyle, styles.bold]}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={i} style={[baseStyle, styles.italic]}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return part;
  });
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  paragraphGap: { height: 6 },
  h1: { fontSize: 17, fontWeight: '800', color: palette.ink900 },
  h2: { fontSize: 16, fontWeight: '800', color: palette.ink900 },
  h3: { fontSize: 15, fontWeight: '700', color: palette.ink900 },
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
  list: { gap: 4, paddingLeft: 2 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bullet: { lineHeight: 22, color: palette.ink700 },
  listItem: { flex: 1, lineHeight: 22 },
});
