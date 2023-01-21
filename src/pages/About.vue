<template>
  <div
    class="fullscreen text-center q-pa-md flex flex-center"
  >
    <div class="flex flex-col">
      <router-link class="border border-gray-400 p-4 m-2 rounded-md hover:bg-gray-200" :to="'/list'" style="text-3xl">Ver todas as categorias</router-link>
      <router-link class="border border-gray-400 p-4 m-2 rounded-md hover:bg-gray-200" :to="'/termos-e-condicoes'" style="text-3xl">Termos e Condições</router-link>
      <router-link class="border border-gray-400 p-4 m-2 rounded-md hover:bg-gray-200" :to="'/politica-de-privacidade'" style="text-3xl">Política de Privacidade</router-link>

      <!-- <div class="text-xl" style="opacity: 0.4">Página não disponivel</div> -->

      <!-- <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        label="Ir para o início"
        no-caps
      /> -->
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "About",
});
</script>
