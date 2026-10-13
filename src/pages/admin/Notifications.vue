<template>
  <q-page class="push-admin-page">
    <section class="push-admin-shell">
      <header class="push-admin-header">
        <div>
          <p class="push-admin-eyebrow">Admin</p>
          <h1>Notificações</h1>
          <p>Envie um aviso para o app iOS, o navegador e o Android. O link é um caminho do site, como <code>/buscar</code>.</p>
        </div>
        <q-btn flat no-caps color="primary" label="Voltar ao painel" to="/adm" />
      </header>

      <div v-if="!allowed" class="push-admin-denied">
        <q-icon name="lock" size="30px" color="primary" />
        <h2>Acesso restrito</h2>
        <p>Entre com uma conta admin para enviar notificações.</p>
        <q-btn color="primary" label="Fazer login" to="/adm/login" no-caps unelevated />
      </div>

      <template v-else>
        <form class="push-admin-card" @submit.prevent="askSend">
          <div class="push-admin-estimate" :class="{ 'is-empty': estimated.count === 0 }">
            <strong v-if="estimating">Contando dispositivos…</strong>
            <strong v-else-if="estimateError">{{ estimateError }}</strong>
            <template v-else>
              <strong>{{ estimated.count }} dispositivo{{ estimated.count === 1 ? '' : 's' }}</strong>
              <span>{{ estimated.expo }} no app iOS · {{ estimated.webpush }} no navegador e Android</span>
            </template>
          </div>

          <label class="push-admin-field">
            <span>Título</span>
            <q-input v-model="form.title" outlined dense maxlength="120" placeholder="Feira de sábado" />
          </label>
          <label class="push-admin-field">
            <span>Texto</span>
            <q-input
              v-model="form.body"
              outlined
              dense
              type="textarea"
              maxlength="500"
              autogrow
              placeholder="A feira mudou para a praça central."
            />
          </label>
          <label class="push-admin-field">
            <span>Link</span>
            <q-input v-model="form.path" outlined dense maxlength="300" placeholder="/buscar" />
            <div class="push-admin-chips">
              <button
                v-for="preset in presets"
                :key="preset.path"
                type="button"
                class="push-admin-chip"
                @click="form.path = preset.path"
              >
                {{ preset.label }}
              </button>
            </div>
          </label>

          <q-toggle v-model="form.all" label="Enviar para todos os dispositivos" />

          <div class="push-admin-grid" :class="{ 'is-disabled': form.all }">
            <label class="push-admin-field">
              <span>Cidades</span>
              <q-select
                v-model="form.cities"
                :options="cityOptions"
                multiple
                use-chips
                emit-value
                map-options
                outlined
                dense
                clearable
                :disable="form.all"
                label="Todas, se vazio"
              />
            </label>
            <label class="push-admin-field">
              <span>Papel</span>
              <q-select
                v-model="form.role"
                :options="roleOptions"
                emit-value
                map-options
                outlined
                dense
                clearable
                :disable="form.all"
                label="Usuários e donos"
              />
            </label>
            <label class="push-admin-field">
              <span>Categorias</span>
              <q-select
                v-model="form.categories"
                :options="filteredCategories"
                multiple
                use-chips
                use-input
                emit-value
                map-options
                outlined
                dense
                clearable
                input-debounce="200"
                :disable="form.all"
                label="Todas, se vazio"
                @filter="filterCategories"
              />
            </label>
            <label class="push-admin-field">
              <span>Usuário específico</span>
              <q-input
                v-model="form.userId"
                outlined
                dense
                clearable
                :disable="form.all"
                placeholder="ID da conta"
              />
            </label>
          </div>

          <div class="push-admin-actions">
            <q-btn
              type="submit"
              color="primary"
              no-caps
              unelevated
              label="Enviar notificação"
              :loading="sending"
              :disable="!canSend"
            />
          </div>
        </form>

        <section class="push-admin-card">
          <div class="push-admin-history-head">
            <h2>Histórico</h2>
            <q-btn flat round dense icon="refresh" color="primary" :loading="loadingHistory" @click="loadHistory" />
          </div>
          <p v-if="historyError" class="push-admin-muted">{{ historyError }}</p>
          <p v-else-if="!campaigns.length" class="push-admin-muted">Nenhum envio ainda.</p>
          <ul v-else class="push-admin-history">
            <li v-for="campaign in campaigns" :key="campaign.id">
              <div>
                <strong>{{ campaign.title }}</strong>
                <p>{{ campaign.body }}</p>
                <small>
                  {{ formatWhen(campaign.createdAt) }}
                  · {{ campaign.path }}
                  · {{ describeFilters(campaign.filters) }}
                </small>
              </div>
              <div class="push-admin-stats">
                <span>{{ statusLabel(campaign.status) }}</span>
                <span>{{ campaign.sentCount }} enviados</span>
                <span v-if="campaign.failedCount">{{ campaign.failedCount }} falharam</span>
                <span v-if="campaign.invalidatedCount">{{ campaign.invalidatedCount }} inválidos</span>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </section>

    <q-dialog v-model="confirmOpen">
      <q-card class="push-admin-dialog">
        <q-card-section>
          <h2>Enviar agora?</h2>
          <p>
            {{ form.title }} chega em {{ estimated.count }} dispositivo{{ estimated.count === 1 ? '' : 's' }}
            e abre <strong>{{ form.path }}</strong>.
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated no-caps color="primary" label="Enviar" :loading="sending" @click="send" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { fetchCities } from 'src/services/cities'
import { estimateNotification, listNotifications, sendNotification } from 'src/services/pushApi'

