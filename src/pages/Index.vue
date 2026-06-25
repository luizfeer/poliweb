<template>
  <q-page class="index-page">
    <div class="index-shell px-4 py-4 pb-8">
      <Location class="mb-4" />

      <!-- Destaque: favorito que você segue -->
      <div v-if="favoriteFollow" class="section mt-2">
        <div
          class="favorite-widget flex flex-col md:flex-row md:items-center gap-3 md:gap-5 p-4 rounded-2xl bg-white shadow-sm border border-gray-100 active:scale-[0.99] transition-transform touch-manipulation"
          @click="goToFavorite(favoriteFollow)"
        >
          <!-- Mini galeria 16:9 -->
          <div class="favorite-gallery16">
            <div class="favorite-gallery16-inner">
              <div class="favorite-gallery16-grid">
                <div
                  v-for="(img, i) in favoriteImages"
                  :key="'fv-img-' + i"
                  class="favorite-gallery16-img"
                >
                  <img :src="img" loading="lazy" />
                </div>
                <div
                  v-if="!favoriteImages.length"
                  class="favorite-gallery16-placeholder"
                >
                  <AppIcon name="storefront" :size="30" class="text-white" />
                </div>
              </div>
            </div>
            <span v-if="favoritePostedAt" class="favorite-gallery16-time">{{ timeAgo(favoritePostedAt) }}</span>
          </div>

          <!-- Texto e ações -->
          <div class="flex-1 min-w-0 md:mt-0">
            <p class="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">
              Seu favorito
            </p>
            <p class="font-semibold text-gray-900 text-base m-0 line-clamp-1">
              {{ favoriteFollow.name }}
            </p>
            <p
              v-if="favoriteFollow.description"
              class="text-xs text-gray-500 mt-1 mb-0 line-clamp-2"
            >
              {{ favoriteFollow.description }}
            </p>
            <div class="mt-3 flex items-center gap-2">
              <q-chip outline color="primary" text-color="primary" size="sm" class="px-2 py-1">
                Ver perfil
              </q-chip>
              <span class="text-[11px] text-gray-400">
                Toque para abrir o comércio
              </span>
            </div>
          </div>
        </div>
      </div>

      <TopRankedAdsWidget :address-id="addressId" />
      <RecentVideosWidget :address-id="addressId" />
      <CityAdsWidget :address-id="addressId" />

      <div v-if="history?.length" class="section mt-6">
        <h2 class="section-title">Veja novamente</h2>
        <CardAds :ads="history" :showAddress="true" :reverse="true" />
      </div>
      <div v-if="follow?.length" class="section mt-8">
        <h2 class="section-title">Você segue</h2>
        <CardAds :ads="follow" :showAddress="true" :reverse="true" />
      </div>

      <router-link to="/encontre" class="block mt-8">
        <div class="action-card flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 active:scale-[0.99] transition-transform touch-manipulation">
          <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <AppIcon name="storefront" class="text-white" :size="28" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 m-0">Encontre o que precisa agora</p>
            <p class="text-sm text-gray-500 m-0 mt-0.5">Ver todas as categorias</p>
          </div>
          <AppIcon name="arrow-forward" :size="24" class="text-primary flex-shrink-0" />
        </div>
      </router-link>

      <div class="section mt-8">
        <h2 class="section-title">Faça uma busca</h2>
        <form @submit.prevent="open()" class="mt-3">
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
            :debounce="300"
          >
            <template v-slot:prepend>
              <div class="search-input-icon">
                <AppIcon name="search" :size="20" class="text-gray-400" />
              </div>
            </template>
            <template v-slot:append>
              <q-btn
                unelevated
                color="primary"
                size="sm"
                class="search-button"
                @click="open()"
              >
                Buscar
              </q-btn>
            </template>
          </q-input>
        </form>
      </div>

      <div
        v-if="deferredPrompt"
        class="action-card flex items-center gap-4 p-4 mt-8 rounded-2xl bg-green-50 border border-green-200 active:scale-[0.99] transition-transform touch-manipulation"
        @click="install()"
      >
        <div class="flex-shrink-0 w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center">
          <AppIcon name="file-download" class="text-white" :size="28" />
        </div>
        <div class="flex-1">
          <p class="font-semibold text-green-800 m-0">Instalar o Aplicativo</p>
          <p class="text-sm text-green-600 m-0 mt-0.5">Use como app no seu celular</p>
        </div>
      </div>

      <!-- Grid de categorias no final da página -->
      <div v-if="categories && categories.length" class="section mt-10">
        <h2 class="section-title mb-3">Categorias</h2>
        <p class="text-xs text-gray-500 mb-3">
          Explore todos os tipos de comércios disponíveis perto de você.
        </p>
        <div class="grid grid-cols-3 gap-3">
          <router-link
            v-for="cat in categories"
            :key="cat.id"
            :to="redirectCategory(cat)"
            class="category-grid-card no-underline"
          >
            <div class="category-grid-icon-wrapper">
              <q-img
                :src="cat.iconLink"
                class="category-grid-icon"
                spinner-color="gray-300"
                spinner-size="18px"
              />
            </div>
            <p class="category-grid-name">
              {{ cat.name }}
            </p>
          </router-link>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";
import { mapState } from "vuex";
import Location from "components/Location";
import CardAds from "src/components/CardAds.vue";
import RecentVideosWidget from "src/components/RecentVideosWidget.vue";
import TopRankedAdsWidget from "src/components/TopRankedAdsWidget.vue";
import CityAdsWidget from "src/components/CityAdsWidget.vue";
import { timeAgo } from "src/js/timeAgo";

