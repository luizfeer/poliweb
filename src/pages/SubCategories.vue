<template>
  <q-page class="sub-page">
    <div class="sub-container">
      <Location class="my-2" />

      <template v-if="!loading">
        <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          animated
          class="h-[auto] p-0"
        >
          <q-carousel-slide name="0" class="p-0">
            <div class="section-header">
              <h1 class="section-title">Categorias</h1>
              <p class="section-subtitle">Escolha uma categoria para ver subcategorias ou comércios.</p>
            </div>

            <router-link v-if="admin" :to="`/painel/categorias/add`">
              <q-btn no-caps rounded unelevated color="primary" icon="add_circle" label="Cadastrar nova categoria" class="admin-btn m-2"/>
            </router-link>

            <div class="category-list">
              <div
                v-for="item in categories"
                :key="item.id"
                @click="item.subcategories.length ? subcategories(item) : goTo(`/categorias/${item.id}/${encodeURI(item.name)}`)"
                class="cursor-pointer"
              >
                <article class="category-card">
                  <div class="category-card-main">
                    <div class="category-thumb">
                      <q-img
                        v-if="item.iconLink"
                        :src="item.iconLink"
                        :ratio="1"
                        class="category-icon"
                        spinner-color="primary"
                        spinner-size="24px"
                      />
                      <AppIcon v-else name="storefront" :size="28" class="category-icon-fallback" />
                    </div>
                    <div class="category-info">
                      <h2 class="category-name">{{ item.name }}</h2>
                      <div v-if="item.subcategories.length || item.haveAds || item.addressCity" class="category-meta">
                        <span v-if="item.subcategories.length" class="category-meta-chip">
                          {{ item.subcategories.length }} subcategorias
                        </span>
                        <span v-if="item.haveAds" class="category-meta-chip category-direct-ads">Comércios disponíveis</span>
                        <span v-if="item.addressCity" class="category-meta-chip">{{ item.addressCity }}</span>
                      </div>
                    </div>
                    <div v-if="admin" class="icon-chevron-wrap">
                      <q-btn
                        flat
                        round
                        dense
                        icon="more_vert"
                        class="actions-menu-btn"
                        @click.stop
                      >
                        <q-menu auto-close @click.stop>
                          <q-list dense style="min-width: 190px">
                            <q-item v-if="isSuperAdmin" clickable v-ripple @click.stop="goToNewAd(item)">
                              <q-item-section avatar><AppIcon name="storefront" :size="18" /></q-item-section>
                              <q-item-section>Novo anúncio</q-item-section>
                            </q-item>
                            <q-item clickable v-ripple @click.stop="editCategory(item)">
                              <q-item-section avatar><AppIcon name="edit" :size="18" /></q-item-section>
                              <q-item-section>Editar</q-item-section>
                            </q-item>
                            <q-item clickable v-ripple v-if="isMaster" @click.stop="removeCategory(item)">
                              <q-item-section avatar><AppIcon name="delete" :size="18" /></q-item-section>
                              <q-item-section class="text-negative">Excluir</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </div>
                    <div v-else class="icon-chevron-wrap">
                      <AppIcon name="chevron-right" :size="20" class="text-indigo-500" />
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </q-carousel-slide>

          <q-carousel-slide name="1" class="p-0">
            <button type="button" @click="slide = '0'" class="back-btn">
              <AppIcon name="arrow-back" :size="22" />
              <span>Voltar</span>
            </button>

            <div class="section-header">
              <h2 class="section-title">{{ subCategorieActive.name || "Subcategorias" }}</h2>
              <p class="section-subtitle">Escolha uma subcategoria para abrir os comércios.</p>
            </div>

            <router-link v-if="admin" :to="`/painel/categorias/add/${subCategorieActive.id}/${encodeURI(subCategorieActive.name)}`">
              <q-btn no-caps rounded unelevated color="primary" icon="category" label="Cadastrar sub-categoria" class="admin-btn m-2"/>
            </router-link>

            <div class="sub-list">
              <div
                v-for="item in subCategories"
                :key="item.id"
                @click="item.subcategories.length ? subcategories(item) : goTo(`/categorias/${item.id}`)"
                class="cursor-pointer"
              >
                <article class="sub-card">
                  <div class="sub-card-main">
                    <div class="sub-thumb">
                      <q-img
                        v-if="item.iconLink"
                        :src="item.iconLink"
                        :ratio="1"
                        class="sub-icon"
                        spinner-color="primary"
                        spinner-size="22px"
                      />
                      <AppIcon v-else name="storefront" :size="24" class="category-icon-fallback" />
                    </div>
                    <div class="sub-info">
                      <h3 class="sub-name">{{ item.name }}</h3>
                      <div v-if="item.subcategories?.length || item.haveAds" class="sub-meta">
                        <span v-if="item.subcategories?.length" class="category-meta-chip">
                          {{ item.subcategories.length }} níveis abaixo
                        </span>
                        <span v-if="item.haveAds" class="category-meta-chip category-direct-ads">Comércios disponíveis</span>
                      </div>
                    </div>
                  <div v-if="admin" class="icon-chevron-wrap">
                    <q-btn
                      flat
                      round
                      dense
                      icon="more_vert"
                      class="actions-menu-btn"
                      @click.stop
                    >
                      <q-menu auto-close @click.stop>
                        <q-list dense style="min-width: 190px">
                          <q-item v-if="isSuperAdmin" clickable v-ripple @click.stop="goToNewAd(item)">
                            <q-item-section avatar><AppIcon name="storefront" :size="18" /></q-item-section>
                            <q-item-section>Novo anúncio</q-item-section>
                          </q-item>
                          <q-item clickable v-ripple @click.stop="editCategory(item)">
                            <q-item-section avatar><AppIcon name="edit" :size="18" /></q-item-section>
                            <q-item-section>Editar</q-item-section>
                          </q-item>
                          <q-item clickable v-ripple v-if="isMaster" @click.stop="removeCategory(item)">
                            <q-item-section avatar><AppIcon name="delete" :size="18" /></q-item-section>
                            <q-item-section class="text-negative">Excluir</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-btn>
                  </div>
                  <div v-else class="icon-chevron-wrap">
                    <AppIcon name="chevron-right" :size="18" class="text-indigo-500" />
                  </div>
                  </div>
                </article>
              </div>
            </div>
          </q-carousel-slide>
        </q-carousel>
      </template>

      <div v-else v-for="i in 10" :key="i">
        <q-skeleton type="QToolbar" class="my-2 h-[86px]"/>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import Location from "components/Location";