export default {
  name: 'AdminNotifications',
  data() {
    return {
      form: {
        title: '',
        body: '',
        path: '/',
        all: false,
        cities: [],
        role: null,
        categories: [],
        userId: ''
      },
      presets: [
        { label: 'Início', path: '/' },
        { label: 'Buscar', path: '/buscar' },
        { label: 'Cidades', path: '/cidades' },
        { label: 'Delivery', path: '/delivery' }
      ],
      roleOptions: [
        { label: 'Usuários', value: 'user' },
        { label: 'Donos de comércio', value: 'owner' }
      ],
      cityOptions: [],
      categoryOptions: [],
      filteredCategories: [],
      estimated: { count: 0, expo: 0, webpush: 0 },
      estimateError: '',
      estimating: false,
      estimateTimer: null,
      estimateToken: 0,
      sending: false,
      confirmOpen: false,
      campaigns: [],
      loadingHistory: false,
      historyError: ''
    }
  },
  computed: {
    allowed() {
      return typeof localStorage === 'undefined' || !!localStorage.getItem('admin')
    },
    canSend() {
      return !this.estimating
        && !this.estimateError
        && this.estimated.count > 0
        && this.form.title.trim()
        && this.form.body.trim()
        && this.form.path.startsWith('/')
        && !this.form.path.startsWith('//')
    }
  },
  watch: {
    form: {
      deep: true,
      handler() {
        this.scheduleEstimate()
      }
    }
  },
  mounted() {
    if (!this.allowed) return
    this.loadOptions()
    this.loadHistory()
    this.scheduleEstimate()
  },
  beforeUnmount() {
    if (this.estimateTimer) clearTimeout(this.estimateTimer)
  },
  methods: {
    scheduleEstimate() {
      if (this.estimateTimer) clearTimeout(this.estimateTimer)
      this.estimateTimer = setTimeout(() => this.estimate(), 350)
    },
    filtersPayload() {
      return {
        all: this.form.all,
        cities: this.form.all ? [] : this.form.cities,
        role: this.form.all ? null : this.form.role,
        categories: this.form.all ? [] : this.form.categories,
        userId: this.form.all ? null : (this.form.userId || null)
      }
    },
    async estimate() {
      const token = ++this.estimateToken
      this.estimating = true
      this.estimateError = ''
      try {
        const response = await estimateNotification(this.filtersPayload())
        if (token !== this.estimateToken) return
        const data = response.data || {}
        this.estimated = {
          count: Number(data.count || 0),
          expo: Number(data.byType && data.byType.expo) || 0,
          webpush: Number(data.byType && data.byType.webpush) || 0
        }
      } catch (error) {
        if (token !== this.estimateToken) return
        this.estimated = { count: 0, expo: 0, webpush: 0 }
        this.estimateError = error?.response?.data?.message || 'Não foi possível contar os dispositivos.'
      } finally {
        if (token === this.estimateToken) this.estimating = false
      }
    },
    askSend() {
      if (!this.canSend) return
      this.confirmOpen = true
    },
    async send() {
      this.sending = true
      try {
        await sendNotification({
          title: this.form.title.trim(),
          body: this.form.body.trim(),
          path: this.form.path.trim(),
          ...this.filtersPayload()
        })
        this.confirmOpen = false
        this.form.title = ''
        this.form.body = ''
        this.$q.notify({
          color: 'positive',
          position: 'top',
          message: 'Notificação enviada.',
          icon: 'check'
        })
        await this.loadHistory()
        await this.estimate()
      } catch (error) {
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: error?.response?.data?.message || 'Não foi possível enviar.',
          icon: 'report_problem'
        })
      } finally {
        this.sending = false
      }
    },
    async loadOptions() {
      try {
        const cities = await fetchCities()
        this.cityOptions = (cities || []).map((city) => ({
          label: city.city,
          value: String(city.id)
        }))
      } catch (error) {
        this.cityOptions = []
      }
      try {
        const response = await this.$api.get('/categories')
        const categories = (response.data && response.data.categories) || []
        this.categoryOptions = categories
          .filter((category) => category && !category.deletedAt)
          .map((category) => ({
            label: category.addressCity ? `${category.name} · ${category.addressCity}` : category.name,
            value: String(category.id)
          }))
        this.filteredCategories = this.categoryOptions
      } catch (error) {
        this.categoryOptions = []
        this.filteredCategories = []
      }
    },
    filterCategories(value, update) {
      update(() => {
        const term = String(value || '').trim().toLowerCase()
        this.filteredCategories = term
          ? this.categoryOptions.filter((option) => option.label.toLowerCase().includes(term))
          : this.categoryOptions
      })
    },
    async loadHistory() {
      this.loadingHistory = true
      this.historyError = ''
      try {
        const response = await listNotifications()
        this.campaigns = (response.data && response.data.campaigns) || []
      } catch (error) {
        this.historyError = error?.response?.data?.message || 'Não foi possível carregar o histórico.'
      } finally {
        this.loadingHistory = false
      }
    },
    describeFilters(filters) {
      if (!filters || filters.all) return 'Todos'
      const parts = []
      if (filters.cities && filters.cities.length) parts.push(`${filters.cities.length} cidade(s)`)
      if (filters.role === 'user') parts.push('usuários')
      if (filters.role === 'owner') parts.push('donos')
      if (filters.categories && filters.categories.length) parts.push(`${filters.categories.length} categoria(s)`)
      if (filters.userId) parts.push(`usuário ${filters.userId}`)
      return parts.length ? parts.join(' · ') : 'Todos os dispositivos ativos'
    },
    statusLabel(status) {
      if (status === 'sending') return 'Enviando'
      if (status === 'failed') return 'Falhou'
      return 'Enviado'
    },
    formatWhen(value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    }
  }
}
</script>

