<template>
<q-layout view="lHh Lpr lFf" :class="{ 'has-glass-navbar': showGlassNavbar }">
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
        <q-page-container :class="{ 'has-glass-navbar': showGlassNavbar }">
            <router-view />
        </q-page-container>
    </transition>
    <!-- Navbar balão centralizado (estilo Apple) -->
    <div v-if="showGlassNavbar" class="glass-navbar-wrapper">
        <nav class="glass-navbar">
            <router-link to="/" class="glass-nav-item" :class="{ active: $route.fullPath === '/' }">
                <span class="glass-nav-icon"><AppIcon name="home" :size="22" /></span>
                <span>Home</span>
            </router-link>
            <router-link to="/encontre" class="glass-nav-item" :class="{ active: $route.fullPath === '/encontre' }">
                <span class="glass-nav-icon"><AppIcon name="storefront" :size="22" /></span>
                <span>Categorias</span>
            </router-link>
            <router-link to="/buscar" class="glass-nav-item" :class="{ active: $route.fullPath.startsWith('/buscar') }">
                <span class="glass-nav-icon"><AppIcon name="search" :size="22" /></span>
                <span>Buscar</span>
            </router-link>
        </nav>
    </div>
    <SelectCityModal
      v-model="showCityModal"
      :confirm-handler="onCityConfirm"
    />
    <SessionExpiredModal />
    <Download />
</q-layout>
</template>

<script>
import EssentialLink from "components/EssentialLink.vue";
import Download from "components/Download.vue";
import AppIcon from "components/AppIcon.vue";
import SessionExpiredModal from "components/SessionExpiredModal.vue";
import SelectCityModal from "components/SelectCityModal.vue";

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
        title: "Perfil",
        icon: "account_circle",
        link: "/perfil",
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
import { mapState, mapGetters } from 'vuex'
import { isSuperAdmin } from 'src/js/superadmin'

