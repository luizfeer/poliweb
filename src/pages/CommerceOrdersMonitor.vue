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
      <div class="monitor-workspace">
        <aside class="monitor-list">
          <div class="monitor-list-filter"><q-btn-toggle v-model="visibility" unelevated toggle-color="deep-orange" :options="[{label:'Ativos',value:'visible'},{label:'Ocultos',value:'hidden'}]" @update:model-value="changeVisibility" /></div>
          <div v-if="!orders.length && !polling" class="monitor-empty">Nenhum pedido nesta lista.</div>
          <button v-for="order in orders" :key="order.id" type="button" class="monitor-list-item" :class="[order.status || 'new', { selected: selectedId === order.id }]" @click="selectedId = order.id">
            <span class="row justify-between"><strong>#{{ String(order.id).slice(0, 8) }}</strong><small>{{ formatTime(order.created_at) }}</small></span>
            <span>{{ order.customer_name }} · {{ money(order.total_cents) }}</span>
            <q-badge :color="statusColor(order.status)">{{ statusLabel(order.status) }}</q-badge>
          </button>
        </aside>
        <section class="monitor-detail">
          <template v-if="selectedOrder">
            <div class="monitor-detail-actions">
              <q-select v-model="newStatus" dense outlined emit-value map-options :options="statusOptions" label="Status do pedido" style="min-width:170px" />
              <q-btn color="primary" label="Alterar status" :loading="saving" @click="updateOrder({status:newStatus})" />
              <q-btn :color="selectedOrder.hidden ? 'primary' : 'grey-8'" outline :label="selectedOrder.hidden ? 'Reexibir' : 'Ocultar'" :loading="saving" @click="updateOrder({hidden:!selectedOrder.hidden})" />
              <q-btn color="positive" icon="whatsapp" label="Responder no WhatsApp" @click="replyWhatsapp" />
            </div>
            <CommerceOrderCard :order="selectedOrder" />
          </template>
          <div v-else class="monitor-empty">Selecione um pedido para ver os detalhes.</div>
        </section>
      </div>
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
      soundEnabled: false, error: '', timer: null, selectedId: null, newStatus: 'new', visibility: 'visible', saving: false,
      statusOptions: [{label:'Novo',value:'new'},{label:'Aceito',value:'accepted'},{label:'Em preparo',value:'preparing'},{label:'Pronto',value:'ready'},{label:'Concluído',value:'completed'},{label:'Cancelado',value:'cancelled'}]
    }
  },
  computed: {
    selectedOrder() { return this.orders.find(order => order.id === this.selectedId) || null }
  },
  watch: {
    selectedOrder(order) { if (order) this.newStatus = order.status || 'new' }
  },
  methods: {
    money(cents) { return (Number(cents || 0) / 100).toLocaleString('pt-BR', {style:'currency',currency:'BRL'}) },
    statusLabel(value) { return (this.statusOptions.find(item => item.value === value) || this.statusOptions[0]).label },
    statusColor(value) { return ({new:'deep-orange',accepted:'blue',preparing:'amber-9',ready:'teal',completed:'positive',cancelled:'grey-7'})[value] || 'deep-orange' },
    async updateOrder(patch) {
      if (!this.selectedOrder) return
      this.saving = true
      try {
        const updated = await commerceApi(this.$route.params.id, `orders/${this.selectedOrder.id}`, 'PATCH', patch)
        this.orders = this.orders.map(order => order.id === updated.id ? updated : order)
        if (patch.hidden !== undefined && ((this.visibility === 'visible' && patch.hidden) || (this.visibility === 'hidden' && !patch.hidden))) { this.orders = this.orders.filter(order => order.id !== updated.id); this.selectedId = this.orders[0]?.id || null }
        this.$q.notify({color:'positive',message:'Pedido atualizado.'})
      } catch (error) { this.$q.notify({color:'negative',message:error.message}) }
      finally { this.saving = false }
    },
    replyWhatsapp() {
      const order = this.selectedOrder
      if (!order) return
      let phone = String(order.customer_phone || '').replace(/\D/g, '')
      if (phone.length === 10 || phone.length === 11) phone = `55${phone}`
      if (phone.length < 12 || phone.length > 13) { this.$q.notify({color:'warning',message:'Telefone do cliente inválido.'}); return }
      const message = `Olá, ${order.customer_name}! Sobre seu pedido #${String(order.id).slice(0,8)} na ${this.storeName}: ${this.statusLabel(order.status)}.`
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
    },
    formatTime(value) {
      return new Date(value).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    },
    changeVisibility() { this.initialized = false; this.newOrderCount = 0; this.seenIds = []; this.loadOrders() },
    async loadOrders() {
      if (this.polling || this.error === 'Você não tem acesso aos pedidos desta loja.') return
      this.polling = true
      try {
        const result = await commerceApi(this.$route.params.id, `orders?view=all&page=1&visibility=${this.visibility}`)
        const nextOrders = result.orders || []
        if (this.initialized) {
          const known = new Set(this.seenIds)
          const newOrders = this.visibility === 'visible' ? nextOrders.filter(order => !known.has(order.id)) : []
          this.newOrderCount = newOrders.length
          if (newOrders.length) {
            if (this.soundEnabled) this.playSound()
            this.$q.notify({ color: 'positive', message: `${newOrders.length} novo(s) pedido(s) gerado(s). Confira o WhatsApp.`, timeout: 8000 })
          }
        }
        this.orders = nextOrders
        if (!nextOrders.some(order => order.id === this.selectedId)) this.selectedId = nextOrders[0]?.id || null
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

<style scoped>
.monitor-shell { max-width: 1400px; }
.monitor-workspace { display:grid; grid-template-columns:minmax(280px,360px) minmax(0,1fr); gap:1rem; align-items:start; }
.monitor-list { background:#fff7ed; border:1px solid #fed7aa; border-radius:16px; overflow:hidden; max-height:75vh; overflow-y:auto; }
.monitor-list-filter { padding:.8rem; background:#ffedd5; }
.monitor-list-item { width:100%; display:grid; gap:.35rem; padding:1rem; text-align:left; border:0; border-bottom:1px solid #fed7aa; background:transparent; color:#1e293b; cursor:pointer; }
.monitor-list-item.new { border-left:5px solid #ea580c; }
.monitor-list-item.accepted { border-left:5px solid #2563eb; }
.monitor-list-item.preparing { border-left:5px solid #d97706; }
.monitor-list-item.ready { border-left:5px solid #0d9488; }
.monitor-list-item.completed { border-left:5px solid #16a34a; }
.monitor-list-item.selected { background:#fff; box-shadow:inset 0 0 0 2px #fb923c; }
.monitor-list-item small { color:#64748b; }
.monitor-detail { background:#fff; border:1px solid #cbd5e1; border-radius:16px; padding:1.25rem; min-height:360px; box-shadow:0 8px 24px #1e293b12; }
.monitor-detail-actions { display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; padding-bottom:1rem; border-bottom:1px solid #e2e8f0; }
@media(max-width:760px) { .monitor-workspace { grid-template-columns:1fr; } .monitor-list { max-height:300px; } }
</style>
