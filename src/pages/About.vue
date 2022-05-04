<template>
  <div
    class="fullscreen text-center q-pa-md flex flex-center"
  >
    <div>
      <router-link :to="'/list'" style="text-3xl">Ver todas as categorias</router-link>

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
