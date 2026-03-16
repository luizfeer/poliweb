<template>
<q-layout view="lHh Lpr lFf">
    <q-header elevated reveal class="z-50 header-mobile">
        <q-toolbar class="flex-col px-0 min-h-[56px]">
            <div class="w-full flex items-center py-3 px-2">
                <q-btn flat dense round aria-label="Menu" class="min-w-[44px] min-h-[44px]" @click="toggleLeftDrawer" icon="menu" />
                <q-toolbar-title class="flex-1 text-center font-semibold" :class="{ 'py-2': $route.fullPath === '/' }">
                    {{
              $route.fullPath === "/" ? "O que você procura?" : "Agenda Poliweb"
            }}
                </q-toolbar-title>
                <div v-if="$route.fullPath === '/'" class="w-full flex">
                    <div class="categories-scroll w-full pt-3 flex flex-row overflow-x-auto overflow-y-hidden px-4 flex-nowrap gap-3 pb-2 -mb-2">
                        <template v-if="loading && !categories?.length">
                          <div v-for="i in 5" :key="'sk-' + i" class="category-skeleton flex-shrink-0 w-24 h-24 rounded-2xl bg-gray-100 animate-pulse" />
                        </template>
                        <router-link
                          v-else-if="categories?.length"
                          :to="redirect(item)"
                          v-for="item in categories"
                          :key="item.id"
                          class="category-chip-card flex-shrink-0 min-w-[6.5rem] w-24 flex flex-col items-center justify-center rounded-2xl px-3 py-3 bg-white shadow-sm active:scale-[0.98] transition-transform touch-manipulation border border-gray-100"
                        >
                          <div class="category-chip-icon-wrapper">
                            <q-img :src="item.iconLink" spinner-color="gray-300" class="category-chip-icon" spinner-size="18px" />
                          </div>
                          <p class="category-chip-name">{{ item.name }}</p>
                        </router-link>
                        <div v-else class="text-gray-500 text-sm py-4">Nenhuma categoria encontrada</div>
                    </div>
                </div>
            </div>
        </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-1 drawer-mobile">
        <q-list class="py-4">
            <EssentialLink v-for="link in essentialLinks" :key="link.title" v-bind="link" exact class="drawer-link" />
        </q-list>
    </q-drawer>
    <transition name="slide" mode="out-in">
        <q-page-container>
            <router-view />
        </q-page-container>
    </transition>
    <Download />
</q-layout>
</template>

<script>
import EssentialLink from "components/EssentialLink.vue";
import Download from "components/Download.vue";

const linksList = [{
        title: "Home",
        icon: "home",
        link: "/",
    },
    {
        title: "Ver categorias",
        icon: "storefront",
        link: "/encontre",
    },
    {
        title: "Cidades",
        icon: "location_city",
        link: "/cidades",
    },
    {
        title: "Busque comércios",
        icon: "search",
        link: "/buscar",
    },
    {
        title: "Login",
        icon: "account_circle",
        link: "/login",
    },

    {
        title: "Sobre",
        icon: "info",
        link: "/sobre",
    },
    {
        title: "Contato",
        icon: "alternate_email",
        link: "/contato",
    },
    // {
    //   title: "Facebook",
    //   caption: "@Poliweb",
    //   icon: "facebook",
    //   link: "/facebook",
    // },
    // {
    //   title: "Fale conosco",
    //   icon: "chat",
    //   link: "/contato",
    // },
    // {
    //   title: "Cadastre seu negócio",
    //   icon: "add_task",
    //   link: "/cadastro",
    // },
];

import {
    defineComponent,
    ref,
    provide
} from "vue";
import {
    differenceInHours
} from 'date-fns'

