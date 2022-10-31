<template>
  <div class="w-full p-4">


        <q-card-section>
          <div class="text-h6">Escolha uma cidade</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list bordered separator>
            <q-item clickable v-ripple v-for="city in citys" :key="city.id" :to="`/c/${city.link}`">
              <q-item-section >
                <div class="flex items-center">
                 <q-icon name="location_on" class="mr-2" />
                 <span>
                   {{ city.city }}
                  </span>
                </div>
                 </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

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
