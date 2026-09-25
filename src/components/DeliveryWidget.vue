<template>
  <section v-if="openStores.length" class="delivery-widget" aria-label="Delivery aberto na sua cidade">
    <div class="delivery-widget-heading">
      <div>
        <span class="delivery-widget-eyebrow"><span class="delivery-live-dot" /> Delivery aberto agora</span>
        <h2>{{ headline }}</h2>
        <p>Comida e bebida de {{ cityName || 'sua cidade' }}, direto pelo WhatsApp da loja.</p>
      </div>
      <router-link :to="deliveryUrl" class="delivery-widget-all">Ver todos <q-icon name="arrow_forward" /></router-link>
    </div>
    <div class="delivery-widget-list">
      <article v-for="shop in openStores.slice(0, 4)" :key="shop.id" class="delivery-widget-shop">
        <router-link :to="`/loja/${shop.id}`" class="delivery-widget-photo" :aria-label="`Pedir em ${shop.name}`">
          <img v-if="shop.imageUrl" :src="shop.imageUrl" :alt="shop.name" loading="lazy" />
          <q-icon v-else name="restaurant" size="36px" />
        </router-link>
        <div class="delivery-widget-shop-info">
          <span class="delivery-widget-open">Aberto agora</span>
          <h3>{{ shop.name }}</h3>
          <p>{{ shop.description || shop.categoryName || 'Comida e bebida' }}</p>
          <div class="delivery-widget-links">
            <router-link :to="`/loja/${shop.id}`" class="delivery-widget-order">Pedir agora <q-icon name="arrow_forward" /></router-link>
            <router-link :to="adUrl(shop)" class="delivery-widget-profile">Perfil</router-link>
          </div>
        </div>
      </article>
    </div>
    <router-link :to="deliveryUrl" class="delivery-widget-mobile-all">Explorar todo o delivery <q-icon name="arrow_forward" /></router-link>
  </section>
</template>

<script>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { api } from 'boot/axios'
import { adUrl } from 'src/js/seoRoutes'

export default {
  name: 'DeliveryWidget',
  props: { addressId: { type: [Number, String], default: null }, cityName: { type: String, default: '' }, cityState: { type: String, default: '' } },
  setup(props) {
    const stores = ref([])
    const hour = ref(12)
    const openStores = computed(() => stores.value.filter(shop => shop.isOpen))
    const deliveryUrl = computed(() => props.addressId ? `/delivery?cidade=${props.addressId}` : '/delivery')
    const headline = computed(() => {
      if (hour.value >= 5 && hour.value < 11) return 'Que tal pedir um café da manhã?'
      if (hour.value >= 11 && hour.value < 15) return 'Hora do almoço. O que vai pedir?'
      if (hour.value >= 15 && hour.value < 18) return 'Uma pausa gostosa para o lanche'
      if (hour.value >= 18 || hour.value < 2) return 'Seu jantar está a poucos toques'
      return 'Bateu a fome? Peça agora'
    })
    let timer = null
    let requestId = 0
    const updateHour = () => {
      const timezones = { AC: 'America/Rio_Branco', AM: 'America/Manaus', RO: 'America/Porto_Velho', RR: 'America/Boa_Vista', MT: 'America/Cuiaba', MS: 'America/Campo_Grande' }
      const timezone = timezones[props.cityState?.toUpperCase()] || 'America/Sao_Paulo'
      hour.value = Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
    }
    const load = async () => {
      const id = props.addressId
      const currentRequest = ++requestId
      updateHour()
      if (!id) { stores.value = []; return }
      try {
        const response = await api.get(`/commerce/cities/${encodeURIComponent(id)}/delivery`)
        if (currentRequest === requestId) stores.value = response?.data?.stores || []
      } catch (_) { if (currentRequest === requestId) stores.value = [] }
    }
    watch(() => props.addressId, load, { immediate: true })
    onMounted(() => { timer = window.setInterval(load, 60000) })
    onUnmounted(() => { if (timer) window.clearInterval(timer) })
    return { openStores, deliveryUrl, headline, adUrl }
  }
}
</script>

<style scoped>
.delivery-widget { margin: 1.25rem 0; padding: 1.25rem; border-radius: 24px; color: #fff; background: linear-gradient(135deg, #271349 0%, #55216c 56%, #a84352 100%); box-shadow: 0 16px 35px #321d4a24; }
.delivery-widget-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; margin-bottom:1rem; }
.delivery-widget-eyebrow { display:inline-flex; align-items:center; gap:.4rem; color:#ffd7a1; text-transform:uppercase; letter-spacing:.12em; font-size:.7rem; font-weight:800; }
.delivery-live-dot { width:8px; height:8px; border-radius:50%; background:#6ee7b7; box-shadow:0 0 0 4px #6ee7b733; }
.delivery-widget h2 { margin:.35rem 0 .25rem; font-size:clamp(1.3rem,3vw,2rem); font-weight:900; line-height:1.1; }
.delivery-widget-heading p { margin:0; color:#f1dbea; font-size:.86rem; }
.delivery-widget-all, .delivery-widget-mobile-all { color:#fff; font-weight:800; white-space:nowrap; }
.delivery-widget-list { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.75rem; }
.delivery-widget-shop { min-width:0; overflow:hidden; border-radius:16px; background:#fff; color:#231b32; }
.delivery-widget-photo { display:flex; align-items:center; justify-content:center; height:122px; background:#ffe4bd; color:#7c2d12; }
.delivery-widget-photo img { width:100%; height:100%; object-fit:cover; }
.delivery-widget-shop-info { padding:.8rem; }
.delivery-widget-open { color:#047857; font-size:.7rem; font-weight:800; text-transform:uppercase; }
.delivery-widget-shop h3 { margin:.25rem 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:1rem; font-weight:800; }
.delivery-widget-shop p { margin:0; min-height:2.3rem; color:#64748b; font-size:.75rem; line-height:1.2rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.delivery-widget-links { display:flex; justify-content:space-between; align-items:center; gap:.4rem; margin-top:.75rem; }
.delivery-widget-order { color:#8a2d68; font-weight:800; font-size:.78rem; }
.delivery-widget-profile { color:#64748b; font-size:.75rem; }
.delivery-widget-mobile-all { display:none; }
@media(max-width:900px) { .delivery-widget-list { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:560px) { .delivery-widget { padding:1rem; margin:1rem 0; border-radius:20px; } .delivery-widget-all { display:none; } .delivery-widget-list { display:flex; overflow-x:auto; scroll-snap-type:x mandatory; margin-right:-1rem; padding-right:1rem; } .delivery-widget-shop { flex:0 0 70%; max-width:250px; scroll-snap-align:start; } .delivery-widget-mobile-all { display:inline-flex; align-items:center; gap:.3rem; margin-top:1rem; } }
</style>
