<template>
  <q-page class="city-page">
    <section class="city-shell">
      <nav class="city-breadcrumb" aria-label="breadcrumb">
        <router-link to="/">Inicio</router-link>
        <span>/</span>
        <strong>{{ cityName }}</strong>
      </nav>

      <header class="city-hero">
        <div>
          <p class="city-eyebrow">{{ city?.state || 'Cidade' }}</p>
          <h1>Comercios em {{ cityName }}</h1>
          <p>{{ seoText }}</p>
        </div>
        <q-btn
          outline
          color="primary"
          icon="location_city"
          label="Trocar cidade"
          to="/cidades"
          no-caps
        />
      </header>

      <section class="city-stats">
        <q-card flat bordered class="city-stat">
          <span>Categorias</span>
          <strong>{{ flatCategories.length }}</strong>
        </q-card>
        <q-card flat bordered class="city-stat">
          <span>Novos comercios</span>
          <strong>{{ newAds.length }}</strong>
        </q-card>
        <q-card flat bordered class="city-stat">
          <span>Em alta</span>
          <strong>{{ topAds.length }}</strong>
        </q-card>
      </section>

      <section class="city-section">
        <div class="city-section-head">
          <h2>Categorias populares em {{ cityName }}</h2>
          <router-link to="/cidades">Ver cidades</router-link>
        </div>

        <div v-if="loadingCategories" class="city-category-list">
          <q-skeleton v-for="i in 8" :key="i" class="city-category-skeleton" />
        </div>
        <div v-else class="city-category-list">
          <router-link
            v-for="category in popularCategories"
            :key="category.id"
            :to="categoryCityUrl(city, category)"
            class="city-category-item"
          >
            <span class="city-category-icon">
              <q-img
                v-if="categoryIcon(category)"
                :src="categoryIcon(category)"
                :alt="category.name"
                ratio="1"
                fit="contain"
                spinner-size="16px"
              />
              <q-icon v-else name="category" size="20px" />
            </span>
            <span>{{ category.name }}</span>
          </router-link>
        </div>
      </section>

      <section class="city-section city-split">
        <div>
          <div class="city-section-head">
            <h2>Comercios novos</h2>
          </div>
          <div v-if="loadingAds" class="city-card-list">
            <q-skeleton v-for="i in 4" :key="i" class="city-ad-skeleton" />
          </div>
          <div v-else class="city-card-list">
            <router-link v-for="ad in newAds" :key="ad.id" :to="adUrl(ad)" class="city-ad-card">
              <q-avatar size="46px" rounded>
                <img v-if="adImage(ad)" :src="adImage(ad)" alt="" />
                <q-icon v-else name="storefront" />
              </q-avatar>
              <span>
                <strong>{{ ad.name }}</strong>
                <small>{{ ad.description || addressText(ad) || 'Comercio local' }}</small>
              </span>
            </router-link>
          </div>
        </div>

        <div>
          <div class="city-section-head">
            <h2>Mais acessados</h2>
          </div>
          <div v-if="loadingTop" class="city-card-list">
            <q-skeleton v-for="i in 4" :key="i" class="city-ad-skeleton" />
          </div>
          <div v-else class="city-card-list">
            <router-link v-for="(ad, index) in topAds" :key="ad.id" :to="adUrl(ad)" class="city-ad-card city-top-card">
              <span class="city-rank">#{{ index + 1 }}</span>
              <span>
                <strong>{{ ad.name }}</strong>
                <small>{{ ad.categoryName || addressText(ad) || 'Destaque da cidade' }}</small>
              </span>
            </router-link>
          </div>
        </div>
      </section>

      <section class="city-seo-text">
        <h2>Guia local de {{ cityName }}</h2>
        <p>
          O Poliweb organiza empresas, prestadores de servico, lojas, restaurantes e outros comercios de {{ cityName }}
          por categoria. Use esta pagina para encontrar negocios locais, comparar opcoes, abrir paginas de comercio
          com fotos, endereco, telefone, WhatsApp e outras informacoes publicas.
        </p>
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
  findCityBySlug,
  flattenCategories,
  slugify,
  titleFromSlug
} from 'src/js/seoRoutes'

function addresses(ad) {
  const value = ad?.addresses || ad?.address
  return Array.isArray(value) ? value : [value].filter(Boolean)
}

