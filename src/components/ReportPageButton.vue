<template>
  <component :is="tag" type="button" :class="buttonClass" title="Reportar página" @click="open = true">
    <q-icon name="flag" :size="iconSize" />
    <span>{{ label }}</span>
  </component>

  <q-dialog v-model="open" @hide="reset">
    <q-card class="report-page-card">
      <q-card-section>
        <div class="text-h6">Reportar página</div>
        <p class="text-caption text-grey-7 q-mb-none">
          Viu algo impróprio nesta página? Conte para nós. A equipe Poliweb vai analisar.
        </p>
      </q-card-section>

      <q-card-section v-if="sent" class="text-center">
        <q-icon name="check_circle" color="positive" size="48px" />
        <p class="q-mt-sm q-mb-none">Obrigado! Sua denúncia foi enviada e será analisada.</p>
      </q-card-section>

      <q-card-section v-else class="q-pt-none">
        <q-option-group v-model="reason" :options="reasons" type="radio" dense />
        <q-input v-model="details" class="q-mt-md" outlined dense autogrow type="textarea"
          maxlength="2000" label="Detalhes (opcional)" />
        <q-input v-model="email" class="q-mt-sm" outlined dense type="email"
          maxlength="255" label="Seu e-mail para contato (opcional)" />
        <p v-if="error" class="text-negative text-caption q-mt-sm q-mb-none">{{ error }}</p>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat no-caps :label="sent ? 'Fechar' : 'Cancelar'" v-close-popup />
        <q-btn v-if="!sent" unelevated no-caps color="negative" label="Enviar denúncia"
          :disable="!reason" :loading="loading" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { api } from 'boot/axios'

export const REPORT_REASONS = [
  { label: 'Spam ou propaganda enganosa', value: 'spam' },
  { label: 'Golpe ou fraude', value: 'fraude' },
  { label: 'Conteúdo ofensivo ou discurso de ódio', value: 'conteudo_ofensivo' },
  { label: 'Conteúdo sexual ou impróprio', value: 'conteudo_sexual' },
  { label: 'Violência ou atividade ilegal', value: 'violencia' },
  { label: 'Informações falsas', value: 'informacao_falsa' },
  { label: 'Violação de direitos autorais ou marca', value: 'direitos_autorais' },
  { label: 'Outro motivo', value: 'outro' }
]

export default {
  name: 'ReportPageButton',
  props: {
    targetId: { type: [Number, String], required: true },
    targetType: { type: String, default: 'commerce' },
    tag: { type: String, default: 'button' },
    buttonClass: { type: [String, Array, Object], default: '' },
    label: { type: String, default: 'Reportar' },
    iconSize: { type: String, default: '20px' }
  },
  data () {
    return { open: false, reason: null, details: '', email: '', loading: false, sent: false, error: '', reasons: REPORT_REASONS }
  },
  methods: {
    reset () {
      this.reason = null; this.details = ''; this.email = ''; this.sent = false; this.error = ''
    },
    async submit () {
      if (!this.reason) return
      this.loading = true
      this.error = ''
      try {
        await api.post('/reports', {
          targetType: this.targetType,
          targetId: Number(this.targetId),
          reason: this.reason,
          details: this.details,
          email: this.email,
          pageUrl: typeof window !== 'undefined' ? window.location.href : ''
        })
        this.sent = true
      } catch (e) {
        this.error = e?.response?.data?.message || 'Não foi possível enviar. Tente novamente.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.report-page-card { width: 440px; max-width: 92vw; }
</style>
