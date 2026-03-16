<template>
  <q-page class="actions-page">

    <!-- Header -->
    <div class="actions-header">
      <button class="actions-back" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div>
        <h1 class="actions-header-title">Relatório de acessos</h1>
        <p class="actions-header-sub">Acompanhe as interações do seu perfil</p>
      </div>
    </div>

    <div v-if="loading" class="actions-loading">
      <q-spinner color="primary" size="2rem" />
    </div>

    <template v-else>
      <!-- Período seletor -->
      <div class="actions-period-tabs">
        <button
          v-for="p in periods"
          :key="p.value"
          class="apt-btn"
          :class="{ 'apt-active': period === p.value }"
          @click="period = p.value"
        >{{ p.label }}</button>
      </div>

      <!-- Cards de resumo -->
      <div class="actions-kpi-row">
        <div class="akpi-card akpi-primary">
          <span class="akpi-label">Visualizações</span>
          <span class="akpi-value">{{ kpi.opens }}</span>
          <span class="akpi-sub">no período</span>
        </div>
        <div class="akpi-card akpi-purple">
          <span class="akpi-label">Visitantes únicos</span>
          <span class="akpi-value">{{ kpi.unique }}</span>
          <span class="akpi-sub">UUIDs distintos</span>
        </div>
        <div class="akpi-card akpi-green">
          <span class="akpi-label">Interações</span>
          <span class="akpi-value">{{ kpi.interactions }}</span>
          <span class="akpi-sub">cliques e ações</span>
        </div>
      </div>

      <!-- Gráfico diário -->
      <div class="actions-section" v-if="dailyBars.length">
        <h2 class="actions-section-title">Acessos por dia</h2>
        <div class="daily-chart">
          <div
            v-for="(day, i) in dailyBars"
            :key="i"
            class="daily-col"
            :title="`${day.label}: ${day.count}`"
          >
            <div class="daily-bar-wrap">
              <div
                class="daily-bar"
                :style="{ height: day.pct + '%' }"
                :class="{ 'daily-bar-today': day.isToday }"
              />
            </div>
            <span class="daily-label">{{ day.short }}</span>
          </div>
        </div>
      </div>

      <!-- Breakdown por tipo -->
      <div class="actions-section">
        <h2 class="actions-section-title">Por tipo de ação</h2>
        <div class="breakdown-list">
          <div
            v-for="item in typeBreakdown"
            :key="item.type"
            class="bkd-item"
          >
            <div class="bkd-icon" :style="{ background: item.bg }">
              <q-icon :name="item.icon" size="16px" color="white" />
            </div>
            <div class="bkd-info">
              <div class="bkd-top">
                <span class="bkd-label">{{ item.label }}</span>
                <span class="bkd-count">{{ item.count }}</span>
              </div>
              <div class="bkd-bar-bg">
                <div class="bkd-bar-fill" :style="{ width: item.pct + '%', background: item.color }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feed de eventos recentes -->
      <div class="actions-section">
        <h2 class="actions-section-title">Eventos recentes</h2>
        <div class="feed-list">
          <div
            v-for="item in filteredActions.slice(0, showAll ? 9999 : 30)"
            :key="item.id"
            class="feed-item"
          >
            <div class="feed-dot" :style="{ background: actionColor(item.type) }" />
            <div class="feed-body">
              <span class="feed-title">{{ actionTitle(item.type) }}</span>
              <span class="feed-desc">{{ item.description }}</span>
            </div>
            <span class="feed-time">{{ timeAgo(item.createdAt) }}</span>
          </div>
          <button v-if="!showAll && filteredActions.length > 30" class="feed-more" @click="showAll = true">
            Ver todos os {{ filteredActions.length }} eventos
          </button>
        </div>
      </div>
    </template>

  </q-page>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'

