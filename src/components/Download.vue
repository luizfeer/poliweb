<template>
  <q-dialog
    v-model="display"
    persistent
    position="standard"
    class="download-modal"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="download-card glass-card">
      <q-btn
        flat
        round
        dense
        class="download-close"
        @click="closeMessage"
        aria-label="Fechar"
      >
        <AppIcon name="close" :size="20" />
      </q-btn>

      <q-card-section class="download-content">
        <div class="download-icon-wrapper">
          <AppIcon name="file-download" :size="40" class="text-primary" />
        </div>
        <h3 class="download-title">Instale em seu celular</h3>
        <p class="download-text">
          Tenha o Poliweb sempre à mão. Acesso rápido aos comércios da sua cidade.
        </p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="download-btn"
          @click="detectAndRedirect"
        >
          <template v-slot:icon>
            <AppIcon name="download" :size="22" />
          </template>
          Instalar aplicativo
        </q-btn>
      </q-card-section>
    </q-card>

  </q-dialog>
</template>

<style scoped>
.download-modal :deep(.q-dialog__backdrop) {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.download-card {
  max-width: 340px;
  width: 90vw;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.glass-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.download-close {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #6b7280;
  z-index: 1;
}

.download-close:hover {
  color: #374151;
}

.download-content {
  padding: 32px 24px 28px;
  text-align: center;
}

.download-icon-wrapper {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25, 118, 210, 0.12);
  border-radius: 18px;
}

.download-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
  line-height: 1.3;
}

.download-text {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 24px;
}

.download-btn {
  width: 100%;
  min-height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 14px;
  background: linear-gradient(135deg, #1976d2 0%, rgba(25, 118, 210, 0.9) 100%);
  color: white !important;
  box-shadow: 0 4px 14px rgba(25, 118, 210, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.download-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.45);
}

.download-btn:active {
  transform: translateY(0);
}
</style>

<script>
import { ref, onMounted } from "vue";
export default {

  setup() {
    const display = ref(true);
    const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined'
    const userAgent = isBrowser ? navigator.userAgent : ''
    const isIOSWebview = isBrowser && /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent)
    const isPWA = isBrowser && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone
    )
    onMounted(() => {
      const dismissed = typeof localStorage !== 'undefined' && localStorage.getItem('poliweb_download_modal_dismissed');
      if (isIOSWebview || isPWA || dismissed) {
        display.value = false;
      }
    });

    const DISMISSED_KEY = 'poliweb_download_modal_dismissed';

    const dismissForever = () => {
      try {
        localStorage.setItem(DISMISSED_KEY, '1');
      } catch (_) {}
      display.value = false;
    };

    const closeMessage = () => {
      dismissForever();
    };

    const detectAndRedirect = () => {
      dismissForever();
      if (!isBrowser) return
      if (userAgent.match(/iPhone|iPad|iPod/i)) {
        window.open("https://apps.apple.com/br/app/poliweb-agenda/id1659657349", "_blank");
      } else if (userAgent.match(/Android/i)) {
        window.open("https://play.google.com/store/apps/details?id=br.com.poliwebapp.www.twa&hl=pt_BR&gl=US", "_blank");
      }
    };
    return { display, closeMessage, detectAndRedirect };

  }
};
</script>
