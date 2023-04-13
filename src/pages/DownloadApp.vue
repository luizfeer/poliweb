<template>
<span class="text-gray-600 text-xl my-2">Redirecionando você para a loja de aplicativos.</span>


</template>

<script>
export default {
  setup() {
    const detectAndRedirect = () => {
      if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        // Redireciona para a loja da Apple
        window.location.href = "https://apps.apple.com/br/app/poliweb-agenda/id1659657349";
      } else if (navigator.userAgent.match(/Android/i)) {
        // Redireciona para a loja do Google Play
        window.location.href = "https://play.google.com/store/apps/details?id=br.com.poliwebapp.www.twa&hl=pt_BR&gl=US";
      }
    };
  }
};
</script>
