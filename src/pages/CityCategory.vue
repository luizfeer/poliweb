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
          <div class="city-category-media">
            <q-img
              v-if="adImage(ad)"
              :src="adImage(ad)"
              :ratio="1"
              spinner-color="primary"
              class="city-category-img"
            />
            <div v-else class="city-category-placeholder">
              <q-icon name="storefront" size="28px" />
            </div>
          </div>
          <div class="city-category-body">
            <h2>{{ ad.name }}</h2>
            <p>{{ ad.description || addressText(ad) || 'Comercio local no Poliweb.' }}</p>
            <span v-if="addressText(ad)">{{ addressText(ad) }}</span>
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

        const adsResponse = await api.get(`/categories/${category.value.id}/ads?nonDeleted=true`)
        const list = adsResponse?.data?.categoryAds || []
        ads.value = list.filter((ad) => !ad.deletedAt && cityMatches(ad, city.value.city))
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

    const adImage = (ad) => {
      const logo = ad?.files?.logo?.find((file) => !file.deletedAt && file.link)?.link
      const gallery = ad?.files?.gallery?.find((file) => !file.deletedAt && file.link)?.link
      return logo || gallery || ''
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
      adImage,
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}
.city-category-card,
.city-category-empty {
  border-radius: 8px;
  background: #fff;
}
.city-category-card {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  color: inherit;
  text-decoration: none;
}
.city-category-media {
  aspect-ratio: 1.25;
  background: #e2e8f0;
}
.city-category-img {
  width: 100%;
  height: 100%;
}
.city-category-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #64748b;
  background: linear-gradient(135deg, #e0f2fe, #f8fafc);
}
.city-category-body {
  padding: 0.85rem;
}
.city-category-body h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
}
.city-category-body p {
  display: -webkit-box;
  min-height: 2.8em;
  margin: 0.35rem 0;
  overflow: hidden;
  color: #475569;
  font-size: 0.88rem;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.city-category-body span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}
.city-category-card-skeleton {
  height: 250px;
  border-radius: 8px;
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
  }
}
</style>
