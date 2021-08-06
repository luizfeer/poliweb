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
      history: [],
      follow: [],
    };
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
  },
  methods: {    
    
  },
})
</script>
