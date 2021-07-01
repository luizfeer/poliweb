<template>
  <q-page>
    <div class="px-4 py-2">
      <Location class="my-2" />
      <router-link v-for="n in 5" :key="n" to="/categorias">
        <div
          class="bg-white border border-gray-200 rounded-md mt-3 p-2 shadow-md"
        >
          <div class="flex flex-nowrap">
            <div class="h-20 w-20 min-w-[5rem] rounded-sm overflow-hidden">
              <q-img
                src="/thumb.png"
                :ratio="1"
                class="h-full w-full"
                spinner-color="white"
                spinner-size="82px"
              />
            </div>
            <div class="pl-3">
              <h1 class="text-lg text-gray-600 font-semibold">
                Favorita Moda Íntima
              </h1>
              <h2 class="text-base text-gray-500">Moda Íntima</h2>
              <h2 class="text-base text-gray-500">Conceição da Aparecida</h2>
            </div>
          </div>
        </div>
      </router-link>
      <!-- <q-carousel
        v-model="slide"
        transition-prev="slide-right"
        transition-next="slide-left"
        swipeable
        animated
        control-color="white"
        navigation
        arrows
        height="300px"
      >
        <q-carousel-slide :name="1">
          <div
            class="
              row
              fit
              justify-start
              items-center
              q-gutter-xs q-col-gutter
              no-wrap
            "
          >
            <q-img
              class="rounded-borders w-full full-height"
              src="https://cdn.quasar.dev/img/mountains.jpg"
            />
          </div>
        </q-carousel-slide>
        <q-carousel-slide :name="2">
          <div
            class="
              row
              fit
              justify-start
              items-center
              q-gutter-xs q-col-gutter
              no-wrap
            "
          >
            <q-img
              class="rounded-borders w-full full-height"
              src="https://cdn.quasar.dev/img/parallax2.jpg"
            />
          </div>
        </q-carousel-slide>
        <q-carousel-slide :name="3">
          <div
            class="
              row
              fit
              justify-start
              items-center
              q-gutter-xs q-col-gutter
              no-wrap
            "
          >
            <q-img
              class="rounded-borders w-full full-height"
              src="https://cdn.quasar.dev/img/cat.jpg"
            />
          </div>
        </q-carousel-slide>
        <q-carousel-slide :name="4">
          <div
            class="
              row
              fit
              justify-start
              items-center
              q-gutter-xs q-col-gutter
              no-wrap
            "
          >
            <q-img
              class="rounded-borders w-full full-height"
              src="https://cdn.quasar.dev/img/material.png"
            />
          </div>
        </q-carousel-slide>
      </q-carousel> -->
    </div>
    <!-- <router-link to="/home">AAA </router-link> -->
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";
import Location from "components/Location";

// export default {
//   }
export default defineComponent({
  components: {
    Location,
  },
  name: "PageIndex",
  setup() {
    return {
      slide: ref(1),
    };
  },
});
</script>
