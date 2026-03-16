<template>
  <div class="city-page w-full p-4 pb-8">
    <div class="city-header mb-6">
      <h1 class="text-xl font-semibold text-gray-800 m-0">Escolha uma cidade</h1>
      <p class="text-gray-500 text-sm mt-1">Selecione sua cidade para ver os comércios disponíveis</p>
    </div>

    <div class="city-list space-y-2">
      <div
        v-for="city in citys"
        :key="city.id"
        class="city-item flex items-center gap-3 min-h-[52px] px-4 py-3 rounded-xl bg-white shadow-sm active:bg-gray-50 touch-manipulation"
        :class="{ 'opacity-60': switchingCity }"
        @click="selectCity(city)"
      >
        <AppIcon name="location-on" :size="22" class="text-primary flex-shrink-0" />
        <span class="font-medium text-gray-800 flex-1">{{ city.city }}</span>
        <AppIcon v-if="!switchingCity" name="chevron-right" :size="20" class="text-gray-400" />
        <q-spinner-dots v-else size="20px" color="primary" />
      </div>
    </div>

    <div class="gps-section mt-8 p-4 rounded-xl bg-primary/5">
      <div
        class="flex items-center gap-3 min-h-[48px] touch-manipulation"
        :class="{ 'opacity-50': gettingLocation }"
        @click="!gettingLocation && locateMe()"
      >
        <q-spinner-dots v-if="gettingLocation" size="24px" color="primary" />
        <AppIcon v-else name="gps-fixed" :size="24" class="text-primary" />
        <span class="font-medium text-primary">Usar GPS para localização</span>
      </div>
      <p class="text-gray-500 text-sm mt-2 mb-0">Encontre os serviços mais próximos de você!</p>
    </div>

    <div v-if="localization && !switchingCity" class="mt-6 p-4 rounded-xl bg-gray-50">
      <p class="text-primary font-medium text-sm">Sua última localização</p>
      <p class="text-gray-700">{{ localization.city }}{{ localization.street ? ', ' + localization.street : '' }}{{ localization.zipCode ? ', ' + localization.zipCode : '' }}</p>
    </div>

           <!--

          <div v-if="location">
            {{ dataApi }}
            Your location data is, {{ location.coords.longitude}}
          </div> -->
        <!-- <q-card-section>
          Preencha sua cidade ou CEP e encontre os serviçoes mais próximos de
          você!
        </q-card-section> -->


  </div>
</template>

<script>
import { inject } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { citysData } from 'src/js/citys'

export default {
  setup() {
    return {
      store: useStore(),
      router: useRouter(),
      loadCategoriesRef: inject('loadCategories')
    }
  },
  data() {
    return {
      citys: [],
      localization: {},
      location: null,
      gettingLocation: false,
      switchingCity: false,
      dataApi: []
    }
  },
  methods: {
    async selectCity(city) {
      if (this.localization?.city === city.city) return
      this.localization = city
      this.switchingCity = true
      this.store.dispatch('localization/setLocalization', city)
      try {
        const loadFn = this.loadCategoriesRef?.value || this.loadCategoriesRef
        if (typeof loadFn === 'function') await loadFn(city)
        await this.router.push('/')
      } finally {
        this.switchingCity = false
      }
    },
    async getLocation() {

      return new Promise((resolve, reject) => {

        if(!("geolocation" in navigator)) {
          reject(new Error('Erro com GPS.'));
        }

        navigator.geolocation.getCurrentPosition(pos => {
          resolve(pos);
        }, err => {
          reject(err);
        });

      });
    },
    async locateMe() {

      this.gettingLocation = true;
      try {
        this.location = await this.getLocation();
        await this.getCity()
      } catch(e) {
        this.gettingLocation = false;
        this.$q.notify({
         color: 'negative',
        position: 'top',
        message: e.message,
        icon: 'report_problem'
        })
      }
    },
    async getCity () {
      const url = "/address/coordinates?"
      const params = {'lat': this.location.coords.latitude, 'long': this.location.coords.longitude}
      const self = this
      return this.$api.get(url + new URLSearchParams(params))
      .then(function(response) {
        if(response.data) {
              const address = {
                city: response.data.city || "GPS",
                    street: response.data.street || "",
                    zipCode: response.data.zipCode || "",
                    neighborhood: response.data.neighborhood || "",
                    state: response.data.state || "",
                    coordinates: {
                      lat: response.data.coordinates.lat,
                      long: response.data.coordinates.long
                  },
              }
              self.dataApi = response.data
              self.selectCity(address)

        } else {
          console.log('Network response was not ok.');
        }
      })
      .catch(function(error) {
        self.gettingLocation = false
        self.$q.notify({
          color: 'negative',
          message: 'Erro ao buscar localização',
          icon: 'report_problem'
        })
      })
      .finally(() => {
        self.gettingLocation = false
      })
    },
    convertStringToUrl (str) {
    return str.toLowerCase().replace(/ /g, '-')
    }

  },
  async mounted(){
    //get city name in param url
    const cityParam = this.$route.params.city

    this.citys = citysData.sort((a, b) => a.city.localeCompare(b.city))

     const localization = localStorage.getItem("localization")
       if(localization){
         this.localization =  JSON.parse(localization)
        if(this.citys.findIndex(x=> x.city === this.localization.city)<0){
          this.citys.push(this.localization)
        }
        // this.model = this.localization
       }
  },

};
</script>

<style lang="scss" scoped></style>