export default defineComponent({
  components: {
    Location,
    CardAds,
    RecentVideosWidget,
    TopRankedAdsWidget,
    CityAdsWidget,
  },
  computed: {
    ...mapState('categories', ['list']),
    ...mapState('localization', ['current']),
    categories() {
      return this.list || []
    },
    addressId() {
      return this.current?.id ?? this.localization?.id ?? null
    },
    favoriteImages() {
      const ad = this.favoriteFollow
      const gallery = ad?.files?.gallery
      if (!Array.isArray(gallery) || !gallery.length) return []
      return gallery
        .filter((g) => !g.deletedAt && g.link)
        .slice(0, 6)
        .map((g) => g.link)
    },
    favoritePostedAt() {
      const ad = this.favoriteFollow
      const gallery = ad?.files?.gallery
      if (!Array.isArray(gallery) || !gallery.length) return null
      const sorted = [...gallery].filter((g) => !g.deletedAt && g.createdAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      return sorted[0]?.createdAt || null
    },
  },
  name: "PageIndex",
  setup() {   
    return {
      subCategorieActive: ref({
        id: '',
        name: ''
      }),
      admin: ref(false),
      subCategories: ref([]),
      slide: ref("0"),
      loading : ref(true),
      localization: ref({}),
      deferredPrompt: ref(null),
      searchInput: ref(''),
      history: [],
      follow: [],
      favoriteFollow: null,
    };
  },
   created() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
    });
    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
    });
  },
  methods: {
    timeAgo,
    open(){
      this.$router.push(`/buscar/${this.searchInput}`)
    },
    goToFavorite(ad) {
      if (!ad || !ad.id || !ad.name) return
      let slug = encodeURIComponent(
        ad.name
          .replace(/[^a-z0-9_]+/gi, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase()
      )
      this.$router.push(`/${ad.id}/${slug}`)
    },
    redirectCategory(item) {
      const subs = item?.subcategories
      if (subs && subs.length) {
        return `/sub/${item.id}`
      }
      return `/categorias/${item.id}`
    },
    async install() {
      this.deferredPrompt.prompt();
    },
  },
  mounted(){
     this.admin = localStorage.getItem('admin') ? true : false
     const localization = localStorage.getItem("localization")
     this.localization = localization ? JSON.parse(localization) : null
     const history = localStorage.getItem('history')
     const follow = localStorage.getItem('follow')
     this.history = history ? JSON.parse(history) : []
     this.follow = follow ? JSON.parse(follow) : []
     this.favoriteFollow = this.follow && this.follow.length ? this.follow[this.follow.length - 1] : null
     if (this.localization) {
       this.$store.dispatch('localization/setLocalization', this.localization)
       this.$store.dispatch('categories/fetchCategories', this.localization)
     }
  }
})
</script>

<style scoped>
.index-page {
  padding-bottom: env(safe-area-inset-bottom);
  background-color: #f3f4f6;
}
.index-shell {
  width: 100%;
}
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}
.action-card {
  -webkit-tap-highlight-color: transparent;
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
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
}

.search-button {
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: none;
}

.favorite-widget {
  background: linear-gradient(135deg, #f9fafb, #eef2ff);
}

.favorite-gallery16 {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  background: #0f172a;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.favorite-gallery16::before,
.favorite-gallery16::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  pointer-events: none;
  z-index: 1;
}
.favorite-gallery16::before {
  top: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
}
.favorite-gallery16::after {
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
}

.favorite-gallery16-time {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  z-index: 2;
}

@media (min-width: 640px) {
  .favorite-gallery16 {
    max-width: 280px;
    aspect-ratio: 4 / 3;
  }
}

.favorite-gallery16-inner {
  width: 100%;
  height: 100%;
  padding: 5px;
}

.favorite-gallery16-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.favorite-gallery16-img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.favorite-gallery16-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.favorite-gallery16-placeholder {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1e293b 0, #0f172a 60%);
}

.category-grid-card {
  background: white;
  border-radius: 16px;
  padding: 10px 8px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}

.category-grid-card:active {
  transform: scale(0.97);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
  border-color: #c7d2fe;
}

.category-grid-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.category-grid-icon {
  width: 28px;
  height: 28px;
  border-radius: 999px;
}

.category-grid-name {
  font-size: 0.72rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
  margin: 0;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-underline {
  text-decoration: none;
}
@media (min-width: 1024px) {
  .index-page {
    background: #eef2f7;
  }
  .index-shell {
    width: min(960px, 100%);
    margin: 0 auto;
    padding: 1.25rem 1.25rem 2.5rem;
  }
  .section-title {
    font-size: 1rem;
    font-weight: 800;
    color: #111827;
  }
  .favorite-widget,
  .action-card {
    border-radius: 8px !important;
  }
  .favorite-gallery16 {
    border-radius: 8px;
  }
  .search-input-wrapper {
    border-radius: 8px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  }
  .search-input-wrapper :deep(.q-field__control),
  .search-input-wrapper :deep(.q-field__marginal),
  .search-input-wrapper :deep(.q-field__native) {
    border-radius: 8px !important;
  }
  .search-button {
    border-radius: 8px;
  }
  .grid.grid-cols-3 {
    grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
    gap: 0.6rem;
  }
  .category-grid-card {
    border-radius: 8px;
    padding: 0.7rem 0.5rem;
  }
  .category-grid-icon-wrapper {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }
  .category-grid-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
