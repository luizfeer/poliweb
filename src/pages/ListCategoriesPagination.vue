<template>
  <q-page class="list-page">
    <div class="list-container">
      <template v-if="!loading">
        <div class="list-header">
          <h1 class="list-title">Categorias e subcategorias</h1>
          <p class="list-subtitle">Navegue por cidade e encontre comércios por tema.</p>
        </div>

        <router-link v-if="admin" :to="`/painel/categorias/add`">
          <q-btn no-caps rounded unelevated color="primary" icon="add_circle" label="Cadastrar nova categoria" class="admin-btn mb-2"/>
        </router-link>

        <section
          v-for="item in categories"
          :key="item.id"
          class="category-section"
        >
          <div class="category-section-head">
            <div class="category-head-main">
              <div class="category-icon-wrap">
                <q-img
                  v-if="item.iconLink"
                  :src="item.iconLink"
                  class="category-icon-img"
                  spinner-color="white"
                  spinner-size="20px"
                />
                <AppIcon v-else name="storefront" :size="18" class="text-indigo-500" />
              </div>
              <div>
                <h2 class="category-section-name">{{ item.name }}</h2>
                <span class="category-section-city">{{ item.addressCity }}</span>
              </div>
            </div>
          </div>

          <div class="sub-grid">
            <router-link
              v-for="sub in item.subcategories"
              :key="sub.id"
              :to="`/categorias/${sub.id}`"
              class="sub-link"
            >
              <article class="sub-chip-card">
                <div class="sub-chip-content">
                  <div class="sub-chip-left">
                    <div class="sub-icon-wrap">
                      <q-img
                        v-if="sub.iconLink"
                        :src="sub.iconLink"
                        class="sub-icon-img"
                        spinner-color="white"
                        spinner-size="16px"
                      />
                      <AppIcon v-else name="tag" :size="14" class="text-indigo-500" />
                    </div>
                    <span class="sub-chip-name">{{ sub.name }}</span>
                  </div>
                  <div class="sub-chip-chevron">
                    <AppIcon name="chevron-right" :size="16" class="text-indigo-400" />
                  </div>
                </div>
              </article>
            </router-link>
          </div>
        </section>
      </template>

      <div v-else>
        <div class="loading-hint">
          <q-spinner-dots color="primary" size="28px" />
          <span>{{ loadingMessage }}</span>
        </div>
        <div v-for="i in 10" :key="i">
          <q-skeleton type="QToolbar" class="my-2 h-[86px]"/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { slugify } from 'src/js/slugify'
import { citysData } from 'src/js/citys'

// export default {
//   }
export default defineComponent({
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
      loadingMessage: 'Carregando categorias da cidade...',
      localization: {},
      pagination:{
        page: 1,
        limit: 30,
        total: 0,
        firstLoad: false,
      }
    };
  },
  async mounted(){
    this.citys = citysData
    this.citys.map(city => {
       city.link = slugify(city.city)
     })
    let slide = false
    // const categories = localStorage.getItem('categories')
    // this.categories = JSON.parse(categories)
    const idSub = this.$route.params.id
    const city = this.$route.params.city

    const matchedCity = this.citys.find(item => item.link === city)
    if (matchedCity) {
      this.localization = matchedCity
      localStorage.setItem('localization', JSON.stringify(matchedCity))
    }
    if(this.categories && this.categories.length){
      this.loading = false
    }
    if(idSub && this.categories){
      slide = true
      this.gotoSub(idSub)
    }

     this.admin = localStorage.getItem('admin') ? true : false
     // move to store
    //  const localization = localStorage.getItem("localization")
    //  this.localization =  JSON.parse(localization)

     this.loading = true
     await this.getData()
     if(idSub && !slide){
      this.gotoSub(idSub)
     }

  },
  methods: {
    slugify,
    async onLoad(index, done) {
      if(!this.pagination.firstLoad){
        this.pagination.firstLoad=true
        await this.getData()
        done()

      } else if(this.pagination.total>index){
        this.pagination.page++
        await this.getData()
        done()
      }
    },
    subcategories(item) {
      this.subCategorieActive = {
        id: item.id,
        name: item.name
      }
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
      if(this.pagination.page === 1){
        this.loading = true
      }
      const pagination = `page=${this.pagination.page}&limit=${this.pagination.limit}`
      await this.$api.get(`/cities/${addressId}/categories?nonDeleted=true&${pagination}`)
      .then((response) => {
          if(response.data){
            this.pagination.total = response.data.total ?? response.data.categories?.length ?? 0
            let categoriesData = response.data.categories ?? []
            categoriesData = categoriesData.filter((item)=>{ return !item.deletedAt && item.subcategories.length })
            categoriesData.forEach(e => {
              return e.name = e.name.trim()
            })
            this.categories = [...this.categories, ...categoriesData]
            }
            // console.table(this.categories)

        })
        .catch((err) => {
          console.log(err)
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
.list-page {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.list-container {
  padding: 10px 12px 16px;
}

.list-header {
  margin-bottom: 10px;
}

.list-title {
  margin: 0;
  font-size: 1.1rem;
  color: #0f172a;
  font-weight: 700;
}

.list-subtitle {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

.category-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px;
  margin-top: 10px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.category-section-head {
  margin-bottom: 8px;
}

.category-head-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-icon-wrap {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 999px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-icon-img {
  width: 26px;
  height: 26px;
  border-radius: 999px;
}

.category-section-name {
  margin: 0;
  font-size: 0.97rem;
  color: #334155;
  font-weight: 700;
}

.category-section-city {
  color: #64748b;
  font-size: 0.72rem;
}

.sub-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.sub-link {
  text-decoration: none;
}

.sub-chip-card {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 10px;
  padding: 10px;
  transition: border-color 0.14s ease, transform 0.14s ease, box-shadow 0.14s ease;
}

.sub-chip-card:active {
  transform: scale(0.98);
  border-color: #c7d2fe;
  box-shadow: 0 6px 15px rgba(79, 70, 229, 0.12);
}

.sub-chip-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sub-chip-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-icon-wrap {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 999px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sub-icon-img {
  width: 20px;
  height: 20px;
  border-radius: 999px;
}

.sub-chip-chevron {
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 999px;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sub-chip-name {
  color: #1e293b;
  font-weight: 600;
  font-size: 0.87rem;
}

.admin-btn {
  font-weight: 600;
  letter-spacing: 0;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 0.84rem;
  margin: 8px 0 10px;
}
</style>
