<template>
  <q-page>
    <div>
      <!-- <Location class="my-2" /> -->
      <!-- {{ categories }} -->
      <template v-if="!loading">
        <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          animated
          class="h-[auto] pt-4"          
        >
          <q-carousel-slide name="0" class="pt-0">
           <div @click="$router.go(-1)" class="cursor-pointer ml-2"> <q-icon name="arrow_back" /> Voltar</div>
            <div class="pl-3 flex">
                <router-link v-if="admin" :to="`/painel/ads/add/${$route.params.id}/${$route.params.name}`">
                    <q-btn unelevated color="primary" label="Cadastrar empresa"  v-if="admin" class="m-2"/>
                </router-link>
                <router-link v-if="admin && !ads.length" :to="`/painel/categorias/add/${$route.params.id}/${$route.params.name}`">
                  <q-btn unelevated color="primary" label="Cadastrar sub-categoria" class="m-2"/>
                </router-link>
            </div>
              <div v-if="ads.length === 0" class="text-lg p-2 text-gray-600">Nenhum dado cadastrado.</div>
              <div v-for="(item) in ads" :key="item.id" @click="showAds(item)">
                  <div
                  class="bg-white border border-gray-200 rounded-md mt-3 p-2 shadow-md"
                  >
                  <div class="flex flex-nowrap">
                      <div class="h-20 w-20 min-w-[5rem] rounded-sm overflow-hidden">
                      <q-img
                          v-if="item.files.logo && item.files.logo.length"
                          :src="pathImg(item)"
                          :ratio="1"
                          class="h-full w-full"
                          spinner-color="white"
                          spinner-size="82px"
                      />
                      <q-avatar v-else rounded class="h-full w-full" :color="colors[Math.floor(Math.random() * colors.length)]" text-color="white">{{ item.name.split(" ").map((n)=>n[0]).join("").toUpperCase() }}</q-avatar>
                      </div>
                      
                      <div class="pl-3">
                      <h1 class="text-lg text-gray-600 font-semibold">
                          {{ item.name }}
                      </h1>
                      <h2 class="text-base text-gray-500">{{ item.description }}</h2>
                      </div>
                  </div>
                </div>
            </div>
          </q-carousel-slide>
          <q-carousel-slide name="1" class="p-0">
           <div @click="slide = '0'" class="cursor-pointer ml-2"> <q-icon name="arrow_back" /> Voltar</div>
            <ads-page :data-ads="data" />
          </q-carousel-slide>
        </q-carousel>
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
import AdsPage from 'components/Ads'

export default ({
  components: {
   AdsPage
  },
  name: "PageIndex",
  setup() {
    return {
      colors: ref(['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning']),
      ads: ref([]),
      admin: ref(false),
      slide: ref('0'),
      loading : ref(true),
      data: ref({})      
    };
  },
  methods: {
   showAds(item){
        console.log(item)
        this.data = {...item};
        this.slide= '1'
      },
    pathImg (item) {
      let last = item.files.logo.length - 1
      return item.files.logo[last].link
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
         this.ads = response.data.categoryAds    
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
