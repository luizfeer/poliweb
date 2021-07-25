<template>
  <div class="w-full items-center flex flex-col">
    <div
      class="flex text-xl text-gray-500 items-center flex-nowrap cursor-pointer"
      @click="dialog = true"
    >
      <q-icon name="location_on" />
      <span class="pl-1 text-blue-600">{{ localization && localization.city ? localization.city : "Selecione sua cidade" }}</span>
      <q-icon name="arrow_drop_down" class="text-base" />
    </div>

    <q-dialog
      v-model="dialog"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="bg-gray-100 text-black">
        <!-- <q-bar>
          <q-space />

        </q-bar> -->
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-black">Close</q-tooltip>
        </q-btn>

        <q-card-section>
          <div class="text-h6">Onde você está?</div>
        </q-card-section>
     
        <q-card-section class="q-pt-none">
        <q-select
            v-model="model"
            use-input
            input-debounce="0"
            label="Localização"
            :options="citys"
            option-label="city"
          >
          <template v-slot:prepend>
            <q-icon name="place" />
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

        <q-card-section @click="gps" class="pt-0 flex items-center text-lg cursor-pointer">
          <q-icon name="gps_fixed" class="mr-1" /> Usar o GPS para localização
        </q-card-section>

        <q-card-section>
          Preencha sua cidade e encontre os serviçoes mais próximos de
          você!
        </q-card-section>
        <!-- <q-card-section>
          Preencha sua cidade ou CEP e encontre os serviçoes mais próximos de
          você!
        </q-card-section> -->
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref } from "vue";
  const citysData = [
    {
      "id": 401,
      "country": "Brasil",
      "state": "MG",
      "city": "Nova Resende",
      "zipCode": "37860000",
      "coordinates": {
        "lat": -21.114253,
        "long": -46.409309,
        "rawType": true
      },
      "createdAt": "2021-07-25T19:07:29.094Z",
      "updatedAt": null,
      "deletedAt": null
    },
    {
      "id": 402,
      "country": "Brasil",
      "state": "MG",
      "city": "Guaxupé",
      "zipCode": "37800000",
      "coordinates": {
        "lat": -21.308362,
        "long": -46.714397,
        "rawType": true
      },
      "createdAt": "2021-07-25T19:08:45.545Z",
      "updatedAt": null,
      "deletedAt": null
    }
  ];


export default {
  setup() {
    return {
      model: ref(null),
      dialog: ref(false),
      citys: ref(citysData),
      localization: ref({})
      
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
    gps(){
        this.$q.notify({
        color: 'negative',
        position: 'top',
        message: 'O recurso GPS será ativado em breve.',
        icon: 'report_problem'
      })
    }
  },
   mounted(){
       const localization = localStorage.getItem("localization")
      this.localization =  JSON.parse(localization)
  },
  
};
</script>

<style lang="scss" scoped></style>
