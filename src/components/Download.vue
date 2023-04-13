<template>
  <div class="flex flex-col items-center justify-center bg-white p-5 fixed bottom-0 left-0 right-0 z-10 shadow-xl border-t border-gray-400" v-if="display">
    <q-btn class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" @click="detectAndRedirect"
    icon="download" >Baixe nosso aplicativo</q-btn>
    <q-btn class="bg-gray-200 hover:bg-gray-300 text-gray-500 font-bold py-1 px-3 rounded absolute right-4 top-2" @click="closeMessage" >X</q-btn>
 </div>
</template>

<script>
import { ref, onMounted } from "vue";
export default {

  setup() {
    const display = ref(true);
    const isIOSWebview = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    onMounted(() => {
      if (isIOSWebview || isPWA) {
        display.value = false;
      }
    });

    const closeMessage = () => {
      display.value = false
    };
    const detectAndRedirect = () => {
      if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        // Redireciona para a loja da Apple
        window.open("https://apps.apple.com/br/app/poliweb-agenda/id1659657349", "_blank");
      } else if (navigator.userAgent.match(/Android/i)) {
        // Redireciona para a loja do Google Play
        window.open("https://play.google.com/store/apps/details?id=br.com.poliwebapp.www.twa&hl=pt_BR&gl=US", "_blank");

      }
    };
    return { display, closeMessage, detectAndRedirect };

  }
};
</script>
