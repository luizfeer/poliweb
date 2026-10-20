<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-overline">Admin</div>
        <h1 class="text-h5 q-my-none">Denúncias de páginas</h1>
        <p class="text-caption text-grey-7 q-mb-none">Páginas reportadas pelos usuários (botão "Reportar").</p>
      </div>
      <q-btn-toggle v-model="status" no-caps unelevated toggle-color="primary" class="q-mr-sm"
        :options="[{ label: 'Abertas', value: 'open' }, { label: 'Resolvidas', value: 'resolved' }, { label: 'Todas', value: '' }]"
        @update:model-value="fetchReports" />
      <q-btn unelevated color="primary" icon="refresh" label="Atualizar" no-caps :loading="loading" @click="fetchReports" />
    </div>

    <q-table :rows="reports" :columns="columns" row-key="id" :loading="loading" flat bordered
      :rows-per-page-options="[20, 50, 100]" no-data-label="Nenhuma denúncia">
      <template #body-cell-createdAt="props">
        <q-td :props="props">{{ formatDate(props.row.createdAt) }}</q-td>
      </template>
      <template #body-cell-target="props">
        <q-td :props="props">
          <a :href="`/comercio/${props.row.targetId}`" target="_blank">#{{ props.row.targetId }} {{ props.row.targetName || '' }}</a>
        </q-td>
      </template>
      <template #body-cell-reason="props">
        <q-td :props="props">{{ reasonLabel(props.row.reason) }}</q-td>
      </template>
      <template #body-cell-details="props">
        <q-td :props="props" style="white-space: pre-wrap; max-width: 320px">{{ props.row.details || '—' }}</q-td>
      </template>
      <template #body-cell-reporter="props">
        <q-td :props="props">
          <div>{{ props.row.reporterEmail || 'Anônimo' }}</div>
          <div v-if="props.row.reporterCustomerId" class="text-caption">Cliente #{{ props.row.reporterCustomerId }}</div>
          <div v-if="props.row.reporterUserId" class="text-caption">Usuário #{{ props.row.reporterUserId }}</div>
        </q-td>
      </template>
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="props.row.status === 'resolved' ? 'positive' : 'warning'">
            {{ props.row.status === 'resolved' ? 'Resolvida' : 'Aberta' }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn v-if="props.row.status !== 'resolved'" dense unelevated no-caps color="positive" icon="check"
            label="Resolver" class="q-mr-xs" @click="setStatus(props.row, 'resolved')" />
          <q-btn v-else dense flat no-caps icon="undo" label="Reabrir" class="q-mr-xs" @click="setStatus(props.row, 'open')" />
          <q-btn dense flat round color="negative" icon="delete" @click="remove(props.row)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { date } from 'quasar'
import { REPORT_REASONS } from 'components/ReportPageButton.vue'

export default {
  name: 'AdminReports',
  data () {
    return {
      reports: [], loading: false, status: 'open',
      columns: [
        { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
        { name: 'createdAt', label: 'Data', field: 'createdAt', align: 'left', sortable: true },
        { name: 'target', label: 'Página', field: 'targetId', align: 'left' },
        { name: 'reason', label: 'Motivo', field: 'reason', align: 'left' },
        { name: 'details', label: 'Detalhes', field: 'details', align: 'left' },
        { name: 'reporter', label: 'Denunciante', field: 'reporterEmail', align: 'left' },
        { name: 'status', label: 'Status', field: 'status', align: 'left' },
        { name: 'actions', label: '', field: 'id', align: 'right' }
      ]
    }
  },
  mounted () { this.fetchReports() },
  methods: {
    reasonLabel (v) {
      if (v === 'teste_interno') return 'Teste interno'
      return REPORT_REASONS.find(r => r.value === v)?.label || v
    },
    formatDate (v) { return v ? date.formatDate(v, 'DD/MM/YYYY HH:mm') : '' },
    async fetchReports () {
      this.loading = true
      try {
        const { data } = await this.$api.get('/admin/reports', { params: { status: this.status } })
        this.reports = data.reports || []
      } catch (e) {
        this.$q.notify({ type: 'negative', message: 'Erro ao carregar denúncias.' })
      } finally { this.loading = false }
    },
    async setStatus (row, status) {
      try {
        await this.$api.patch(`/admin/reports/${row.id}`, { status })
        this.$q.notify({ type: 'positive', message: status === 'resolved' ? 'Marcada como resolvida.' : 'Reaberta.' })
        this.fetchReports()
      } catch (e) { this.$q.notify({ type: 'negative', message: 'Erro ao atualizar.' }) }
    },
    remove (row) {
      this.$q.dialog({ title: 'Excluir denúncia', message: `Excluir a denúncia #${row.id}?`, cancel: true }).onOk(async () => {
        try {
          await this.$api.delete(`/admin/reports/${row.id}`)
          this.fetchReports()
        } catch (e) { this.$q.notify({ type: 'negative', message: 'Erro ao excluir.' }) }
      })
    }
  }
}
</script>
