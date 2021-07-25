
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') }
    ]
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
    path: '/categorias/:id?/:name?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Categories.vue') }
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
    path: '/ads/:id',
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
