import { boot } from 'quasar/wrappers'
import axios from 'axios'

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const baseURL = process.env.DEV
  ? (process.env.API_URL_LOCAL || 'http://localhost:5000')
  : (process.env.API_URL || 'https://apiv3.poliwebapp.com.br')

const api = axios.create({ baseURL })
// const apiCep = axios.create({ baseURL: 'https://www.cepaberto.com/api/v3/nearest?' })
export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api
  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file
  
  app.config.globalProperties.$api = api
  api.defaults.headers.post['Content-Type'] = 'application/json';
  // SSR-safe: localStorage só existe no browser
  if (typeof window !== 'undefined') {
    const AUTH_TOKEN = window.localStorage?.getItem('token')
    if (AUTH_TOKEN) {
      api.defaults.headers.common['Authorization'] = 'Bearer ' + AUTH_TOKEN
    }
  }
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }
