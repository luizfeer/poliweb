<template>
  <q-page class="city-category-page">
    <section class="city-category-shell">
      <nav class="city-category-breadcrumb" aria-label="breadcrumb">
        <router-link to="/">Inicio</router-link>
        <span>/</span>
        <router-link :to="cityUrl(city)">{{ city?.city || cityName }}</router-link>
        <span>/</span>
        <strong>{{ categoryName }}</strong>
      </nav>

      <header class="city-category-hero">
        <p class="city-category-eyebrow">{{ city?.state || 'Poliweb' }}</p>
        <h1>{{ pageTitle }}</h1>
        <p>{{ pageDescription }}</p>
      </header>

      <div v-if="loading" class="city-category-grid">
        <q-skeleton v-for="i in 8" :key="i" class="city-category-card-skeleton" />
      </div>

      <div v-else-if="ads.length" class="city-category-grid">
        <router-link v-for="ad in ads" :key="ad.id" :to="adUrl(ad)" class="city-category-card">
          <div class="city-category-media" :class="{ 'city-category-media--fallback': !adCoverImage(ad) }">
            <q-img
              v-if="adCoverImage(ad)"
              :src="adCoverImage(ad)"
              :alt="`Foto de ${ad.name}`"
              spinner-color="white"
              loading="lazy"
              class="city-category-img"
            />
            <div v-else class="city-category-placeholder">
              <q-icon name="storefront" size="38px" />
            </div>

            <div class="city-category-overlay"></div>

            <div class="city-category-logo" aria-hidden="true">
              <q-img
                v-if="adLogoImage(ad)"
                :src="adLogoImage(ad)"
                :alt="`Logo de ${ad.name}`"
                loading="lazy"
                class="city-category-logo-img"
              />
              <span v-else>{{ initials(ad.name) }}</span>
            </div>

            <div class="city-category-arrow" aria-hidden="true">
              <q-icon name="arrow_forward" size="18px" />
            </div>

            <div class="city-category-body">
              <span v-if="addressText(ad)" class="city-category-address">
                <q-icon name="place" size="14px" />
                {{ addressText(ad) }}
              </span>
              <h2>{{ ad.name }}</h2>
              <p>{{ ad.description || 'Conheça este comércio no Poliweb.' }}</p>
            </div>
          </div>
        </router-link>
      </div>

      <q-card v-else flat bordered class="city-category-empty">
        <q-icon name="search_off" size="28px" color="primary" />
        <h2>Nenhum comercio encontrado</h2>
        <p>Esta categoria ainda nao tem anuncios publicos em {{ cityName }}.</p>
      </q-card>

      <section v-if="relatedCategories.length" class="city-category-related">
        <h2>Outras categorias em {{ cityName }}</h2>
        <div class="city-category-chip-list">
          <router-link
            v-for="item in relatedCategories"
            :key="item.id"
            :to="categoryCityUrl(city, item)"
            class="city-category-chip"
          >
            {{ item.name }}
          </router-link>
        </div>
      </section>
    </section>
  </q-page>
</template>

<script>
import { computed, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useMeta } from 'quasar'
import { useRoute } from 'vue-router'
import { api } from 'boot/axios'
import { citysData } from 'src/js/citys'
import {
  adUrl,
  categoryCityUrl,
  cityUrl,
  findCategoryBySlug,
  findCityBySlug,
  flattenCategories,
  slugify
  , titleFromSlug
} from 'src/js/seoRoutes'

function addresses(ad) {
  const value = ad?.addresses || ad?.address
  return Array.isArray(value) ? value : [value].filter(Boolean)
}

function cityMatches(ad, cityName) {
  const target = slugify(cityName)
  return addresses(ad).some((address) => slugify(address?.city) === target)
}

export default {
  name: 'CityCategoryPage',
  setup() {
    const route = useRoute()
    const city = ref(null)
    const category = ref(null)
    const categories = ref([])
    const ads = ref([])
    const loading = ref(true)

    const cityName = computed(() => city.value?.city || titleFromSlug(route.params.citySlug))
    const categoryName = computed(() => category.value?.name || titleFromSlug(route.params.categorySlug))
    const pageTitle = computed(() => `${categoryName.value} em ${cityName.value}`)
    const pageDescription = computed(() => {
      const count = ads.value.length
      const suffix = count ? `${count} comercio${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}.` : 'Veja empresas, telefones, fotos e enderecos cadastrados.'
      return `Encontre ${categoryName.value} em ${cityName.value} no Poliweb. ${suffix}`
    })
    const relatedCategories = computed(() => {
      const current = category.value?.id
      return flattenCategories(categories.value)
        .filter((item) => item.id !== current && !item.deletedAt)
        .slice(0, 12)
    })

    const loadPage = async () => {
      loading.value = true
      city.value = findCityBySlug(citysData, route.params.citySlug)
      category.value = null
      categories.value = []
      ads.value = []

      if (!city.value) {
        loading.value = false
        return
      }

      try {
        const categoryResponse = await api.get(`/cities/${city.value.id}/categories?nonDeleted=true`)
        categories.value = categoryResponse?.data?.categories || []
        category.value = findCategoryBySlug(categories.value, route.params.categorySlug)

        if (!category.value?.id) return

        const categoryTree = flattenCategories([category.value])
          .filter((item) => item.id && !item.deletedAt)
        const adsResponses = await Promise.allSettled(
          categoryTree.map((item) => (
            api.get(`/categories/${item.id}/ads?nonDeleted=true`)
          ))
        )
        const list = adsResponses.flatMap((result) => (
          result.status === 'fulfilled'
            ? result.value?.data?.categoryAds || []
            : []
        ))
        const cityAds = list.filter((ad) => (
          ad?.id &&
          !ad.deletedAt &&
          cityMatches(ad, city.value.city)
        ))
        ads.value = [...new Map(cityAds.map((ad) => [ad.id, ad])).values()]
      } finally {
        loading.value = false
      }
    }

    onServerPrefetch(loadPage)
    onMounted(() => {
      if (!city.value) loadPage()
    })
    watch(() => [route.params.citySlug, route.params.categorySlug], loadPage)

    useMeta(() => {
      const seoBase = (process.env.SEO_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://www.poliwebapp.com.br').replace(/\/$/, '')
      const canonicalUrl = `${seoBase}/${slugify(cityName.value)}/${slugify(categoryName.value)}`
      const itemList = ads.value.slice(0, 24).map((ad, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: ad.name,
        url: `${seoBase}${adUrl(ad)}`
      }))
      const title = pageTitle.value
      const description = pageDescription.value.slice(0, 160)

      return {
        title,
        titleTemplate: (chunk) => `${chunk} - Poliweb`,
        link: {
          canonical: { rel: 'canonical', href: canonicalUrl }
        },
        meta: {
          description: { name: 'description', content: description },
          ogTitle: { property: 'og:title', content: title },
          ogDesc: { property: 'og:description', content: description },
          ogUrl: { property: 'og:url', content: canonicalUrl },
          ogType: { property: 'og:type', content: 'website' },
          twitterCard: { name: 'twitter:card', content: 'summary' }
        },
        script: [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: title,
              description,
              url: canonicalUrl,
              about: {
                '@type': 'Service',
                name: categoryName.value,
                areaServed: { '@type': 'City', name: cityName.value }
              }
            })
          },
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: title,
              numberOfItems: ads.value.length,
              itemListElement: itemList
            })
          },
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: seoBase },
                { '@type': 'ListItem', position: 2, name: cityName.value, item: `${seoBase}${cityUrl(city.value || cityName.value)}` },
                { '@type': 'ListItem', position: 3, name: categoryName.value, item: canonicalUrl }
              ]
            })
          }
        ]
      }
    })

    const firstActiveFile = (files) => {
      return files?.find((file) => !file.deletedAt && file.link)?.link || ''
    }
    const adCoverImage = (ad) => {
      return firstActiveFile(ad?.files?.gallery)
    }
    const adLogoImage = (ad) => {
      return firstActiveFile(ad?.files?.logo)
    }
    const initials = (name = '') => {
      return String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase() || 'P'
    }
    const addressText = (ad) => {
      const address = addresses(ad).slice(-1)[0]
      return [address?.neighborhood, address?.city, address?.state].filter(Boolean).join(', ')
    }

    return {
      city,
      categories,
      category,
      ads,
      loading,
      cityName,
      categoryName,
      pageTitle,
      pageDescription,
      relatedCategories,
      adUrl,
      adCoverImage,
      adLogoImage,
      initials,
      addressText,
      categoryCityUrl,
      cityUrl
    }
  }
}
</script>

<style scoped>
.city-category-page {
  min-height: 100%;
  background: #f8fafc;
}
.city-category-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 1rem 1rem 6rem;
}
.city-category-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  color: #64748b;
  font-size: 0.86rem;
  margin: 0.25rem 0 1rem;
}
.city-category-breadcrumb a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 700;
}
.city-category-hero {
  margin-bottom: 1rem;
}
.city-category-eyebrow {
  margin: 0 0 0.25rem;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
.city-category-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(1.8rem, 3vw, 3rem);
  font-weight: 900;
  line-height: 1.05;
}
.city-category-hero p {
  max-width: 46rem;
  margin: 0.6rem 0 0;
  color: #475569;
  line-height: 1.55;
}
.city-category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.city-category-card,
.city-category-empty {
  border-radius: 18px;
  background: #fff;
}
.city-category-card {
  position: relative;
  display: block;
  overflow: hidden;
  min-width: 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: inherit;
  text-decoration: none;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
  isolation: isolate;
  transition: transform 180ms ease, box-shadow 180ms ease;
}
.city-category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.18);
}
.city-category-card:focus-visible {
  outline: 3px solid #60a5fa;
  outline-offset: 3px;
}
.city-category-media {
  position: relative;
  min-height: 280px;
  overflow: hidden;
  background: #1e293b;
}
.city-category-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition: transform 450ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.city-category-card:hover .city-category-img {
  transform: scale(1.045);
}
.city-category-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: rgba(255, 255, 255, 0.7);
  background:
    radial-gradient(circle at 80% 15%, rgba(96, 165, 250, 0.65), transparent 35%),
    linear-gradient(145deg, #1e3a5f, #0f766e);
}
.city-category-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.08) 15%, rgba(15, 23, 42, 0.38) 50%, rgba(8, 15, 29, 0.96) 100%),
    linear-gradient(90deg, rgba(15, 23, 42, 0.18), transparent 60%);
}
.city-category-logo {
  position: absolute;
  z-index: 2;
  top: 14px;
  left: 14px;
  display: grid;
  width: 48px;
  height: 48px;
  overflow: hidden;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  background: #fff;
  color: #1e3a8a;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.3);
}
.city-category-logo-img {
  width: 100%;
  height: 100%;
}
.city-category-arrow {
  position: absolute;
  z-index: 2;
  top: 14px;
  right: 14px;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.38);
  color: #fff;
  backdrop-filter: blur(8px);
  transition: background 180ms ease, transform 180ms ease;
}
.city-category-card:hover .city-category-arrow {
  background: #2563eb;
  transform: translateX(2px);
}
.city-category-body {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  min-width: 0;
  padding: 4.5rem 1rem 1rem;
}
.city-category-body h2 {
  margin: 0;
  color: #fff;
  font-size: 1.12rem;
  font-weight: 900;
  line-height: 1.18;
  text-wrap: balance;
}
.city-category-body p {
  display: -webkit-box;
  min-height: 2.7em;
  margin: 0.45rem 0 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.82rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.city-category-address {
  display: flex;
  width: fit-content;
  max-width: 100%;
  align-items: center;
  gap: 0.22rem;
  margin: 0 0 0.45rem;
  overflow: hidden;
  color: #dbeafe;
  font-size: 0.72rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.city-category-card-skeleton {
  height: 280px;
  border-radius: 18px;
}
.city-category-empty {
  display: grid;
  gap: 0.4rem;
  justify-items: start;
  padding: 1.25rem;
}
.city-category-empty h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 800;
}
.city-category-empty p {
  margin: 0;
  color: #64748b;
}
.city-category-related {
  margin-top: 1.4rem;
}
.city-category-related h2 {
  margin: 0 0 0.75rem;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 900;
}
.city-category-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.city-category-chip {
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.86rem;
  font-weight: 800;
  text-decoration: none;
}
@media (max-width: 920px) {
  .city-category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .city-category-shell {
    padding-inline: 0.8rem;
  }
  .city-category-grid {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
  .city-category-media {
    min-height: 240px;
  }
  .city-category-card-skeleton {
    height: 240px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .city-category-card,
  .city-category-img,
  .city-category-arrow {
    transition: none;
  }
}
</style>
