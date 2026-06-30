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
          <q-btn flat round dense icon="close" v-close-popup size="md" class="min-w-[44px] min-h-[44px]" aria-label="Fechar" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-model="model"
            use-input
            input-debounce="0"
            label="Buscar cidade"
            :options="filteredCitys"
            option-label="city"
            outlined
            dense
            class="location-select"
            :disable="switchingCity"
            @filter="filterCitys"
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

        <!-- Loading ao trocar cidade (Teleport para garantir overlay fullscreen) -->
        <Teleport to="body">
          <Transition name="switch-fade">
            <div v-if="switchingCity" class="switching-overlay">
              <div class="switching-content">
                <p class="switching-text">Levando você para os comércios de</p>
                <p class="switching-city">{{ model?.city }}</p>
                <div class="switching-spinner">
                  <q-spinner-dots size="56px" color="primary" />
                </div>
                <Transition name="label-fade" mode="out-in">
                  <p :key="switchingLabelIndex" class="switching-label">{{ switchingLabels[switchingLabelIndex] }}</p>
                </Transition>
              </div>
            </div>
          </Transition>
        </Teleport>

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
import { ref, inject, watch, onUnmounted } from "vue";
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { citysData } from 'src/js/citys'

function normalizeCitySearch(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default {
  setup() {
    const store = useStore()
    const router = useRouter()
    const loadCategoriesRef = inject('loadCategories')
    const switchingCity = ref(false)
    const switchingLabelIndex = ref(0)
    const switchingLabels = [
      'Encontre os melhores comércios na sua região',
      'Sua agenda de serviços e empresas',
      'Conectando você aos comércios locais',
      'Descubra o que sua cidade tem a oferecer',
      'Comércios perto de você',
      'A Poliweb na palma da sua mão',
    ]
    let labelInterval = null

    watch(switchingCity, (isSwitching) => {
      if (isSwitching) {
        switchingLabelIndex.value = 0
        labelInterval = setInterval(() => {
          switchingLabelIndex.value = (switchingLabelIndex.value + 1) % switchingLabels.length
        }, 2500)
      } else {
        if (labelInterval) {
          clearInterval(labelInterval)
          labelInterval = null
        }
      }
    })

    onUnmounted(() => {
      if (labelInterval) clearInterval(labelInterval)
    })

    return {
      store,
      router,
      loadCategoriesRef,
      model: ref(null),
      dialog: ref(false),
      citys: ref([]),
      filteredCitys: ref([]),
      localization: ref({}),
      location: ref(null),
      gettingLocation: ref(false),
      switchingCity,
      dataApi: ref([]),
      switchingLabels,
      switchingLabelIndex,
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
    filterCitys(val, update) {
      update(() => {
        const query = normalizeCitySearch(val)
        if (!query) {
          this.filteredCitys = [...this.citys]
          return
        }

        this.filteredCitys = this.citys.filter((city) => {
          const text = normalizeCitySearch(`${city.city} ${city.state || ''}`)
          return text.includes(query)
        })
      })
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

     this.citys = [...citysData].sort((a, b) => a.city.localeCompare(b.city))
     this.filteredCitys = [...this.citys]

     const localization = localStorage.getItem("localization")
       if(localization){
         this.localization =  JSON.parse(localization)
        if(this.citys.findIndex(x=> x.city === this.localization.city)<0){
          this.citys.push(this.localization)
          this.filteredCitys = [...this.citys]
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  min-height: 100dvh;
  background: rgba(255, 255, 255, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.switching-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 2rem;
  max-width: 280px;
}
.switching-text {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 1.25rem;
  text-align: center;
  line-height: 1.4;
}
.switching-city {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1976d2;
  margin: 0 0 1.25rem;
  text-align: center;
}
.switching-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin: 0 auto;
}
.switching-label {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 1.25rem 0 0;
  text-align: center;
  line-height: 1.4;
  min-height: 2.5rem;
  max-width: 260px;
}
.switch-fade-enter-active,
.switch-fade-leave-active {
  transition: opacity 0.2s ease;
}
.switch-fade-enter-from,
.switch-fade-leave-to {
  opacity: 0;
}
.label-fade-enter-active,
.label-fade-leave-active {
  transition: opacity 0.3s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
}
</style>
