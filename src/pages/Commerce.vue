<template>
  <div class="ads-page-wrapper">
    <ads-page v-if="!loading && data" :data-ads="data" @updated="getData" />
    <div v-if="!loading && data" class="seo-cta-wrapper">
      <q-card class="seo-cta-card">
        <q-item>
          <q-item-section>
            <q-item-label class="seo-cta-title">Quer encontrar outros comércios?</q-item-label>
            <q-item-label caption class="seo-cta-subtitle">
              Pesquise por categoria, cidade ou serviço no Poliweb.
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-card-actions align="between" class="seo-cta-actions">
          <router-link to="/buscar" class="seo-cta-btn seo-cta-primary">
            <q-icon name="search" size="18px" />
            <span>Buscar comércios</span>
          </router-link>
          <button type="button" class="seo-cta-btn" @click="copyCommerceLink()">
            <q-icon name="link" size="18px" />
            <span>Copiar link</span>
          </button>
        </q-card-actions>
      </q-card>
    </div>
    <div v-else class="p-3">
      <q-card>
        <q-item>
          <q-item-section avatar>
            <q-skeleton type="QAvatar" />
          </q-item-section>

          <q-item-section>
            <q-item-label>
              <q-skeleton type="text" />
            </q-item-label>
            <q-item-label caption>
              <q-skeleton type="text" />
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-skeleton height="200px" square />

        <q-card-actions align="right" class="q-gutter-md">
          <q-skeleton type="QBtn" />
          <q-skeleton type="QBtn" />
        </q-card-actions>
        <q-skeleton height="400px" square />
        <q-item-section>
          <q-item-label>
            <q-skeleton type="text" />
          </q-item-label>
          <q-item-label caption>
            <q-skeleton type="text" />
          </q-item-label>
        </q-item-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onServerPrefetch } from 'vue'