const TYPE_META = {
  'open':           { label: 'Abriu o perfil',       icon: 'visibility',  color: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
  'open-whatsapp':  { label: 'WhatsApp',              icon: 'chat',        color: '#22c55e', bg: 'linear-gradient(135deg,#22c55e,#16a34a)' },
  'open-phone':     { label: 'Telefone',              icon: 'phone',       color: '#ef4444', bg: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  'open-instagram': { label: 'Instagram',             icon: 'photo_camera',color: '#ec4899', bg: 'linear-gradient(135deg,#ec4899,#db2777)' },
  'open-facebook':  { label: 'Facebook',              icon: 'people',      color: '#3b82f6', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  'open-site':      { label: 'Site',                  icon: 'language',    color: '#0ea5e9', bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
  'open-mail':      { label: 'E-mail',                icon: 'mail',        color: '#8b5cf6', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  'open-map':       { label: 'Endereço/Mapa',         icon: 'place',       color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  'open-photos':    { label: 'Fotos',                 icon: 'collections', color: '#f97316', bg: 'linear-gradient(135deg,#f97316,#ea580c)' },
  'share':          { label: 'Compartilhou',          icon: 'share',       color: '#14b8a6', bg: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
  'follow':         { label: 'Seguiu',                icon: 'favorite',    color: '#f43f5e', bg: 'linear-gradient(135deg,#f43f5e,#e11d48)' },
}

const PERIODS = [
  { label: 'Últimos 7 dias',  value: 7  },
  { label: 'Último mês',      value: 30 },
  { label: 'Últimos 3 meses', value: 90 },
  { label: 'Tudo',            value: 0  },
]

export default defineComponent({
  name: 'Actions',
  setup() {
    return {
      actions: ref([]),
      period: ref(30),
      loading: ref(true),
      showAll: ref(false),
    }
  },
  computed: {
    periods() { return PERIODS },

    filteredActions() {
      if (!this.period) return this.actions
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - this.period)
      return this.actions.filter(a => new Date(a.createdAt) >= cutoff)
    },

    kpi() {
      const fa = this.filteredActions
      const opens       = fa.filter(a => a.type === 'open').length
      const unique      = new Set(fa.map(a => a.uuid)).size
      const interactions = fa.filter(a => a.type !== 'open').length
      return { opens, unique, interactions }
    },

    dailyBars() {
      const days = this.period || 30
      const map = {}
      const now = new Date()

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        map[key] = 0
      }

      this.filteredActions.forEach(a => {
        const key = a.createdAt.slice(0, 10)
        if (key in map) map[key]++
      })

      const entries = Object.entries(map)
      const max = Math.max(...entries.map(([, v]) => v), 1)
      const todayKey = now.toISOString().slice(0, 10)

      return entries.map(([date, count]) => {
        const d = new Date(date + 'T12:00:00')
        return {
          label:   d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          short:   days <= 7
            ? d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)
            : d.toLocaleDateString('pt-BR', { day: '2-digit' }),
          count,
          pct:     Math.round((count / max) * 100),
          isToday: date === todayKey,
        }
      })
    },

    typeBreakdown() {
      const map = {}
      this.filteredActions.forEach(a => {
        map[a.type] = (map[a.type] || 0) + 1
      })
      const max = Math.max(...Object.values(map), 1)
      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => {
          const meta = TYPE_META[type] || { label: type, icon: 'done', color: '#9ca3af', bg: '#9ca3af' }
          return { type, count, pct: Math.round((count / max) * 100), ...meta }
        })
    },
  },
  methods: {
    actionTitle(type) {
      return (TYPE_META[type] || {}).label || type
    },
    actionColor(type) {
      return (TYPE_META[type] || {}).color || '#9ca3af'
    },
    timeAgo(dateStr) {
      const diff = Date.now() - new Date(dateStr).getTime()
      const m = Math.floor(diff / 60000)
      if (m < 1)   return 'agora'
      if (m < 60)  return `${m}min`
      const h = Math.floor(m / 60)
      if (h < 24)  return `${h}h`
      const d = Math.floor(h / 24)
      if (d < 30)  return `${d}d`
      const mo = Math.floor(d / 30)
      return `${mo}m`
    },
    async getData() {
      this.loading = true
      this.$api.get(`/categories/ads/${this.$route.params.id}/actions`)
        .then(res => {
          if (res.data) {
            this.actions = (res.data.actions || []).slice().reverse()
          }
        })
        .catch(err => {
          const msg = err.response?.data?.message || 'Erro na conexão!'
          this.$q.notify({ color: 'negative', position: 'top', message: msg, icon: 'report_problem' })
        })
        .finally(() => { this.loading = false })
    }
  },
  async mounted() {
    this.getData()
  }
})
</script>

<style scoped>
.actions-page {
  background: #f4f6fb;
  min-height: 100vh;
  padding-bottom: 3rem;
}

/* Header */
.actions-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 0.75rem 0.5rem;
}
.actions-back {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #374151;
  flex-shrink: 0;
}
.actions-header-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.actions-header-sub {
  font-size: 0.72rem;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Loading */
.actions-loading {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

/* Period tabs */
.actions-period-tabs {
  display: flex;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.actions-period-tabs::-webkit-scrollbar { display: none; }
.apt-btn {
  flex-shrink: 0;
  padding: 0.35rem 0.75rem;
  border-radius: 99px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}
.apt-active {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
  box-shadow: 0 2px 8px rgba(99,102,241,0.35);
}

/* KPI cards */
.actions-kpi-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 0 0.75rem 0.5rem;
}
.akpi-card {
  border-radius: 14px;
  padding: 0.75rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  color: #fff;
  min-width: 0;
}
.akpi-primary { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.akpi-purple  { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.akpi-green   { background: linear-gradient(135deg, #10b981, #059669); }
.akpi-label {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.akpi-value {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
}
.akpi-sub {
  font-size: 0.58rem;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* telas muito estreitas: empilha KPI em 1 coluna de 3 */
@media (max-width: 359px) {
  .actions-kpi-row {
    grid-template-columns: 1fr;
    gap: 0.4rem;
    padding: 0 0.75rem 0.5rem;
  }
  .akpi-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.75rem;
    border-radius: 12px;
  }
  .akpi-label { font-size: 0.72rem; white-space: normal; }
  .akpi-value { font-size: 1.4rem; }
  .akpi-sub   { display: none; }
}

/* Sections */
.actions-section {
  margin: 0.6rem 0.75rem 0;
  background: #fff;
  border-radius: 14px;
  padding: 0.875rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.actions-section-title {
  font-size: 0.825rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.75rem;
}

/* Daily chart */
.daily-chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 80px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.daily-chart::-webkit-scrollbar { display: none; }
.daily-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 18px;
  max-width: 32px;
}
.daily-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  height: 56px;
}
.daily-bar {
  width: 100%;
  min-height: 3px;
  border-radius: 4px 4px 0 0;
  background: #c7d2fe;
  transition: height 0.3s ease;
}
.daily-bar-today { background: #6366f1; }
.daily-label {
  font-size: 0.58rem;
  color: #9ca3af;
  text-align: center;
  white-space: nowrap;
}

/* Breakdown */
.breakdown-list { display: flex; flex-direction: column; gap: 0.6rem; }
.bkd-item { display: flex; align-items: center; gap: 0.55rem; }
.bkd-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bkd-info { flex: 1; min-width: 0; }
.bkd-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 3px;
}
.bkd-label {
  font-size: 0.78rem;
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}
.bkd-count { font-size: 0.78rem; color: #111827; font-weight: 700; flex-shrink: 0; }
.bkd-bar-bg {
  height: 5px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
}
.bkd-bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.5s ease;
}

/* Feed */
.feed-list { display: flex; flex-direction: column; gap: 0; }
.feed-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.feed-item:last-child { border-bottom: none; }
.feed-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.feed-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.feed-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.feed-desc {
  font-size: 0.72rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.feed-time {
  font-size: 0.7rem;
  color: #9ca3af;
  flex-shrink: 0;
}
.feed-more {
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.6rem;
  border-radius: 10px;
  border: 1.5px dashed #d1d5db;
  background: transparent;
  color: #6b7280;
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
