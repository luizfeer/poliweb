<template>
  <q-page class="p-0">
    <div class="px-4 py-2">
      <!-- <Location class="my-2" /> -->
      <!-- {{ categories }} -->
      <template v-if="!loading">
            <ads-page :data="data" />
      </template>
      <div v-else v-for="i in 10" :key="i" class="p-4">
        <q-skeleton type="QToolbar" class="my-2 h-[86px]"/>
      </div>

    </div>
  </q-page>
</template>

<script>
import { ref } from "vue";
import { Ads } from 'components/Ads.vue'

export default({
  components: {
    'ads-page': Ads
  },
  name: "Ads",
  setup() {
    return {
      ads: ref([]),
      admin: ref(false),
      slide: ref('0'),
      loading : ref(true),
      data: ref({}),
      showAds(item){
        console.table(item)
        this.data= item;
        this.slide= '1'
      }
    };
  },
  mounted(){
     this.admin = localStorage.getItem('admin') ? true : false
  },
  beforeMount () {
    this.loading = true
    this.$api.get(`/categories/${this.$route.params.id}/ads`)
     .then((response) => {
        if(response.data){
          response.data.categoryAds.sort((a, b) => a.name.localeCompare(b.name))

         this.data = response.data.categoryAds
        }
      })
      .catch((err) => {
        let msg
        if( err.response){
          msg =  err.response.data.message
        }else {
          msg = 'Erro na conexão!'
        }
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
  })
</script>
