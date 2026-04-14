<template>
  <div v-if="addressId" class="section mt-6">
    <div class="top-ranked-header">
      <div>
        <h2 class="section-title mb-1">Em alta na sua cidade</h2>
        <p class="top-ranked-subtitle">
          Top 10 comércios com maior score desta cidade, atualizado a cada 5 horas.
        </p>
      </div>
      <span class="top-ranked-badge">Top 10</span>
    </div>

    <div v-if="loading" class="top-ranked-loading">
      <div class="top-ranked-hero-skeleton" />
      <div class="top-ranked-strip">
        <div v-for="i in 4" :key="'sk-' + i" class="top-ranked-item-skeleton" />
      </div>
    </div>

    <div v-else-if="heroAd" class="top-ranked-wrap">
      <router-link :to="adUrl(heroAd)" class="top-ranked-hero">
        <div class="top-ranked-hero-media">
          <template v-if="heroAd.photoLinks.length">
            <img
              v-for="(url, index) in heroAd.photoLinks.slice(0, 3)"
              :key="heroAd.id + '-photo-' + index"
              :src="url"
              loading="lazy"
              class="top-ranked-hero-photo"
              alt=""
            />
          </template>
          <div v-else class="top-ranked-hero-placeholder">
            <AppIcon name="storefront" :size="34" class="text-white" />
          </div>
          <div class="top-ranked-hero-overlay" />
          <div class="top-ranked-hero-rank">#1</div>
        </div>

        <div class="top-ranked-hero-body">
          <div class="top-ranked-hero-topline">
            <span class="top-ranked-score">Score {{ formatScore(heroAd.rankScore) }}</span>
            <span v-if="heroAd.categoryName" class="top-ranked-category">{{ heroAd.categoryName }}</span>
          </div>

          <div class="top-ranked-hero-main">
            <div class="top-ranked-avatar">
              <img v-if="heroAd.logoLink" :src="heroAd.logoLink" alt="" class="top-ranked-avatar-img" />
              <div v-else class="top-ranked-avatar-placeholder">
                <AppIcon name="storefront" :size="18" class="text-gray-500" />
              </div>
            </div>

            <div class="top-ranked-hero-copy">
              <p class="top-ranked-name">{{ heroAd.name }}</p>
              <p v-if="heroAd.description" class="top-ranked-description">
                {{ heroAd.description }}
              </p>
              <p v-else-if="addressSummary(heroAd)" class="top-ranked-description">
                {{ addressSummary(heroAd) }}
              </p>
            </div>
          </div>

          <div class="top-ranked-hero-footer">
            <span v-if="heroAd.rankUpdatedAt" class="top-ranked-updated">
              Atualizado {{ timeAgo(heroAd.rankUpdatedAt) }}
            </span>
            <a
              v-if="heroAd.whatsappPhone"
              :href="whatsappLink(heroAd.whatsappPhone)"
              target="_blank"
              rel="noopener noreferrer"
              class="top-ranked-whatsapp"
              @click.stop
            >
              <AppIcon name="whatsapp" :size="18" class="text-green-600" />
              <span>Chamar</span>
            </a>
          </div>
        </div>
      </router-link>

      <div class="top-ranked-strip-wrapper">
        <div class="top-ranked-strip">
          <router-link
            v-for="(ad, index) in restAds"
            :key="ad.id"
            :to="adUrl(ad)"
            class="top-ranked-item"
          >
            <div class="top-ranked-item-rank">#{{ index + 2 }}</div>
            <div class="top-ranked-item-avatar">
              <img v-if="ad.logoLink" :src="ad.logoLink" alt="" class="top-ranked-item-avatar-img" />
              <div v-else class="top-ranked-item-avatar-placeholder">
                <AppIcon name="storefront" :size="16" class="text-gray-500" />
              </div>
            </div>
            <div class="top-ranked-item-copy">
              <p class="top-ranked-item-name">{{ ad.name }}</p>
              <p class="top-ranked-item-meta">
                {{ ad.categoryName || 'Comércio' }} · score {{ formatScore(ad.rankScore) }}
              </p>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <p v-else-if="!loading && addressId" class="text-sm text-gray-500 py-4">
      Ainda não há comércios ranqueados para destacar nesta cidade.
    </p>
  </div>
</template>

<script>
import AppIcon from 'components/AppIcon.vue'
import { timeAgo } from 'src/js/timeAgo'
import { FIVE_HOURS, getCached, setCached } from 'src/services/homeCache'