export default defineComponent({

    name: "MainLayout",

    components: {
        EssentialLink,
        Download,
        AppIcon,
        SessionExpiredModal,
        SelectCityModal,
    },

    setup() {
        const leftDrawerOpen = ref(false);
        const loadCategoriesRef = ref(null);
        const showCityModal = ref(false);
        provide('loadCategories', loadCategoriesRef);

        return {
            showCityModal,
            baseLinks: linksList,
            essentialLinks: ref([]),
            leftDrawerOpen,
            loadCategoriesRef,
            toggleLeftDrawer() {
                leftDrawerOpen.value = !leftDrawerOpen.value;
            },
        };
    },
    computed: {
        ...mapState('categories', ['list']),
        ...mapGetters('categories', ['loading']),
        categories() {
            return this.list || [];
        },
        showGlassNavbar() {
            const p = this.$route.fullPath;
            // Esconde na página de anúncio (/123/...) e na página SEO (/comercio/123/slug)
            const clean = p.replace(/\?.*$/, '')
            const isAdPage = /^\/\d+(\/.*)?$/.test(clean)
            const isCommerceSeoPage = /^\/comercio\/\d+(\/.*)?$/.test(clean)
            return !(isAdPage || isCommerceSeoPage);
        },
    },
    data() {
        return {};
    },
    watch: {
      $route(to, from) {
        if (from.fullPath === '/login') {
          console.log('change router')
          this.init()
        }
      },
      showGlassNavbar: {
        immediate: true,
        handler(v) {
          if (typeof document !== 'undefined') {
            document.body.classList.toggle('has-glass-navbar', !!v)
          }
        }
      }
    },
    mounted() {
        console.log('mount')
        this.init()
        this.loadCategoriesRef = (loc) => this.getData(loc)
    },
    beforeUnmount() {
        if (typeof document !== 'undefined') {
            document.body.classList.remove('has-glass-navbar')
        }
    },
    methods: {
        async init() {
            this.essentialLinks = this.baseLinks.map((link) => ({ ...link }))
            const uuid = localStorage.getItem('uuid')
            let context = localStorage.getItem("context")
            if (!uuid) {
                localStorage.setItem('uuid', this.uuidv4())
            }
            let admin
            if (context) {
                context = JSON.parse(context)
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

            const isLoggedIn = !!context || !!localStorage.getItem('admin')
            this.essentialLinks = this.essentialLinks.map((link) =>
                link.link === '/perfil'
                    ? {
                        ...link,
                        title: isLoggedIn ? 'Minha conta' : 'Login/Senha',
                    }
                    : link
            )

            const localization = localStorage.getItem("localization")
            this.localization = localization ? JSON.parse(localization) : null
            if (this.localization) {
                this.$store.dispatch('localization/setLocalization', this.localization)
                this.getData()
            } else {
                const setFromCommerce = await this.trySetCityFromCommercePage()
                if (!setFromCommerce) {
                    const setFromGeo = await this.trySetCityFromIp()
                    if (!setFromGeo) {
                        this.showCityModal = true
                    }
                }
            }
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
                if (isSuperAdmin()) {
                    this.essentialLinks.push({
                        title: "Mensagens",
                        icon: "mark_email_unread",
                        link: "/adm/contatos",
                    })
                }
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
        async trySetCityFromIp() {
            try {
                const res = await fetch('https://ipinfo.io/json')
                const data = await res.json()
                const cityName = data?.city
                if (!cityName) return false
                const { citysData } = await import('src/js/citys')
                const n = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
                const nCity = n(cityName)
                const city =
                    citysData.find((c) => n(c.city) === nCity) ||
                    citysData.find((c) => n(c.city).includes(nCity) || nCity.includes(n(c.city)))
                if (!city) return false
                localStorage.setItem('localization', JSON.stringify(city))
                this.localization = city
                this.$store.dispatch('localization/setLocalization', city)
                await this.getData(city)
                return true
            } catch {
                return false
            }
        },
        async trySetCityFromCommercePage() {
            const path = this.$route?.path || ''
            const commerceMatch = path.match(/^\/(\d+)(?:\/|$)|^\/comercio\/(\d+)(?:\/|$)/)
            if (!commerceMatch) return false
            const adId = commerceMatch[1] || commerceMatch[2]
            try {
                const res = await this.$api.get(`/categories/ads/${adId}?nonDeleted=true`)
                const ad = res?.data
                if (!ad?.deletedAt) {
                    const addrs = ad?.address || ad?.addresses
                    const addr = Array.isArray(addrs) && addrs.length ? addrs[addrs.length - 1] : addrs
                    const cityName = addr?.city || addr?.addressCity
                    const { citysData } = await import('src/js/citys')
                    let city = addr?.addressId ? citysData.find((c) => c.id === addr.addressId) : null
                    if (!city && cityName) {
                        const n = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
                        const nCity = n(cityName)
                        city = citysData.find((c) => n(c.city) === nCity || n(c.city).includes(nCity) || nCity.includes(n(c.city)))
                    }
                    if (city) {
                        localStorage.setItem('localization', JSON.stringify(city))
                        this.localization = city
                        this.$store.dispatch('localization/setLocalization', city)
                        await this.getData(city)
                        return true
                    }
                }
            } catch {
                // ignore
            }
            return false
        },
        async onCityConfirm(city) {
            if (!city) return
            localStorage.setItem('localization', JSON.stringify(city))
            this.localization = city
            this.$store.dispatch('localization/setLocalization', city)
            await this.getData(city)
        },
        async getData(overrideLocalization) {
            const loc = overrideLocalization || this.localization
            if (overrideLocalization) this.localization = loc
            if (!loc) return
            try {
                await this.$store.dispatch('categories/fetchCategories', loc)
            } catch (err) {
                const msg = err?.response?.data?.message || 'Erro na conexão!'
                this.$q.notify({
                    color: 'negative',
                    position: 'top',
                    message: msg,
                    icon: 'report_problem'
                })
            }
        },
    }
});
</script>

<style scoped>
.header-mobile {
  padding-top: env(safe-area-inset-top);
  background: rgba(37, 99, 235, 0.92) !important;
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}
.header-mobile :deep(.q-toolbar),
.header-mobile :deep(.q-btn) {
  color: white !important;
}
.header-mobile :deep(.q-toolbar-title) {
  color: white !important;
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

/* Navbar balão estilo Apple - frosted glass refinado */
.glass-navbar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  z-index: 50;
  pointer-events: none;
  isolation: isolate;
}
.glass-navbar-wrapper > nav {
  pointer-events: auto;
}
.glass-navbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.6rem;
  max-width: 300px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 2px 12px rgba(255, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
}
.glass-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.4rem 0;
  color: #4b5563;
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 500;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;
}
.glass-nav-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}
.glass-nav-item:hover {
  color: #374151;
}
.glass-nav-item:hover .glass-nav-icon {
  background: rgba(255, 255, 255, 0.5);
}
.glass-nav-item.active {
  color: #2563eb;
}
.glass-nav-item.active .glass-nav-icon {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(37, 99, 235, 0.25);
}
.glass-nav-item :deep(svg) {
  flex-shrink: 0;
}
/* Celular: apenas ícones em círculos */
@media (max-width: 600px) {
  .glass-nav-item span:not(.glass-nav-icon) {
    display: none;
  }
  .glass-nav-icon {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
  }
}
.has-glass-navbar {
  padding-bottom: calc(72px + env(safe-area-inset-bottom)) !important;
}
</style>
