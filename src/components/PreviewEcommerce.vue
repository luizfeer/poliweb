<template>
    <div class="items-start q-gutter-md border-t-2 border-b-2 border-gray-300 bg-gray-100 my-5" @click="goToLoja()">
      <div class="text-xl w-full pl-4 mt-4 ">Produtos</div>
      <div class="flex-nowrap overflow-x-scroll flex gap-x-4 p-4 pr-0 mt-0" v-if="ecommercePreview && ecommercePreview.length>0">
        <q-card class="min-w-max min-h-full flex-grow max-w-xs" v-for="item in ecommercePreview" :key="item.id">
            <q-img :src="item.link" style="max-height: 150px;" />
            <q-card-section class="py-0">
                <div class="no-wrap items-center row w-36">
                    <div class="col text-base ellipsis">
                        {{ item.title.name }}
                    </div>
                </div>
            </q-card-section>
            <q-card-section class="q-pt-none">
                <div class="text-sm">
                    R$ {{ item.subtitle.value }}
                </div>
                <div class="text-caption text-xs text-grey">
                    {{ item.title.description }}
                </div>
            </q-card-section>
            <q-separator />
            <q-card-actions class="w-full flex justify-center">
                <q-btn flat :color="item.quantityCart > 0 ? 'secondary' : 'primary'" size="md" @click="addToCart(item)">
                    <q-badge v-if="item.quantityCart > 0" color="black" floating>{{ item.quantityCart }}</q-badge>
                    Comprar
                </q-btn>
            </q-card-actions>
        </q-card>
        </div>
        <div v-else class="ml-8 p-8 w-48 rounded-md flex items-center justify-center
        ce flex-col bg-white border border-gray-500">
          <div class="text-center pb-2">
              Adicionar novo produto a loja
          </div>
          <!-- add icon plus -->
          <q-icon name="add_shopping_cart" class="text-2xl" ></q-icon>

        </div>
        <div class="flex justify-end">
          <q-btn  flat label="Ir para loja completa" class="text-right mb-4 " icon-right="chevron_right" />
        </div>
    </div>
</template>

<script>
import {
    reactive,
    toRefs
} from 'vue'

export default {
    props: {
      ecommercePreview: {
          type: Array
      },
      admin: {
          type: Boolean,
          default: false
      }
    },
    setup() {
        const state = reactive({
            count: 0,
        })

        return {
            ...toRefs(state),
        }
    },
    methods: {
        goToLoja() {
          const id = this.$route.params.id
          if(this.admin) {
                this.$router.push(`/ecommerce/${id}`)
            } else {
                this.$router.push(`/loja/${id}`)
            }
        },

    }
}
</script>

<style lang="scss" scoped>

</style>