export default defineComponent({

    name: "MainLayout",

    components: {
        EssentialLink,
        Download
    },

    setup() {
        const leftDrawerOpen = ref(false);
        const loadCategoriesRef = ref(null);
        provide('loadCategories', loadCategoriesRef);

        return {
            baseLinks: linksList,
            categories: ref([]),
            essentialLinks: ref([]),
            leftDrawerOpen,
            loadCategoriesRef,
            toggleLeftDrawer() {
                leftDrawerOpen.value = !leftDrawerOpen.value;
            },
        };
    },
    data() {
        return {
            loading: false,
        };
    },
     watch:{
      $route (to, from){
          if(from.fullPath === '/login'){
            console.log('change router')
             this.init()
          }
      }
    },
    mounted() {
        console.log('mount')
        this.init()
        this.loadCategoriesRef = (loc) => this.getData(loc)
    },
    methods: {
        init() {
            this.essentialLinks = this.baseLinks
            const categories = localStorage.getItem('categories')
            const uuid = localStorage.getItem('uuid')
            let context = localStorage.getItem("context")
            if (!uuid) {
                localStorage.setItem('uuid', this.uuidv4())
            }
            let admin
            if (context) {
                context = JSON.parse(context)
                const result = differenceInHours(
                    new Date(),
                    new Date(context.when)
                )
                console.log(result)
                if (result > 23) {
                    this.$q.notify({
                        color: 'negative',
                        position: 'bottom',
                        message: 'Seu login está expirado, faça login novamente!',
                        actions: [{
                            label: 'Login',
                            color: 'white',
                            handler: () => {
                                this.$router.push({
                                    path: '/login'
                                })
                            }
                        }]
                    })
                    localStorage.removeItem('admin')
                    localStorage.removeItem('context')
                } else {
                    if ((context || {}).company !== null) {
                        this.essentialLinks = [{
                                title: context.company,
                                icon: "business",
                                link: `/${context.categoryAdId}`,
                            },
                            ...this.essentialLinks
                        ]
                    }
                    admin = localStorage.getItem('admin') ? true : false
                }
            }
            this.categories = categories ? JSON.parse(categories) : []
            const localization = localStorage.getItem("localization")
            this.localization = localization ? JSON.parse(localization) : null
            this.getData()
            if (admin) {
                this.essentialLinks.push({
                    title: "Usuários",
                    icon: "group",
                    link: "/adm/users",
                }, {
                    title: "Icones",
                    icon: "insert_emoticon",
                    link: "/adm/icons",
                })
            }
        },
        redirect(item) {
            const subs = item?.subcategories
            if (subs && subs.length) {
                return `/sub/${item.id}`
            }
            return `/categorias/${item.id}`
        },
        uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        getData(overrideLocalization) {
            const loc = overrideLocalization || this.localization
            if (overrideLocalization) this.localization = loc
            this.loading = true

            let gps = 'nonDeleted=true'
            if (loc?.coordinates?.lat != null && loc?.coordinates?.long != null) {
                gps = `lat=${loc.coordinates.lat}&long=${loc.coordinates.long}&nonDeleted=true`
            }

            const api = this.$api
            if (!api) {
                this.loading = false
                return Promise.resolve()
            }

            return api.get(`/categories?${gps}`)
                .then((response) => {
                    let categoriesData = response?.data?.categories || []
                    const cityName = loc?.city
                    if (cityName && Array.isArray(categoriesData)) {
                        categoriesData = categoriesData.filter((item) => item.addressCity === cityName)
                    }
                    if (Array.isArray(categoriesData)) {
                        categoriesData.forEach(e => { if (e && e.name) e.name = e.name.trim() })
                        categoriesData.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                        categoriesData = categoriesData.filter((item) => !item.deletedAt)
                        this.categories = categoriesData
                        localStorage.setItem('categories', JSON.stringify(this.categories))
                    }
                })
                .catch((err) => {
                    const msg = err?.response?.data?.message || 'Erro na conexão!'
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
.header-mobile {
  padding-top: env(safe-area-inset-top);
}
.categories-scroll {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.categories-scroll::-webkit-scrollbar {
  display: none;
}
.category-chip-card {
  -webkit-tap-highlight-color: transparent;
}

.category-chip-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.category-chip-icon {
  width: 26px;
  height: 26px;
  border-radius: 999px;
}

.category-chip-name {
  font-size: 0.72rem;
  font-weight: 500;
  color: #374151;
  text-align: center;
  margin: 0;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.drawer-mobile :deep(.q-item) {
  min-height: 48px;
  padding: 12px 16px;
}
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