<style scoped>
.push-admin-page {
  min-height: 100%;
  background: #f8fafc;
  padding: 1rem;
}
.push-admin-shell {
  width: min(980px, 100%);
  margin: 0 auto;
  padding: 1rem 0 6rem;
}
.push-admin-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
}
.push-admin-eyebrow {
  margin: 0 0 0.25rem;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
.push-admin-header h1,
.push-admin-history-head h2,
.push-admin-dialog h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
}
.push-admin-header h1 {
  font-size: 1.9rem;
}
.push-admin-header p,
.push-admin-muted,
.push-admin-dialog p {
  margin: 0.35rem 0 0;
  color: #64748b;
}
.push-admin-card {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}
.push-admin-field {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
}
.push-admin-field span {
  color: #334155;
  font-size: 0.85rem;
  font-weight: 700;
}
.push-admin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-top: 0.8rem;
}
.push-admin-grid.is-disabled {
  opacity: 0.55;
}
.push-admin-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.push-admin-chip {
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  cursor: pointer;
}
.push-admin-estimate {
  display: grid;
  gap: 0.2rem;
  margin: 0.4rem 0 1rem;
  padding: 0.9rem 1rem;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e3a8a;
}
.push-admin-estimate.is-empty {
  background: #f8fafc;
  color: #64748b;
}
.push-admin-estimate strong {
  font-size: 1.15rem;
}
.push-admin-actions {
  display: flex;
  justify-content: flex-end;
}
.push-admin-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.push-admin-history {
  list-style: none;
  margin: 0.8rem 0 0;
  padding: 0;
}
.push-admin-history li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  border-top: 1px solid #e5e7eb;
}
.push-admin-history p {
  margin: 0.2rem 0;
  color: #334155;
}
.push-admin-history small,
.push-admin-stats {
  color: #64748b;
}
.push-admin-stats {
  display: grid;
  justify-items: end;
  gap: 0.15rem;
  font-size: 0.85rem;
}
.push-admin-denied {
  display: grid;
  justify-items: start;
  gap: 0.7rem;
  max-width: 420px;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}
.push-admin-dialog {
  width: min(440px, calc(100vw - 2rem));
  padding: 0.4rem;
}
@media (max-width: 720px) {
  .push-admin-header,
  .push-admin-history li {
    flex-direction: column;
  }
  .push-admin-grid {
    grid-template-columns: 1fr;
  }
  .push-admin-stats {
    justify-items: start;
  }
}
</style>
