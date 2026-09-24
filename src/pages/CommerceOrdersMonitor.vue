<template>
  <div class="monitor-page">
    <div class="monitor-shell">
      <header class="monitor-header">
        <q-btn flat round icon="arrow_back" aria-label="Voltar à loja" @click="$router.push(`/ecommerce/${$route.params.id}`)" />
        <div class="monitor-heading">
          <h1>Pedidos em tempo real</h1>
          <p>{{ storeName || `Loja #${$route.params.id}` }}</p>
        </div>
      </header>

      <section class="monitor-toolbar">
        <div>
          <div class="row items-center q-gutter-sm"><span class="monitor-dot" /><strong>Atualização a cada 20 segundos</strong></div>
          <p v-if="lastUpdatedAt">Última consulta: {{ formatTime(lastUpdatedAt) }}</p>
          <p v-else>Buscando pedidos...</p>
        </div>
        <div class="row q-gutter-sm">
          <q-btn :color="soundEnabled ? 'positive' : 'primary'" :outline="soundEnabled" :icon="soundEnabled ? 'volume_up' : 'volume_off'"
            :label="soundEnabled ? 'Som ativado' : 'Ativar som'" @click="toggleSound" />
          <q-btn outline color="primary" icon="refresh" label="Atualizar" :loading="polling" @click="loadOrders" />
        </div>
      </section>

      <q-banner v-if="newOrderCount" rounded class="bg-green-1 text-green-10 q-mb-md">
        {{ newOrderCount }} {{ newOrderCount === 1 ? 'novo pedido gerado' : 'novos pedidos gerados' }} desde a última consulta. Confira a mensagem no WhatsApp.
      </q-banner>
      <q-banner v-if="error" rounded class="bg-red-1 text-red-10 q-mb-md">{{ error }}</q-banner>

      <div class="row items-center justify-between q-mb-md">
        <h2>Pedidos recentes</h2>
        <q-btn flat color="primary" label="Histórico e filtros" @click="$router.push(`/ecommerce/${$route.params.id}?pedidos=todos`)" />
      </div>
      <p class="text-caption">Estes registros indicam pedidos gerados no site. O envio pelo WhatsApp não pode ser confirmado automaticamente.</p>
      <div v-if="!orders.length && !polling" class="monitor-empty">Ainda não há pedidos registrados.</div>
      <CommerceOrderCard v-for="order in orders" :key="order.id" :order="order" />
    </div>
  </div>
</template>

<script>
import CommerceOrderCard from 'src/components/CommerceOrderCard.vue'
import { commerceApi } from 'src/js/commerceApi'

let monitorAudioContext = null

export default {
  name: 'CommerceOrdersMonitor',
  components: { CommerceOrderCard },
  data() {
    return {
      storeName: '', orders: [], seenIds: [], initialized: false,
      lastUpdatedAt: null, newOrderCount: 0, polling: false,
      soundEnabled: false, error: '', timer: null
    }
  },
  methods: {
    formatTime(value) {
      return new Date(value).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    },
    async loadOrders() {
      if (this.polling || this.error === 'Você não tem acesso aos pedidos desta loja.') return
      this.polling = true
      try {
        const result = await commerceApi(this.$route.params.id, 'orders?view=all&page=1')
        const nextOrders = result.orders || []
        if (this.initialized) {
          const known = new Set(this.seenIds)
          const newOrders = nextOrders.filter(order => !known.has(order.id))
          this.newOrderCount = newOrders.length
          if (newOrders.length) {
            if (this.soundEnabled) this.playSound()
            this.$q.notify({ color: 'positive', message: `${newOrders.length} novo(s) pedido(s) gerado(s). Confira o WhatsApp.`, timeout: 8000 })
          }
        }
        this.orders = nextOrders
        this.seenIds = nextOrders.map(order => order.id)
        this.initialized = true
        this.lastUpdatedAt = Date.now()
        this.error = ''
      } catch (cause) {
        this.error = [401, 403].includes(cause.status)
          ? 'Você não tem acesso aos pedidos desta loja.'
          : cause.message || 'Não foi possível atualizar os pedidos.'
      } finally { this.polling = false }
    },
    async toggleSound() {
      if (this.soundEnabled) { this.soundEnabled = false; return }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) {
        this.$q.notify({ color: 'warning', message: 'Este navegador não suporta aviso sonoro.' }); return
      }
      try {
        if (!monitorAudioContext) monitorAudioContext = new AudioContextClass()
        await monitorAudioContext.resume()
        this.soundEnabled = true
        this.playSound()
      } catch (_) { this.$q.notify({ color: 'warning', message: 'Toque novamente para liberar o som neste navegador.' }) }
    },
    playSound() {
      if (!monitorAudioContext || monitorAudioContext.state !== 'running') return
      const now = monitorAudioContext.currentTime
      for (const [offset, frequency] of [[0, 880], [0.19, 1175]]) {
        const oscillator = monitorAudioContext.createOscillator()
        const gain = monitorAudioContext.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, now + offset)
        gain.gain.setValueAtTime(0.001, now + offset)
        gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16)
        oscillator.connect(gain)
        gain.connect(monitorAudioContext.destination)
        oscillator.start(now + offset)
        oscillator.stop(now + offset + 0.17)
      }
    },
    handleVisibility() {
      if (document.visibilityState === 'visible') this.loadOrders()
    }
  },
  mounted() {
    this.$api.get(`/categories/ads/${this.$route.params.id}?nonDeleted=true`)
      .then(({ data }) => { this.storeName = data?.name || '' })
      .catch(() => {})
    this.loadOrders()
    this.timer = window.setInterval(() => this.loadOrders(), 20000)
    document.addEventListener('visibilitychange', this.handleVisibility)
  },
  unmounted() {
    window.clearInterval(this.timer)
    document.removeEventListener('visibilitychange', this.handleVisibility)
    if (monitorAudioContext) { monitorAudioContext.close(); monitorAudioContext = null }
  }
}
</script>

<style scoped>
.monitor-page { min-height: 100vh; background: #f8fafc; padding: 1rem 1rem 4rem; }
.monitor-shell { max-width: 900px; margin: 0 auto; }
.monitor-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.monitor-heading h1 { margin: 0; font-size: 1.5rem; font-weight: 700; line-height: 1.25; }
.monitor-heading p, .monitor-toolbar p { margin: 0.25rem 0 0; color: #64748b; }
.monitor-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
.monitor-dot { width: 9px; height: 9px; border-radius: 50%; background: #16a34a; }
h2 { margin: 0; font-size: 1.15rem; font-weight: 700; }
.monitor-empty { text-align: center; padding: 3rem 1rem; background: white; border-radius: 12px; color: #64748b; }
@media (max-width: 600px) { .monitor-toolbar .row { width: 100%; } .monitor-toolbar .q-btn { flex: 1; } }
</style>
