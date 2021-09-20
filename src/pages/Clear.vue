<template>
  <q-dialog v-model="displayUpdatePrompt">
    <q-banner>
      A new version is available.
     <template v-slot:action>
       <q-btn label="Update" @click="refreshApp" />
     </template>
   </q-banner>
  </q-dialog>
</template>

<script>
import { Wokbox } from 'workbox-window'

export default {
data() {
  return {
  displayUpdatePrompt: false,
  workbox: null,
  }
},
methods: {
  refreshApp() {
    this.workbox.addEventListener('controlling', () => {
      window.location.reload()
    })
   this.workbox.messageSkipWaiting()
  }
},
created() {
  if ('service-worker' in navigator) {
    this.workbox = new Workbox('/service-worker.js')

   this.workbox.addEventListener('waiting', (event) => {
    this.displayUpdatePrompt = true
    })
    this.workbox.register()
  }
}
}
</script>