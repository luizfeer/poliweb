<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="z-50">
      <q-toolbar class="flex-col px-0">
        <div class="w-full flex py-4">
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="toggleLeftDrawer"
          />
          <q-toolbar-title :class="{ 'py-4': $route.fullPath === '/' }">
            {{
              $route.fullPath === "/" ? "O que você procura?" : "Agenda Poliweb"
            }}
          </q-toolbar-title>
          <div v-if="$route.fullPath === '/'" class="w-full flex">
            <div
              class="
                w-full
                pt-4
                flex-row
                overflow-x-scroll
                flex
                overflow-y-hidden
                px-4
                flex-nowrap
                touch
              "
            >
              <router-link
                :to="`/sub/${item.id}`"
                v-for="item in categories"
                :key="item.id"
                class="
                  select-none                  
                  min-w-[8rem]
                  min-h-[8rem]
                  bg-white
                  rounded-md
                  p-4
                  mr-4
                  flex
                  flex-col
                  items-center
                  justify-center
                "
              >
                <q-img
                  :src="item.iconLink"
                  spinner-color="text-gray-300"
                  class="h-[64px] w-[64px]"
                  spinner-size="15px"
                />
                <p class="text-gray-700 font-semibold text-base text-center mt-1 h-14">{{ item.name }}</p>
              </router-link>
            </div>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-1">
      <q-list>
        <!-- <q-item-label header class="text-grey-8">
          
        </q-item-label> -->

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>
    <transition name="slide" mode="“out-in”">
      <q-page-container>
        <router-view />
      </q-page-container>
    </transition>
  </q-layout>
</template>

<script>
import EssentialLink from "components/EssentialLink.vue";

const linksList = [
  {
    title: "Home",
    icon: "home",
    link: "/",
  },
    {
    title: "Encontre comércios",
    icon: "storefront",
    link: "/encontre",
  },
  {
    title: "Login",
    icon: "account_circle",
    link: "/login",
  },
  {
    title: "Facebook",
    caption: "@Poliweb",
    icon: "facebook",
    link: "/facebook",
  },
  {
    title: "Fale conosco",
    icon: "chat",
    link: "/contato",
  },
  {
    title: "Cadastre seu negócio",
    icon: "add_task",
    link: "/cadastro",
  },
 
  
];

import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "MainLayout",

  components: {
    EssentialLink,
  },

  setup() {
    const leftDrawerOpen = ref(false);

    return {
      essentialLinks: linksList,
      categories: ref([]),
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
   mounted(){
     const categories = localStorage.getItem('categories')
     this.categories = JSON.parse(categories)
     const admin = localStorage.getItem('admin') ? true : false
     // move to store
     const localization = localStorage.getItem("localization")
     this.localization =  JSON.parse(localization)
     this.getData()
      if(admin){
        this.essentialLinks.push({
          title: "Usuários",
          icon: "group",
          link: "/adm/users",
        })
    }
  },
  methods: { 
    getData () {
      this.loading = true
      let gps
      if(this.localization){
        gps = `?lat=${this.localization.coordinates.lat}&long=${this.localization.coordinates.long}`
      }
      this.$api.get(`/categories${gps ? gps : ''}`)
      .then((response) => {
          if(response.data){
            let categoriesData = response.data.categories
            if(!this.localization.city==="GPS") categoriesData = categoriesData.filter((item)=>{ return item.addressCity === this.localization.city && !item.deletedAt })
            if(this.localization.city==="GPS"){
              this.categories = categoriesData
            }  else {
              this.categories = categoriesData.sort((a, b) => a.name.localeCompare(b.name));
            }
            // console.table(this.categories)
          }
          localStorage.setItem('categories', JSON.stringify(this.categories))
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
  }
});
</script>
<style scoped>
slide-enter-active,
.slide-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.slide-enter,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-30%);
}
</style>
