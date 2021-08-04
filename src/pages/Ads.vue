<template>
    <div>
        <div @click="slide = '0'" class="cursor-pointer ml-2"> <q-icon name="arrow_back" /> Voltar</div>
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
            setAnotherTitle,
            data: ref([]), 
            loading: ref(true)          
        };
    },    
    mounted () {
    this.loading = true
    this.$api.get(`/categories/ads/${this.$route.params.id}?nonDeleted=true`)
     .then((response) => {
        if(response.data){
         this.data = response.data    
        }
      })
      .catch((err) => {
         this.$router.push({ path: '/' })          
          msg = 'Erro na conexão!'        
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
      })
      .finally(() => {
        this.loading = false
      })
  },
}
</script>

<style scoped>

</style>