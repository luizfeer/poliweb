<template>
  <q-page>
    <div class="px-4 py-2">
      <!-- <Location class="my-2" /> -->
      <q-menu
        transition-show="jump-down"
      >
       <template v-if="categories.length">
        <div v-for="item in categories" :key="item.id" @click="item.subcategories ? this.subcategories(item.subcategories) : this.goTo(`/categorias/${item.id}`)">
          <div
            class="bg-white border border-gray-200 rounded-md mt-3 p-2 shadow-md"
          >
            <div class="flex flex-nowrap">
              <div class="pl-3">
                <h1 class="text-lg text-gray-600 font-semibold">
                  {{ item.name }}
                </h1>
                <h2 class="text-base text-gray-500">{{ item.addressCity }}</h2>
              </div>            
            </div>
          </div>
        </div>
       </template>
       <div v-else v-for="i in 10" :key="i">
           <q-skeleton type="QToolbar" class="my-2 h-14"/>
      </div>
      </q-menu>
      {{ categories }}

    </div>
    <!-- <router-link to="/home">AAA </router-link> -->
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";
// export default {
//   }
export default defineComponent({
  name: "PageIndex",
  setup() {
    return {
      categories: ref([]),
      slide: ref(1),
      loading : ref(false)
    };
  },
  methods: {
    subcategories(data) {
      
    },  
  },
  })
</script>
