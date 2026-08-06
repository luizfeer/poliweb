<template>
  <q-dialog
    v-model="visible"
    persistent
    maximized
    transition-show="fade"
    transition-hide="fade"
    class="select-city-modal"
    @hide="onHide"
  >
    <Teleport to="body">
      <Transition name="switch-fade">
        <div v-if="switchingCity" class="switching-overlay">
          <div class="switching-content">
            <p class="switching-text">Levando você para os comércios de</p>
            <p class="switching-city">{{ selectedCity?.city }}</p>
            <div class="switching-spinner">
              <q-spinner-dots size="56px" color="primary" />
            </div>
            <Transition name="label-fade" mode="out-in">
              <p :key="switchingLabelIndex" class="switching-label">{{ switchingLabels[switchingLabelIndex] }}</p>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>
    <div class="select-city-backdrop" />
    <div class="select-city-content">
      <div class="select-city-card">
        <div class="select-city-header">
          <div class="select-city-icon-wrap">
            <AppIcon name="location-on" :size="40" class="text-primary" />
          </div>
          <h1 class="select-city-title">Bem-vindo à Poliweb</h1>
          <p class="select-city-subtitle">
            Selecione sua cidade para ver os comércios e anúncios da região
          </p>
        </div>

        <div v-if="loadingIp" class="select-city-loading">
          <q-spinner-dots size="40px" color="primary" />
          <p class="select-city-loading-text">Detectando sua localização...</p>
        </div>

        <div v-else class="select-city-form">
          <q-select
            v-model="selectedCity"
            use-input
            input-debounce="200"
            :options="filteredCitys"
            option-label="city"
            label="Buscar ou selecionar cidade"
            outlined
            dense
            class="select-city-input"
            :disable="confirming"
            @filter="filterCitys"
          >
            <template v-slot:prepend>
              <AppIcon name="place" :size="22" class="text-primary" />
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Cidade ainda não cadastrada
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <AppIcon name="location-city" :size="20" class="text-primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt?.city }}</q-item-label>
                  <q-item-label v-if="scope.opt?.state" caption>{{ scope.opt.state }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <p v-if="suggestedCityName" class="select-city-hint">
            <AppIcon name="info" :size="16" />
            <template v-if="suggestedCity">
              Detectamos que você está em <strong>{{ suggestedCityName }}</strong>
            </template>
            <template v-else>
              Detectamos que você está em <strong>{{ suggestedCityName }}</strong>, mas essa cidade ainda não está cadastrada. Selecione uma cidade da lista.
            </template>
          </p>

          <button
            type="button"
            class="select-city-btn"
            :class="{ 'opacity-60': !selectedCity || confirming }"
            :disabled="!selectedCity || confirming"
            @click="confirm"
          >
            <q-spinner-dots v-if="confirming" size="24px" color="white" />
            <template v-else>
              <AppIcon name="check" :size="22" />
              Confirmar cidade
            </template>
          </button>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import AppIcon from 'components/AppIcon.vue'
import { fetchCities } from 'src/services/cities'

function normalize(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function findCityByIpInfo(citys, ipCity) {
  if (!ipCity) return null
  const n = normalize(ipCity)
  const exact = citys.find((c) => normalize(c.city) === n)
  if (exact) return exact
  return citys.find((c) => {
    const cn = normalize(c.city)
    return cn.includes(n) || n.includes(cn)
  })
}

const FALLBACK_CITY_NAME = 'São Sebastião do Paraíso'

export default {
  name: 'SelectCityModal',
  components: { AppIcon },
  props: {
    modelValue: { type: Boolean, default: false },
    confirmHandler: { type: Function, default: null },
  },
  data() {
    return {
      visible: this.modelValue,
      citys: [],
      filteredCitys: [],
      selectedCity: null,
      suggestedCity: null,
      suggestedCityName: '',
      loadingIp: true,
      confirming: false,
      switchingCity: false,
      switchingLabelIndex: 0,
      switchingLabels: [
        'Encontre os melhores comércios na sua região',
        'Sua agenda de serviços e empresas',
        'Conectando você aos comércios locais',
        'Descubra o que sua cidade tem a oferecer',
        'Comércios perto de você',
        'A Poliweb na palma da sua mão',
      ],
      labelInterval: null,
    }
  },
  watch: {
    modelValue(v) {
      this.visible = v
      if (v) this.init()
    },
    visible(v) {
      this.$emit('update:modelValue', v)
    },
    switchingCity(isSwitching) {
      if (isSwitching) {
        this.switchingLabelIndex = 0
        this.labelInterval = setInterval(() => {
          this.switchingLabelIndex = (this.switchingLabelIndex + 1) % this.switchingLabels.length
        }, 2500)
      } else if (this.labelInterval) {
        clearInterval(this.labelInterval)
        this.labelInterval = null
      }
    },
  },
  mounted() {
    if (this.modelValue) this.init()
  },
  beforeUnmount() {
    if (this.labelInterval) clearInterval(this.labelInterval)
  },
  methods: {
    async init() {
      const citysData = await fetchCities()
      this.citys = [...citysData].sort((a, b) => a.city.localeCompare(b.city))
      this.filteredCitys = [...this.citys]
      this.selectedCity = null
      this.suggestedCity = null
      this.suggestedCityName = ''
      this.loadingIp = true
      this.confirming = false
      this.fetchIpInfo()
    },
    async fetchIpInfo() {
      const fallback = this.citys.find((c) => c.city === FALLBACK_CITY_NAME)
      try {
        const res = await fetch('https://ipinfo.io/json')
        const data = await res.json()
        const ipCity = data?.city || ''
        this.suggestedCityName = ipCity
        const match = findCityByIpInfo(this.citys, ipCity)
        if (match) {
          this.suggestedCity = match
          this.selectedCity = match
        } else if (fallback) {
          this.selectedCity = fallback
        }
      } catch {
        if (fallback) this.selectedCity = fallback
      } finally {
        this.loadingIp = false
      }
    },
    filterCitys(val, update) {
      update(() => {
        if (!val) {
          this.filteredCitys = [...this.citys]
        } else {
          const n = normalize(val)
          this.filteredCitys = this.citys.filter((c) => normalize(c.city).includes(n))
        }
      })
    },
    async confirm() {
      if (!this.selectedCity || this.confirming) return
      this.confirming = true
      this.switchingCity = true
      try {
        if (this.confirmHandler) {
          await this.confirmHandler(this.selectedCity)
        } else {
          this.$emit('confirm', this.selectedCity)
        }
        await new Promise((r) => setTimeout(r, 2000))
        this.visible = false
      } finally {
        this.confirming = false
        this.switchingCity = false
      }
    },
    onHide() {
      this.$emit('update:modelValue', false)
    },
  },
}
</script>

<style scoped>
.select-city-modal :deep(.q-dialog__inner) {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.select-city-backdrop {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%);
  opacity: 0.97;
}
.select-city-content {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
}
.select-city-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}
.select-city-header {
  text-align: center;
  margin-bottom: 1.75rem;
}
.select-city-icon-wrap {
  width: 72px;
  height: 72px;
  margin: 0 auto 1rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
}
.select-city-icon-wrap :deep(.text-primary) {
  color: white !important;
}
.select-city-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}
.select-city-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}
.select-city-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
}
.select-city-loading-text {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}
.select-city-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.select-city-input :deep(.q-field__control) {
  border-radius: 14px;
}
.select-city-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}
.select-city-hint strong {
  color: #374151;
}
.select-city-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 52px;
  padding: 0 1.5rem;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  -webkit-tap-highlight-color: transparent;
}
.select-city-btn:not(:disabled):active {
  transform: scale(0.98);
}
.select-city-btn:disabled {
  cursor: not-allowed;
}
.switching-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  min-height: 100dvh;
  background: rgba(255, 255, 255, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.switching-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 2rem;
  max-width: 280px;
}
.switching-text {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 1.25rem;
  text-align: center;
  line-height: 1.4;
}
.switching-city {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1976d2;
  margin: 0 0 1.25rem;
  text-align: center;
}
.switching-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin: 0 auto;
}
.switching-label {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 1.25rem 0 0;
  text-align: center;
  line-height: 1.4;
  min-height: 2.5rem;
  max-width: 260px;
}
.switch-fade-enter-active,
.switch-fade-leave-active {
  transition: opacity 0.2s ease;
}
.switch-fade-enter-from,
.switch-fade-leave-to {
  opacity: 0;
}
.label-fade-enter-active,
.label-fade-leave-active {
  transition: opacity 0.3s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
}
</style>
