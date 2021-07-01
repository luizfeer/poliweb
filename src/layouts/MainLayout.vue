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
              <div
                v-for="item in recommenders"
                :key="item"
                class="
                  select-none
                  h-24
                  min-w-[6rem]
                  w-24
                  min-h-[6rem]
                  bg-white
                  rounded-md
                  p-4
                  mr-4
                  flex
                  items-center
                  justify-center
                "
              >
                <q-img
                  :src="getImg(item.img)"
                  spinner-color="text-gray-300"
                  class="h-10 w-10"
                  spinner-size="15px"
                />
                <p class="text-gray-700 font-semibold">{{ item.title }}</p>
              </div>
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
const recommenders = [
  {
    patch: "/",
    img: "food",
    title: "Alimentos",
  },
  {
    patch: "/",
    img: "shopping",
    title: "Compras",
  },
  {
    patch: "/",
    img: "gym",
    title: "Academias",
  },
  {
    patch: "/",
    img: "cosmetics",
    title: "Beleza",
  },
  {
    patch: "/",
    img: "cart",
    title: "Mercados",
  },
  {
    patch: "/",
    img: "dog",
    title: "Pets",
  },
  {
    patch: "/",
    img: "ticket",
    title: "Eventos",
  },
  {
    patch: "/",
    img: "cow",
    title: "Animais",
  },
  {
    patch: "/",
    img: "hospital",
    title: "Saúde",
  },
];
const linksList = [
  {
    title: "Home",
    icon: "home",
    link: "/",
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
      leftDrawerOpen,
      recommenders,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
  methods: {
    getImg(path) {
      return "/icons-recommenders/" + path + ".png";
    },
  },
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
