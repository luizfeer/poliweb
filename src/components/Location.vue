<template>
  <div class="w-full items-center flex flex-col">
    <div
      class="location-trigger flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg bg-white/80 active:bg-gray-100 touch-manipulation"
      @click="dialog = true"
    >
      <AppIcon name="location-on" :size="22" class="text-primary" />
      <span class="text-primary font-medium truncate max-w-[180px] sm:max-w-none">
        {{ localization && localization.city ? localization.city : "Selecione sua cidade" }}
      </span>
      <AppIcon name="arrow-drop-down" :size="20" class="text-gray-500 flex-shrink-0" />
    </div>

    <q-dialog
      v-model="dialog"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
      class="location-dialog"
    >
      <q-card class="location-card rounded-t-2xl">
        <q-card-section class="flex flex-row items-center justify-between pb-2">
          <h2 class="text-lg font-semibold m-0">Onde você está?</h2>
          <q-btn flat round dense v-close-popup size="md" class="min-w-[44px] min-h-[44px]"><template #icon><AppIcon name="close" :size="24" /></template></q-btn>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-model="model"
            use-input
            input-debounce="0"
            label="Buscar cidade"
            :options="citys"
            option-label="city"
            outlined
            dense
            class="location-select"
            :disable="switchingCity"
          >
            <template v-slot:prepend>
              <AppIcon name="place" :size="20" />
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Cidade ainda não cadastrada
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-section class="pt-0">
          <div
            class="gps-btn flex items-center gap-2 min-h-[48px] px-4 rounded-xl bg-primary/10 text-primary font-medium touch-manipulation"
            :class="{ 'opacity-50': gettingLocation }"
            @click="!gettingLocation && locateMe()"
          >
            <q-spinner-dots v-if="gettingLocation" size="24px" color="primary" />
            <AppIcon v-else name="gps-fixed" :size="24" />
            <span>Usar GPS para localização</span>
          </div>
        </q-card-section>

        <q-card-section class="text-gray-500 text-sm">
          Use seu GPS e encontre os serviços mais próximos de você!
        </q-card-section>

        <!-- Loading ao trocar cidade -->
        <div v-if="switchingCity" class="switching-overlay">
          <div class="switching-content">
            <q-spinner-dots size="48px" color="primary" />
            <p class="text-base font-medium mt-4">Carregando categorias...</p>
            <p class="text-sm text-gray-500">{{ model?.city }}</p>
          </div>
        </div>

        <div v-if="localization && !switchingCity" class="p-4 mx-4 mb-4 rounded-xl bg-gray-50">
          <p class="text-primary font-medium text-sm">Sua última localização</p>
          <p class="text-gray-700 font-medium">
            {{ localization.city }}
            <span v-if="localization.street">, {{ localization.street }}</span>
            <span v-if="localization.zipCode">, {{ localization.zipCode }}</span>
          </p>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, inject } from "vue";
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { citysData } from 'src/js/citys'

export default {
  setup() {
    const store = useStore()
    const router = useRouter()
    const loadCategoriesRef = inject('loadCategories')
    return {
      store,
      router,
      loadCategoriesRef,
      model: ref(null),
      dialog: ref(false),
      citys: ref([]),
      localization: ref({}),
      location: ref(null),
      gettingLocation: ref(false),
      switchingCity: ref(false),
      dataApi: ref([])
    }
  },
  watch: {
    async model(val) {
      if (!val) return
      const previousCity = this.localization?.city
      if (previousCity === val.city) return

      this.localization = val
      this.switchingCity = true
      this.store.dispatch('localization/setLocalization', val)
      this.store.dispatch('localization/setCategoriesLoading', true)

      try {
        const loadFn = this.loadCategoriesRef?.value || this.loadCategoriesRef
        if (typeof loadFn === 'function') {
          await loadFn(val)
        }
        await this.router.push('/')
      } finally {
        this.switchingCity = false
        this.store.dispatch('localization/setCategoriesLoading', false)
        this.dialog = false
      }
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

<style lang="scss" scoped>
.location-trigger {
  -webkit-tap-highlight-color: transparent;
}
.location-card {
  padding-bottom: env(safe-area-inset-bottom);
}
.switching-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.switching-content {
  text-align: center;
  padding: 2rem;
}
</style>
