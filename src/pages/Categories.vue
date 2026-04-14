<template>
  <q-page class="category-page">
    <div class="category-container">
      <template v-if="!loading">
        <div class="category-header">
          <button type="button" class="back-link" @click="$router.go(-1)">
            <AppIcon name="arrow-back" :size="22" />
            <span>Voltar</span>
          </button>
          <h1 class="category-title">Comércios da categoria</h1>
          <p class="category-subtitle">Escolha como deseja visualizar os estabelecimentos.</p>
        </div>

        <div class="admin-actions" v-if="admin">
          <router-link :to="`/painel/ads/add/${$route.params.id}/${$route.params.name}`">
            <q-btn no-caps rounded unelevated class="admin-btn admin-btn-primary">
              <q-icon name="add_business" size="18px" class="q-mr-xs" />
              Novo anúncio
            </q-btn>
          </router-link>
          <router-link v-if="!ads.length" :to="`/painel/categorias/add/${$route.params.id}/${$route.params.name}`">
            <q-btn no-caps rounded unelevated class="admin-btn admin-btn-secondary">
              <q-icon name="category" size="18px" class="q-mr-xs" />
              Nova sub-categoria
            </q-btn>
          </router-link>
        </div>

        <div class="view-toggle-wrap">
          <q-btn-toggle
            v-model="viewMode"
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            no-caps
            rounded
            class="view-toggle"
            :options="[
              { label: 'Lista', value: 'list', icon: 'view_list' },
              { label: 'Grid', value: 'grid', icon: 'grid_view' }
            ]"
          />
        </div>

        <div v-if="ads.length === 0" class="empty-state">Nenhum comércio cadastrado nessa categoria.</div>

        <div class="ads-grid" :class="`ads-grid-${viewMode}`">
          <router-link
            v-for="item in ads"
            :key="item.id"
            :to="'/' + item.id"
            class="ad-card-link"
          >
            <article class="ad-card" :class="`ad-card-${viewMode}`">
              <div class="ad-card-media" :class="`ad-card-media-${viewMode}`">
                <q-img
                  v-if="getGalleryBackdrop(item)"
                  :src="getGalleryBackdrop(item)"
                  :ratio="1"
                  class="ad-media-bg"
                  spinner-color="white"
                  spinner-size="26px"
                />
                <div v-else class="ad-media-bg ad-media-bg-fallback"></div>
                <div class="ad-media-overlay"></div>

                <div class="ad-logo-wrap">
                  <q-img
                    v-if="getLogo(item)"
                    :src="getLogo(item)"
                    :ratio="1"
                    :class="['ad-logo-round', `ad-logo-round-${viewMode}`]"
                    spinner-color="white"
                    spinner-size="20px"
                  />
                  <q-avatar
                    v-else
                    round
                    :class="['ad-logo-round', `ad-logo-round-${viewMode}`]"
                    :color="colors[Math.floor(Math.random() * colors.length)]"
                    text-color="white"
                  >
                    {{ initials(item.name) }}
                  </q-avatar>
                </div>
              </div>
              <div class="ad-card-body">
                <h2 class="ad-card-title">{{ item.name }}</h2>
                <p class="ad-card-desc">{{ formatDesc(item.description) || "Sem descrição no momento." }}</p>
              </div>
            </article>
          </router-link>
        </div>
      </template>

      <div v-else class="p-2">
        <div v-for="i in 10" :key="i">
          <q-skeleton type="QToolbar" class="my-2 h-[86px]"/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>

import { ref, watch } from "vue";
// import AdsPage from 'components/Ads'

const CATEGORIES_VIEW_KEY = 'poliweb_categories_view_mode'

