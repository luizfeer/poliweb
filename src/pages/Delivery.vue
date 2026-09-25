<template>
  <q-page class="delivery-page">
    <div class="delivery-shell">
      <Location class="delivery-location" redirect-to="/delivery" />
      <header class="delivery-hero">
        <div class="delivery-hero-art" aria-hidden="true"><span>✦</span><q-icon name="restaurant_menu" /></div>
        <div class="delivery-hero-content">
          <span class="delivery-kicker">POLIWEB DELIVERY</span>
          <h1>O próximo pedido começa aqui.</h1>
          <p>Escolha o que dá vontade, veja quem está aberto e peça direto para o comércio da sua cidade.</p>
          <div class="delivery-hero-pills">
            <span><q-icon name="location_on" /> {{ city?.city || current?.city || 'Escolha sua cidade' }}</span>
            <span v-if="openStores.length"><span class="delivery-pulse" /> {{ openStores.length }} {{ openStores.length === 1 ? 'loja aberta' : 'lojas abertas' }} agora</span>
          </div>
        </div>
      </header>

      <template v-if="loading">
        <div class="delivery-skeletons"><q-skeleton v-for="i in 4" :key="i" type="rect" height="220px" /></div>
      </template>
      <template v-else-if="stores.length">
        <section v-if="availablePopularProducts.length" class="delivery-section">
          <div class="delivery-section-heading"><div><span class="delivery-section-kicker">ESCOLHAS DA CIDADE</span><h2>Mais pedidos</h2><p>Produtos que aparecem com frequência nos pedidos do Poliweb.</p></div></div>
          <div class="delivery-products">
            <router-link v-for="product in availablePopularProducts" :key="product.id" :to="`/loja/${product.adId}/produto/${product.id}`" class="delivery-product">
              <img :src="product.imageUrl" :alt="product.name" loading="lazy" />
              <div><strong>{{ product.name }}</strong><small>{{ shopName(product.adId) }}</small><b>{{ money(product.priceCents) }}</b></div>
              <span class="delivery-product-arrow"><q-icon name="arrow_forward" /></span>
            </router-link>
          </div>
        </section>

        <section class="delivery-section" id="lojas">
          <div class="delivery-section-heading"><div><span class="delivery-section-kicker">EXPLORAR DELIVERY</span><h2>Encontre sua próxima refeição</h2><p>Cardápios locais com pedido direto pelo WhatsApp da loja.</p></div><span class="delivery-total">{{ filteredStores.length }} {{ filteredStores.length === 1 ? 'loja' : 'lojas' }}</span></div>
          <div class="delivery-controls">
            <q-input v-model="search" filled clearable debounce="200" class="delivery-search" placeholder="Buscar loja, comida ou categoria" aria-label="Buscar delivery"><template #prepend><q-icon name="search" /></template></q-input>
            <q-select v-model="sortBy" filled emit-value map-options :options="sortOptions" label="Ordenar" class="delivery-sort" />
          </div>
          <div class="delivery-filters" role="group" aria-label="Filtros de delivery">
            <button type="button" :class="{ active: !onlyOpen }" @click="onlyOpen = false">Todas ({{ stores.length }})</button>
            <button type="button" :class="{ active: onlyOpen }" @click="onlyOpen = true"><span class="delivery-pulse" /> Abertas agora ({{ openStores.length }})</button>
          </div>
          <div v-if="categories.length > 1" class="delivery-categories" role="group" aria-label="Categorias">
            <button type="button" :class="{ active: !category }" @click="category = ''">Todas as categorias</button>
            <button v-for="name in categories" :key="name" type="button" :class="{ active: category === name }" @click="category = category === name ? '' : name">{{ name }}</button>
          </div>
          <div v-if="!filteredStores.length" class="delivery-no-results"><q-icon name="search_off" size="42px" /><h3>Nenhuma loja neste filtro</h3><p>Experimente ver todas as lojas ou mudar a busca.</p><q-btn outline color="primary" label="Limpar filtros" @click="clearFilters" /></div>
          <div v-else class="delivery-grid">
            <article v-for="shop in filteredStores" :key="shop.id" class="delivery-store" :class="{ closed: !shop.isOpen }">
              <router-link :to="`/loja/${shop.id}`" class="delivery-store-image" :aria-label="`Ver cardápio de ${shop.name}`"><img v-if="shop.imageUrl" :src="shop.imageUrl" :alt="shop.name" loading="lazy" /><q-icon v-else name="restaurant_menu" size="54px" /><span class="delivery-store-status" :class="{ closed: !shop.isOpen }"><span v-if="shop.isOpen" class="delivery-pulse" />{{ shop.label }}</span></router-link>
              <div class="delivery-store-body"><span class="delivery-store-category">{{ shop.categoryName || 'Comida e bebida' }}</span><h3>{{ shop.name }}</h3><p>{{ shop.description || 'Conheça o cardápio e faça seu pedido.' }}</p>
                <div v-if="shop.deliveryFeeCents || shop.deliveryInfo" class="delivery-store-info"><q-icon name="two_wheeler" /><span>{{ shop.deliveryFeeCents ? `Taxa de entrega ${money(shop.deliveryFeeCents)}` : shop.deliveryInfo }}</span></div>
                <div class="delivery-store-actions"><router-link :to="`/loja/${shop.id}`" class="delivery-store-order">{{ shop.isOpen ? 'Pedir agora' : 'Ver cardápio' }} <q-icon name="arrow_forward" /></router-link><router-link :to="adUrl(shop)" class="delivery-store-profile">Perfil completo</router-link></div>
              </div>
            </article>
          </div>
        </section>
      </template>
      <section v-else class="delivery-empty"><div class="delivery-empty-icon"><q-icon name="restaurant_menu" size="46px" /></div><h2>{{ addressId ? 'O delivery está chegando à sua cidade' : 'Escolha sua cidade para ver o delivery' }}</h2><p>{{ addressId ? 'Assim que os estabelecimentos ativarem o delivery de comida, eles aparecerão aqui.' : 'Selecione uma cidade acima para encontrar lojas e cardápios.' }}</p><router-link v-if="addressId" to="/encontre">Explorar comércios <q-icon name="arrow_forward" /></router-link></section>
    </div>
  </q-page>
