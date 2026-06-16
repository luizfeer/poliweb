<template>
<div class="ads-page-wrapper">
    <!-- <router-link @click="$router.go(-1)"  class="cursor-pointer ml-2 "> <q-icon name="arrow_back" /> Voltar</router-link> -->
    <ads-page v-if="!loading" :data-ads="data" @updated="getData" />
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
import {
    ref,
    onMounted
} from "vue";
import AdsPage from 'components/Ads'
import {
    useMeta,
    useQuasar
} from 'quasar'
import {
    api
} from 'boot/axios'
import {
    useRouter,
    useRoute
} from 'vue-router'
export default {
    components: {
        AdsPage
    },

    setup() {
        const $q = useQuasar()
        const router = useRouter()
        const route = useRoute()
        let loading = ref(true)
        let data = ref({
            description: '',
            files: {
                gallery: [{
                    link: ''
                }]
            }
        })
        const filterDeleted = (arr) => {
          if (!arr) return
            try {
                return arr.filter((item) => {
                    return !item.deletedAt
                })
            } catch (error) {
                console.log(error)
                return arr
            }
        }
        const filterEatchType = (arr) => {
            if (!arr) return
            let productsFiltered = []
            let items = arr.length > 20 ? 20 : arr.length
            try {
                for (let i = 0; i < items; i++) {
                  let label = false
                    if(arr[i] && arr[i].label && arr[i].label !== null){
                      label = JSON.parse(arr[i].label)
                    }
                    if (label && label.category && label.category.category) {
                        let title = JSON.parse(arr[i].title)
                        let subtitle = JSON.parse(arr[i].subtitle)
                        productsFiltered.push({
                            ...arr[i],
                            label: label,
                            title: title,
                            subtitle: subtitle,
                            quantityCart: 0
                        })
                    }
                }
                return productsFiltered
            } catch (error) {
                console.log(error)
                // return arr
            }
        }
        const getData = () => api.get(`/categories/ads/${route.params.id}?nonDeleted=true`)
            .then((response) => {
                if (response.data) {
                    if (response.data.deletedAt) {
                        router.push('/')
                    }

                    let filtered = response.data
                    console.log(filtered)
                    if (filtered.files && filtered.files.gallery) {
                        filtered.files.gallery = filterDeleted(filtered.files.gallery)
                        filtered.files.gallery = filtered.files.gallery.sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt));

                    }
                    if (filtered.files && filtered.files.logo) {
                        filtered.files.logo = filtered.files.logo.sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt));
                    }
                    if (filtered.files && filtered.files.videos) {
                        filtered.files.videos = filterDeleted(filtered.files.videos)
                        filtered.files.videos = filtered.files.videos.slice(0).reverse();
                    }
                    if(filtered.files && filtered.files.ecommerce){
                        filtered.files.ecommerce = filterDeleted(filtered.files.ecommerce)
                        filtered.files.ecommerce = filtered.files.ecommerce.slice(0).reverse();
                        filtered.files.ecommercePreview = filterEatchType(filtered.files.ecommerce)
                    }
                    filtered.phones = filterDeleted(filtered.phones)
                    filtered.address = filterDeleted(filtered.address)
                    data.value = filtered
                    loading.value = false
                }
            })
            .catch((err) => {
                console.log(err)
                let msg = 'Erro na conexão!'
                $q.notify({
                    color: 'negative',
                    position: 'top',
                    message: msg,
                    icon: 'report_problem'
                })
                router.push({
                    path: '/'
                })
            })
            .finally(() => {})
        onMounted(async () => {
            await getData()

        })
        console.log('123', data.value.files)

        useMeta(() => {
            const ad = data.value
            const name = ad.name || ''
            const description = ad.description || ''

            // Melhor imagem disponível: galeria ou logo
            const logoImg = ad.files?.logo?.filter(l => !l.deletedAt)?.[0]?.link || null
            const galleryImg = ad.files?.gallery?.filter(g => !g.deletedAt)?.[0]?.link || null
            const firstImage = galleryImg || logoImg

            // Endereço (o campo pode vir como 'address' ou 'addresses')
            const addresses = ad.address || ad.addresses || []
            const lastAddress = addresses.length ? addresses[addresses.length - 1] : null
            const city = lastAddress?.city || ''
            const state = lastAddress?.state || ''
            const zipCode = lastAddress?.zipCode || ''
            const street = lastAddress?.street || ''
            const number = lastAddress?.number || ''

            // Telefones
            const activePhonesArr = (ad.phones || []).filter(p => !p.deletedAt)
            const phonesStr = activePhonesArr.map(p => p.phone).join(', ')
            const firstPhone = activePhonesArr[0]?.phone || ''

            // Título rico: "Nome em Cidade, Estado"
            const locationParts = [city, state].filter(Boolean).join(', ')
            const pageTitle = locationParts ? `${name} em ${locationParts}` : name

            // Descrição meta concatenada (máx 160 chars)
            const descParts = [
                description ? description.slice(0, 100) : name,
                city && state ? `Localizado em ${city}, ${state}.` : city ? `Em ${city}.` : '',
                firstPhone ? `Tel: ${firstPhone}.` : '',
                'Encontre no Poliweb.'
            ].filter(Boolean)
            const metaDesc = descParts.join(' ').slice(0, 160)

            // Palavras-chave: nome + cidade + estado + descrição + telefones + categoria
            const keywordParts = [
                name,
                city,
                state,
                locationParts ? `${name} ${city}` : '',
                description ? description.slice(0, 80) : '',
                phonesStr,
                'Poliweb',
                'anúncio',
                'negócio local'
            ].filter(Boolean)

            // URL canônica
            const adSlug = name
                ? name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
                : String(ad.id || '')
            const canonicalUrl = ad.id
                ? `https://www.poliwebapp.com.br/${ad.id}/${adSlug}`
                : 'https://www.poliwebapp.com.br'

            // JSON-LD LocalBusiness para Google Rich Results
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
                    description: {
                        name: 'description',
                        content: metaDesc
                    },
                    keywords: {
                        name: 'keywords',
                        content: keywordParts.join(', ')
                    },
                    // Open Graph
                    ogTitle: {
                        property: 'og:title',
                        content: pageTitle
                    },
                    ogDesc: {
                        property: 'og:description',
                        content: metaDesc
                    },
                    ogImage: {
                        property: 'og:image',
                        content: firstImage || ''
                    },
                    ogImageAlt: {
                        property: 'og:image:alt',
                        content: name
                    },
                    ogUrl: {
                        property: 'og:url',
                        content: canonicalUrl
                    },
                    ogType: {
                        property: 'og:type',
                        content: 'business.business'
                    },
                    ogSiteName: {
                        property: 'og:site_name',
                        content: 'Poliweb'
                    },
                    ogLocale: {
                        property: 'og:locale',
                        content: 'pt_BR'
                    },
                    // Twitter Card
                    twitterCard: {
                        name: 'twitter:card',
                        content: 'summary_large_image'
                    },
                    twitterTitle: {
                        name: 'twitter:title',
                        content: pageTitle
                    },
                    twitterDesc: {
                        name: 'twitter:description',
                        content: metaDesc
                    },
                    twitterImage: {
                        name: 'twitter:image',
                        content: firstImage || ''
                    }
                },
                script: name ? [{
                    type: 'application/ld+json',
                    innerHTML: JSON.stringify(jsonLd)
                }] : []
            }
        })
        return {
            data,
            loading,
            getData
        };
    }
}
</script>

<style scoped>
.ads-page-wrapper {
  padding-top: 0.5rem;
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
