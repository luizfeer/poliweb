<template>
  <q-page>
    <div class="">
      <!-- <Location class="my-2" /> -->
      <!-- {{ categories }} -->
      <template v-if="!loading">
        <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          animated
          class="h-[auto]"          
        >
          <q-carousel-slide name="0" class="">
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
                      <!-- <div class="h-20 w-20 min-w-[5rem] rounded-sm overflow-hidden">
                      <q-img
                          src="/thumb.png"
                          :ratio="1"
                          class="h-full w-full"
                          spinner-color="white"
                          spinner-size="82px"
                      />
                      </div> -->
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
          <q-carousel-slide name="1" class="">        
            <ads-page :data-ads="data" />  

          </q-carousel-slide>
        </q-carousel>
      </template>
      <div v-else v-for="i in 10" :key="i">
        <q-skeleton type="QToolbar" class="my-2 h-14"/>
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
      ads: ref([]),
      admin: ref(false),
      slide: ref('0'),
      loading : ref(true),
      data: ref({}),
      showAds(item){
        console.log(item)
        this.data= {...item};
        this.slide= '1'
      }
    };
  },
  mounted(){
     this.admin = localStorage.getItem('admin') ? true : false
  },
  beforeMount () {
    this.loading = true
    this.$api.get(`/categories/${this.$route.params.id}/ads`)
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