import { useMeta, useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'
import AdsPage from 'components/Ads'
import { api } from 'boot/axios'

export default {
  name: 'CommercePage',
  components: { AdsPage },

  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const route = useRoute()
    const data = ref(null)
    const loading = ref(true)
    const commerceCanonicalUrl = ref('')

    const filterDeleted = (arr) => {
      if (!arr) return arr
      try {
        return arr.filter((item) => !item.deletedAt)
      } catch (_) {
        return arr
      }
    }

    const filterEatchType = (arr) => {
      if (!arr) return
      const productsFiltered = []
      const items = arr.length > 4 ? 4 : arr.length
      try {
        for (let i = 0; i < items; i++) {
          let label = false
          if (arr[i] && arr[i].label && arr[i].label !== null) {
            label = JSON.parse(arr[i].label)
          }
          if (label && label.category && label.category.category) {
            const title = JSON.parse(arr[i].title)
            const subtitle = JSON.parse(arr[i].subtitle)
            productsFiltered.push({
              ...arr[i],
              label,
              title,
              subtitle,
              quantityCart: 0
            })
          }
        }
        return productsFiltered
      } catch (_) {}
    }

    const normalizeAd = (ad) => {
      const filtered = { ...ad }
      if (filtered.files?.gallery) {
        filtered.files.gallery = filterDeleted(filtered.files.gallery)
        filtered.files.gallery = filtered.files.gallery.sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt))
      }
      if (filtered.files?.logo) {
        filtered.files.logo = filtered.files.logo.sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt))
      }
      if (filtered.files?.videos) {
        filtered.files.videos = filterDeleted(filtered.files.videos)
        filtered.files.videos = filtered.files.videos.slice(0).reverse()
      }
      if (filtered.files?.ecommerce) {
        filtered.files.ecommerce = filterDeleted(filtered.files.ecommerce)
        filtered.files.ecommerce = filtered.files.ecommerce.slice(0).reverse()
        filtered.files.ecommercePreview = filterEatchType(filtered.files.ecommerce)
      }
      filtered.phones = filterDeleted(filtered.phones)
      filtered.address = filterDeleted(filtered.address)
      return filtered
    }

    const getData = async (opts = {}) => {
      const { silent = false } = opts
      try {
        loading.value = true
        const response = await api.get(`/categories/ads/${route.params.id}?nonDeleted=true`)
        const ad = response?.data
        if (!ad || ad.deletedAt) {
          data.value = null
          if (!silent) router.push('/')
          return
        }
        data.value = normalizeAd(ad)
      } catch (err) {
        console.log(err)
        // SSR: evita notificação e redirecionamentos ruidosos
        if (!silent) {
          $q.notify({
            color: 'negative',
            position: 'top',
            message: 'Erro na conexão!',
            icon: 'report_problem'
          })
          router.push({ path: '/' })
        }
      } finally {
        loading.value = false
      }
    }

    // SSR: aguarda os dados antes de renderizar HTML
    onServerPrefetch(async () => {
      if (!data.value) {
        await getData({ silent: true })
      }
    })

    onMounted(async () => {
      // Fallback no client (quando não estiver em SSR)
      if (!data.value) {
        await getData()
      }
    })

    useMeta(() => {
      const ad = data.value || {}
      const name = ad.name || ''
      const description = ad.description || ''

      const logoImg = ad.files?.logo?.filter(l => !l.deletedAt)?.[0]?.link || null
      const galleryImg = ad.files?.gallery?.filter(g => !g.deletedAt)?.[0]?.link || null
      const firstImage = galleryImg || logoImg

      const addresses = ad.address || ad.addresses || []
      const lastAddress = addresses.length ? addresses[addresses.length - 1] : null
      const city = lastAddress?.city || ''
      const state = lastAddress?.state || ''
      const zipCode = lastAddress?.zipCode || ''
      const street = lastAddress?.street || ''
      const number = lastAddress?.number || ''

      const activePhonesArr = (ad.phones || []).filter(p => !p.deletedAt)
      const phonesStr = activePhonesArr.map(p => p.phone).join(', ')
      const firstPhone = activePhonesArr[0]?.phone || ''

      const locationParts = [city, state].filter(Boolean).join(', ')
      const pageTitle = locationParts ? `${name} em ${locationParts}` : name

      const descParts = [
        description ? description.slice(0, 100) : name,
        city && state ? `Localizado em ${city}, ${state}.` : city ? `Em ${city}.` : '',
        firstPhone ? `Tel: ${firstPhone}.` : '',
        'Encontre no Poliweb.'
      ].filter(Boolean)
      const metaDesc = descParts.join(' ').slice(0, 160)

      const keywordParts = [
        name,
        city,
        state,
        locationParts ? `${name} ${city}` : '',
        description ? description.slice(0, 80) : '',
        phonesStr,
        'Poliweb',
        'comércio',
        'negócio local'
      ].filter(Boolean)

      const rawSlug = (route.params.slug || '').toString()
      const computedSlug = name
        ? name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
        : String(ad.id || '')
      const slug = rawSlug || computedSlug

      const seoBaseUrl = (process.env.SEO_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://ssr.poliwebapp.com.br').replace(/\/$/, '')
      const canonicalUrl = ad.id
        ? `${seoBaseUrl}/comercio/${ad.id}/${encodeURIComponent(slug)}`
        : seoBaseUrl
      commerceCanonicalUrl.value = canonicalUrl

      const sameAs = [ad.website, ad.facebook, ad.instagram].filter(Boolean)
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: name || undefined,
        description: description || undefined,
        ...(firstImage ? { image: firstImage } : {}),
        url: ad.website || canonicalUrl,
        ...(firstPhone ? { telephone: firstPhone } : {}),
        ...(ad.email ? { email: ad.email } : {}),
        ...(lastAddress ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: [street, number].filter(Boolean).join(', '),
            addressLocality: city,
            addressRegion: state,
            postalCode: zipCode,
            addressCountry: 'BR'
          }
        } : {}),
        ...(lastAddress?.coordinates?.lat != null && lastAddress?.coordinates?.long != null ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: lastAddress.coordinates.lat,
            longitude: lastAddress.coordinates.long
          }
        } : {}),
        ...(sameAs.length ? { sameAs } : {})
      }

      return {
        title: pageTitle || 'Poliweb',
        titleTemplate: title => `${title} - Poliweb`,
        link: {
          canonical: { rel: 'canonical', href: canonicalUrl }
        },
        meta: {
          description: { name: 'description', content: metaDesc },
          keywords: { name: 'keywords', content: keywordParts.join(', ') },
          ogTitle: { property: 'og:title', content: pageTitle },
          ogDesc: { property: 'og:description', content: metaDesc },
          ogImage: { property: 'og:image', content: firstImage || '' },
          ogImageAlt: { property: 'og:image:alt', content: name },
          ogUrl: { property: 'og:url', content: canonicalUrl },
          ogType: { property: 'og:type', content: 'business.business' },
          ogSiteName: { property: 'og:site_name', content: 'Poliweb' },
          ogLocale: { property: 'og:locale', content: 'pt_BR' },
          twitterCard: { name: 'twitter:card', content: 'summary_large_image' },
          twitterTitle: { name: 'twitter:title', content: pageTitle },
          twitterDesc: { name: 'twitter:description', content: metaDesc },
          twitterImage: { name: 'twitter:image', content: firstImage || '' }
        },
        script: name ? [{
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd)
        }] : []
      }
    })

    const copyCommerceLink = async () => {
      try {
        const link = commerceCanonicalUrl.value || (typeof window !== 'undefined' ? window.location.href : '')
        if (!link) return
        if (typeof window !== 'undefined' && window.navigator?.clipboard?.writeText) {
          await window.navigator.clipboard.writeText(link)
        }
        $q.notify({ color: 'positive', message: 'Link copiado!', icon: 'check_circle', position: 'bottom' })
      } catch (_) {
        $q.notify({ color: 'negative', message: 'Não foi possível copiar', icon: 'error', position: 'bottom' })
      }
    }

    return { data, loading, getData, copyCommerceLink }
  }
}
</script>

<style scoped>
.ads-page-wrapper {
  padding-top: 0.5rem;
  padding-bottom: env(safe-area-inset-bottom);
}
.seo-cta-wrapper {
  padding: 0 1rem 1rem;
}
.seo-cta-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
}
.seo-cta-title {
  font-weight: 700;
  color: #111827;
}
.seo-cta-subtitle {
  color: #6b7280;
}
.seo-cta-actions {
  padding: 0.75rem 1rem 1rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.seo-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.6rem 0.85rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}
.seo-cta-primary {
  border-color: rgba(37, 99, 235, 0.25);
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
}
</style>
