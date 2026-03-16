<template>
  <q-page class="about-page bg-gray-50 min-h-screen pb-12">

    <!-- Hero -->
    <div class="hero-section bg-primary text-white px-6 pt-10 pb-16 text-center relative overflow-hidden">
      <div class="hero-blur-circle" />
      <div class="hero-blur-circle-2" />
      <div class="relative z-10">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 shadow-lg">
          <q-icon name="storefront" size="2.5rem" color="white" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight mb-1">Agenda Poliweb</h1>
        <p class="text-white/80 text-base font-medium">Conectando comércios à sua região</p>
      </div>
    </div>

    <!-- Conteúdo principal -->
    <div class="px-4 -mt-8 max-w-lg mx-auto space-y-4">

      <!-- Sobre o app -->
      <div class="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <q-icon name="info" color="primary" size="1.2rem" />
          </div>
          <h2 class="text-gray-800 font-semibold text-base">Sobre o Poliweb</h2>
        </div>
        <p class="text-gray-500 text-sm leading-relaxed">
          O Poliweb é uma plataforma de agenda digital que conecta comércios locais com seus clientes,
          facilitando a descoberta de estabelecimentos, serviços e produtos na sua cidade.
        </p>
      </div>

      <!-- Links rápidos -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-5 pt-4 pb-2">
          <h2 class="text-gray-700 font-semibold text-sm uppercase tracking-wide">Acesso rápido</h2>
        </div>

        <router-link
          to="/list"
          class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-t border-gray-50 no-underline"
        >
          <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <q-icon name="grid_view" color="indigo-6" size="1.2rem" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-gray-800 font-medium text-sm mb-0">Ver todas as categorias</p>
            <p class="text-gray-400 text-xs">Explore todos os segmentos</p>
          </div>
          <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
        </router-link>

        <router-link
          to="/encontre"
          class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-t border-gray-100 no-underline"
        >
          <div class="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <q-icon name="search" color="teal-6" size="1.2rem" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-gray-800 font-medium text-sm mb-0">Encontrar comércios</p>
            <p class="text-gray-400 text-xs">Busque por categorias e subcategorias</p>
          </div>
          <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
        </router-link>

        <router-link
          to="/cidades"
          class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-t border-gray-100 no-underline"
        >
          <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <q-icon name="location_city" color="orange-7" size="1.2rem" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-gray-800 font-medium text-sm mb-0">Cidades disponíveis</p>
            <p class="text-gray-400 text-xs">Veja onde o Poliweb está presente</p>
          </div>
          <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
        </router-link>

        <router-link
          to="/contato"
          class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-t border-gray-100 no-underline"
        >
          <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <q-icon name="alternate_email" color="green-7" size="1.2rem" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-gray-800 font-medium text-sm mb-0">Fale conosco</p>
            <p class="text-gray-400 text-xs">Entre em contato com nossa equipe</p>
          </div>
          <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
        </router-link>
      </div>

      <!-- Juridico -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-5 pt-4 pb-2">
          <h2 class="text-gray-700 font-semibold text-sm uppercase tracking-wide">Jurídico</h2>
        </div>

        <router-link
          to="/termos-e-condicoes"
          class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-t border-gray-50 no-underline"
        >
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <q-icon name="gavel" color="blue-7" size="1.2rem" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-gray-800 font-medium text-sm mb-0">Termos e Condições</p>
            <p class="text-gray-400 text-xs">Leia nossos termos de uso</p>
          </div>
          <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
        </router-link>

        <router-link
          to="/politica-de-privacidade"
          class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-t border-gray-100 no-underline"
        >
          <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <q-icon name="shield" color="purple-7" size="1.2rem" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-gray-800 font-medium text-sm mb-0">Política de Privacidade</p>
            <p class="text-gray-400 text-xs">Como tratamos seus dados</p>
          </div>
          <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
        </router-link>
      </div>

      <!-- Versão -->
      <p class="text-center text-gray-400 text-xs pt-2">Agenda Poliweb &copy; {{ new Date().getFullYear() }}</p>

    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "About",
});
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #1976D2 0%, #1565C0 60%, #0D47A1 100%);
}

.hero-blur-circle {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.hero-blur-circle-2 {
  position: absolute;
  bottom: -20px;
  left: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.no-underline {
  text-decoration: none;
  display: flex;
}
</style>
