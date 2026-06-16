<template>
  <q-page class="category-page">
    <div class="category-container">
      <template v-if="!loading">
        <div class="category-header">
          <button type="button" class="back-link" @click="$router.go(-1)">
            <AppIcon name="arrow-back" :size="22" />
            <span>Voltar</span>
          </button>
          <h1 class="category-title">{{ headingPrimary }}</h1>
          <p class="category-subtitle">{{ headingSecondary }}</p>
        </div>

        <div class="admin-actions" v-if="admin">
          <router-link :to="`/painel/ads/add/${$route.params.id}/${encodeURIComponent(adminCategoryParam)}`">
            <q-btn no-caps rounded unelevated class="admin-btn admin-btn-primary">
              <q-icon name="add_business" size="18px" class="q-mr-xs" />
              Novo anúncio
            </q-btn>
          </router-link>
          <router-link v-if="!ads.length" :to="`/painel/categorias/add/${$route.params.id}/${encodeURIComponent(adminCategoryParam)}`">
            <q-btn no-caps rounded unelevated class="admin-btn admin-btn-secondary">
              <q-icon name="category" size="18px" class="q-mr-xs" />
              Nova sub-categoria
            </q-btn>
          </router-link>
        </div>

        <div class="view-toggle-wrap">
          <q-btn-toggle
            v-model="viewMode"
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            no-caps
            rounded
            class="view-toggle"
            :options="[
              { label: 'Lista', value: 'list', icon: 'view_list' },
              { label: 'Grid', value: 'grid', icon: 'grid_view' }
            ]"
          />
        </div>

        <div v-if="ads.length === 0" class="empty-state">Nenhum comércio cadastrado nessa categoria.</div>

        <div v-else class="ads-grid" :class="`ads-grid-${viewMode}`">
          <router-link
            v-for="item in ads"
            :key="item.id"
            :to="'/' + item.id"
            class="ad-card-link"
          >
            <article class="ad-card" :class="`ad-card-${viewMode}`">
              <div class="ad-card-media" :class="`ad-card-media-${viewMode}`">
                <q-img
                  v-if="getGalleryBackdrop(item)"
                  :src="getGalleryBackdrop(item)"
                  :ratio="1"
                  class="ad-media-bg"
                  spinner-color="white"
                  spinner-size="26px"
                />
                <div v-else class="ad-media-bg ad-media-bg-fallback"></div>
                <div class="ad-media-overlay"></div>

                <div class="ad-logo-wrap">
                  <q-img
                    v-if="getLogo(item)"
                    :src="getLogo(item)"
                    :ratio="1"
                    :class="['ad-logo-round', `ad-logo-round-${viewMode}`]"
                    spinner-color="white"
                    spinner-size="20px"
                  />
                  <q-avatar
                    v-else
                    round
                    :class="['ad-logo-round', `ad-logo-round-${viewMode}`]"
                    :color="colors[Math.floor(Math.random() * colors.length)]"
                    text-color="white"
                  >
                    {{ initials(item.name) }}
                  </q-avatar>
                </div>
              </div>
              <div class="ad-card-body">
                <h2 class="ad-card-title">{{ item.name }}</h2>
                <p class="ad-card-desc">{{ formatDesc(item.description) || "Sem descrição no momento." }}</p>
              </div>
            </article>
          </router-link>
        </div>
      </template>

      <div v-else class="p-2">
        <div v-for="i in 10" :key="i">
          <q-skeleton type="QToolbar" class="my-2 h-[86px]"/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, watch, computed, onMounted, onServerPrefetch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useMeta, useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { queryClient } from 'boot/vue-query'
import { citysData } from 'src/js/citys'

const CATEGORIES_VIEW_KEY = 'poliweb_categories_view_mode'
const CATEGORY_ADS_STALE_TIME = 1000 * 60 * 5

