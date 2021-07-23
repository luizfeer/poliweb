
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
    path: '/painel',
    component: null,
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
      { path: 'categorias/list', component: () => import('pages/Categories/index.vue') },
      
      { path: 'categorias/add', component: () => import('pages/Categories/Add.vue') },
      
      { path: 'categorias/remove', component: () => import('pages/Categories/Remove.vue') },
      
      { path: 'categorias/edit', component: () => import('pages/Categories/Edit.vue') }
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
