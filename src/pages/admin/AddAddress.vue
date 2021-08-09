<template>
  <q-page class="bg-gray-100">
    
    <span class="text-xl">
      {{ "Criando um anúncio dentro da categoria " + nameCategorie }}
    </span>
     <q-carousel
        v-model="slide"
        transition-prev="slide-right"
        transition-next="slide-left"
        animated
        class="h-[auto] bg-gray-100"          
      >
        <q-carousel-slide name="0" class="">
          <q-form
            @submit="getCityCoordinates"
            @reset="onReset"
            class="p-6"
          >
          <div class="mt-10">
            <div class="row">      
              <q-input filled v-model="city" type="text" lazy-rules label="Cidade" class="w-full py-2" />
              <q-input filled v-model="district" type="text" lazy-rules label="UF" class="w-full py-2" />
            </div>
          </div>
          <q-btn label="Procurar" type="submit" color="primary"/>
          </q-form>
          {{ model }}
        </q-carousel-slide>
         <q-carousel-slide name="1" class="">
          
            
        </q-carousel-slide>
     </q-carousel>
     
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";

export default defineComponent({
  name: "AddCategorias",
  setup() {
    return {   
      slide: ref('0'), 
      city: ref(''),
      district: ref(''),
      model:ref([]),
      dataApi: ref([])
    }
  },

  methods: {
    getCityCoordinates () {
    const url = "https://nominatim.openstreetmap.org/search?format=json&q="
    const params = `${this.city}, ${this.district}`  
    const self= this
    this.$api.get(url + new URLSearchParams(params))
    .then(function(response) {
        if(response.data) {
              const address = {                  
                    city: response.data[0].display_name || "",                    
                    coordinates: {
                      lat: response.data[0].lat  || "",
                      long: response.data[0].lon  || ""         
                    },                  
              }
              self.model = address
              console.log(self.model)
              self.dataApi = response.data
            
        } else {
          console.log('Network response was not ok.');
        }
      })
      .catch(function(error) {
        console.log('There has been a problem with your fetch operation: ' + error.message);
      })      
    },      
    setAd(){
      this.$q.loading.show()
      this.$api.post(`/categories/${this.categoryId}/ads`, {...this.formAds})
      .then((response) => {
        //  console.log(response.data.addresses)
        if(response.data){
          this.adId = response.data.id
          this.slide = "2"
          this.$q.notify({
          color: 'secondary',
          position: 'top',
          message: 'Anúncio com sucesso!',         
        })
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
        this.$q.loading.hide()
      })
    },
    
    onReset () {
      form.name = null
      form.addressId = null
      selectedCity = null
    }
  }, 
 async mounted () {},
});
</script>
<style>
</style>
