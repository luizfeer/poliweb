<template>
  <q-page>
    <div class="px-4 py-2">
      <Location class="my-2" />

       <template v-if="!loading">
         <q-infinite-scroll
         @load="onLoad"
         :offset="250"

          class="h-[auto] p-0"
        >

            <router-link v-if="admin" :to="`/painel/categorias/add`">
              <q-btn unelevated color="primary" label="Cadastrar nova categoria" class="m-2"/>
            </router-link>
            <div
              v-for="(item) in categories" :key="item.id"
            >
            <!-- @click="item.subcategories ? this.subcategories(item.subcategories) : this.goTo(`/categorias/${item.id}`) -->
              <div
                class="bg-white border border-gray-200 rounded-md mt-3 p-2 shadow-md"
              >
                <div class="flex flex-nowrap pl-1">
                  <!-- <div class="h-[68px] w-[68px] rounded-sm overflow-hidden">
                    <q-img
                      :src="item.iconLink"
                      :ratio="1"
                      class="h-[68px] w-[68px] rounded-full"
                      spinner-color="white"
                      spinner-size="30px"
                    />
                  </div> -->
                  <div class="pl-3 mb-3">
                    <h2 class="text-lg text-gray-500">{{ item.name }} em {{ item.addressCity }}</h2>
                  </div>
                </div>

              <!-- <router-link v-if="admin" :to="`/painel/categorias/add/${subCategorieActive.id}/${encodeURI(subCategorieActive.name)}`">
                <q-btn unelevated color="primary" label="Cadastrar sub-categoria" v-if="admin" class="m-2"/>
              </router-link> -->
              <template v-if="item.subcategories">
              <router-link v-for="sub in item.subcategories" :key="sub.id" :to="`/categorias/${sub.id}`">
                <div class="bg-white border border-gray-200 rounded-md p-2 shadow-md mb-2" >
                  <div class="flex flex-nowrap h-14 items-center">
                    <div class="h-[40px] w-[40px] rounded-sm overflow-hidden">
                      <q-img
                        :src="sub.iconLink"
                        :ratio="1"
                        class="h-[40px] w-[40px] rounded-full"
                        spinner-color="white"
                        spinner-size="30px"
                      />
                    </div>
                    <div class="pl-3">
                      <h1 class="text-lg text-gray-600 font-semibold">
                        {{ sub.name }}
                      </h1>
                    </div>
                  </div>
                </div>
              </router-link>
              </template>
              <template v-else>
              
              </template>


              </div>
            </div>
            <template v-slot:loading>
              <div class="row justify-center q-my-md">
                <q-spinner-dots color="primary" size="40px" />
              </div>
            </template>


         </q-infinite-scroll>
       </template>
       <div v-else v-for="i in 10" :key="i">
           <q-skeleton type="QToolbar" class="my-2 h-[86px]"/>
      </div>

      <!-- {{ categories }} -->

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
      pagination:{
        page: 1,
        limit: 16,
        total: 0,
        firstLoad: false,
      }
    };
  },
  async mounted(){
    let slide = false
    // const categories = localStorage.getItem('categories')
    // this.categories = JSON.parse(categories)
    const idSub = this.$route.params.id
    if(this.categories){
      this.loading = false
    }
    if(idSub && this.categories){
      slide = true
      this.gotoSub(idSub)
    }

     this.admin = localStorage.getItem('admin') ? true : false
     // move to store
     const localization = localStorage.getItem("localization")
     this.localization =  JSON.parse(localization)
     await this.getData()
     if(idSub && !slide){
      this.gotoSub(idSub)
     }

  },
  methods: {
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
      if(!this.categories){
        this.loading = true
      }
      let gps
      if(this.localization){
        gps = `lat=${this.localization.coordinates.lat}&long=${this.localization.coordinates.long}&nonDeleted=true`
      }
      const pagination = `page=${this.pagination.page}&limit=${this.pagination.limit}&`
      await this.$api.get(`/categories?${pagination}${gps ? gps : 'nonDeleted=true'}`)
      .then((response) => {
          if(response.data){
            this.pagination.total = response.data.total
            let categoriesData = response.data.categories
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
