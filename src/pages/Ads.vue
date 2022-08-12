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
import { ref, onMounted } from "vue";
import AdsPage from 'components/Ads'
import { useMeta, useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useRouter, useRoute } from 'vue-router'
export default {
    components: {
        AdsPage
    },

   setup () {
    const $q = useQuasar()
    const router = useRouter()
    const route = useRoute()
    let loading = ref(true)
    let data = ref({
      description: '',
      files:{gallery:[{ link:''}]}
    })
    const filterDeleted = (arr) => {
      try {
          return arr.filter((item)=>{ return !item.deletedAt })
        } catch (error) {
            console.log(error)
            return arr
        }
      }
    const getData = () => api.get(`/categories/ads/${route.params.id}?nonDeleted=true`)
     .then((response) => {
        if(response.data){
            if(response.data.deletedAt){
                router.push('/')
            }

            let filtered = response.data
            console.log(filtered)
            if(filtered.files && filtered.files.gallery){
              filtered.files.gallery = filterDeleted(filtered.files.gallery)
              filtered.files.gallery = filtered.files.gallery.slice(0).reverse();
            }
             if(filtered.files && filtered.files.logo){
              filtered.files.logo = filtered.files.logo.sort((b, a) =>   new Date(a.createdAt) -  new Date(b.createdAt));
            }
             if(filtered.files && filtered.files.videos){
              filtered.files.videos = filterDeleted(filtered.files.videos)
              filtered.files.videos = filtered.files.videos.slice(0).reverse();
            }
            filtered.phones =  filterDeleted(filtered.phones)
            filtered.address =  filterDeleted(filtered.address)
            data.value = filtered
            loading.value = false
        }
      })
      .catch((err) => {
        console.log(err)
        let msg = 'Erro na conexão!'
        $q.notify({
            color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
       router.push({ path: '/' })
      })
      .finally(() => {
      })
      onMounted(async () => {
        await getData()

      })
      console.log('123', data.value.files)

      useMeta(() => {
        return {
          title: data.value.name,
      // optional; sets final title as "Index Page - My Website", useful for multiple level meta
          titleTemplate: title => `${title} - Poliweb`,
          meta: {
            description: { name: data.value.name, content: data.value.description },
            keywords: { name: 'keywords', content:  `${data.value.description}` },
            ogDesc: {
              name: 'og:description',
              content: data.value.description
            },
            ogImage: {
              name: 'og:image',
              content: data.value.files.gallery ? data.value.files.gallery[0].link : null
            },

          },
        }
      })
      return {
          data,
          loading
      };
    }
}
</script>

<style scoped>

</style>
