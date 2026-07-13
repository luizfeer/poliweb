<template>
  <div v-if="addressId" class="section mt-6">
    <h2 class="section-title mb-3">Comércios da cidade</h2>
    <p class="text-xs text-gray-500 mb-3">
      Últimos cadastros na sua cidade.
    </p>
    <div v-if="loading" class="city-ads-scroll-wrapper">
      <div class="city-ads-scroll flex pb-2 -mb-2">
        <div v-for="i in 4" :key="'sk-' + i" class="city-ads-card city-ads-skeleton-card" />
      </div>
    </div>
    <div v-else-if="ads.length" class="city-ads-scroll-wrapper">
      <div class="city-ads-scroll flex pb-2 -mb-2">
        <router-link
          v-for="ad in adsWithPhotos"
          :key="ad.id"
          :to="adUrl(ad)"
          class="city-ads-card"
        >
          <div class="city-ads-card-header">
            <div class="city-ads-avatar">
              <img v-if="ad.logoLink" :src="ad.logoLink" class="city-ads-avatar-img" alt="" />
              <div v-else class="city-ads-avatar-placeholder">
                <AppIcon name="storefront" :size="20" class="text-gray-400" />
              </div>
            </div>
            <span class="city-ads-name">{{ ad.name }}</span>
            <a
              v-if="ad.whatsappPhone"
              :href="whatsappLink(ad.whatsappPhone)"
              target="_blank"
              rel="noopener noreferrer"
              class="city-ads-phone"
              @click.stop
            >
              <AppIcon name="whatsapp" :size="16" class="text-green-600" />
              <span>{{ formatPhone(ad.whatsappPhone) }}</span>
            </a>
            <span v-else class="city-ads-phone city-ads-phone-empty">Sem telefone</span>
          </div>
          <div class="city-ads-grid-wrap">
            <div class="city-ads-grid">
              <template v-if="ad.photos.length">
                <img
                  v-for="(url, i) in ad.photos"
                  :key="i"
                  :src="url"
                  loading="lazy"
                  class="city-ads-thumb"
                  alt=""
                />
              </template>
              <div v-else class="city-ads-grid-placeholder">
                <AppIcon name="image-plus" :size="24" class="text-gray-400" />
              </div>
            </div>
            <span v-if="ad.createdAt" class="city-ads-time">{{ timeAgo(ad.createdAt) }}</span>
          </div>
        </router-link>
      </div>
    </div>
    <p v-else-if="!loading && addressId" class="text-sm text-gray-500 py-4">Nenhum comércio cadastrado na sua cidade.</p>
  </div>
</template>

<script>
import AppIcon from 'components/AppIcon.vue'
import { timeAgo } from 'src/js/timeAgo'
import { FIVE_HOURS, getCached, setCached } from 'src/services/homeCache'

export default {
  name: 'CityAdsWidget',
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
    adsWithPhotos() {
      return this.ads
        .filter((ad) => ad && ad.id != null)
        .map((ad) => ({
          ...ad,
          photos: (ad.photoLinks && Array.isArray(ad.photoLinks))
            ? ad.photoLinks.slice(0, 6)
            : [],
        }))
    },
  },
  watch: {
    addressId: {
      immediate: true,
      handler(id, oldId) {
        if (id === oldId && oldId !== undefined) return
        if (id) {
          this.loadFromCache(id).then((hit) => {
            if (!hit) {
              this.fetchAds()
            }
          })
        } else {
          this.ads = []
        }
      },
    },
  },
  methods: {
    timeAgo,
    formatPhone(phone) {
      const n = String(phone || '').replace(/\D/g, '')
      if (n.length === 13 && n.startsWith('55')) {
        return n.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '($2) $3-$4')
      }
      if (n.length === 11) {
        return n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      }
      return phone
    },
    whatsappLink(phone) {
      const n = String(phone || '').replace(/\D/g, '')
      return `https://wa.me/${n.startsWith('55') ? n : '55' + n}`
    },
    adUrl(ad) {
      if (!ad?.id) return '/'
      const name = ad.name
      const slug = name
        ? encodeURIComponent(name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase())
        : ''
      return slug ? `/${ad.id}/${slug}` : `/${ad.id}`
    },
    async loadFromCache(addressId) {
      try {
        const key = `cityAds_${addressId}`
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
        const response = await this.$api.get(`/cities/${this.addressId}/ads`)
        if (this.fetchGen < 0 || fetchId !== this.fetchGen) return
        const raw = response?.data?.ads ?? []
        const list = Array.isArray(raw) ? raw : []
        this.ads = list
        setCached(`cityAds_${this.addressId}`, list).catch(() => {})
      } catch (err) {
        if (this.fetchGen < 0 || fetchId !== this.fetchGen) return
        const msg = err?.response?.data?.message || 'Erro ao carregar comércios'
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
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.city-ads-scroll-wrapper {
  margin-left: -1rem;
  margin-right: -1rem;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.city-ads-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.city-ads-scroll {
  display: flex;
  flex-wrap: nowrap;
  padding-left: 1rem;
  padding-right: 1rem;
  gap: 0.75rem;
}

.city-ads-card {
  flex-shrink: 0;
  width: 180px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow 0.2s;
  display: block;
  text-decoration: none;
  color: inherit;
}

.city-ads-card:active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.city-ads-card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 10px 8px;
  gap: 6px;
}

.city-ads-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f4f6;
}

.city-ads-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.city-ads-avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.city-ads-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.city-ads-phone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #16a34a;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.city-ads-phone:active {
  opacity: 0.8;
}

.city-ads-phone-empty {
  color: #9ca3af;
}

.city-ads-grid-wrap {
  position: relative;
  padding: 0 8px 8px;
}
.city-ads-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.city-ads-time {
  position: absolute;
  bottom: 10px;
  left: 12px;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  z-index: 2;
}

.city-ads-thumb {
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
  background: #f3f4f6;
}

.city-ads-grid-placeholder {
  grid-column: 1 / -1;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 6px;
}

.city-ads-skeleton-card {
  width: 180px;
  height: 220px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: city-ads-skeleton 1.5s ease-in-out infinite;
  border-radius: 12px;
}

@keyframes city-ads-skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