export default {
  name: 'TopRankedAdsWidget',
  components: {
    AppIcon,
  },
  props: {
    addressId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      ads: [],
      loading: false,
      fetchGen: 0,
    }
  },
  beforeUnmount() {
    this.fetchGen = -1
  },
  computed: {
    heroAd() {
      return this.ads[0] || null
    },
    restAds() {
      return this.ads.slice(1, 10)
    },
  },
  watch: {
    addressId: {
      immediate: true,
      handler(id, oldId) {
        if (id === oldId && oldId !== undefined) return
        if (id) {
          this.loadFromCache(id).then((hit) => {
            if (!hit) this.fetchAds()
          })
        } else {
          this.ads = []
        }
      },
    },
  },
  methods: {
    timeAgo,
    formatScore(score) {
      const value = Number(score || 0)
      if (!Number.isFinite(value)) return '0'
      return value % 1 === 0 ? String(value) : value.toFixed(1)
    },
    adUrl(ad) {
      if (!ad?.id) return '/'
      const slug = ad.name
        ? encodeURIComponent(ad.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase())
        : ''
      return slug ? `/${ad.id}/${slug}` : `/${ad.id}`
    },
    whatsappLink(phone) {
      const n = String(phone || '').replace(/\D/g, '')
      return `https://wa.me/${n.startsWith('55') ? n : '55' + n}`
    },
    addressSummary(ad) {
      if (!ad?.address) return ''
      const a = ad.address
      return [a.neighborhood, a.city, a.state].filter(Boolean).join(', ')
    },
    async loadFromCache(addressId) {
      try {
        const key = `cityTopRankedAds_${addressId}`
        const { hit, data } = await getCached(key, FIVE_HOURS)
        if (hit && Array.isArray(data)) {
          this.ads = data
          return true
        }
      } catch (_) {
        this.ads = []
      }
      return false
    },
    async fetchAds() {
      if (!this.addressId || !this.$api) return
      const fetchId = ++this.fetchGen
      if (!this.ads.length) this.loading = true
      try {
        const response = await this.$api.get(`/cities/${this.addressId}/top-ranked-ads`)
        if (this.fetchGen < 0 || fetchId !== this.fetchGen) return
        const raw = response?.data?.ads ?? []
        const list = Array.isArray(raw) ? raw : []
        this.ads = list
        setCached(`cityTopRankedAds_${this.addressId}`, list).catch(() => {})
      } catch (err) {
        if (this.fetchGen < 0 || fetchId !== this.fetchGen) return
        const msg = err?.response?.data?.message || 'Erro ao carregar destaques'
        this.$q.notify({ color: 'negative', position: 'top', message: msg, icon: 'report_problem' })
        this.ads = []
      } finally {
        if (this.fetchGen >= 0 && fetchId === this.fetchGen) this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.top-ranked-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.top-ranked-subtitle {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #6b7280;
}

.top-ranked-badge {
  flex-shrink: 0;
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #7c2d12;
  background: linear-gradient(135deg, #fde68a, #fdba74);
  box-shadow: 0 8px 18px rgba(249, 115, 22, 0.16);
}

.top-ranked-loading {
  display: grid;
  gap: 0.8rem;
}

.top-ranked-hero-skeleton,
.top-ranked-item-skeleton {
  background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
  background-size: 200% 100%;
  animation: top-ranked-pulse 1.4s ease infinite;
  border-radius: 20px;
}

.top-ranked-hero-skeleton {
  min-height: 240px;
}

.top-ranked-item-skeleton {
  min-width: 180px;
  height: 92px;
}

.top-ranked-wrap {
  display: grid;
  gap: 0.85rem;
}

.top-ranked-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  min-height: 248px;
  border-radius: 24px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.28), transparent 40%),
    linear-gradient(135deg, #111827, #1f2937 58%, #374151);
  box-shadow: 0 18px 38px rgba(17, 24, 39, 0.16);
}

.top-ranked-hero-media {
  position: relative;
  min-height: 220px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.top-ranked-hero-photo,
.top-ranked-hero-placeholder {
  width: 100%;
  height: 100%;
  min-height: 220px;
  object-fit: cover;
}

.top-ranked-hero-placeholder {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.5), rgba(249, 115, 22, 0.55));
}

.top-ranked-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, rgba(17, 24, 39, 0.72));
  pointer-events: none;
}

.top-ranked-hero-rank {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 0.45rem 0.72rem;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.78);
  color: #f9fafb;
  font-size: 0.82rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.top-ranked-hero-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem;
  color: #f9fafb;
}

.top-ranked-hero-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.top-ranked-score,
.top-ranked-category {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0.2rem 0.62rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.top-ranked-score {
  color: #1f2937;
  background: linear-gradient(135deg, #fde68a, #f59e0b);
}

.top-ranked-category {
  color: #e5e7eb;
  background: rgba(255, 255, 255, 0.1);
}

.top-ranked-hero-main {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}

.top-ranked-avatar {
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: 18px;
  overflow: hidden;
  background: #f3f4f6;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.top-ranked-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.top-ranked-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-ranked-hero-copy {
  min-width: 0;
}

.top-ranked-name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
}

.top-ranked-description {
  margin: 0.45rem 0 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: rgba(249, 250, 251, 0.78);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.top-ranked-hero-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.top-ranked-updated {
  font-size: 0.74rem;
  color: rgba(229, 231, 235, 0.76);
}

.top-ranked-whatsapp {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  text-decoration: none;
  background: #f9fafb;
  color: #111827;
  font-size: 0.78rem;
  font-weight: 700;
}

.top-ranked-strip-wrapper {
  margin-left: -1rem;
  margin-right: -1rem;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.top-ranked-strip-wrapper::-webkit-scrollbar {
  display: none;
}

.top-ranked-strip {
  display: flex;
  gap: 0.75rem;
  padding: 0 1rem 0.2rem;
}

.top-ranked-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 220px;
  padding: 0.9rem;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.top-ranked-item-rank {
  font-size: 0.85rem;
  font-weight: 800;
  color: #b45309;
}

.top-ranked-item-avatar {
  width: 42px;
  height: 42px;
  min-width: 42px;
  border-radius: 14px;
  overflow: hidden;
  background: #f3f4f6;
}

.top-ranked-item-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.top-ranked-item-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-ranked-item-copy {
  min-width: 0;
}

.top-ranked-item-name {
  margin: 0;
  font-size: 0.87rem;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-ranked-item-meta {
  margin: 0.18rem 0 0;
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes top-ranked-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .top-ranked-hero {
    grid-template-columns: 1fr;
  }

  .top-ranked-hero-media,
  .top-ranked-hero-photo,
  .top-ranked-hero-placeholder {
    min-height: 180px;
  }
}
</style>
