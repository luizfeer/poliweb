<template>
  <q-page class="search-page bg-gray-50">
    <div class="px-4 pt-4 pb-6">
      <!-- Top bar -->
      <div class="flex items-center gap-3 mb-4">
        <button
          type="button"
          class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 active:scale-95 transition-transform"
          @click="$router.go(-1)"
        >
          <AppIcon name="arrow-back" :size="20" class="text-gray-700" />
        </button>
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-primary tracking-wide uppercase">Buscar</span>
          <h1 class="text-base font-semibold text-gray-900 leading-tight">Encontre comércios e serviços</h1>
        </div>
      </div>

      <!-- Busca -->
      <form @submit.prevent class="mt-1">
        <q-input
          v-model="searchInput"
          type="search"
          standout="bg-white"
          rounded
          clearable
          borderless
          input-class="search-input-field"
          placeholder="Digite o que você procura..."
          class="search-input-wrapper"
          debounce="600"
        >
          <template v-slot:prepend>
            <div class="search-input-icon">
              <AppIcon name="search" :size="20" class="text-gray-400" />
            </div>
          </template>
        </q-input>
      </form>

      <!-- Últimos acessados (formato balão flutuante) -->
      <div v-if="history.length && !searchInput && !loading" class="history-bubbles-wrapper">
        <p class="history-bubbles-label">Últimos acessados</p>
        <div class="history-bubbles">
          <router-link
            v-for="item in history"
            :key="item.id"
            :to="goToAd(item)"
            class="history-bubble"
          >
            <q-img
              v-if="item.files?.logo && item.files.logo.length"
              :src="pathImg(item)"
              :ratio="1"
              class="history-bubble-img"
              spinner-color="white"
              spinner-size="24px"
            />
            <span v-else class="history-bubble-avatar">{{ (item.name || '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) }}</span>
            <span class="history-bubble-name">{{ item.name }}</span>
          </router-link>
        </div>
      </div>

      <!-- Resultados -->
      <template v-if="!loading">
        <div class="mt-6">
          <div class="flex items-baseline justify-between mb-2" v-if="ads.length">
            <h2 class="results-title">Resultados</h2>
            <span class="results-count text-xs text-gray-400">{{ ads.length }} encontrado{{ ads.length > 1 ? 's' : '' }}</span>
          </div>

          <div v-if="ads.length === 0" class="empty-state">
            <p class="empty-title">Nenhum resultado encontrado</p>
            <p class="empty-subtitle">Tente buscar por outro nome, categoria ou serviço.</p>
          </div>

          <div v-else class="results-list">
            <router-link
              v-for="item in ads"
              :key="item.id"
              :to="goToAd(item)"
              class="result-card-link"
            >
              <div class="result-card">
                <div class="result-media">
                  <q-img
                    v-if="item.files?.logo && item.files.logo.length"
                    :src="pathImg(item)"
                    :ratio="1"
                    class="h-full w-full"
                    spinner-color="white"
                    spinner-size="40px"
                  />
                  <q-avatar
                    v-else
                    rounded
                    class="h-full w-full"
                    color="primary"
                    text-color="white"
                  >
                    {{ (item.name || '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) }}
                  </q-avatar>
                </div>

                <div class="result-body">
                  <h3 class="result-category" v-if="item.category">{{ item.category }}</h3>
                  <h2 class="result-name">{{ item.name }}</h2>
                  <p class="result-desc" v-if="item.description">
                    {{ formatDesc(item.description) }}
                  </p>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </template>

      <div v-else class="p-1 mt-4">
        <div v-for="i in 6" :key="i">
          <q-skeleton type="QToolbar" class="my-2 h-[86px]" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>

import { ref } from "vue";
// import AdsPage from 'components/Ads'
import collect from 'collect.js';
export default ({
  components: {
  //  AdsPage
  },
  name: "PageIndex",
  setup() {
    return {
      colors: ref(['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning']),
      ads: ref([]),
      admin: ref(false),
      loading : ref(false),
      data: ref({}),
      searchInput: ref(''),
      history: ref([])
    };
  },
  watch: {
    async searchInput(newValue, oldValue) {
      if(newValue!== oldValue){
        this.ads= []
        await this.search(`name=${newValue}`)
        await this.search(`description=${newValue}`)
        await this.search(`category=${newValue}`)
      }
    }
  },
  methods: {
    async search (params) {
      this.loading = true
      await this.$api.get(`/categories/ads?${encodeURI(params)}&nonDeleted=true`)
      .then((response) => {
          if(response.data){
            console.log(response.data.ads)
            this.addDataResponse(response.data.ads)

          }
        })
      .catch((err) => {
        console.log(err)
        let msg
        if( err.response){
          msg =  err.response.data.message
        }else {
          msg = 'Erro na conexão!'
        }
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
      })
      .finally(() => {
        this.loading = false
      })
    },
    addDataResponse(data){
      const collection = collect([ ...this.ads, ...data])
      const unique = collection.unique('id')
      const filtred = unique.all()
      this.ads = filtred
    },
    formatDesc(str) {
      if(!str) return
      if (str.length > 100) {
        return str.slice(0, 100) + "...";
      } else {
        return str;
      }
    },
   showAds(item){
        this.data = {...item};
        this.slide= '1'
      },
    goToAd(item) {
      if (!item?.id || !item?.name) return '/'
      const slug = encodeURIComponent(
        item.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
      )
      return `/${item.id}/${slug}`
    },
    pathImg (item) {
      const logo = item?.files?.logo
      if (!logo?.length) return ''
      const sorted = [...logo].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      return sorted[0]?.link || ''
    },
  },
  mounted(){
     this.admin = localStorage.getItem('admin') ? true : false
     this.searchInput = this.$route.params.terms || ''
     const stored = localStorage.getItem('history')
     try {
       this.history = (stored && JSON.parse(stored)) || []
       if (!Array.isArray(this.history)) this.history = []
     } catch {
       this.history = []
     }
  },
  beforeMount () {
  },
  })
</script>

<style scoped>
.search-page {
  padding-bottom: env(safe-area-inset-bottom);
}

.search-input-wrapper {
  border-radius: 999px;
  background: #ffffff;
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.12),
    0 2px 6px rgba(59, 130, 246, 0.15);
  border: 1px solid #dbeafe;
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
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
}

.results-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #111827;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.result-card-link {
  text-decoration: none;
}

.result-card {
  display: flex;
  gap: 0.75rem;
  padding: 0.65rem 0.7rem;
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.result-media {
  width: 56px;
  height: 56px;
  border-radius: 0.9rem;
  overflow: hidden;
  flex-shrink: 0;
}

.result-body {
  flex: 1;
  min-width: 0;
}

.result-category {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  margin: 0 0 2px 0;
}

.result-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.35;
}

.result-desc {
  margin: 3px 0 0 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  margin-top: 1.5rem;
  padding: 1.25rem 1rem;
  border-radius: 1rem;
  border: 1px dashed #e5e7eb;
  background: #f9fafb;
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 2px 0;
}

.empty-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

/* Últimos acessados - formato balão flutuante (sem colar nos cantos) */
.history-bubbles-wrapper {
  margin-top: 1.25rem;
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 1.25rem;
  border: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 2px 16px rgba(15, 23, 42, 0.06);
}

.history-bubbles-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem 0;
  padding-left: 0.25rem;
}

.history-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: flex-start;
}

.history-bubble {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  background: #ffffff;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
  text-decoration: none;
  color: #374151;
  font-size: 0.88rem;
  font-weight: 500;
  max-width: calc(100% - 0.5rem);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, box-shadow 0.15s;
}

.history-bubble:active {
  transform: scale(0.98);
}

.history-bubble:hover {
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
}

.history-bubble-img {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 999px;
  object-fit: cover;
}

.history-bubble-avatar {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 999px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-bubble-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}
</style>
