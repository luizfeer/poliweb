import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { SearchEmptyState } from '@/components/search/SearchEmptyState';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import {
  fetchSearch,
  fetchSearchSuggest,
  type SearchHitResult,
  type SearchSuggestion,
} from '@/lib/api/search';
import type { SearchEntityType } from '@/lib/chat/types';
import { env } from '@/lib/env';
import { openPortalUrl } from '@/lib/navigation/open-portal-url';
import {
  QUICK_CATEGORIES,
  SEARCH_PLACEHOLDERS,
} from '@/lib/search/constants';
import { palette, radius, shadows } from '@/lib/theme/tokens';

type Props = {
  initialQuery?: string;
};

export function SearchScreen({ initialQuery = '' }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim());
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<SearchEntityType[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [hits, setHits] = useState<SearchHitResult[]>([]);
  const [cityName, setCityName] = useState<string | null>(null);
  const [usedSemantic, setUsedSemantic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const trimmed = query.trim();
  const showSuggestions = trimmed.length >= 2 && suggestions.length > 0 && submittedQuery !== trimmed;
  const hasSubmitted = submittedQuery.length >= 2;

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      void runSearch(initialQuery.trim(), selectedTypes);
    }
  }, []);

  useEffect(() => {
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        const next = await fetchSearchSuggest(trimmed);
        if (!controller.signal.aborted) setSuggestions(next);
      } finally {
        if (!controller.signal.aborted) setLoadingSuggest(false);
      }
    }, 280);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmed]);

  const runSearch = useCallback(async (q: string, types: SearchEntityType[]) => {
    if (q.length < 2) {
      setHits([]);
      setSubmittedQuery('');
      return;
    }

    setLoading(true);
    setSubmittedQuery(q);
    setSuggestions([]);
    Keyboard.dismiss();

    const result = await fetchSearch(q, {
      citySlug: env.defaultCitySlug,
      types: types.length ? types : undefined,
    });

    setHits(result.hits);
    setCityName(result.city?.name ?? null);
    setUsedSemantic(result.usedSemantic);
    setLoading(false);
  }, []);

  const submit = () => {
    void runSearch(trimmed, selectedTypes);
  };

  const toggleFilter = (type: SearchEntityType | null) => {
    const next =
      type === null
        ? []
        : selectedTypes.includes(type)
          ? selectedTypes.filter((t) => t !== type)
          : [...selectedTypes, type];
    setSelectedTypes(next);
    if (submittedQuery.length >= 2) {
      void runSearch(submittedQuery, next);
    }
  };

  const openSuggestion = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    openPortalUrl(suggestion.href);
  };

  const listHeader = (
    <View style={styles.listHeader}>
      {hasSubmitted ? (
        <>
          <SearchFilters selectedTypes={selectedTypes} onToggle={toggleFilter} />
          {!loading && hits.length > 0 ? (
            <Text style={styles.resultMeta}>
              {hits.length} resultado{hits.length === 1 ? '' : 's'} para{' '}
              <Text style={styles.resultMetaStrong}>{submittedQuery}</Text>
              {cityName ? ` em ${cityName}` : ''}
              {usedSemantic ? ' · busca inteligente' : ' · busca por texto'}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Categorias</Text>
          <View style={styles.quickGrid}>
            {QUICK_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.href}
                onPress={() => router.push(cat.href as never)}
                style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.9 : 1 }]}
              >
                <View style={styles.quickIcon}>
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={palette.clay500}
                  />
                </View>
                <Text style={styles.quickLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Pressable
        onPress={() =>
          router.push(
            (hasSubmitted
              ? `/assistente?q=${encodeURIComponent(submittedQuery)}`
              : '/assistente') as never,
          )
        }
        style={({ pressed }) => [styles.aiBanner, { opacity: pressed ? 0.94 : 1 }]}
      >
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={18} color={palette.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiTitle}>Quer perguntar do seu jeito?</Text>
          <Text style={styles.aiSub}>
            A TormentaIA entende clima, balsas, turismo, comércio e eventos da cidade.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={palette.clay500} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.headerClay}>
        <View style={styles.searchRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={palette.white} />
          </Pressable>

          <View style={styles.inputWrap}>
            <Ionicons name="search" size={18} color={palette.ink400} />
            <TextInput
              ref={inputRef}
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
              placeholderTextColor={palette.ink400}
              returnKeyType="search"
              onSubmitEditing={submit}
              style={styles.input}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {loadingSuggest ? (
              <ActivityIndicator size="small" color={palette.clay500} />
            ) : null}
            {trimmed.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={palette.ink400} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={submit}
            disabled={trimmed.length < 2 || loading}
            style={({ pressed }) => [
              styles.submitBtn,
              (trimmed.length < 2 || loading) && styles.submitBtnDisabled,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.submitText}>Buscar</Text>
          </Pressable>
        </View>

        {cityName && !hasSubmitted ? (
          <Text style={styles.cityHint}>Buscando em {cityName}</Text>
        ) : null}
      </SafeAreaView>

      {showSuggestions ? (
        <View style={styles.suggestPanel}>
          <Text style={styles.suggestTitle}>Sugestões rápidas</Text>
          {suggestions.map((s) => (
            <Pressable
              key={`${s.entityType}-${s.title}-${s.href}`}
              onPress={() => openSuggestion(s)}
              style={({ pressed }) => [styles.suggestRow, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestHitTitle} numberOfLines={1}>
                  {s.title}
                </Text>
                {s.subtitle ? (
                  <Text style={styles.suggestHitSub} numberOfLines={1}>
                    {s.subtitle}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="arrow-forward" size={16} color={palette.ink400} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <FlatList
        data={hasSubmitted ? hits : []}
        keyExtractor={(item) => `${item.entityType}-${item.entityId}`}
        renderItem={({ item }) => <SearchResultCard hit={item} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={palette.clay500} />
              <Text style={styles.loadingText}>Buscando…</Text>
            </View>
          ) : hasSubmitted ? (
            <SearchEmptyState query={submittedQuery} onPickQuery={(q) => {
              setQuery(q);
              void runSearch(q, selectedTypes);
            }} />
          ) : (
            <SearchEmptyState onPickQuery={(q) => {
              setQuery(q);
              void runSearch(q, selectedTypes);
            }} />
          )
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.paper },
  headerClay: {
    backgroundColor: palette.clay500,
    paddingHorizontal: 12,
    paddingBottom: 14,
    ...shadows.banner,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.white,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.ink900,
    padding: 0,
  },
  submitBtn: {
    backgroundColor: palette.ink900,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.pill,
    minHeight: 44,
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitText: { color: palette.white, fontSize: 13, fontWeight: '800' },
  cityHint: {
    marginTop: 8,
    marginLeft: 44,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  suggestPanel: {
    marginHorizontal: 12,
    marginTop: -6,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.ink100,
    overflow: 'hidden',
    zIndex: 10,
    ...shadows.pop,
  },
  suggestTitle: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    fontSize: 11,
    fontWeight: '800',
    color: palette.ink600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: palette.ink100,
  },
  suggestHitTitle: { fontSize: 14, fontWeight: '700', color: palette.ink900 },
  suggestHitSub: { fontSize: 12, color: palette.ink600, marginTop: 2 },
  listContent: { paddingHorizontal: 12, paddingTop: 12 },
  listHeader: { gap: 14, marginBottom: 12 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.ink600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '30%',
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.ink100,
    ...shadows.card,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.clay50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.ink900,
    textAlign: 'center',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: palette.clay50,
    borderWidth: 1,
    borderColor: palette.clay100,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.clay500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: 14, fontWeight: '800', color: palette.ink900 },
  aiSub: { marginTop: 2, fontSize: 12, color: palette.ink600, lineHeight: 17 },
  resultMeta: {
    fontSize: 13,
    color: palette.ink600,
    fontWeight: '500',
  },
  resultMetaStrong: { fontWeight: '800', color: palette.ink900 },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600', color: palette.ink600 },
});
