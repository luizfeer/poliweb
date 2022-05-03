<template>
  <q-page>
    <div @click="$router.go(-1)" class="cursor-pointer ml-2 mt-2"> <q-icon name="arrow_back" /> Voltar</div>
    <div>
        <q-input color="teal" outlined debounce="2000" v-model="searchInput" type="search" hint="Procurar" class="m-4">
        <template v-slot:before>
          <q-icon name="search" />
        </template>
      </q-input>
      <!-- <Location class="my-2" /> -->
      <!-- {{ categories }} -->
      <template v-if="!loading">

            <div class="p-3 flex">

              <div v-if="ads.length === 0" class="text-lg p-2 text-gray-600">Nenhum dado encontrado.</div>
              <router-link v-for="(item) in ads" :key="item.id" :to="'/'+item.id" class="w-full">
                  <div
                  class="bg-white border border-gray-200 rounded-md mt-3 p-2 shadow-md"
                  >
                  <div class="flex flex-nowrap">

                      <div class="pl-3">
                      <h3 class="text-sm text-gray-600 font-semibold">
                        {{ item.category }}
                      </h3>
                      <h1 class="text-lg text-gray-600 font-semibold">
                          {{ item.name }}
                      </h1>
                      <h2 class="text-base text-gray-500 min-h-[3rem]">{{ formatDesc(item.description) }}</h2>
                      </div>
                  </div>
                </div>
            </router-link>
            </div>
          <!-- <q-carousel-slide name="1" class="p-0">
           <div @click="slide = '0'" class="cursor-pointer ml-2"> <q-icon name="arrow_back" /> Voltar</div>
            <ads-page :data-ads="data" />
          </q-carousel-slide> -->
      </template>
      <div v-else class="p-4">
        <div v-for="i in 10" :key="i" class="">
          <q-skeleton type="QToolbar" class="my-2 h-[86px]"/>
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
      searchInput: ref('')
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
    pathImg (item) {
      let last = item.files.logo.length - 1
      return item.files.logo[0].link
    },
  },
  mounted(){
     this.admin = localStorage.getItem('admin') ? true : false
     this.searchInput = this.$route.params.terms
  },
  beforeMount () {
  },
  })
</script>