export default {
  name: 'CityPage',
  setup() {
    const route = useRoute()
    const city = ref(null)
    const categories = ref([])
    const newAds = ref([])
    const topAds = ref([])
    const loadingCategories = ref(true)
    const loadingAds = ref(true)
    const loadingTop = ref(true)

    const cityName = computed(() => city.value?.city || titleFromSlug(route.params.cidade))
    const flatCategories = computed(() => flattenCategories(categories.value).filter((item) => !item.deletedAt))
    const popularCategories = computed(() => flatCategories.value.slice(0, 18))
    const seoText = computed(() => {
      const count = newAds.value.length
      const categoryCount = flatCategories.value.length
      return `Encontre comercios, servicos e categorias em ${cityName.value}. ${categoryCount ? `${categoryCount} categorias locais` : 'Categorias locais'}${count ? ` e ${count} novos comercios cadastrados` : ''}.`
    })

    const loadCategories = async () => {
      loadingCategories.value = true
      try {
        const response = await api.get(`/cities/${city.value.id}/categories?nonDeleted=true`)
        categories.value = response?.data?.categories || []
      } finally {
        loadingCategories.value = false
      }
    }

    const loadAds = async () => {
      loadingAds.value = true
      try {
        const response = await api.get(`/cities/${city.value.id}/ads`)
        newAds.value = (response?.data?.ads || []).filter((ad) => ad && ad.id).slice(0, 8)
      } finally {
        loadingAds.value = false
      }
    }

    const loadTopAds = async () => {
      loadingTop.value = true
      try {
        const response = await api.get(`/cities/${city.value.id}/top-ranked-ads`)
        topAds.value = (response?.data?.ads || []).filter((ad) => ad && ad.id).slice(0, 8)
      } finally {
        loadingTop.value = false
      }
    }

    const loadPage = async () => {
      city.value = findCityBySlug(citysData, route.params.cidade)
      categories.value = []
      newAds.value = []
      topAds.value = []

      if (!city.value) {
        loadingCategories.value = false
        loadingAds.value = false
        loadingTop.value = false
        return
      }

      await Promise.all([
        loadCategories(),
        loadAds(),
        loadTopAds()
      ])
    }

    onServerPrefetch(loadPage)
    onMounted(() => {
      if (!city.value) loadPage()
    })
    watch(() => route.params.cidade, loadPage)

    useMeta(() => {
      const seoBase = (process.env.SEO_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://www.poliwebapp.com.br').replace(/\/$/, '')
      const canonicalUrl = `${seoBase}${cityUrl(city.value || cityName.value)}`
      const title = `Comercios em ${cityName.value}`
      const description = seoText.value.slice(0, 160)

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
                '@type': 'City',
                name: cityName.value,
                addressRegion: city.value?.state,
                addressCountry: 'BR'
              }
            })
          },
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: `Categorias em ${cityName.value}`,
              numberOfItems: flatCategories.value.length,
              itemListElement: popularCategories.value.map((category, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: category.name,
                url: `${seoBase}${categoryCityUrl(city.value || cityName.value, category)}`
              }))
            })
          }
        ]
      }
    })

    const adImage = (ad) => ad?.logoLink || ad?.photoLinks?.[0] || ad?.files?.logo?.find((file) => !file.deletedAt && file.link)?.link || ''
    const addressText = (ad) => {
      const address = addresses(ad).slice(-1)[0] || ad?.address
      return [address?.neighborhood, address?.city, address?.state].filter(Boolean).join(', ')
    }
    const categoryIcon = (category) => category?.iconLink || category?.parent?.iconLink || ''

    return {
      city,
      categories,
      newAds,
      topAds,
      loadingCategories,
      loadingAds,
      loadingTop,
      cityName,
      flatCategories,
      popularCategories,
      seoText,
      adUrl,
      adImage,
      addressText,
      categoryIcon,
      categoryCityUrl,
      slugify,
      cityUrl
    }
  }
}
</script>

<style scoped>
.city-page {
  min-height: 100%;
  background: #f8fafc;
}
.city-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 1rem 1rem 6rem;
}
.city-breadcrumb {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  color: #64748b;
  font-size: 0.86rem;
  margin: 0.25rem 0 1rem;
}
.city-breadcrumb a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 700;
}
.city-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.city-eyebrow {
  margin: 0 0 0.3rem;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
.city-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 900;
  line-height: 1.02;
}
.city-hero p {
  max-width: 48rem;
  margin: 0.7rem 0 0;
  color: #475569;
  line-height: 1.55;
}
.city-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.2rem;
}
.city-stat {
  display: grid;
  gap: 0.25rem;
  border-radius: 8px;
  padding: 1rem;
  background: #fff;
}
.city-stat span {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
}
.city-stat strong {
  color: #0f172a;
  font-size: 1.6rem;
}
.city-section {
  margin-top: 1.2rem;
}
.city-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.city-section-head h2,
.city-seo-text h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 900;
}
.city-section-head a {
  color: #2563eb;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: none;
}
.city-category-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}
.city-category-item {
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.8rem;
  background: #fff;
  color: #0f172a;
  font-weight: 800;
  text-decoration: none;
}
.city-category-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 8px;
  background: #eff6ff;
  overflow: hidden;
}
.city-category-icon :deep(.q-img) {
  width: 24px;
  height: 24px;
}
.city-category-icon .q-icon {
  color: #2563eb;
}
.city-category-skeleton,
.city-ad-skeleton {
  height: 58px;
  border-radius: 8px;
}
.city-split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.city-card-list {
  display: grid;
  gap: 0.65rem;
}
.city-ad-card {
  display: flex;
  min-height: 70px;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  background: #fff;
  color: inherit;
  text-decoration: none;
}
.city-ad-card span:not(.city-rank) {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}
.city-ad-card strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.city-ad-card small {
  display: -webkit-box;
  overflow: hidden;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.city-rank {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 900;
}
.city-seo-text {
  margin-top: 1.4rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}
.city-seo-text p {
  max-width: 56rem;
  margin: 0.5rem 0 0;
  color: #475569;
  line-height: 1.65;
}
@media (max-width: 820px) {
  .city-hero {
    display: block;
  }
  .city-hero .q-btn {
    margin-top: 0.85rem;
  }
  .city-stats,
  .city-category-list,
  .city-split {
    grid-template-columns: 1fr;
  }
}
</style>
