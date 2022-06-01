<template>
    <div class="pt-2">
        <!-- <router-link @click="$router.go(-1)"  class="cursor-pointer ml-2 "> <q-icon name="arrow_back" /> Voltar</router-link> -->
        <ads-page v-if="!loading" :data-ads="data" />
        <div v-else class="p-3">
            <q-card>
            <q-item>
                <q-item-section avatar>
                <q-skeleton type="QAvatar" />
                </q-item-section>

                <q-item-section>
                <q-item-label>
                    <q-skeleton type="text" />
                </q-item-label>
                <q-item-label caption>
                    <q-skeleton type="text" />
                </q-item-label>
                </q-item-section>
            </q-item>

            <q-skeleton height="200px" square />

            <q-card-actions align="right" class="q-gutter-md">
                <q-skeleton type="QBtn" />
                <q-skeleton type="QBtn" />
            </q-card-actions>
            <q-skeleton height="400px" square />
            <q-item-section>
                <q-item-label>
                    <q-skeleton type="text" />
                </q-item-label>
                <q-item-label caption>
                    <q-skeleton type="text" />
                </q-item-label>
                </q-item-section>
            </q-card>
        </div>
    </div>
</template>

<script>
import { ref } from "vue";
import AdsPage from 'components/Ads'

export default {
    components: {
        AdsPage
    },

    setup () {
        return {
            data: ref([]),
            loading: ref(true)
        };
    },
    mounted () {
    this.loading = true
    this.$api.get(`/categories/ads/${this.$route.params.id}?nonDeleted=true`)
     .then((response) => {
        if(response.data){
            if(response.data.deletedAt){
                this.$router.push('/')
            }

            let filtered = response.data
            console.log(filtered)
            if(filtered.files && filtered.files.gallery){
                filtered.files.gallery = this.filterDeleted(filtered.files.gallery).slice(0).reverse();
            }
            filtered.phones =  this.filterDeleted(filtered.phones)
            filtered.address =  this.filterDeleted(filtered.address)
            this.data = filtered
            console.log(filtered)

            this.loading = false


        }
      })
      .catch((err) => {
          console.log(err)
        let msg = 'Erro na conexão!'
        this.$q.notify({
            color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
        this.$router.push({ path: '/' })
      })
      .finally(() => {
      })
  },
  methods: {
      filterDeleted(arr) {
          try {
              return arr.filter((item)=>{ return !item.deletedAt })

          } catch (error) {
              console.log(error)
              return arr
          }
      }
  },
}
</script>

<style scoped>

</style>
