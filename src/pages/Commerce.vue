<template>
  <div class="ads-page-wrapper">
    <ads-page v-if="!loading && data" :data-ads="data" @updated="getData" />
    <div v-if="!loading && data" class="seo-content-wrapper">
      <q-card class="seo-breadcrumb-card">
        <nav class="seo-breadcrumb" aria-label="Breadcrumb">
          <router-link to="/" class="seo-breadcrumb-link">Início</router-link>
          <span class="seo-breadcrumb-sep">/</span>
          <router-link v-if="cityLabel" :to="cityCategoryLink()" class="seo-breadcrumb-link">{{ cityLabel }}</router-link>
          <span v-if="cityLabel" class="seo-breadcrumb-sep">/</span>
          <router-link v-if="primaryCategory" :to="categoryLink(primaryCategory)" class="seo-breadcrumb-link">{{ categoryLabel(primaryCategory) }}</router-link>
          <span v-if="primaryCategory" class="seo-breadcrumb-sep">/</span>
          <span class="seo-breadcrumb-current">{{ commerceName }}</span>
        </nav>
      </q-card>

      <div class="seo-layout-grid">
        <div class="seo-primary-column">
          <q-card class="seo-info-card">
            <div class="seo-info-head">
              <div>
                <p class="seo-eyebrow">Categorias e buscas relacionadas</p>
                <h2 class="seo-section-title">Veja {{ commerceName }} em outras buscas</h2>
                <p class="seo-section-text">
                  {{ categoriesLeadText }}
                </p>
              </div>
            </div>

            <div v-if="adCategories.length" class="seo-category-grid">
              <router-link
                v-for="category in adCategories"
                :key="category.id"
                :to="categoryLink(category)"
                class="seo-category-link"
              >
                <span class="seo-category-name">{{ categoryLabel(category) }}</span>
                <span class="seo-category-sub">
                  {{ categoryCityCta(category) }}
                </span>
              </router-link>
            </div>

            <div v-if="adCategories.length" class="seo-category-tags">
              <router-link
                v-for="category in adCategories"
                :key="`tag-${category.id}`"
                :to="categoryLink(category)"
                class="seo-category-tag"
              >
                {{ categoryLabel(category) }}
              </router-link>
            </div>
          </q-card>

          <q-card class="seo-summary-card">
            <p class="seo-eyebrow">Resumo local</p>
            <h2 class="seo-section-title">{{ summaryTitle }}</h2>
            <p class="seo-section-text">{{ localSummary }}</p>
          </q-card>
        </div>

        <q-card class="seo-faq-card">
          <div class="seo-faq-head">
            <p class="seo-eyebrow">Perguntas frequentes</p>
            <h2 class="seo-section-title">O que mais perguntam sobre {{ commerceName }}{{ citySuffix }}</h2>
            <p class="seo-section-text">
              Reunimos as dúvidas mais comuns sobre contato, localização, categorias e presença digital deste comércio{{ citySuffix }}.
            </p>
          </div>

          <div class="seo-faq-list">
            <q-expansion-item
              v-for="(item, index) in faqItems"
              :key="`${index}-${item.question}`"
              group="commerce-faq"
              dense
              expand-separator
              header-class="seo-faq-question"
              class="seo-faq-item"
            >
              <template #header>
                <q-item-section>
                  <div class="seo-faq-question-text">{{ item.question }}</div>
                </q-item-section>
              </template>
              <div class="seo-faq-answer" v-html="item.answer" />
            </q-expansion-item>
          </div>
        </q-card>
      </div>
    </div>
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
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
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
    const adCategories = ref([])

    const commerceName = computed(() => data.value?.name || 'este comércio')
    const cityLabel = computed(() => lastAddress.value?.city || '')
    const stateLabel = computed(() => lastAddress.value?.state || '')
    const cityStateLabel = computed(() =>
      [cityLabel.value, stateLabel.value].filter(Boolean).join(', ')
    )
    const citySuffix = computed(() =>
      cityStateLabel.value ? ` em ${cityStateLabel.value}` : ''
    )
    const primaryCategory = computed(() =>
      adCategories.value.find((category) => category.isPrimary) || adCategories.value[0] || null
    )

    const lastAddress = computed(() => {
      const ad = data.value || {}
      const addresses = ad.address || ad.addresses || []
      return addresses.length ? addresses[addresses.length - 1] : null
    })

    const activePhones = computed(() =>
      (data.value?.phones || []).filter((phone) => !phone.deletedAt)
    )

    const whatsappPhone = computed(() =>
      activePhones.value.find((phone) => phone.isWhatsapp)?.phone || ''
    )

    const regularPhone = computed(() =>
      activePhones.value.find((phone) => !phone.isWhatsapp)?.phone || activePhones.value[0]?.phone || ''
    )

    const categoryNames = computed(() =>
      adCategories.value.map((category) => categoryLabel(category))
    )

    const categoriesLeadText = computed(() => {
      if (!adCategories.value.length) {
        return `${commerceName.value} está publicado no Poliweb com página pública pronta para busca e indexação.`
      }

      const topCategories = categoryNames.value.slice(0, 3).join(', ')
      return cityLabel.value
        ? `${commerceName.value} aparece em buscas como ${topCategories} em ${cityLabel.value}. Explore as categorias abaixo para encontrar empresas parecidas, serviços próximos e outras opções da mesma região.`
        : `${commerceName.value} aparece em buscas como ${topCategories}. Explore as categorias abaixo para navegar por serviços relacionados e comércios parecidos.`
    })

    const summaryTitle = computed(() => {
      if (primaryCategory.value && cityStateLabel.value) {
        return `${commerceName.value}: ${categoryLabel(primaryCategory.value)} em ${cityStateLabel.value}`
      }
      if (primaryCategory.value) {
        return `${commerceName.value}: ${categoryLabel(primaryCategory.value)}`
      }
      return `${commerceName.value} no Poliweb`
    })

    const localSummary = computed(() => {
      const categoryText = categoryNames.value.length
        ? categoryNames.value.join(', ')
        : 'categorias ainda não informadas'
      const channels = [
        whatsappPhone.value ? 'WhatsApp' : '',
        regularPhone.value ? 'telefone' : '',
        data.value?.email ? 'email' : '',
        data.value?.website ? 'site' : '',
      ].filter(Boolean)
      const channelsText = channels.length ? ` Os principais canais públicos incluem ${channels.join(', ')}.` : ''

      if (cityStateLabel.value) {
        return `${commerceName.value} é um comércio localizado em ${cityStateLabel.value} e aparece no Poliweb nas categorias ${categoryText}.${channelsText}`
      }
      return `${commerceName.value} aparece no Poliweb nas categorias ${categoryText}.${channelsText}`
    })

    const faqItems = computed(() => {
      const ad = data.value || {}
      const address = lastAddress.value
      const mapQuery = address
        ? [ad.name, address.street, address.number, address.neighborhood, address.city, address.state, address.zipCode]
          .filter(Boolean)
          .join(', ')
        : ''
      const mapUrl = mapQuery
        ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}`
        : ''
      const email = ad.email || ''
      const site = ad.website || ''
      const instagram = ad.instagram || ''
      const facebook = ad.facebook || ''
      const galleryCount = (ad.files?.gallery || []).filter((item) => !item.deletedAt).length
      const videoCount = (ad.files?.videos || []).filter((item) => !item.deletedAt).length
      const categoriesText = categoryNames.value.length
        ? categoryNames.value.join(', ')
        : 'categorias não informadas'

      const maybeLink = (href, label) => href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>` : ''

      return [
        {
          question: `Como chegar e qual o mapa da ${commerceName.value}${citySuffix.value}?`,
          answer: address
            ? `Você pode chegar até ${commerceName.value} pelo endereço ${[address.street, address.number, address.neighborhood, address.city, address.state, address.zipCode].filter(Boolean).join(', ')}. ${mapUrl ? `Abra o mapa em ${maybeLink(mapUrl, 'Google Maps')}.` : ''}`
            : `${commerceName.value} ainda não informou um endereço completo para navegação por mapa.`
        },
        {
          question: `Quais os principais produtos, serviços ou categorias da ${commerceName.value}${citySuffix.value}?`,
          answer: adCategories.value.length
            ? `${commerceName.value} está relacionado às seguintes categorias no Poliweb: ${categoriesText}. Essas categorias ajudam a encontrar o comércio nas buscas do Google e dentro da plataforma${citySuffix.value}.`
            : `${commerceName.value} ainda não possui categorias públicas adicionais detalhadas nesta página.`
        },
        {
          question: `Qual o horário de funcionamento e o email da ${commerceName.value}${citySuffix.value}?`,
          answer: email
            ? `${commerceName.value} informa o email ${maybeLink(`mailto:${email}`, email)} para contato. O horário de funcionamento não foi publicado nesta página; vale confirmar diretamente com o estabelecimento antes de visitar.`
            : `${commerceName.value} ainda não publicou horário de funcionamento nem email detalhado nesta página.`
        },
        {
          question: `Qual o WhatsApp comercial da ${commerceName.value}${citySuffix.value}?`,
          answer: whatsappPhone.value
            ? `O WhatsApp comercial disponível para ${commerceName.value} é ${whatsappPhone.value}. Você também pode iniciar o contato direto pela página do comércio.`
            : `${commerceName.value} não informou um número de WhatsApp comercial nesta página.`
        },
        {
          question: `Qual o telefone celular da ${commerceName.value}${citySuffix.value}?`,
          answer: regularPhone.value
            ? `O telefone disponível de ${commerceName.value} é ${regularPhone.value}.`
            : `${commerceName.value} não informou telefone celular adicional nesta página.`
        },
        {
          question: `Quero ver fotos e vídeos da ${commerceName.value}${citySuffix.value}. A empresa possui Instagram e Facebook?`,
          answer: `${galleryCount || videoCount ? `${commerceName.value} possui ${galleryCount} foto(s) e ${videoCount} vídeo(s) publicados nesta página.` : `${commerceName.value} ainda não possui fotos ou vídeos publicados em quantidade visível nesta página.`} ${instagram ? `Instagram: ${maybeLink(instagram, instagram)}.` : 'Instagram não informado.'} ${facebook ? `Facebook: ${maybeLink(facebook, facebook)}.` : 'Facebook não informado.'}`
        },
        {
          question: `Qual o site, landing page ou blog da empresa ${commerceName.value}${citySuffix.value}?`,
          answer: site
            ? `O endereço digital informado por ${commerceName.value} é ${maybeLink(site, site)}.`
            : `${commerceName.value} não informou site, landing page ou blog nesta página.`
        },
        {
          question: `Qual o contato do setor de vendas e financeiro da ${commerceName.value}${citySuffix.value}?`,
          answer: email || regularPhone.value || whatsappPhone.value
            ? `Os canais públicos disponíveis de ${commerceName.value} são ${[email ? `email ${email}` : '', regularPhone.value ? `telefone ${regularPhone.value}` : '', whatsappPhone.value ? `WhatsApp ${whatsappPhone.value}` : ''].filter(Boolean).join(', ')}. Caso exista setor financeiro ou comercial separado, o ideal é solicitar o direcionamento pelo canal principal.`
            : `${commerceName.value} não divulgou um contato específico para vendas ou financeiro nesta página.`
        },
        {
          question: `Qual o contato para deixar currículo e participar de entrevista na ${commerceName.value}${citySuffix.value}?`,
          answer: email
            ? `Se você deseja enviar currículo para ${commerceName.value}, o canal público disponível nesta página é ${maybeLink(`mailto:${email}`, email)}. Recomendamos confirmar por esse contato se há vagas abertas.`
            : regularPhone.value || whatsappPhone.value
              ? `O comércio não publicou email de recrutamento, mas você pode tentar contato pelos canais públicos informados: ${[regularPhone.value, whatsappPhone.value].filter(Boolean).join(' / ')}.`
              : `${commerceName.value} não divulgou um contato específico para currículo ou entrevista nesta página.`
        }
      ]
    })

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
      const items = arr.length > 20 ? 20 : arr.length
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
        const [adResponse, categoriesResponse] = await Promise.all([
          api.get(`/categories/ads/${route.params.id}?nonDeleted=true`),
          api.get(`/categories/ads/${route.params.id}/categories`).catch(() => ({ data: { categories: [] } }))
        ])
        const ad = adResponse?.data
        if (!ad || ad.deletedAt) {
          data.value = null
          adCategories.value = []
          if (!silent) router.push('/')
          return
        }
        data.value = normalizeAd(ad)
        adCategories.value = categoriesResponse?.data?.categories ?? []
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
      const routeId = (route.params.id || '').toString()
      const rawSlug = (route.params.slug || '').toString()
      const routeName = rawSlug
        ? decodeURIComponent(rawSlug).replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
        : ''
      const name = ad.name || routeName
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
      const primaryCategoryName = primaryCategory.value ? categoryLabel(primaryCategory.value) : ''
      const faqEntities = faqItems.value.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer.replace(/<[^>]*>/g, ' ')
        }
      }))

      const locationParts = [city, state].filter(Boolean).join(', ')
      const pageTitle = [name, locationParts ? `em ${locationParts}` : '', primaryCategoryName].filter(Boolean).join(' | ')

      const descParts = [
        description ? description.slice(0, 90) : name,
        primaryCategoryName ? `${primaryCategoryName}.` : '',
        city && state ? `Localizado em ${city}, ${state}.` : city ? `Em ${city}.` : '',
        firstPhone ? `Tel: ${firstPhone}.` : '',
        categoryNames.value.length ? `Categorias: ${categoryNames.value.slice(0, 3).join(', ')}.` : '',
        'Encontre no Poliweb.'
      ].filter(Boolean)
      const metaDesc = descParts.join(' ').slice(0, 160)

      const keywordParts = [
        name,
        city,
        state,
        locationParts ? `${name} ${city}` : '',
        primaryCategoryName,
        city ? `${primaryCategoryName} em ${city}` : '',
        description ? description.slice(0, 80) : '',
        phonesStr,
        'Poliweb',
        'comércio',
        'negócio local',
        ...categoryNames.value
      ].filter(Boolean)

      const computedSlug = name
        ? name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
        : routeId || String(ad.id || '')
      const slug = rawSlug || computedSlug

      const seoBaseUrl = (process.env.SEO_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://www.poliwebapp.com.br').replace(/\/$/, '')
      const canonicalId = ad.id || routeId
      const canonicalUrl = canonicalId
        ? `${seoBaseUrl}/comercio/${canonicalId}/${encodeURIComponent(slug)}`
        : seoBaseUrl
      commerceCanonicalUrl.value = canonicalUrl

      const sameAs = [ad.website, ad.facebook, ad.instagram].filter(Boolean)
      const breadcrumbItems = [
        { name: 'Início', item: seoBaseUrl },
        ...(cityLabel.value ? [{ name: cityLabel.value, item: `${seoBaseUrl}/buscar` }] : []),
        ...(primaryCategoryName ? [{ name: primaryCategoryName, item: `${seoBaseUrl}${primaryCategory.value ? categoryLink(primaryCategory.value) : '/buscar'}` }] : []),
        { name, item: canonicalUrl },
      ]
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: name || undefined,
        description: description || undefined,
        ...(firstImage ? { image: firstImage } : {}),
        url: ad.website || canonicalUrl,
        ...(firstPhone ? { telephone: firstPhone } : {}),
        ...(ad.email ? { email: ad.email } : {}),
        ...(primaryCategoryName ? { keywords: [primaryCategoryName, ...categoryNames.value].join(', ') } : {}),
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
        ...(lastAddress ? { hasMap: `https://maps.google.com/maps?q=${encodeURIComponent([name, street, number, city, state, zipCode].filter(Boolean).join(', '))}` } : {}),
        ...(city ? { areaServed: { '@type': 'City', name: city } } : {}),
        ...(lastAddress?.coordinates?.lat != null && lastAddress?.coordinates?.long != null ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: lastAddress.coordinates.lat,
            longitude: lastAddress.coordinates.long
          }
        } : {}),
        ...(sameAs.length ? { sameAs } : {})
      }

      const jsonLdScripts = [jsonLd]

      if (breadcrumbItems.length) {
        jsonLdScripts.push({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.item
          }))
        })
      }

      if (faqEntities.length) {
        jsonLdScripts.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqEntities
        })
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
        script: name ? jsonLdScripts.map((item) => ({
          type: 'application/ld+json',
          innerHTML: JSON.stringify(item)
        })) : []
      }
    })

    const findCategoryById = (categoryId, list = adCategories.value) => {
      for (const item of list || []) {
        if (Number(item.id) === Number(categoryId)) return item
        const found = findCategoryById(categoryId, item.subcategories || [])
        if (found) return found
      }
      return null
    }

    const categoryLabel = (category) => {
      const parentId = category?.categoryId
      if (!parentId) return category?.name || ''
      const parent = findCategoryById(parentId)
      return parent?.name ? `${parent.name} / ${category.name}` : category.name
    }

    const categoryLink = (category) =>
      `/categorias/${category.id}/${encodeURIComponent(category.name || 'categoria')}`

    const cityCategoryLink = () => '/buscar'

    const categoryCityCta = (category) =>
      cityLabel.value
        ? `Ver ${commerceName.value} em ${categoryLabel(category)} em ${cityLabel.value}`
        : `Ver ${commerceName.value} em ${categoryLabel(category)}`

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

    return {
      data,
      loading,
      getData,
      copyCommerceLink,
      adCategories,
      commerceName,
      cityLabel,
      citySuffix,
      primaryCategory,
      categoriesLeadText,
      summaryTitle,
      localSummary,
      faqItems,
      categoryLabel,
      categoryLink,
      cityCategoryLink,
      categoryCityCta
    }
  }
}
</script>