function normalizeCity (s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function findCityIdByName (cityName) {
  if (!cityName) return null
  const n = normalizeCity(cityName)
  const city = citysData.find((c) => {
    const nc = normalizeCity(c.city)
    return nc === n || nc.includes(n) || n.includes(nc)
  })
  return city?.id ?? null
}

function findCategoryWithParent (list, id, parent = null) {
  for (const item of list || []) {
    if (Number(item.id) === Number(id)) return { category: item, parent }
    const sub = findCategoryWithParent(item.subcategories || [], id, item)
    if (sub) return sub
  }
  return null
}

function pickCityFromAds (ads) {
  for (const ad of ads || []) {
    const addrs = ad.address || ad.addresses
    const arr = Array.isArray(addrs) ? addrs : [addrs].filter(Boolean)
    if (arr.length) {
      const last = arr[arr.length - 1]
      const c = last?.city || last?.addressCity
      if (c) return String(c).trim()
    }
  }
  return ''
}

function pickOgImageFromAds (ads) {
  for (const ad of ads || []) {
    const g = ad?.files?.gallery?.filter((x) => !x.deletedAt && x.link)?.[0]?.link
    if (g) return g
    const l = ad?.files?.logo?.filter((x) => !x.deletedAt && x.link)?.[0]?.link
    if (l) return l
  }
  return ''
}

export default {
  name: 'CategoriesPage',
  setup () {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const $q = useQuasar()

    const stored = typeof localStorage !== 'undefined' && localStorage.getItem(CATEGORIES_VIEW_KEY)
    const viewMode = ref(stored === 'grid' || stored === 'list' ? stored : 'list')
    watch(viewMode, (val) => {
      try {
        localStorage.setItem(CATEGORIES_VIEW_KEY, val)
      } catch (_) {}
    })

    const colors = ref(['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning'])
    const ads = ref([])
    const admin = ref(false)
    const loading = ref(true)
    const categoryName = ref('')
    const cityLabel = ref('')

    const adminCategoryParam = computed(() => {
      const n = categoryName.value?.trim()
      if (n) return n
      const p = route.params.name
      if (!p) return 'categoria'
      try {
        return decodeURIComponent(String(p))
      } catch {
        return 'categoria'
      }
    })

    const headingPrimary = computed(() => {
      const cat = categoryName.value?.trim()
      const city = cityLabel.value?.trim()
      if (cat && city) return `Empresas de ${cat} em ${city}`
      if (cat) return `Empresas de ${cat}`
      return 'Comércios da categoria'
    })

    const headingSecondary = computed(() => {
      const city = cityLabel.value?.trim()
      const n = ads.value.length
      if (city && n) {
        return `${n} estabelecimento${n !== 1 ? 's' : ''} em ${city}. Escolha lista ou grade abaixo.`
      }
      if (n) return `${n} estabelecimento${n !== 1 ? 's' : ''}. Escolha lista ou grade abaixo.`
      return 'Escolha como deseja visualizar os estabelecimentos.'
    })

    const decodeRouteName = () => {
      const p = route.params.name
      if (!p) return ''
      try {
        return decodeURIComponent(String(p)).trim()
      } catch {
        return String(p).trim()
      }
    }

    const resolveCategoryLabel = async (categoryId, routeNameOverride, adsList) => {
      if (routeNameOverride) return routeNameOverride

      const loc = store.state.localization?.current
      let cityId = loc?.id
      const cityFromAds = pickCityFromAds(adsList)
      if (!cityId && cityFromAds) {
        cityId = findCityIdByName(cityFromAds)
      }
      if (!cityId) return ''

      try {
        const cats = await store.dispatch('categories/fetchCategories', { loc: { id: cityId } })
        const found = findCategoryWithParent(cats, categoryId)
        const raw = found?.category?.name
        return raw ? String(raw).trim() : ''
      } catch {
        return ''
      }
    }

    const applyPageData = async (categoryId, list) => {
      ads.value = (Array.isArray(list) ? list : []).filter((item) => !item.deletedAt)

      const routeNm = decodeRouteName()
      cityLabel.value = pickCityFromAds(ads.value) || store.state.localization?.current?.city || ''

      let resolved = routeNm
      if (!resolved) {
        resolved = await resolveCategoryLabel(categoryId, '', ads.value)
      }
      categoryName.value = resolved || 'Comércios locais'
    }

    const loadPage = async () => {
      const categoryId = route.params.id
      const queryKey = ['category-ads', String(categoryId)]
      const cachedAds = queryClient.getQueryData(queryKey)

      if (Array.isArray(cachedAds)) {
        await applyPageData(categoryId, cachedAds)
        loading.value = false
      } else {
        loading.value = true
      }

      try {
        const list = await queryClient.fetchQuery({
          queryKey,
          staleTime: CATEGORY_ADS_STALE_TIME,
          queryFn: async () => {
            const response = await api.get(`/categories/${categoryId}/ads?nonDeleted=true`)
            const raw = response?.data?.categoryAds || []
            return Array.isArray(raw) ? raw : []
          },
        })
        await applyPageData(categoryId, list)
      } catch (err) {
        if (!Array.isArray(cachedAds)) ads.value = []
        const msg = err?.response?.data?.message || 'Erro na conexão!'
        if (typeof window !== 'undefined' && !Array.isArray(cachedAds)) {
          $q.notify({
            color: 'negative',
            position: 'top',
            message: msg,
            icon: 'report_problem'
          })
        }
        if (typeof window !== 'undefined' && !Array.isArray(cachedAds)) {
          router.push({ path: '/' })
        }
      } finally {
        loading.value = false
      }
    }

    onServerPrefetch(async () => {
      await loadPage()
    })

    onMounted(() => {
      admin.value = !!localStorage.getItem('admin')
      if (!ads.value.length) {
        loadPage()
      }
    })

    watch(
      () => [route.params.id, route.params.name],
      () => {
        loadPage()
      }
    )

    useMeta(() => {
      const seoBase = (process.env.SEO_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://www.poliwebapp.com.br').replace(/\/$/, '')
      const catId = route.params.id || ''
      const slugPiece = (categoryName.value || 'categoria').trim() || 'categoria'
      const canonicalUrl = `${seoBase}/categorias/${catId}/${encodeURIComponent(slugPiece)}`

      const city = (cityLabel.value || '').trim()
      const cat = (categoryName.value || '').trim()
      const pageTitle =
        city && cat && cat !== 'Comércios locais'
          ? `Empresas de ${cat} em ${city}`
          : cat && cat !== 'Comércios locais'
            ? `Empresas de ${cat}`
            : 'Categorias'

      const count = ads.value.length
      const descParts = [
        city && cat && cat !== 'Comércios locais'
          ? `Encontre empresas e comércios de ${cat} em ${city} no Poliweb.`
          : cat && cat !== 'Comércios locais'
            ? `Encontre empresas e comércios de ${cat} no Poliweb.`
            : 'Lista de comércios e empresas locais no Poliweb.',
        count ? `${count} estabelecimento${count !== 1 ? 's' : ''} nesta categoria.` : '',
        'Agenda de negócios locais.'
      ].filter(Boolean)
      const metaDesc = descParts.join(' ').slice(0, 160)

      const keywordParts = [
        cat,
        city,
        cat && city ? `${cat} em ${city}` : '',
        cat && city ? `empresas de ${cat} em ${city}` : '',
        'Poliweb',
        'comércios',
        'empresas'
      ].filter(Boolean)

      const ogImage = pickOgImageFromAds(ads.value)

      const itemList = ads.value.slice(0, 24).map((ad, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: ad.name,
        url: ad.id ? `${seoBase}/${ad.id}` : undefined
      }))

      const jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: pageTitle,
          numberOfItems: ads.value.length,
          ...(itemList.length ? { itemListElement: itemList } : {})
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: seoBase },
            ...(city ? [{ '@type': 'ListItem', position: 2, name: city, item: `${seoBase}/buscar` }] : []),
            ...(cat && cat !== 'Comércios locais'
              ? [{ '@type': 'ListItem', position: city ? 3 : 2, name: cat, item: canonicalUrl }]
              : [])
          ]
        }
      ]

      return {
        title: pageTitle,
        titleTemplate: (title) => `${title} - Poliweb`,
        link: {
          canonical: { rel: 'canonical', href: canonicalUrl }
        },
        meta: {
          description: { name: 'description', content: metaDesc },
          keywords: { name: 'keywords', content: keywordParts.join(', ') },
          ogTitle: { property: 'og:title', content: pageTitle },
          ogDesc: { property: 'og:description', content: metaDesc },
          ogImage: { property: 'og:image', content: ogImage },
          ogImageAlt: { property: 'og:image:alt', content: pageTitle },
          ogUrl: { property: 'og:url', content: canonicalUrl },
          ogType: { property: 'og:type', content: 'website' },
          ogSiteName: { property: 'og:site_name', content: 'Poliweb' },
          ogLocale: { property: 'og:locale', content: 'pt_BR' },
          twitterCard: { name: 'twitter:card', content: 'summary_large_image' },
          twitterTitle: { name: 'twitter:title', content: pageTitle },
          twitterDesc: { name: 'twitter:description', content: metaDesc },
          twitterImage: { name: 'twitter:image', content: ogImage }
        },
        script: jsonLd.map((item) => ({
          type: 'application/ld+json',
          innerHTML: JSON.stringify(item)
        }))
      }
    })

    const initials = (name) => {
      if (!name) return ''
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const formatDesc = (str) => {
      if (!str) return
      if (str.length > 50) {
        return str.slice(0, 50) + '...'
      }
      return str
    }

    const getLogo = (item) => {
      if (!item?.files?.logo?.length) return null
      const logos = item.files.logo
        .filter((logo) => !logo.deletedAt && logo.link)
        .sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt))
      return logos.length ? logos[0].link : null
    }

    const getGalleryBackdrop = (item) => {
      if (!item?.files?.gallery?.length) return null
      const gallery = item.files.gallery
        .filter((img) => !img.deletedAt && img.link)
        .sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt))
      return gallery.length ? gallery[0].link : null
    }

    return {
      colors,
      ads,
      admin,
      loading,
      viewMode,
      categoryName,
      cityLabel,
      headingPrimary,
      headingSecondary,
      adminCategoryParam,
      initials,
      formatDesc,
      getLogo,
      getGalleryBackdrop,
      encodeURIComponent
    }
  }
}
</script>

