<template>
  <q-page class="demo-page">
    <div class="demo-shell px-4 py-4 pb-10">
      <form @submit.prevent="open()" class="demo-search">
        <q-input
          v-model="searchInput"
          type="search"
          standout="bg-white"
          rounded
          clearable
          borderless
          input-class="search-input-field"
          placeholder="Busque por nome, categoria ou serviço"
          class="search-input-wrapper"
        >
          <template v-slot:prepend>
            <div class="search-input-icon">
              <AppIcon name="search" :size="20" class="text-gray-400" />
            </div>
          </template>
          <template v-slot:append>
            <q-btn unelevated color="primary" size="sm" class="search-button" @click="open()">
              Buscar
            </q-btn>
          </template>
        </q-input>
      </form>

      <div class="demo-header">
        <h1 class="demo-title">Demonstração de ícones</h1>
        <p class="demo-subtitle">
          Cada linha é uma família de ícones aplicada às primeiras categorias. Todos são servidos via Iconify (api.iconify.design).
        </p>
      </div>

      <section v-for="family in families" :key="family.id" class="family">
        <div class="family-head">
          <h2 class="family-name">{{ family.name }}</h2>
          <span class="family-license">{{ family.license }}</span>
        </div>
        <p v-if="family.note" class="family-note">{{ family.note }}</p>
        <div class="family-row">
          <div v-for="(icon, i) in family.icons" :key="family.id + i" class="demo-card">
            <div class="demo-icon-wrap">
              <img :src="iconUrl(family, icon)" :alt="categories[i]" class="demo-icon" loading="lazy" />
            </div>
            <p class="demo-name">{{ categories[i] }}</p>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'

const CATEGORIES = ['Delivery', 'Comércios', 'Serviços', 'Beleza', 'Restaurantes', 'Saúde', 'Mercados', 'Pets', 'Automotivo', 'Educação']

const EMOJI = ['motor-scooter', 'convenience-store', 'hammer-and-wrench', 'lipstick', 'fork-and-knife-with-plate', 'stethoscope', 'shopping-cart', 'paw-prints', 'automobile', 'graduation-cap']
const PHOSPHOR = ['moped', 'storefront', 'wrench', 'scissors', 'fork-knife', 'first-aid-kit', 'shopping-cart', 'paw-print', 'car', 'graduation-cap']