import { isSuperAdmin } from 'src/js/superadmin';

// export default {
//   }
export default defineComponent({
  components: {
    Location,

  },
  name: "PageIndex",
  data() {
    return {
      subCategorieActive: {
        id: '',
        name: ''
      },
      admin: false,
      subCategories: [],
      categories: [],
      slide: "0",
      loading : true,
      localization: {},
      isMaster: false,
      isSuperAdmin: false,
    };
  },
  async mounted(){
    let slide = false
    const categories = localStorage.getItem('categories')
    this.categories = JSON.parse(categories)
    const idSub = this.$route.params.id
    if(this.categories){
      this.loading = false
    }
    if(idSub && this.categories){
      slide = true
      this.gotoSub(idSub)
    }

     this.admin = localStorage.getItem('admin') ? true : false
     let context = localStorage.getItem('context')
     context = context ? JSON.parse(context) : null
     this.isMaster = (context||{}).isMaster ? true : false
     this.isSuperAdmin = isSuperAdmin()
     // move to store
     const localization = localStorage.getItem("localization")
     this.localization =  JSON.parse(localization)
     await this.getData()
     if(idSub && !slide){
      this.gotoSub(idSub)
     }

  },
  methods: {
    goToNewAd(item) {
      this.$router.push({ path: `/painel/ads/add/${item.id}/${encodeURI(item.name)}` })
    },
    editCategory(item){
      console.log(`categorias/edit/${item.id}/${item.name}/${item.iconId}`)
      this.$router.push({path: `/painel/categorias/edit/${item.id}/${item.name}/${item.iconId}`})
      // return
    },
    async removeCategory (item) {
      let text = "Deseja apagar";
      if (confirm(text) === false)  return

      this.$api.delete(`/categories/${item.id}`)
      .then(async (response) => {
           this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Deletado',
            icon: 'report_problem'
          })
          await this.$store.dispatch('categories/invalidateCategories')
          await this.getData()

        })
        .catch((err) => {

          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: 'Erro ao deletar',
            icon: 'report_problem'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    subcategories(item) {
      this.subCategorieActive = {
        id: item.id,
        name: item.name
      }
      item.subcategories.sort((a, b) => a.name.localeCompare(b.name));

      this.subCategories = item.subcategories
      this.slide = '1'
      console.log(item)
    },
    goTo(path){
      this.$router.push({ path })
    },
    gotoSub(idSub){
       const item = this.categories.find(x => x.id === parseFloat(idSub))
       if(item) this.subcategories(item)
    },
    async getData () {
      const addressId = this.localization?.id
      if (!addressId) {
        this.loading = false
        return
      }
      if(!this.categories){
        this.loading = true
      }
      this.$api.get(`/cities/${addressId}/categories?nonDeleted=true`)
      .then((response) => {
          if(response.data){
            try {
              let categoriesData = response.data.categories ?? []
              categoriesData.forEach(e => {
                return e.name = e.name.trim()
              })
              categoriesData.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
              categoriesData = categoriesData.filter((item) => !item.deletedAt)

              this.categories = categoriesData
            } catch (error) {
              console.log(error)
            }
          }
          localStorage.setItem('categories', JSON.stringify(this.categories))
            // console.table(this.categories)

        })
        .catch((err) => {
          let msg
          if( err.response){
            msg =  err.response.data.message
          } else {
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
  },
})
</script>

<style scoped>
.sub-page {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.sub-container {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 8px 12px 24px;
}

.sub-container :deep(.q-carousel),
.sub-container :deep(.q-carousel__slide) {
  background: transparent;
}

.section-header {
  margin: 8px 2px 10px;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.section-subtitle {
  margin: 3px 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

.category-list,
.sub-list {
  display: grid;
  gap: 10px;
}

.category-card,
.sub-card {
  position: relative;
  height: 100%;
  overflow: hidden;
  border: 1px solid #dbe4f0;
  border-radius: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #fff 0%, #f8faff 100%);
  box-shadow: 0 5px 16px rgba(15, 23, 42, 0.055);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.category-card::before,
.sub-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, #6366f1, #3b82f6);
  content: '';
}

.cursor-pointer:active .category-card,
.cursor-pointer:active .sub-card {
  transform: scale(0.985);
}

.category-card-main,
.sub-card-main {
  display: flex;
  align-items: center;
  min-height: 60px;
  gap: 12px;
}

.category-thumb {
  width: 58px;
  min-width: 58px;
  height: 58px;
  border-radius: 999px;
  border: 1px solid #dbeafe;
  background: linear-gradient(145deg, #eef2ff, #e0f2fe);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.sub-thumb {
  width: 54px;
  min-width: 54px;
  height: 54px;
  border-radius: 999px;
  border: 1px solid #dbeafe;
  background: linear-gradient(145deg, #eef2ff, #e0f2fe);
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-icon {
  width: 42px;
  height: 42px;
  border-radius: 999px;
}

.sub-icon {
  width: 38px;
  height: 38px;
  border-radius: 999px;
}

.category-icon-fallback {
  color: #4f46e5;
}

.category-info,
.sub-info {
  flex: 1;
  min-width: 0;
}

.category-name,
.sub-name {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #1e293b;
  font-size: 0.97rem;
  font-weight: 800;
  letter-spacing: -0.012em;
  line-height: 1.12;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.category-meta,
.sub-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 7px 0 0;
  color: #64748b;
  font-size: 0.7rem;
}

.category-meta-chip {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 2px 7px;
  background: rgba(248, 250, 252, 0.9);
  line-height: 1.1;
}
.category-direct-ads {
  color: #15803d;
  font-weight: 700;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.admin-btn {
  font-weight: 600;
  letter-spacing: 0;
}

.icon-chevron-wrap {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 999px;
  border: 1px solid #e0e7ff;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions-menu-btn {
  color: #4f46e5;
}

.back-btn {
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 2px 0 8px;
  border-radius: 999px;
  padding: 6px 10px;
}

@media (hover: hover) {
  .cursor-pointer:hover .category-card,
  .cursor-pointer:hover .sub-card {
    transform: translateY(-2px);
    border-color: #c7d2fe;
    box-shadow: 0 10px 24px rgba(30, 41, 59, 0.09);
  }
}

@media (min-width: 760px) {
  .category-list,
  .sub-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-header {
    margin-top: 14px;
  }
}
</style>