<style scoped>
.category-page {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  min-height: 100%;
}

.category-container {
  padding: 12px 14px 20px;
}

.category-header {
  margin-bottom: 12px;
}

.back-link {
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #4338ca;
  font-weight: 600;
  margin-bottom: 8px;
  border-radius: 999px;
  padding: 6px 10px;
}

.category-title {
  margin: 0 !important;
  padding: 0;
  font-size: 1.15rem;
  line-height: 1.25;
  color: #0f172a;
  font-weight: 700;
}

.category-subtitle {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #64748b;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 8px;
}

.view-toggle-wrap {
  margin: 10px 0 14px;
}

.view-toggle :deep(.q-btn) {
  font-weight: 600;
  letter-spacing: 0;
}

.empty-state {
  background: #fff;
  border: 1px dashed #cbd5e1;
  color: #475569;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.ads-grid {
  display: grid;
  gap: 10px;
}

.ads-grid-list {
  grid-template-columns: 1fr;
}

.ads-grid-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ad-card-link {
  text-decoration: none;
}

.ad-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
}

.ad-card:active {
  transform: scale(0.98);
  border-color: #c7d2fe;
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.12);
}

.ad-card-list {
  display: flex;
  align-items: stretch;
}

.ad-card-grid {
  display: block;
}

.ad-card-media {
  position: relative;
  overflow: hidden;
  background: #f8fafc;
}

.ad-card-media-list {
  width: 88px;
  min-width: 88px;
  height: 88px;
}

.ad-card-media-grid {
  width: 100%;
  height: 132px;
}

.ad-media-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ad-media-bg-fallback {
  background: linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%);
}

.ad-media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.35) 100%);
}

.ad-logo-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.ad-logo-round {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 3px solid #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
}

.ad-logo-round-grid {
  width: 82px;
  height: 82px;
}

.ad-logo-round-list {
  width: 68px;
  height: 68px;
}

.ad-card-body {
  padding: 10px;
}

.ad-card-title {
  margin: 0;
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 700;
  line-height: 1.3;
}

.ad-card-desc {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.35;
  min-height: 30px;
}

.admin-btn {
  font-weight: 600;
  letter-spacing: 0;
  font-size: 0.85rem;
  padding: 6px 16px;
  min-height: 36px;
  border-radius: 999px;
}

.admin-btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.admin-btn-primary:active {
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);
}

.admin-btn-secondary {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
}

.admin-btn-secondary:active {
  box-shadow: 0 2px 6px rgba(8, 145, 178, 0.2);
}
</style>