</template>

<script>
import { computed, onMounted, onServerPrefetch, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useMeta } from 'quasar'
import { api } from 'boot/axios'
import { adUrl } from 'src/js/seoRoutes'
import Location from 'components/Location'

export default {
  name: 'DeliveryPage', components: { Location },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const current = computed(() => store.state.localization.current)
    const addressId = computed(() => {
      const queryId = Number(route.query.cidade)
      return Number.isSafeInteger(queryId) && queryId > 0 ? queryId : current.value?.id || null
    })
    const city = ref(null)
    useMeta(() => ({
      title: `Delivery em ${city.value?.city || current.value?.city || 'sua cidade'} - Poliweb`,
      meta: { description: { name: 'description', content: `Encontre delivery de comida e bebida em ${city.value?.city || current.value?.city || 'sua cidade'}, veja lojas abertas e peça direto pelo WhatsApp.` } }
    }))
    const stores = ref([])
    const popularProducts = ref([])
    const loading = ref(false)
    const search = ref('')
    const onlyOpen = ref(false)
    const category = ref('')
    const sortBy = ref('recommended')
    const sortOptions = [
      { label: 'Recomendados', value: 'recommended' },
      { label: 'Mais pedidos', value: 'popular' },
      { label: 'Nome A–Z', value: 'name' }
    ]
    const openStores = computed(() => stores.value.filter(shop => shop.isOpen))
    const availablePopularProducts = computed(() => {
      const openIds = new Set(openStores.value.map(shop => shop.id))
      return popularProducts.value.filter(product => openIds.has(product.adId))
    })
    const categories = computed(() => [...new Set(stores.value.map(shop => shop.categoryName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')))
    const filteredStores = computed(() => {
      const query = String(search.value || '').trim().toLocaleLowerCase('pt-BR')
      const result = stores.value.filter(shop => (!onlyOpen.value || shop.isOpen) && (!category.value || shop.categoryName === category.value) &&
        (!query || `${shop.name} ${shop.description || ''} ${shop.categoryName || ''}`.toLocaleLowerCase('pt-BR').includes(query)))
      if (sortBy.value === 'popular') return result.sort((a, b) => b.orderCount - a.orderCount || a.name.localeCompare(b.name, 'pt-BR'))
      if (sortBy.value === 'name') return result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      return result.sort((a, b) => Number(b.isOpen) - Number(a.isOpen) || b.orderCount - a.orderCount || a.name.localeCompare(b.name, 'pt-BR'))
    })
    const money = cents => (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const shopName = adId => stores.value.find(shop => shop.id === adId)?.name || 'Loja local'
    const clearFilters = () => { search.value = ''; onlyOpen.value = false; category.value = ''; sortBy.value = 'recommended' }
    let requestId = 0
    let timer = null
    const load = async () => {
      const id = addressId.value
      const currentRequest = ++requestId
      if (!id) { stores.value = []; popularProducts.value = []; city.value = null; loading.value = false; return }
      loading.value = !stores.value.length
      try {
        const response = await api.get(`/commerce/cities/${encodeURIComponent(id)}/delivery`)
        if (currentRequest !== requestId) return
        stores.value = response?.data?.stores || []
        popularProducts.value = response?.data?.popularProducts || []
        city.value = response?.data?.city || null
      } catch (_) {
        if (currentRequest === requestId) { stores.value = []; popularProducts.value = []; city.value = null }
      } finally { if (currentRequest === requestId) loading.value = false }
    }
    watch(addressId, () => { clearFilters(); load() }, { immediate: true })
    watch(() => current.value?.id, (id, previous) => {
      if (id && previous && id !== previous) router.replace({ path: '/delivery', query: { cidade: id } })
    })
    onServerPrefetch(load)
    onMounted(() => { timer = window.setInterval(load, 60000) })
    onUnmounted(() => { if (timer) window.clearInterval(timer) })
    return { current, addressId, city, stores, availablePopularProducts, loading, search, onlyOpen, category, categories, sortBy, sortOptions,
      openStores, filteredStores, money, shopName, clearFilters, adUrl }
  }
}
</script>

<style scoped>
.delivery-page { min-height:100vh; background:#faf7f5; color:#251d2b; }
.delivery-shell { max-width:1240px; margin:auto; padding:1rem 1rem 5rem; }
.delivery-location { margin-bottom:1rem; }
.delivery-hero { position:relative; display:flex; align-items:center; min-height:300px; padding:clamp(1.5rem,5vw,4rem); overflow:hidden; border-radius:28px; background:radial-gradient(circle at 78% 30%,#aa4770 0,#653064 30%,#27183e 72%); color:#fff; box-shadow:0 20px 45px #311b4230; }
.delivery-hero-content { position:relative; z-index:1; max-width:630px; }
.delivery-kicker, .delivery-section-kicker { color:#ffc791; font-size:.73rem; font-weight:900; letter-spacing:.16em; }
.delivery-hero h1 { max-width:600px; margin:.6rem 0 .8rem; font-size:clamp(2.3rem,5vw,4.6rem); font-weight:900; line-height:1.01; letter-spacing:-.035em; }
.delivery-hero p { max-width:480px; margin:0; color:#f4dce9; font-size:1rem; line-height:1.55; }
.delivery-hero-pills { display:flex; gap:.6rem; flex-wrap:wrap; margin-top:1.4rem; }
.delivery-hero-pills span { display:inline-flex; align-items:center; gap:.4rem; padding:.5rem .75rem; border:1px solid #ffffff55; border-radius:999px; background:#ffffff15; font-size:.78rem; font-weight:700; }
.delivery-hero-art { position:absolute; right:7%; top:15%; display:flex; align-items:center; justify-content:center; width:230px; height:230px; border:1px solid #ffffff45; border-radius:50%; background:#ffffff16; box-shadow:0 0 0 35px #ffffff0c,0 0 0 70px #ffffff09; transform:rotate(-12deg); }
.delivery-hero-art .q-icon { font-size:100px; color:#ffcd8b; }
.delivery-hero-art span { position:absolute; top:8%; left:10%; color:#ffcd8b; font-size:3rem; }
.delivery-pulse { display:inline-block; width:8px; height:8px; border-radius:50%; background:#34d399; box-shadow:0 0 0 4px #34d39933; }
.delivery-section { margin-top:2.5rem; }
.delivery-section-heading { display:flex; align-items:end; justify-content:space-between; gap:1rem; margin-bottom:1rem; }
.delivery-section-kicker { color:#a54865; }
.delivery-section h2 { margin:.2rem 0; font-size:clamp(1.5rem,3vw,2.2rem); line-height:1.15; font-weight:900; }
.delivery-section-heading p { margin:.3rem 0 0; color:#7a7180; }
.delivery-total { color:#7a7180; white-space:nowrap; font-size:.83rem; }
.delivery-products { display:flex; gap:.8rem; overflow-x:auto; padding:.2rem .2rem .8rem; scroll-snap-type:x mandatory; }
.delivery-product { position:relative; display:flex; flex:0 0 260px; min-width:0; overflow:hidden; border:1px solid #eadfe4; border-radius:18px; background:#fff; color:#251d2b; scroll-snap-align:start; box-shadow:0 5px 18px #321b3610; }
.delivery-product img { width:94px; min-height:104px; object-fit:cover; }
.delivery-product div { display:flex; flex-direction:column; padding:.75rem .65rem; min-width:0; }
.delivery-product strong, .delivery-product small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.delivery-product small { color:#7a7180; font-size:.72rem; }
.delivery-product b { color:#9d3565; margin-top:auto; font-size:.8rem; }
.delivery-product-arrow { position:absolute; right:.5rem; bottom:.55rem; color:#9d3565; }
.delivery-controls { display:flex; gap:.75rem; margin:1.2rem 0 .8rem; }
.delivery-search { flex:1; }
.delivery-sort { width:185px; }
.delivery-filters, .delivery-categories { display:flex; gap:.5rem; overflow-x:auto; padding:.2rem 0 .7rem; }
.delivery-filters button, .delivery-categories button { display:inline-flex; align-items:center; gap:.5rem; flex:none; padding:.55rem .9rem; border:1px solid #e9dfe5; border-radius:999px; background:#fff; color:#5d5261; cursor:pointer; font-weight:700; }
.delivery-filters button.active, .delivery-categories button.active { border-color:#86326a; background:#86326a; color:#fff; }
.delivery-grid, .delivery-skeletons { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }
.delivery-store { overflow:hidden; border:1px solid #eadfe4; border-radius:20px; background:#fff; box-shadow:0 6px 22px #321b3611; transition:transform .2s,box-shadow .2s; }
.delivery-store:hover { transform:translateY(-3px); box-shadow:0 13px 30px #321b3620; }
.delivery-store-image { position:relative; display:flex; align-items:center; justify-content:center; height:180px; color:#a54865; background:linear-gradient(135deg,#ffe4ca,#f2d7e7); }
.delivery-store-image img { width:100%; height:100%; object-fit:cover; }
.delivery-store-status { position:absolute; bottom:.7rem; left:.8rem; display:flex; align-items:center; gap:.45rem; padding:.35rem .65rem; border-radius:999px; background:#fff; color:#047857; font-size:.73rem; font-weight:900; box-shadow:0 3px 12px #0002; }
.delivery-store-status.closed { color:#a35a0a; }
.delivery-store-body { padding:1rem; }
.delivery-store-category { color:#9d3565; font-size:.68rem; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
.delivery-store h3 { margin:.3rem 0 .35rem; font-size:1.17rem; font-weight:900; }
.delivery-store p { min-height:2.7rem; margin:0; color:#756c7a; font-size:.84rem; line-height:1.35rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.delivery-store-info { display:flex; align-items:center; gap:.35rem; margin-top:.55rem; color:#756c7a; font-size:.75rem; white-space:nowrap; overflow:hidden; }
.delivery-store-info span { overflow:hidden; text-overflow:ellipsis; }
.delivery-store-actions { display:flex; align-items:center; justify-content:space-between; gap:.5rem; margin-top:1rem; }
.delivery-store-order { padding:.65rem .85rem; border-radius:10px; background:#86326a; color:#fff; font-size:.82rem; font-weight:800; }
.delivery-store-profile { color:#7a5374; font-size:.8rem; font-weight:700; }
.delivery-empty, .delivery-no-results { max-width:520px; margin:3rem auto; padding:2rem; text-align:center; }
.delivery-empty-icon { display:inline-flex; align-items:center; justify-content:center; width:90px; height:90px; border-radius:26px; color:#9d3565; background:#f6e3ec; }
.delivery-empty h2, .delivery-no-results h3 { margin:1rem 0 .4rem; font-size:1.5rem; font-weight:900; }
.delivery-empty p, .delivery-no-results p { color:#756c7a; }
.delivery-empty a { color:#86326a; font-weight:800; }
@media(max-width:900px) { .delivery-grid, .delivery-skeletons { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:620px) { .delivery-shell { padding:.7rem .8rem 4rem; } .delivery-hero { min-height:275px; border-radius:22px; } .delivery-hero-art { right:-55px; top:-60px; opacity:.34; } .delivery-hero h1 { font-size:2.65rem; } .delivery-controls { flex-direction:column; } .delivery-sort { width:100%; } .delivery-grid, .delivery-skeletons { grid-template-columns:1fr; } .delivery-store { display:grid; grid-template-columns:105px minmax(0,1fr); min-height:150px; } .delivery-store-image { height:100%; min-height:150px; } .delivery-store-body { min-width:0; padding:.8rem; } .delivery-store h3 { font-size:1rem; } .delivery-store p { min-height:0; font-size:.76rem; line-height:1.1rem; } .delivery-store-actions { flex-wrap:wrap; margin-top:.65rem; } .delivery-store-order { padding:.48rem .6rem; font-size:.74rem; } .delivery-store-profile { font-size:.73rem; } .delivery-store-status { bottom:.4rem; left:.3rem; padding:.25rem .4rem; font-size:.6rem; } }
</style>
