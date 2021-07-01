<template>
  <div class="w-full items-center flex flex-col">
    <div
      class="flex text-xl text-gray-500 items-center flex-nowrap"
      @click="dialog = true"
    >
      <q-icon name="location_on" />
      <span class="pl-1 text-blue-600">Conceição da Aparecida</span>
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
          <q-input rounded bottom-slots v-model="city" counter>
            <template v-slot:prepend>
              <q-icon name="place" />
            </template>
            <template v-slot:append>
              <q-icon name="close" @click="city = ''" class="cursor-pointer" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-section class="pt-0 flex items-center text-lg">
          <q-icon name="gps_fixed" class="mr-1" /> Usar o GPS para localização
        </q-card-section>

        <q-card-section>
          Preencha sua cidade ou CEP e encontre os serviçoes mais próximos de
          você!
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  setup() {
    return {
      dialog: ref(false),
      city: ref("Conceição da Aparecida"),
    };
  },
};
</script>

<style lang="scss" scoped></style>
