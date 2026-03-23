<template>
  <q-dialog
    v-model="display"
    persistent
    position="standard"
    class="session-expired-modal"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="session-expired-card glass-card">
      <q-card-section class="session-expired-content">
        <div class="session-expired-icon-wrapper">
          <AppIcon name="lock" :size="34" class="text-primary" />
        </div>
        <h3 class="session-expired-title">Sessão expirada</h3>
        <p class="session-expired-text">
          Seu acesso expirou. Para continuar, faça login novamente.
        </p>
        <div class="session-expired-actions">
          <q-btn
            flat
            no-caps
            class="session-expired-secondary"
            @click="goHome"
          >
            Agora não
          </q-btn>
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="session-expired-primary"
            @click="goToLogin"
          >
            Fazer login
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import AppIcon from 'components/AppIcon.vue'

export default {
  name: 'SessionExpiredModal',
  components: { AppIcon },
  data () {
    return {
      display: false,
      isAdmin: false
    }
  },
  mounted () {
    if (typeof window !== 'undefined') {
      window.addEventListener('poliweb:session-expired', this.handleSessionExpired)
    }
  },
  beforeUnmount () {
    if (typeof window !== 'undefined') {
      window.removeEventListener('poliweb:session-expired', this.handleSessionExpired)
    }
  },
  methods: {
    handleSessionExpired (event) {
      this.isAdmin = !!event?.detail?.isAdmin
      this.display = true
    },
    goHome () {
      this.display = false
      if (this.$route?.path !== '/') {
        this.$router.push('/')
      }
    },
    goToLogin () {
      this.display = false
      const target = this.isAdmin ? '/adm/login' : '/login'
      if (this.$route?.path !== target) {
        this.$router.push(target)
      }
    }
  }
}
</script>

<style scoped>
.session-expired-modal :deep(.q-dialog__backdrop) {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.session-expired-card {
  max-width: 360px;
  width: 90vw;
  border-radius: 22px;
  overflow: hidden;
}

.glass-card {
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.58);
  box-shadow: 0 10px 36px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.14) inset;
}

.session-expired-content {
  padding: 30px 24px 24px;
  text-align: center;
}

.session-expired-icon-wrapper {
  width: 68px;
  height: 68px;
  margin: 0 auto 18px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.16), rgba(25, 118, 210, 0.06));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.session-expired-title {
  margin: 0 0 8px;
  font-size: 1.18rem;
  font-weight: 700;
  color: #111827;
}

.session-expired-text {
  margin: 0 0 22px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #6b7280;
}

.session-expired-actions {
  display: flex;
  gap: 10px;
}

.session-expired-secondary,
.session-expired-primary {
  flex: 1;
  min-height: 46px;
  border-radius: 14px;
  font-weight: 600;
}

.session-expired-secondary {
  color: #475569;
  background: rgba(255, 255, 255, 0.45);
}

.session-expired-primary {
  background: linear-gradient(135deg, #1976d2 0%, #0f5fb8 100%);
  box-shadow: 0 8px 20px rgba(25, 118, 210, 0.28);
}
</style>
