import { boot } from 'quasar/wrappers'
import AppIcon from 'components/AppIcon.vue'

export default boot(({ app }) => {
  app.component('AppIcon', AppIcon)
})
