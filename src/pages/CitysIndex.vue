<template>
  <q-page class="citys-index">
    <section class="citys-shell">
      <header class="citys-header">
        <div>
          <p class="citys-eyebrow">Cidades atendidas</p>
          <h1>Escolha sua cidade no Poliweb</h1>
          <p class="citys-subtitle">
            Veja as cidades com mais comercios cadastrados e acesse a pagina local com categorias, destaques e novos cadastros.
          </p>
        </div>
      </header>

      <q-input
        v-model="searchQuery"
        outlined
        clearable
        debounce="120"
        type="search"
        label="Buscar cidade"
        class="city-search"
      >
        <template #prepend>
          <AppIcon name="search" :size="20" class="text-gray-400" />
        </template>
      </q-input>

      <section class="city-ranking">
        <div class="city-section-head">
          <div>
            <h2>Ranking semanal</h2>
            <p>Maiores cidades no topo, atualizado semanalmente pelos cadastros encontrados.</p>
          </div>
          <q-spinner-dots v-if="rankingLoading" color="primary" size="28px" />
        </div>

        <div class="city-grid">
          <router-link
            v-for="(city, index) in filteredRankedCitys"
            :key="city.id"
            :to="cityUrl(city)"
            class="city-card"
            @click="selectCity(city)"
          >
            <span class="city-rank">#{{ index + 1 }}</span>
            <div class="city-card-main">
              <strong>{{ city.city }}</strong>
              <span>{{ city.state || 'BR' }}</span>
            </div>
            <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
          </router-link>
        </div>

        <p v-if="!filteredRankedCitys.length" class="city-empty">
          Nenhuma cidade encontrada para a busca.
        </p>
      </section>

      <section class="city-latest" v-if="latestInsertions.length">
        <div class="city-section-head">
          <div>
            <h2>Ultimas insercoes</h2>
            <p>Novos comercios cadastrados nas cidades do Poliweb.</p>
          </div>
        </div>

        <div class="latest-list">
          <router-link
            v-for="ad in latestInsertions"
            :key="`${ad.cityId}-${ad.id}`"
            :to="adUrl(ad)"
            class="latest-item"
          >
            <q-avatar size="42px" rounded>
              <img v-if="adImage(ad)" :src="adImage(ad)" alt="" />
              <AppIcon v-else name="storefront" :size="20" class="text-primary" />
            </q-avatar>
            <div>
              <strong>{{ ad.name }}</strong>
              <span>{{ ad.cityName }}{{ ad.createdLabel ? ` - ${ad.createdLabel}` : '' }}</span>
            </div>
          </router-link>
        </div>
      </section>
    </section>
  </q-page>
</template>

<script>
import { citysData } from 'src/js/citys'
import { adUrl, cityUrl, normalizeSearch, slugify } from 'src/js/seoRoutes'
import { FIVE_HOURS, getCached, setCached } from 'src/services/homeCache'

const RANKING_CACHE_KEY = 'cityRanking_v2'

function dateValue(value) {
  const time = value ? new Date(value).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(new Date(value))
}

