<template>
  <div class="w-full p-4">
    <!-- <div
      class="flex text-xl text-gray-500 flex-nowrap cursor-pointer"
      @click="dialog = true"
    >
      <q-icon name="location_on" />
      <span class="pl-1 text-blue-600">{{ localization && localization.city ? localization.city : "Selecione sua cidade" }}</span>
      <q-icon name="arrow_drop_down" class="text-base" />
    </div> -->



        <!-- <q-bar>
          <q-space />

        </q-bar> -->

        <q-card-section>
          <div class="text-h6">Escolha uma cidade</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list bordered separator>
            <q-item clickable v-ripple v-for="city in citys" :key="city.id" @click="model=city">
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

        <div class="flex flex-col items-center mt-4">
          <q-btn @click="locateMe" class="pt-0 flex items-center text-lg cursor-pointer text-blue-600">
            <q-icon name="gps_fixed" class="mr-1" /> Usar o GPS para localização
          </q-btn>

          <q-card-section>
          Use seu GPS e encontre os serviçoes mais próximos de
            você!
          </q-card-section>


            <div v-if="gettingLocation">
              <i class="text-blue-500 font-medium font-xl p-4">
                <q-circular-progress
                  indeterminate
                  size="25px"
                  color="primary"
                  class="q-ma-md"
                />
                Buscando sua lozalização...
              </i>
            </div>

            <div v-if="localization" class="p-4 mt-4">
              <p class="text-blue-600 font-medium">Sua última localização aproximada</p>
              <p class="text-lg">
                <span class="text-gray-600 font-medium">{{ localization.city }}</span>
                <span class="text-gray-600 font-medium" v-if="localization.street">, {{ localization.street }}</span>
                <span class="text-gray-600 font-medium" v-if="localization.zipCode">, {{ localization.zipCode }}</span>
              </p>
              <p class="text-gray-500">Você pode buscar novamente pelo GPS.</p>

            </div>
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
import {citysData} from 'src/js/citys'



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