const FAMILIES = [
  { id: 'ph', name: 'Phosphor — Regular', license: 'MIT', prefix: 'ph', color: '#2563eb', icons: PHOSPHOR },
  { id: 'ph-duotone', name: 'Phosphor — Duotone', license: 'MIT', prefix: 'ph', color: '#2563eb', icons: PHOSPHOR.map((n) => `${n}-duotone`) },
  { id: 'ph-fill', name: 'Phosphor — Fill', license: 'MIT', prefix: 'ph', color: '#2563eb', icons: PHOSPHOR.map((n) => `${n}-fill`) },
  { id: 'lucide', name: 'Lucide', license: 'ISC', prefix: 'lucide', color: '#2563eb', icons: ['bike', 'store', 'wrench', 'scissors', 'utensils', 'stethoscope', 'shopping-cart', 'paw-print', 'car', 'graduation-cap'] },
  { id: 'tabler', name: 'Tabler Icons', license: 'MIT', prefix: 'tabler', color: '#2563eb', icons: ['moped', 'building-store', 'tool', 'scissors', 'tools-kitchen-2', 'stethoscope', 'shopping-cart', 'paw', 'car', 'school'] },
  { id: 'material', name: 'Material Symbols — Rounded', license: 'Apache 2.0', prefix: 'material-symbols', color: '#2563eb', icons: ['delivery-truck-speed-rounded', 'storefront-rounded', 'home-repair-service-rounded', 'content-cut-rounded', 'restaurant-rounded', 'medical-services-rounded', 'shopping-cart-rounded', 'pets-rounded', 'directions-car-rounded', 'school-rounded'] },
  { id: 'heroicons', name: 'Heroicons — Outline', license: 'MIT', prefix: 'heroicons', color: '#2563eb', note: 'Set enxuto: Restaurantes, Pets e Automotivo usam ícones aproximados.', icons: ['truck', 'building-storefront', 'wrench-screwdriver', 'sparkles', 'cake', 'heart', 'shopping-cart', 'face-smile', 'map', 'academic-cap'] },
  { id: 'fluent-flat', name: 'Fluent Emoji — Flat (colorido)', license: 'MIT', prefix: 'fluent-emoji-flat', icons: EMOJI },
  { id: 'fluent-3d', name: 'Fluent Emoji — 3D (colorido)', license: 'MIT', prefix: 'fluent-emoji', icons: EMOJI },
  { id: 'noto', name: 'Noto Emoji (colorido)', license: 'Apache 2.0', prefix: 'noto', icons: EMOJI },
  { id: 'openmoji', name: 'OpenMoji (colorido)', license: 'CC BY-SA 4.0 (exige atribuição)', prefix: 'openmoji', icons: EMOJI },
  { id: 'twemoji', name: 'Twemoji (colorido)', license: 'CC BY 4.0 (exige atribuição)', prefix: 'twemoji', icons: EMOJI },
  { id: 'flat-color', name: 'Flat Color Icons — estilo Icons8 (colorido)', license: 'MIT', prefix: 'flat-color-icons', note: 'Set limitado: vários ícones são aproximados.', icons: ['in-transit', 'shop', 'support', 'like', 'home', 'biomass', 'paid', 'butting-in', 'automotive', 'graduation-cap'] }
]

export default defineComponent({
  name: 'DemoIcones',
  data () {
    return {
      searchInput: '',
      categories: CATEGORIES,
      families: FAMILIES
    }
  },
  methods: {
    open () {
      if (!this.searchInput) return
      this.$router.push(`/buscar/${this.searchInput}`)
    },
    iconUrl (family, icon) {
      const color = family.color ? `?color=${encodeURIComponent(family.color)}` : ''
      return `https://api.iconify.design/${family.prefix}/${icon}.svg${color}`
    }
  }
})
</script>

<style scoped>
.demo-page {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.demo-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.search-input-wrapper {
  border-radius: 999px;
  background: #ffffff;
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.12),
    0 2px 6px rgba(59, 130, 246, 0.15);
  border: 1px solid #dbeafe;
  padding-right: 0.25rem;
  overflow: hidden;
}

.search-input-wrapper :deep(.q-field__control),
.search-input-wrapper :deep(.q-field__marginal),
.search-input-wrapper :deep(.q-field__native) {
  border-radius: 999px !important;
}

.search-input-wrapper :deep(.q-field__control) {
  box-shadow: none !important;
}

.search-input-icon {
  padding-left: 1rem;
  padding-right: 0.5rem;
  display: flex;
  align-items: center;
}

.search-input-field {
  font-size: 0.95rem;
}

.search-button {
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: none;
}

.demo-header {
  margin: 20px 2px 8px;
}

.demo-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.3;
  color: #0f172a;
}

.demo-subtitle {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

.family {
  margin-top: 22px;
}

.family-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 0 2px 8px;
}

.family-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
  color: #1e293b;
}

.family-license {
  font-size: 0.7rem;
  font-weight: 600;
  color: #4f46e5;
  background: #eef2ff;
  border-radius: 999px;
  padding: 2px 8px;
}

.family-note {
  margin: -4px 2px 8px;
  font-size: 0.72rem;
  color: #94a3b8;
}

.family-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.demo-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 10px 6px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.demo-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: 0.5px solid rgba(59, 130, 246, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-icon {
  width: 32px;
  height: 32px;
}

.demo-name {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
  line-height: 1.25;
}

@media (min-width: 768px) {
  .family-row {
    grid-template-columns: repeat(10, minmax(0, 1fr));
  }
}
</style>
