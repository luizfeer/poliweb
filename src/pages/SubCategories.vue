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
              <p class="section-subtitle">Escolha uma categoria para ver as subcategorias.</p>
            </div>

            <router-link v-if="admin" :to="`/painel/categorias/add`">
              <q-btn no-caps rounded unelevated color="primary" icon="add_circle" label="Cadastrar nova categoria" class="admin-btn m-2"/>
            </router-link>

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
                      :src="item.iconLink"
                      :ratio="1"
                      class="category-icon"
                      spinner-color="white"
                      spinner-size="30px"
                    />
                  </div>
                  <div class="category-info">
                    <h2 class="category-name">{{ item.name }}</h2>
                    <p class="category-meta">
                      {{ item.subcategories.length }} subcategorias
                      <span v-if="item.addressCity"> • {{ item.addressCity }}</span>
                    </p>
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
                          <q-item clickable v-ripple @click.stop="goToNewAd(item)">
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
                    <AppIcon name="chevron-right" :size="20" class="text-indigo-400" />
                  </div>
                </div>
              </article>
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
                      :src="item.iconLink"
                      :ratio="1"
                      class="sub-icon"
                      spinner-color="white"
                      spinner-size="30px"
                    />
                  </div>
                  <div class="sub-info">
                    <h3 class="sub-name">{{ item.name }}</h3>
                    <p class="sub-meta" v-if="item.subcategories?.length">
                      {{ item.subcategories.length }} níveis abaixo
                    </p>
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
                          <q-item clickable v-ripple @click.stop="goToNewAd(item)">
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
                    <AppIcon name="chevron-right" :size="18" class="text-indigo-400" />
                  </div>
                </div>
              </article>
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
     context = JSON.parse(context)
     this.isMaster = (context||{}).isMaster ? true : false
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
      .then((response) => {
           this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Deletado',
            icon: 'report_problem'
          })

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
  padding: 8px 12px 16px;
}

.section-header {
  margin: 8px 2px 10px;
}

.section-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: #0f172a;
}

.section-subtitle {
  margin: 3px 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

.category-card,
.sub-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px;
  margin-top: 10px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.category-card-main,
.sub-card-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-thumb {
  width: 52px;
  min-width: 52px;
  height: 52px;
  border-radius: 999px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sub-thumb {
  width: 48px;
  min-width: 48px;
  height: 48px;
  border-radius: 999px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-icon {
  width: 36px;
  height: 36px;
  border-radius: 999px;
}

.sub-icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
}

.category-info,
.sub-info {
  flex: 1;
  min-width: 0;
}

.category-name,
.sub-name {
  margin: 0;
  color: #334155;
  font-weight: 700;
  line-height: 1.25;
}

.category-meta,
.sub-meta {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.76rem;
}

.admin-btn {
  font-weight: 600;
  letter-spacing: 0;
}

.icon-chevron-wrap {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 999px;
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
</style>
