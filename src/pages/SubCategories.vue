<template>
  <q-page>
    <div class="px-4 py-2">
      <Location class="my-2" />

       <template v-if="!loading">
         <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          animated
          class="h-[auto] p-0"
        >
           <q-carousel-slide name="0" class="p-0">
              <router-link v-if="admin" :to="`/painel/categorias/add`">
                <q-btn unelevated color="primary" label="Cadastrar nova categoria" class="m-2"/>
              </router-link>
            <div
              v-for="(item) in categories" :key="item.id"
              @click="item.subcategories.length ? subcategories(item) : goTo(`/categorias/${item.id}/${encodeURI(item.name)}`)"
              class="cursor-pointer"
            >
            <!-- @click="item.subcategories ? this.subcategories(item.subcategories) : this.goTo(`/categorias/${item.id}`) -->
              <div
                class="bg-white border border-gray-200 rounded-md mt-3 p-2 shadow-md"
              >
                <div class="flex flex-nowrap pl-1">
                  <div class="h-[68px] w-[68px] rounded-sm overflow-hidden pr-16">
                    <q-img
                      :src="item.iconLink"
                      :ratio="1"
                      class="h-[68px] w-[68px] rounded-full"
                      spinner-color="white"
                      spinner-size="30px"
                    />
                  </div>
                  <div class="ml-2 w-full">
                    <h1 class="text-lg text-gray-600 font-semibold flex items-center justify-between ">
                      {{ item.name }} 
                      <q-btn unelevated color="primary" label="Editar" v-if="admin" @click.stop="editCategory(item)" class="m-2"/>
                      <q-btn unelevated color="negative" label="Excluir" v-if="admin" @click.stop="removeCategory(item)" class="m-2"/>
                    </h1>
                    <h2 class="text-base text-gray-500">{{ item.addressCity }}</h2>
                  </div>
                </div>
              </div>
            </div>
         </q-carousel-slide>
         <q-carousel-slide name="1" class="p-0">
           <div @click="slide = '0'" class="cursor-pointer"> <q-icon name="arrow_back" /> Voltar</div>
              <router-link v-if="admin" :to="`/painel/categorias/add/${subCategorieActive.id}/${encodeURI(subCategorieActive.name)}`">
                <q-btn unelevated color="primary" label="Cadastrar sub-categoria" v-if="admin" class="m-2"/>
              </router-link>
           <div
            v-for="item in subCategories" :key="item.id"
            @click="item.subcategories.length ? subcategories(item) : goTo(`/categorias/${item.id}`)"
             class="cursor-pointer">
            <!-- @click="item.subcategories ? this.subcategories(item.subcategories) : this.goTo(`/categorias/${item.id}`) -->
              <div
                class="bg-white border border-gray-200 rounded-md mb-3 p-2 shadow-md"
              >
                <div class="flex flex-nowrap h-14 items-center justify-between">
                   <div class="h-[60px] w-[60px] rounded-sm overflow-hidden pr-16">
                    <q-img
                      :src="item.iconLink"
                      :ratio="1"
                      class="w-[60px] rounded-full"
                      spinner-color="white"
                      spinner-size="30px"
                    />
                  </div>
                  <div class="ml-2 w-full">
                    <h1 class="text-lg text-gray-600 font-semibold flex items-center justify-between">
                      {{ item.name }} 
                      <q-btn unelevated color="primary" label="Editar" v-if="admin" @click.stop="editCategory(item)" class="m-2"/>
                      <q-btn unelevated color="negative" label="Excluir" v-if="admin" @click.stop="removeCategory(item)" class="m-2"/>
                    </h1>
                  </div>
                </div>
              </div>
            </div>
         </q-carousel-slide>
         </q-carousel>
       </template>
       <div v-else v-for="i in 10" :key="i">
           <q-skeleton type="QToolbar" class="my-2 h-[86px]"/>
      </div>

      <!-- {{ categories }} -->

    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import Location from "components/Location";

// export default {
//   }
export default defineComponent({
  components: {
    Location,

  },
  name: "PageIndex",
  data() {
    return {
      subCategorieActive: {
        id: '',
        name: ''
      },
      admin: false,
      subCategories: [],
      categories: [],
      slide: "0",
      loading : true,
      localization: {},
    };
  },
  async mounted(){
    let slide = false
    const categories = localStorage.getItem('categories')
    this.categories = JSON.parse(categories)
    const idSub = this.$route.params.id
    if(this.categories){
      this.loading = false
    }
    if(idSub && this.categories){
      slide = true
      this.gotoSub(idSub)
    }

     this.admin = localStorage.getItem('admin') ? true : false
     // move to store
     const localization = localStorage.getItem("localization")
     this.localization =  JSON.parse(localization)
     await this.getData()
     if(idSub && !slide){
      this.gotoSub(idSub)
     }

  },
  methods: {
    editCategory(item){
      console.log(`categorias/edit/${item.id}/${item.name}/${item.iconId}`)
      this.$router.push({path: `/painel/categorias/edit/${item.id}/${item.name}/${item.iconId}`})
      // return
    },
    async removeCategory (item) {
      let text = "Deseja apagar";
      if (confirm(text) === false)  return
        
      this.$api.delete(`/categories/${item.id}`)
      .then((response) => {
          this.getData()         
          
        })
        .catch((err) => {
       
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: 'Erro ao deletar',
            icon: 'report_problem'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    subcategories(item) {
      this.subCategorieActive = {
        id: item.id,
        name: item.name
      }
      item.subcategories.sort((a, b) => a.name.localeCompare(b.name));

      this.subCategories = item.subcategories
      this.slide = '1'
      console.log(item)
    },
    goTo(path){
      this.$router.push({ path })
    },
    gotoSub(idSub){
       const item = this.categories.find(x => x.id === parseFloat(idSub))
       if(item) this.subcategories(item)
    },
    async getData () {
      if(!this.categories){
        this.loading = true
      }
      let gps
      if(this.localization){
        gps = `lat=${this.localization.coordinates.lat}&long=${this.localization.coordinates.long}&nonDeleted=true`
      }
      this.$api.get(`/categories?${gps ? gps : 'nonDeleted=true'}`)
      .then((response) => {
          if(response.data){
            try {
              let categoriesData = response.data.categories
              categoriesData = categoriesData.filter((item)=>{ return item.addressCity === this.localization.city })
              console.log('before', categoriesData)
              categoriesData.forEach(e => {
                return e.name = e.name.trim()
              })
              categoriesData.sort((a, b) => a.name.localeCompare(b.name));
              console.log('after', categoriesData)

              categoriesData = categoriesData.filter((item)=>{ return !item.deletedAt })

              this.categories = categoriesData
            } catch (error) {
              console.log(error)
            }
          }
          localStorage.setItem('categories', JSON.stringify(this.categories))
            // console.table(this.categories)

        })
        .catch((err) => {
          let msg
          if( err.response){
            msg =  err.response.data.message
          } else {
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
  },
})
</script>
