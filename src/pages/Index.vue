<template>
  <q-page>
    <div class="px-4 py-2">
      <Location class="my-2" />
      <div v-if="history" class="mt-4">
        <span class="text-gray-600 text-xl my-2">Veja novamente</span>
        <CardAds :ads="history" :showAddress="true" :reverse="true" />     
      </div>
      <div v-if="follow" class="mt-8">
        <span class="text-gray-600 text-xl my-2">Você segue</span>
        <CardAds :ads="follow" :showAddress="true" :reverse="true" />     
      </div>
      <router-link to="/encontre">
      <div
        class="bg-blue-50 border border-gray-200 rounded-md my-10 p-2 shadow-md"
      >
        <div class="flex flex-nowrap pl-1">
          <div class="min-h-[68px] min-w-[68px] rounded-full flex items-center justify-center overflow-hidden bg-blue-600">
            <q-icon name="storefront" class="text-white text-5xl" />
          </div>
          <div class="pl-3 flex items-center">                     
            <h1 class="text-base text-gray-600 font-semibold">
             Encontre o que precisa agora <q-icon name="arrow_forward" class="text-2xl"/>
            </h1>
          </div>            
        </div>
        </div>
        
      </router-link>
      
       <div
        class="bg-green-50 hover:bg-green-400 border border-green-400 rounded-md my-10 p-2 shadow-md"
        @click="install()"
         v-if="deferredPrompt"
      >
        <div class="flex flex-nowrap pl-1 select-none cursor-pointer">
          <div class="min-h-[55px] min-w-[55px] rounded-full flex items-center justify-center overflow-hidden bg-green-600 ">
            <q-icon name="file_download" class="text-white text-4xl" />
          </div>
          <div class="pl-3 flex items-center">                     
            <h1 class="text-lg text-green-600 font-semibold">
             Instalar o Aplicativo
            </h1>
          </div>            
        </div>
        </div>
      <!-- {{ categories }} -->
      
    </div>  
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";
import Location from "components/Location";
import CardAds from "src/components/CardAds.vue";

// export default {
//   }
export default defineComponent({
  components: {
    Location,
    CardAds,
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
      localization: ref({}),
      deferredPrompt: ref(null),
      history: [],
      follow: [],
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
    async install() {
      this.deferredPrompt.prompt();
    }
  },
  mounted(){
     this.admin = localStorage.getItem('admin') ? true : false
     // move to store
     const localization = localStorage.getItem("localization")
     this.localization =  JSON.parse(localization)
     const history = localStorage.getItem('history')
     const follow = localStorage.getItem('follow')
     this.history = JSON.parse(history)
     this.follow = JSON.parse(follow)
  }
})
</script>
