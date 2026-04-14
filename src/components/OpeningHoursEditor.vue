<template>
  <q-form @submit="saveHours" class="fix-infos-form">
    <div class="fix-card">
      <div class="fix-card__header">
        <div>
          <p class="fix-card__eyebrow">Horário de funcionamento</p>
          <h3 class="fix-card__title">Preencha manualmente ou cole do Google</h3>
          <p class="fix-card__subtitle">
            Exemplos: <code>Segunda: 08:00-18:00</code> ou <code>Seg-Sex: 08:00-18:00</code>
          </p>
        </div>
      </div>

      <q-input
        filled
        v-model="importHoursText"
        type="textarea"
        autogrow
        label="Cole os horários"
        class="w-full"
      />

      <div class="fix-import-actions">
        <q-btn no-caps unelevated color="primary" label="Importar texto" @click="applyImportedHours" />
        <q-btn no-caps flat color="grey-7" label="Limpar horários" @click="clearOpeningHours" />
      </div>

      <div class="fix-hours-list">
        <div
          v-for="(dayConfig, index) in openingHours"
          :key="dayConfig.day"
          class="fix-hours-row"
        >
          <div class="fix-hours-row__top">
            <div>
              <p class="fix-hours-row__label">{{ dayConfig.label }}</p>
              <p class="fix-hours-row__value">{{ daySummary(dayConfig) }}</p>
            </div>
            <q-toggle v-model="dayConfig.enabled" color="primary" />
          </div>

          <div v-if="dayConfig.enabled" class="fix-hours-row__inputs">
            <q-input
              filled
              dense
              type="time"
              v-model="dayConfig.intervals[0].open"
              label="Abre"
              class="fix-hours-row__input"
            />
            <q-input
              filled
              dense
              type="time"
              v-model="dayConfig.intervals[0].close"
              label="Fecha"
              class="fix-hours-row__input"
            />
            <q-btn
              flat
              no-caps
              color="primary"
              label="Copiar para todos"
              class="fix-hours-row__copy"
              @click="copyDayToAll(index)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="fix-actions">
      <q-btn label="Salvar" type="submit" color="primary" no-caps unelevated />
    </div>
  </q-form>
</template>

<script>
import { ref } from 'vue'
import {
  formatOpeningHours,
  normalizeOpeningHours,
  parseOpeningHoursText,
} from 'src/js/openingHours'

export default {
  emits: ['saved'],
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  setup() {
    return {
      importHoursText: ref(''),
      openingHours: ref(normalizeOpeningHours([])),
    }
  },
  watch: {
    data: {
      immediate: true,
      deep: true,
      handler(d) {
        this.openingHours = normalizeOpeningHours(d?.openingHours)
      },
    },
  },
  methods: {
    daySummary(dayConfig) {
      return formatOpeningHours(dayConfig)
    },
    copyDayToAll(index) {
      const source = this.openingHours[index]
      this.openingHours = this.openingHours.map((day) => ({
        ...day,
        enabled: source.enabled,
        intervals: source.enabled
          ? source.intervals.map((interval) => ({ ...interval }))
          : [{ open: '08:00', close: '18:00' }],
      }))
    },
    applyImportedHours() {
      if (!this.importHoursText?.trim()) {
        this.$q.notify({
          color: 'warning',
          position: 'top',
          message: 'Cole os horários antes de importar.',
        })
        return
      }

      const parsed = parseOpeningHoursText(this.importHoursText)
      this.openingHours = normalizeOpeningHours(parsed)
      this.$q.notify({
        color: 'secondary',
        position: 'top',
        message: 'Horários importados. Revise antes de salvar.',
      })
    },
    clearOpeningHours() {
      this.openingHours = normalizeOpeningHours([])
      this.importHoursText = ''
    },
    saveHours() {
      this.$q.loading.show()
      this.$api.post(`/categories/ads/${this.data.id}`, {
        name: this.data.name,
        description: this.data.description,
        facebook: this.data.facebook,
        instagram: this.data.instagram,
        website: this.data.website,
        email: this.data.email,
        openingHours: normalizeOpeningHours(this.openingHours),
      })
        .then((response) => {
          if (response.data) {
            this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Horário salvo com sucesso!',
            })
            this.$emit('saved')
          }
        })
        .catch((err) => {
          const msg = err.response ? err.response.data.message : 'Erro na conexão!'
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: msg,
            icon: 'report_problem',
          })
        })
        .finally(() => {
          this.$q.loading.hide()
        })
    },
  },
}
</script>

<style scoped>
.fix-infos-form {
  display: grid;
  gap: 16px;
  padding: 8px;
}

.fix-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.fix-card__header {
  margin-bottom: 14px;
}

.fix-card__eyebrow {
  margin: 0 0 4px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.fix-card__title {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
  font-weight: 700;
}

.fix-card__subtitle {
  margin: 6px 0 0;
  font-size: 0.84rem;
  color: #64748b;
}

.fix-import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0 14px;
}

.fix-hours-list {
  display: grid;
  gap: 10px;
}

.fix-hours-row {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px;
  background: #f8fafc;
}

.fix-hours-row__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.fix-hours-row__label {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.fix-hours-row__value {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #64748b;
}

.fix-hours-row__inputs {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.fix-hours-row__copy {
  grid-column: 1 / -1;
  justify-self: flex-start;
}

.fix-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
