<template>
    <div>
        <div v-if="ads.length === 0" class="text-lg p-2 text-gray-600">Nenhum dado cadastrado.</div>
              <router-link :to="`/${item.id}`" v-for="(item) in adsEdited" :key="item.id">
                  <div
                  class="bg-white border border-gray-200 rounded-md mt-3 p-2 shadow-md"
                  >
                  <div class="flex flex-nowrap">
                      <div class="h-20 w-20 min-w-[5rem] rounded-sm overflow-hidden">
                      <q-img
                          v-if="item.files.logo && item.files.logo.length"
                          :src="pathImg(item)"
                          :ratio="1"
                          class="h-full w-full"
                          spinner-color="white"
                          spinner-size="82px"
                      />
                      <q-avatar v-else rounded class="h-full w-full" :color="colors[Math.floor(Math.random() * colors.length)]" text-color="white">{{ item.name.split(" ").map((n)=>n[0]).join("").toUpperCase() }}</q-avatar>
                      </div>
                      
                      <div class="pl-3">
                      <h1 class="text-lg text-gray-600 font-semibold">
                          {{ item.name }}
                      </h1>
                      <h2 class="text-base text-gray-500">{{ item.description }}</h2>
                      <h2 v-if="showAddress && item.addresses && item.addresses.length" class="text-base text-gray-500">{{ item.addresses[0].city }}</h2>
                      
                      </div>
                  </div>
                </div>
            </router-link>
    </div>
</template>

<script>
    export default {
        props:{
            ads: {
                type: Array,
                default() {
                    return []
                }
            },
            showAddress: {
                type: Boolean,
                default: false
            },
            reverse: {
                type: Boolean,
                default: false
            }
        },
        computed: {
            adsEdited() {
                if(this.reverse){
                    return this.ads.slice().reverse()
                }
                return this.ads
            }
        },
        methods: {          
             pathImg (item) {
                let last = item.files.logo.length - 1
                return item.files.logo[last].link
            },
        },
        
    }
</script>

<style lang="scss" scoped>

</style>