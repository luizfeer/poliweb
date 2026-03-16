<template>
  <div class="citys-index w-full p-4 pb-8">
    <div class="city-header mb-6">
      <h1 class="text-xl font-semibold text-gray-800 m-0">Escolha uma cidade</h1>
      <p class="text-gray-500 text-sm mt-1">Toque para ver os comércios da região</p>
    </div>

    <div class="city-list space-y-2">
      <router-link
        v-for="city in citys"
        :key="city.id"
        :to="`/c/${city.link}`"
        class="city-item flex items-center gap-3 min-h-[52px] px-4 py-3 rounded-xl bg-white shadow-sm active:bg-gray-50 touch-manipulation no-underline text-inherit"
      >
        <AppIcon name="location-on" :size="22" class="text-primary flex-shrink-0" />
        <span class="font-medium text-gray-800 flex-1">{{ city.city }}</span>
        <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
      </router-link>
    </div>
  </div>
</template>

<script>
import { citysData } from 'src/js/citys'
import { slugify } from 'src/js/slugify'



export default {
  data() {
    return {
      model: null,
      dialog: false,
      citys: [],
      localization: {},
      location: null,
      gettingLocation: false,
      dataApi: []
    }
  },
  watch: {
    model(val) {
      this.localization = val
      localStorage.setItem("localization", JSON.stringify(val))
      window.location.href = "/"
    }
  },

  methods: {
    slugify,
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
        this.getCity()
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
    getCity () {
      const url = "/address/coordinates?"
      const params = {'lat': this.location.coords.latitude, 'long': this.location.coords.longitude}
     const self= this
      this.$api.get(url + new URLSearchParams(params))
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
    }

  },
  async mounted(){

     this.citys = citysData.sort((a, b) => a.city.localeCompare(b.city))
     this.citys.map(city => {
       city.link = slugify(city.city)
     })

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