<style scoped>
.ads-page-wrapper {
  min-height: 100vh;
  padding-top: 0.5rem;
  padding-bottom: env(safe-area-inset-bottom);
  background: linear-gradient(180deg, #eef2f6 0%, #e5e7eb 100%);
}
.seo-content-wrapper,
.seo-cta-wrapper {
  padding: 0 1rem 1rem;
}
.seo-content-wrapper {
  padding-top: 1rem;
}
.seo-layout-grid {
  min-width: 0;
}
.seo-primary-column {
  min-width: 0;
}
@media (min-width: 1024px) {
  .seo-content-wrapper,
  .seo-cta-wrapper {
    width: min(1180px, 100%);
    margin-left: auto;
    margin-right: auto;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .seo-layout-grid {
    display: grid;
    grid-template-columns: minmax(300px, 0.8fr) minmax(0, 1.35fr);
    gap: 1rem;
    align-items: start;
  }
  .seo-primary-column {
    display: grid;
    gap: 1rem;
  }
  .seo-primary-column .seo-info-card,
  .seo-primary-column .seo-summary-card,
  .seo-layout-grid .seo-faq-card {
    margin-bottom: 0;
  }
}
.seo-breadcrumb-card,
.seo-info-card,
.seo-summary-card,
.seo-faq-card,
.seo-cta-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}
.seo-breadcrumb-card,
.seo-info-card,
.seo-summary-card,
.seo-faq-card {
  margin-bottom: 1rem;
  padding: 1rem;
}
.seo-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.92rem;
}
.seo-breadcrumb-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}
.seo-breadcrumb-sep {
  color: #94a3b8;
}
.seo-breadcrumb-current {
  color: #0f172a;
  font-weight: 700;
}
.seo-info-head,
.seo-faq-head {
  margin-bottom: 1rem;
}
.seo-eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #2563eb;
}
.seo-section-title {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  line-height: 1.3;
  font-weight: 800;
  color: #111827;
}
.seo-section-text {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
}
.seo-category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.seo-category-link {
  display: block;
  padding: 0.95rem;
  border-radius: 14px;
  text-decoration: none;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
  border: 1px solid #dbeafe;
}
.seo-category-name {
  display: block;
  font-weight: 700;
  color: #1e3a8a;
  margin-bottom: 0.35rem;
}
.seo-category-sub {
  display: block;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.45;
}
.seo-category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.seo-category-tag {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  text-decoration: none;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-weight: 600;
}
.seo-faq-list {
  border-top: 1px solid #eef2f7;
}
.seo-faq-item {
  border-bottom: 1px solid #eef2f7;
}
.seo-faq-question {
  padding-left: 0;
  padding-right: 0;
}
.seo-faq-question-text {
  font-weight: 700;
  line-height: 1.5;
  color: #111827;
  padding: 0.35rem 0;
}
.seo-faq-answer {
  padding: 0 0 1rem;
  color: #4b5563;
  line-height: 1.7;
}
.seo-faq-answer :deep(a) {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
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
@media (max-width: 640px) {
  .seo-breadcrumb-card,
  .seo-info-card,
  .seo-summary-card,
  .seo-faq-card {
    padding: 0.9rem;
  }

  .seo-category-grid {
    grid-template-columns: 1fr;
  }
}
</style>