export default ({
  components: {
  //  AdsPage
  },
  name: "PageIndex",
  setup() {
    const stored = typeof localStorage !== 'undefined' && localStorage.getItem(CATEGORIES_VIEW_KEY)
    const viewMode = ref(stored === 'grid' || stored === 'list' ? stored : 'list')
    watch(viewMode, (val) => {
      try {
        localStorage.setItem(CATEGORIES_VIEW_KEY, val)
      } catch (_) {}
    })
    return {
      colors: ref(['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning']),
      ads: ref([]),
      admin: ref(false),
      slide: ref('0'),
      loading : ref(true),
      data: ref({}),
      viewMode
    };
  },
  methods: {
    initials(name) {
      if (!name) return ""
      return name.split(" ").map((n)=>n[0]).join("").toUpperCase().slice(0, 2)
    },
    formatDesc(str) {
      if(!str) return
      if (str.length > 50) {
        return str.slice(0, 50) + "...";
      } else {
        return str;
      }
    },
   showAds(item){
        this.data = {...item};
        this.slide= '1'
      },
    getLogo(item) {
      if (!item?.files?.logo?.length) return null
      const logos = item.files.logo
        .filter((logo) => !logo.deletedAt && logo.link)
        .sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt))
      return logos.length ? logos[0].link : null
    },
    getGalleryBackdrop(item) {
      if (!item?.files?.gallery?.length) return null
      const gallery = item.files.gallery
        .filter((img) => !img.deletedAt && img.link)
        .sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt))
      return gallery.length ? gallery[0].link : null
    },
  },
  mounted(){
     this.admin = localStorage.getItem('admin') ? true : false
  },
  beforeMount () {
    this.loading = true
    this.$api.get(`/categories/${this.$route.params.id}/ads?nonDeleted=true`)
     .then((response) => {
        if(response.data){
          this.ads = response.data.categoryAds.filter((item)=>{ return !item.deletedAt })
        }
      })
      .catch((err) => {
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
  })
</script>

<style scoped>
.category-page {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  min-height: 100%;
}

.category-container {
  padding: 12px 14px 20px;
}

.category-header {
  margin-bottom: 12px;
}

.back-link {
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #4338ca;
  font-weight: 600;
  margin-bottom: 8px;
  border-radius: 999px;
  padding: 6px 10px;
}

.category-title {
  margin: 0 !important;
  padding: 0;
  font-size: 1.15rem;
  line-height: 1.25;
  color: #0f172a;
  font-weight: 700;
}

.category-subtitle {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #64748b;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 8px;
}

.view-toggle-wrap {
  margin: 10px 0 14px;
}

.view-toggle :deep(.q-btn) {
  font-weight: 600;
  letter-spacing: 0;
}

.empty-state {
  background: #fff;
  border: 1px dashed #cbd5e1;
  color: #475569;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.ads-grid {
  display: grid;
  gap: 10px;
}

.ads-grid-list {
  grid-template-columns: 1fr;
}

.ads-grid-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ad-card-link {
  text-decoration: none;
}

.ad-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
}

.ad-card:active {
  transform: scale(0.98);
  border-color: #c7d2fe;
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.12);
}

.ad-card-list {
  display: flex;
  align-items: stretch;
}

.ad-card-grid {
  display: block;
}

.ad-card-media {
  position: relative;
  overflow: hidden;
  background: #f8fafc;
}

.ad-card-media-list {
  width: 88px;
  min-width: 88px;
  height: 88px;
}

.ad-card-media-grid {
  width: 100%;
  height: 132px;
}

.ad-media-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ad-media-bg-fallback {
  background: linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%);
}

.ad-media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.35) 100%);
}

.ad-logo-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.ad-logo-round {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 3px solid #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
}

.ad-logo-round-grid {
  width: 82px;
  height: 82px;
}

.ad-logo-round-list {
  width: 68px;
  height: 68px;
}

.ad-card-body {
  padding: 10px;
}

.ad-card-title {
  margin: 0;
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 700;
  line-height: 1.3;
}

.ad-card-desc {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.35;
  min-height: 30px;
}

.admin-btn {
  font-weight: 600;
  letter-spacing: 0;
  font-size: 0.85rem;
  padding: 6px 16px;
  min-height: 36px;
  border-radius: 999px;
}

.admin-btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.admin-btn-primary:active {
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);
}

.admin-btn-secondary {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
}

.admin-btn-secondary:active {
  box-shadow: 0 2px 6px rgba(8, 145, 178, 0.2);
}
</style>
