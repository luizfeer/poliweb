<template>
  <q-page>
    <div class="px-4 py-2">
      <Location class="my-2" />
       <template v-if="!loading">
         <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          animated
          class="h-[auto]"          
        >
           <q-carousel-slide name="0" class="">
              <router-link v-if="admin" :to="`/painel/categorias/add`">
                <q-btn unelevated color="primary" label="Cadastrar nova categoria" class="m-2"/>
              </router-link>
            <div 
              v-for="(item) in categories" :key="item.id"
              @click="item.subcategories.length ? subcategories(item) : goTo(`/categorias/${item.id}/${encodeURI(item.name)}`)"
              class="cursor-pointer"
            >
            <!-- @click="item.subcategories ? this.subcategories(item.subcategories) : this.goTo(`/categorias/${item.id}`) -->
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
                    <h2 class="text-base text-gray-500">{{ item.addressCity }}</h2>
                  </div>            
                </div>
              </div>
            </div>
         </q-carousel-slide>
         <q-carousel-slide name="1" class="">
           <div @click="slide = '0'" class="cursor-pointer">Voltar</div>
              <router-link v-if="admin" :to="`/painel/categorias/add/${subCategorieActive.id}/${encodeURI(subCategorieActive.name)}`">
                <q-btn unelevated color="primary" label="Cadastrar sub-categoria" v-if="admin" class="m-2"/>
              </router-link>
           <div 
           v-for="item in subCategories" :key="item.id" 
            @click="item.subcategories.length ? subcategories(item) : goTo(`/categorias/${item.id}`)"
             class="cursor-pointer">
            <!-- @click="item.subcategories ? this.subcategories(item.subcategories) : this.goTo(`/categorias/${item.id}`) -->
              <div
                class="bg-white border border-gray-200 rounded-md mt-3 p-2 shadow-md"
              >
                <div class="flex flex-nowrap h-14 items-center">
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
                  </div>            
                </div>
              </div>
            </div>
         </q-carousel-slide>    
         </q-carousel>    
       </template>
       <div v-else v-for="i in 10" :key="i">
           <q-skeleton type="QToolbar" class="my-2 h-14"/>
      </div>
     
      <!-- {{ categories }} -->
      
    </div>  
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";
import Location from "components/Location";

// export default {
//   }
export default defineComponent({
  components: {
    Location,
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
      categories: ref([]),
      slide: ref("0"),
      loading : ref(true),
      localization: ref({})
    };
  }, 
  mounted(){
     this.admin = localStorage.getItem('admin') ? true : false

     // move to store
     const localization = localStorage.getItem("localization")
     this.localization =  JSON.parse(localization)
     this.getData()
  },
  methods: {
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
      this.$router.push(path)
    },
    getData () {
      this.loading = true
      let gps
      if(this.localization){
        gps = `?lat=${this.localization.coordinates.lat}&long=${this.localization.coordinates.long}`
      }
      this.$api.get(`/categories${gps ? gps : ''}`)
      .then((response) => {
          if(response.data){
            this.categories = response.data.categories    
            console.table(this.categories)
          }
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
