<template>
  <q-page class="search-page">
    <section class="search-shell">
      <header class="search-hero">
        <button
          type="button"
          class="back-btn"
          aria-label="Voltar"
          @click="$router.go(-1)"
        >
          <AppIcon name="arrow-back" :size="20" />
        </button>

        <div class="hero-copy">
          <span class="hero-eyebrow">Busca inteligente</span>
          <h1>Encontre o comercio certo</h1>
          <p>
            {{ currentCityLabel ? `Resultados priorizados em ${currentCityLabel}.` : 'Digite um nome, categoria ou servico.' }}
          </p>
        </div>
      </header>

      <form class="search-form" @submit.prevent="submitSearch">
        <q-input
          v-model="searchInput"
          type="search"
          standout="bg-white"
          rounded
          clearable
          borderless
          input-class="search-input-field"
          placeholder="Nome do comercio, categoria ou servico"
          class="search-input-wrapper"
          debounce="350"
          @clear="clearSearch"
        >
          <template #prepend>
            <div class="search-input-icon">
              <AppIcon name="search" :size="20" class="text-gray-400" />
            </div>
          </template>
          <template #append>
            <q-btn
              round
              unelevated
              color="primary"
              type="submit"
              aria-label="Buscar"
              class="search-submit"
              :disable="!normalizedTerm"
            >
              <AppIcon name="arrow-forward" :size="18" class="text-white" />
            </q-btn>
          </template>
        </q-input>
      </form>

      <div v-if="history.length && !normalizedTerm && !loading" class="history-panel">
        <div class="section-head">
          <h2>Ultimos acessados</h2>
        </div>
        <div class="history-bubbles">
          <router-link
            v-for="item in history"
            :key="item.id"
            :to="goToAd(item)"
            class="history-bubble"
          >
            <img v-if="imageFor(item)" :src="imageFor(item)" :alt="item.name" class="history-bubble-img">
            <span v-else class="history-bubble-avatar">{{ initials(item.name) }}</span>
            <span class="history-bubble-name">{{ item.name }}</span>
          </router-link>
        </div>
      </div>

      <template v-if="loading">
        <div class="loading-list">
          <q-skeleton v-for="i in 6" :key="i" type="QToolbar" class="loading-row" />
        </div>
      </template>

      <section v-else-if="normalizedTerm" class="results-section">
        <div class="section-head">
          <div>
            <span class="section-kicker">Resultados para</span>
            <h2>{{ searchTerm }}</h2>
          </div>
          <span v-if="ads.length" class="results-count">{{ ads.length }} encontrado{{ ads.length > 1 ? 's' : '' }}</span>
        </div>

        <div v-if="ads.length === 0" class="empty-state">
          <div class="empty-icon">
            <AppIcon name="search-off" :size="24" />
          </div>
          <p class="empty-title">Nenhum resultado encontrado</p>
          <p class="empty-subtitle">Tente buscar pelo nome principal, uma categoria ou outro servico.</p>
        </div>

        <div v-else class="results-grid">
          <router-link
            v-for="item in ads"
            :key="item.id"
            :to="goToAd(item)"
            class="result-card"
          >
            <div class="result-media">
              <img v-if="imageFor(item)" :src="imageFor(item)" :alt="item.name" class="result-img">
              <div v-else class="result-avatar">{{ initials(item.name) }}</div>
            </div>

            <div class="result-body">
              <div class="result-meta">
                <span v-if="categoryLabel(item)" class="result-chip">{{ categoryLabel(item) }}</span>
                <span v-if="cityLabel(item)" class="result-city">
                  <AppIcon name="place" :size="14" />
                  {{ cityLabel(item) }}
                </span>
              </div>
              <h3 class="result-name">{{ item.name }}</h3>
              <p v-if="formatDesc(item.description)" class="result-desc">
                {{ formatDesc(item.description) }}
              </p>
              <div class="result-footer">
                <span v-if="isCurrentCity(item)" class="nearby-badge">Na cidade selecionada</span>
                <span v-if="item._matchLabel" class="match-label">{{ item._matchLabel }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </section>

      <section v-else class="start-panel">
        <div class="start-icon">
          <AppIcon name="storefront" :size="30" />
        </div>
        <h2>Busque com mais precisao</h2>
        <p>Use o nome do comercio quando souber. A cidade selecionada entra como prioridade nos resultados.</p>
      </section>
    </section>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { mapState } from 'vuex'
import { slugify } from 'src/js/seoRoutes'

const MIN_SEARCH_CHARS = 1

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function meaningfulTokens(value = '') {
  const ignored = new Set(['a', 'as', 'o', 'os', 'de', 'da', 'das', 'do', 'dos', 'e', 'em', 'na', 'no', 'para'])
  return normalizeText(value).split(' ').filter((word) => word && !ignored.has(word))
}

function lastAddress(item) {
  const list = item?.addresses || item?.address
  if (Array.isArray(list)) return list.length ? list[list.length - 1] : null
  return list || null
}

export default ({
  name: 'PageIndex',
  setup() {
    return {
      ads: ref([]),
      admin: ref(false),
      loading: ref(false),
      searchInput: ref(''),
      history: ref([]),
      searchRequestId: ref(0),
      searchTimer: ref(null)
    }
  },
  computed: {
    ...mapState('localization', ['current']),
    searchTerm() {
      return String(this.searchInput || '').trim()
    },
    normalizedTerm() {
      return normalizeText(this.searchTerm)
    },
    currentCity() {
      if (this.current?.id || this.current?.city) return this.current
      if (typeof localStorage === 'undefined') return null
      try {
        return JSON.parse(localStorage.getItem('localization') || 'null')
      } catch {
        return null
      }
    },
    currentCityLabel() {
      return [this.currentCity?.city, this.currentCity?.state].filter(Boolean).join(', ')
    }
  },
  watch: {
    searchInput(newValue, oldValue) {
      if (newValue === oldValue) return
      this.scheduleSearch()
    },
    '$route.params.terms': {
      immediate: true,
      handler(value) {
        const term = value ? decodeURIComponent(String(value)) : ''
        if (term !== this.searchInput) this.searchInput = term
        this.scheduleSearch()
      }
    }
  },
  methods: {
    submitSearch() {
      if (!this.searchTerm) {
        this.clearSearch()
        return
      }
      this.$router.push(`/buscar/${encodeURIComponent(this.searchTerm)}`)
      this.runSearch()
    },
    clearSearch() {
      this.ads = []
      this.searchInput = ''
      if (this.$route.path !== '/buscar') this.$router.push('/buscar')
    },
    scheduleSearch() {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.runSearch(), 250)
    },
    async runSearch() {
      const term = this.searchTerm
      const normalized = normalizeText(term)
      const requestId = ++this.searchRequestId

      if (normalized.length < MIN_SEARCH_CHARS) {
        this.ads = []
        this.loading = false
        return
      }

      this.loading = true
      try {
        const cityAds = await this.fetchCityAds()
        let results = this.filterAndRank(cityAds, term)

        if (results.length < 8) {
          const globalAds = await this.fetchGlobalSearch(term)
          results = this.filterAndRank([...cityAds, ...globalAds], term)
        }

        if (requestId === this.searchRequestId) {
          const hydrated = await this.hydrateTopResults(results.slice(0, 24))
          const reranked = this.filterAndRank([...hydrated, ...results.slice(24)], term)
          if (requestId === this.searchRequestId) this.ads = reranked.slice(0, 40)
        }
      } catch (err) {
        if (requestId !== this.searchRequestId) return
        const msg = err?.response?.data?.message || 'Erro ao buscar comercios'
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
      } finally {
        if (requestId === this.searchRequestId) this.loading = false
      }
    },
    async fetchCityAds() {
      const addressId = this.currentCity?.id
      if (!addressId) return []
      try {
        const response = await this.$api.get(`/cities/${addressId}/ads`)
        return Array.isArray(response?.data?.ads) ? response.data.ads : []
      } catch {
        return []
      }
    },
    async fetchGlobalSearch(term) {
      const fields = ['name', 'description', 'category']
      const responses = await Promise.allSettled(fields.map((field) => {
        const params = new URLSearchParams()
        params.set(field, term)
        params.set('nonDeleted', 'true')
        return this.$api.get(`/categories/ads?${params.toString()}`)
      }))

      return responses.flatMap((response) => {
        if (response.status !== 'fulfilled') return []
        return Array.isArray(response.value?.data?.ads) ? response.value.data.ads : []
      })
    },
    filterAndRank(items, term) {
      const unique = new Map()
      for (const item of items || []) {
        if (item?.id && !unique.has(item.id) && !item.deletedAt) unique.set(item.id, item)
      }

      const ranked = [...unique.values()]
        .map((item) => ({ ...item, ...this.matchInfo(item, term) }))
        .filter((item) => item._score > 0)
        .sort((a, b) => {
          if (b._score !== a._score) return b._score - a._score
          return String(a.name || '').localeCompare(String(b.name || ''))
        })

      const strongMatches = ranked.filter((item) => item._matchKind === 'name' || item._matchKind === 'category')
      if (strongMatches.length) return strongMatches
      return ranked
    },
    matchInfo(item, term) {
      const query = normalizeText(term)
      const tokens = meaningfulTokens(term)
      const name = normalizeText(item.name)
      const category = normalizeText(this.categoryLabel(item))
      const desc = normalizeText(item.description)
      const city = normalizeText(this.cityLabel(item))
      const haystack = [name, category, desc, city].filter(Boolean).join(' ')

      let score = 0
      let label = ''
      let kind = ''

      if (name === query) {
        score += 1200
        label = 'Nome exato'
        kind = 'name'
      } else if (name.startsWith(query)) {
        score += 900
        label = 'Comeca pelo nome'
        kind = 'name'
      } else if (name.includes(query)) {
        score += 700
        label = 'Nome contem a busca'
        kind = 'name'
      }

      if (tokens.length && tokens.every((token) => name.includes(token))) {
        score += 260
        if (!label) label = 'Nome relacionado'
        kind = kind || 'name'
      } else if (tokens.some((token) => name.includes(token))) {
        score += 120
        if (!label) label = 'Nome parecido'
        kind = kind || 'name'
      }

      if (category.includes(query) || tokens.some((token) => category.includes(token))) {
        score += 90
        if (!label) label = 'Categoria'
        kind = kind || 'category'
      }
      if (desc.includes(query) || tokens.some((token) => desc.includes(token))) {
        score += 35
        if (!label) label = 'Descricao'
        kind = kind || 'description'
      }
      if (!score && tokens.some((token) => haystack.includes(token))) {
        score += 15
        label = 'Relacionado'
      }
      if (this.isCurrentCity(item)) score += 320
      if (this.imageFor(item)) score += 12

      return { _score: score, _matchLabel: label, _matchKind: kind }
    },
    async hydrateTopResults(items) {
      const responses = await Promise.allSettled((items || []).map(async (item) => {
        if (this.imageFor(item) && this.cityLabel(item)) return item
        const response = await this.$api.get(`/categories/ads/${item.id}?nonDeleted=true`)
        return { ...item, ...response?.data }
      }))

      return responses.map((response, index) => {
        if (response.status === 'fulfilled' && response.value?.id) return response.value
        return items[index]
      })
    },
    isCurrentCity(item) {
      const current = this.currentCity
      const addr = lastAddress(item)
      if (!current || !addr) return false
      if (current.id && (Number(addr.addressId) === Number(current.id) || Number(addr.id) === Number(current.id))) return true
      return normalizeText(addr.city || addr.addressCity) === normalizeText(current.city)
    },
    categoryLabel(item) {
      if (typeof item?.category === 'string') return item.category
      if (item?.category?.name) return item.category.name
      if (item?.categoryName) return item.categoryName
      if (Array.isArray(item?.categories) && item.categories.length) {
        return item.categories.map((cat) => cat?.name || cat).filter(Boolean).join(', ')
      }
      return ''
    },
    cityLabel(item) {
      const addr = lastAddress(item)
      return [addr?.city || addr?.addressCity, addr?.state].filter(Boolean).join(', ')
    },
    imageFor(item) {
      const logo = Array.isArray(item?.files?.logo) ? [...item.files.logo] : []
      const gallery = Array.isArray(item?.files?.gallery) ? [...item.files.gallery] : []
      const sortedLogo = logo.filter((file) => file?.link).sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      if (sortedLogo[0]?.link) return sortedLogo[0].link
      const sortedGallery = gallery.filter((file) => file?.link).sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      return sortedGallery[0]?.link || ''
    },
    initials(name = '') {
      return String(name || '?').split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
    },
    formatDesc(str) {
      if (!str) return ''
      const text = String(str).replace(/\s+/g, ' ').trim()
      return text.length > 130 ? `${text.slice(0, 130)}...` : text
    },
    goToAd(item) {
      if (!item?.id) return '/'
      const slug = slugify(item.name)
      return slug ? `/comercio/${item.id}/${slug}` : `/comercio/${item.id}`
    }
  },
  mounted() {
    this.admin = localStorage.getItem('admin') ? true : false
    const stored = localStorage.getItem('history')
    try {
      this.history = (stored && JSON.parse(stored)) || []
      if (!Array.isArray(this.history)) this.history = []
    } catch {
      this.history = []
    }
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer)
  }
})
</script>

