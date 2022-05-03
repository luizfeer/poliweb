
import {citysData} from 'src/js/citys'
import axios from 'axios'
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') }
    ],
     beforeEnter: async (to, from) => {
      const geo = 'a'
      // const geo = await axios.get('https://ip-api.com/json/')
      // console.log('geo', geo.data)
      const citys = citysData.sort((a, b) => a.city.localeCompare(b.city))

     const localization = localStorage.getItem("localization")
       if(!localization){
        //  const hasLimit = citys.findIndex(x => {return x.city === geo.data.city})

        //  if(hasLimit>0){
          //  localStorage.setItem("localization", JSON.stringify(citysData[hasLimit]))
        //  } else{
          localStorage.setItem("localization", JSON.stringify(citysData[1]))
        //  }

        // this.model = this.localization
       }
     }
  },
  {
    path: '/home',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Home.vue') }
    ]
  },
  // {
  //   path: '/categorias',
  //   component: () => import('layouts/MainLayout.vue'),
  //   children: [
  //     { path: '', component: () => import('src/pages/Categories/Categories.vue') }
  //   ]
  // },
  {
    path: '/login',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Login.vue') }
    ]
  },
  {
    path: '/adm/login',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/admin/Login.vue') }
    ]
  },
   {
    path: '/adm/users',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/admin/User.vue') }
    ]
  },
  {
    path: '/adm/cidades',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/admin/AddAddress.vue') }
    ]
  },
  {
    path: '/categorias/:id?/:name?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Categories.vue') }
    ]
  },
  {
    path: '/buscar/:terms?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Search.vue') }
    ]
  },
  {
    path: '/actions/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/ads/Actions.vue') }
    ]
  },
   {
    path: '/sub/:id?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/SubCategories.vue') }
    ]
  },
  {
    path: '/encontre',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/SubCategories.vue') }
    ]
  },
  // {
  //   path: '/sub/:id',
  //   component: () => import('layouts/MainLayout.vue'),
  //   children: [
  //     { path: '', component: () => import('pages/SubCategorie.vue') }
  //   ]
  // },
   {
    path: '/img/:id',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/EditImgs.vue') }
    ]
  },
    {
    path: '/clear',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Clear.vue') }
    ]
  },
  {
    path: '/:id/:name?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Ads.vue') }
    ]
  },

  {
    path: '/painel',
       // redirect: '/painel/categorias/list',
    component: () => import('layouts/MainLayout.vue'),
    //   async beforeEnter (to, from, next) {
    //   // const auth = store.dispatch('loadMe')
    //   const token = localStorage.getItem('jwtToken')
    //   const headers = { 'Content-Type': 'application/json; charset=utf-8' }
    //   headers.Authorization = `bearer ${token}`

    //   try {
    //     const meResponse = await fetch('https://poliwebapp.com.br/admin/login', {
    //       method: 'POST',
    //       headers
    //     })
    //     const meData = await meResponse.json()

    //     if (!meResponse.ok) {
    //       throw meData
    //     }
    //     if (!meData) {
    //       throw meData
    //     }

    //     store.dispatch('setDataAuth', { token, meData })
    //     next()
    //   } catch (err) {
    //     next('/login')
    //     store.dispatch('alert', { color: 'red', msg: 'Sessão expirada, faça login novamente!' })
    //     router.push({ path: '/login' })
    //   }
    // },
    children: [
      { path: 'categorias/list', component: () => import('pages/categories/index.vue') },

      { path: 'categorias/add/:id?/:name?', component: () => import('pages/categories/Add.vue') },

      { path: 'categorias/remove', component: () => import('pages/categories/Remove.vue') },

      { path: 'categorias/edit', component: () => import('pages/categories/Edit.vue') },

      { path: 'ads/add/:id?/:name?', component: () => import('pages/ads/Add.vue') },


    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
