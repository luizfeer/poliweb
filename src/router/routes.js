
import {citysData} from 'src/js/citys'
import axios from 'axios'
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: async (to, from) => {
      let geo = {}
      const options = {
        method: 'GET',
        url: 'https://ipapi.co/json/',
        // headers: {
        //   'X-RapidAPI-Host': 'ip-geolocation-and-threat-detection.p.rapidapi.com',
        //   'X-RapidAPI-Key': '40d9ffead9msh25fc9428d1adbecp1f7159jsnb6b98cfcc60b'
        // }
      };

      const citys = citysData.sort((a, b) => a.city.localeCompare(b.city))

      const localization = localStorage.getItem("localization")
      if(!localization){
         axios.request(options).then(function (response) {
           geo = response.data;
           console.log(geo)
         }).catch(function (error) {
           console.error(error);
         });
         const hasLimit = citys.findIndex(x => {return x.city === geo.city})

         if(hasLimit>0){
           localStorage.setItem("localization", JSON.stringify(citysData[hasLimit]))
         } else{
          localStorage.setItem("localization", JSON.stringify(citysData[1]))
         }

       }
     },
     children: [
      { path: '', component: () => import('pages/Index.vue') },
      {
        path: '/home',
       component: () => import('pages/Home.vue')

      },
      {
        path: '/politica',
        component: () => import('pages/PoliticaSeguranca.vue')

      },
      // {
      //   path: '/categorias',
      //
      //   children: [
      //     { path: '', component: () => import('src/pages/Categories/Categories.vue') }
      //   ]
      // },
      {
        path: '/login',
       component: () => import('pages/Login.vue')

      },
      {
        path: '/adm/login',
        component: () => import('pages/admin/Login.vue')
      },
       {
        path: '/adm/icons',
        component: () => import('pages/admin/Icon.vue')
      },
      {
        path: '/adm/users',
       component: () => import('pages/admin/User.vue')

      },
      {
        path: '/adm/cidades',
       component: () => import('pages/admin/AddAddress.vue')

      },
      {
        path: '/categorias/:id?/:name?',
       component: () => import('pages/Categories.vue')

      },
      {
        path: '/buscar/:terms?',
       component: () => import('pages/Search.vue')

      },
      {
        path: '/actions/:id',
       component: () => import('pages/ads/Actions.vue')

      },
      {
        path: '/sobre',
       component: () => import('pages/About.vue')

      },
      {
        path: '/list',
       component: () => import('pages/ListCategoriesPagination.vue')

      },
      {
        path: '/encontre',
       component: () => import('pages/SubCategories.vue')

      },
      // {
      //   path: '/cidades',
      //  component: () => import('pages/Citys.vue')

      // },
      {
        path: '/cidade/:cidade',
       component: () => import('pages/City.vue')

      },
      {
        path: '/cidades',
       component: () => import('pages/CitysIndex.vue')

      },
      {
        path: '/c/:city/:id?',
       component: () => import('pages/ListCategoriesPagination.vue')

      },
      {
        path: '/sub/:id',
        component: () => import('pages/SubCategories.vue')
      },
      {
        path: '/img/:id',
       component: () => import('pages/EditImgs.vue')

      },
      {
        path: '/ecommerce/:id',
       component: () => import('pages/EditEcommerce.vue')

      },
      {
        path: '/loja/:id',
       component: () => import('pages/ViewEcommerce.vue')

      },
      // {
      //   path: '/slider/:id',
      //   component: () => import('src/pages/Video.vue')
      // },
      {
        path: '/slider2/:id',
        component: () => import('pages/Slider2.vue')
      },
      {
        path: '/contato',
        component: () => import('pages/Contact.vue')
      },
      {
        path: '/clear',
       component: () => import('pages/Clear.vue')

      },

      {
        path: '/:id/:name?',
       component: () => import('pages/Ads.vue')
      },
      {
        path: '/politica-de-privacidade',
        component: () => import('pages/PoliticaPrivacidade.vue')
      },
      {
        path: '/termos-e-condicoes',
        component: () => import('pages/TermosCondicoes.vue')
      },
      {
        path: '/cadastre',
        component: () => import('pages/Cadastre.vue'),
      },
      {
        path: '/baixar',
        component: () => import('pages/DownloadApp.vue'),

      }

      //vue router redirec to external link
    ],
  },
  {
    path: '/painel',
      // redirect: '/painel/categorias/list',
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
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'categorias/list', component: () => import('pages/categories/index.vue') },

      { path: 'categorias/add/:id?/:name?', component: () => import('pages/categories/Add.vue') },

      { path: 'categorias/remove', component: () => import('pages/categories/Remove.vue') },

      { path: 'categorias/edit/:id/:name/:icon', component: () => import('pages/categories/Edit.vue') },

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