<style scoped>
.search-page {
  min-height: 100%;
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.12), transparent 28rem),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.search-shell {
  width: min(980px, 100%);
  margin: 0 auto;
  padding: 14px 14px 24px;
}

.search-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0 14px;
}

.back-btn {
  width: 42px;
  height: 42px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #334155;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-copy {
  min-width: 0;
}

.hero-eyebrow,
.section-kicker {
  display: block;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-copy h1 {
  margin: 1px 0 2px;
  color: #0f172a;
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.15;
}

.hero-copy p {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.35;
}

.search-form {
  position: sticky;
  top: 8px;
  z-index: 2;
}

.search-input-wrapper {
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(37, 99, 235, 0.12);
  border: 1px solid #dbeafe;
  overflow: hidden;
}

.search-input-wrapper :deep(.q-field__control),
.search-input-wrapper :deep(.q-field__marginal),
.search-input-wrapper :deep(.q-field__native) {
  border-radius: 999px !important;
}

.search-input-wrapper :deep(.q-field__control) {
  min-height: 56px;
  box-shadow: none !important;
}

.search-input-icon {
  padding-left: 0.95rem;
  padding-right: 0.45rem;
  display: flex;
  align-items: center;
}

.search-input-field {
  color: #0f172a;
  font-size: 0.96rem;
}

.search-submit {
  width: 38px;
  height: 38px;
  margin-right: 5px;
}

.history-panel,
.results-section,
.start-panel {
  margin-top: 18px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.section-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.2;
}

.results-count {
  color: #64748b;
  font-size: 0.78rem;
  white-space: nowrap;
}

.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.result-card {
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  text-decoration: none;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

.result-media {
  width: 78px;
  height: 78px;
  border-radius: 14px;
  overflow: hidden;
  background: #eff6ff;
}

.result-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.result-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d4ed8;
  font-size: 1.15rem;
  font-weight: 800;
  background: linear-gradient(135deg, #dbeafe, #dcfce7);
}

.result-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.result-meta,
.result-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.result-chip,
.nearby-badge,
.match-label {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.1;
}

.result-chip {
  color: #1d4ed8;
  background: #dbeafe;
}

.result-city {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #64748b;
  font-size: 0.72rem;
  min-width: 0;
}

.result-name {
  margin: 5px 0 2px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-desc {
  margin: 0 0 7px;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nearby-badge {
  color: #047857;
  background: #d1fae5;
}

.match-label {
  color: #475569;
  background: #f1f5f9;
}

.empty-state,
.start-panel {
  padding: 26px 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  text-align: center;
}

.empty-icon,
.start-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 10px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  background: #dbeafe;
}

.empty-title,
.start-panel h2 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
}

.empty-subtitle,
.start-panel p {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.4;
}

.history-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.history-bubble {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px 7px 7px;
  background: #fff;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.07);
  text-decoration: none;
  color: #334155;
  font-size: 0.86rem;
  font-weight: 700;
  max-width: 100%;
}

.history-bubble-img,
.history-bubble-avatar {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 999px;
}

.history-bubble-img {
  object-fit: cover;
}

.history-bubble-avatar {
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-bubble-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 170px;
}

.loading-list {
  margin-top: 18px;
}

.loading-row {
  height: 98px;
  margin-bottom: 10px;
  border-radius: 16px;
}

@media (min-width: 720px) {
  .search-shell {
    padding-top: 22px;
  }

  .hero-copy h1 {
    font-size: 1.65rem;
  }

  .results-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