export default {
  name: 'CitysIndex',
  data() {
    return {
      searchQuery: '',
      citys: [],
      ranking: {},
      latestInsertions: [],
      rankingLoading: false
    }
  },
  computed: {
    rankedCitys() {
      return [...this.citys].sort((a, b) => {
        const aStats = this.cityStats(a)
        const bStats = this.cityStats(b)
        if (bStats.adsCount !== aStats.adsCount) return bStats.adsCount - aStats.adsCount
        if (bStats.latestAt !== aStats.latestAt) return bStats.latestAt - aStats.latestAt
        return a.city.localeCompare(b.city)
      })
    },
    filteredRankedCitys() {
      const query = normalizeSearch(this.searchQuery)
      if (!query) return this.rankedCitys

      return this.rankedCitys.filter((city) => {
        const haystack = normalizeSearch(`${city.city} ${city.state || ''}`)
        return haystack.includes(query)
      })
    }
  },
  async mounted() {
    this.citys = [...citysData]
      .filter((city) => !city.deletedAt)
      .map((city) => ({ ...city, link: slugify(city.city) }))
      .sort((a, b) => a.city.localeCompare(b.city))

    const localization = this.readLocalization()
    if (localization?.city && !this.citys.some((city) => city.city === localization.city)) {
      this.citys.push({ ...localization, link: slugify(localization.city) })
    }

    await this.loadCachedRanking()
    await this.refreshRanking()
  },
  methods: {
    cityUrl,
    adUrl,
    readLocalization() {
      if (typeof localStorage === 'undefined') return null
      const raw = localStorage.getItem('localization')
      if (!raw) return null
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    },
    cityStats(city) {
      return this.ranking[city.id] || {
        adsCount: 0,
        latestAt: dateValue(city.createdAt),
        latestAds: []
      }
    },
    selectCity(city) {
      if (!city) return
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('localization', JSON.stringify(city))
      }
      this.$store?.dispatch?.('localization/setLocalization', city)
    },
    async loadCachedRanking() {
      try {
        const { hit, data } = await getCached(RANKING_CACHE_KEY, FIVE_HOURS)
        if (!hit || !data) return
        const cached = data
        this.ranking = cached.ranking || {}
        this.latestInsertions = cached.latestInsertions || []
      } catch {
        this.ranking = {}
        this.latestInsertions = []
      }
    },
    saveRanking() {
      setCached(RANKING_CACHE_KEY, {
        ranking: this.ranking,
        latestInsertions: this.latestInsertions
      }).catch(() => {})
    },
    async refreshRanking() {
      try {
        const { hit } = await getCached(RANKING_CACHE_KEY, FIVE_HOURS)
        if (hit) return
      } catch {
        // segue e recalcula
      }

      this.rankingLoading = true
      try {
        const response = await this.$api.get('/cities/ranking')
        const apiRanking = Array.isArray(response?.data?.ranking) ? response.data.ranking : []
        const byCity = new Map(apiRanking.map((item) => [Number(item.addressId), item]))
        const entries = this.citys.map((city) => {
          const stats = byCity.get(Number(city.id))
          const latestAds = (stats?.latestAds || []).map((ad) => ({
            ...ad,
            cityId: city.id,
            cityName: city.city,
            createdLabel: formatDate(ad.createdAt || ad.updatedAt)
          }))

          return [
            city.id,
            {
              adsCount: Number(stats?.adsCount || 0),
              latestAt: dateValue(stats?.latestAt || latestAds[0]?.createdAt || city.createdAt),
              latestAds
            }
          ]
        })

        this.ranking = Object.fromEntries(entries)
        this.latestInsertions = Object.values(this.ranking)
          .flatMap((item) => item.latestAds || [])
          .sort((a, b) => dateValue(b.createdAt || b.updatedAt) - dateValue(a.createdAt || a.updatedAt))
          .slice(0, 8)
        this.saveRanking()
      } finally {
        this.rankingLoading = false
      }
    },
    adImage(ad) {
      return ad?.logoLink || ad?.photoLinks?.[0] || ad?.files?.logo?.find((file) => !file.deletedAt && file.link)?.link || ''
    }
  }
}
</script>

<style scoped>
.citys-index {
  min-height: 100%;
  background: #f8fafc;
}
.citys-shell {
  width: min(1040px, 100%);
  margin: 0 auto;
  padding: 1rem 1rem 6rem;
}
.citys-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.citys-eyebrow {
  margin: 0 0 0.3rem;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
.citys-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 900;
  line-height: 1.05;
}
.citys-subtitle {
  max-width: 42rem;
  margin: 0.65rem 0 0;
  color: #475569;
  line-height: 1.55;
}
.city-search {
  margin-bottom: 1rem;
  background: #fff;
}
.city-ranking,
.city-latest {
  margin-top: 1rem;
}
.city-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
}
.city-section-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 900;
}
.city-section-head p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.86rem;
}
.city-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
}
.city-card,
.latest-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 72px;
  padding: 0.85rem;
  color: inherit;
  text-decoration: none;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}
.city-rank {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 900;
  font-size: 0.78rem;
  flex: 0 0 auto;
}
.city-card-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.city-card-main strong,
.latest-item strong {
  color: #0f172a;
  font-size: 0.95rem;
  line-height: 1.2;
}
.city-card-main span,
.latest-item span {
  color: #64748b;
  font-size: 0.78rem;
}
.latest-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 0.75rem;
}
.latest-item > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.15rem;
}
.city-empty {
  margin: 1rem 0 0;
  padding: 1rem;
  color: #64748b;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .citys-shell {
    padding-inline: 0.75rem;
  }
}
</style>
