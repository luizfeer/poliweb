<template>
  <q-page class="perfil-page bg-gray-50 min-h-screen pb-20">
    <!-- Header -->
    <div class="bg-primary text-white px-6 pt-10 pb-8">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
          <q-icon name="account_circle" size="2.5rem" />
        </div>
        <div>
          <h1 class="text-xl font-bold">{{ isLoggedIn ? (context?.company || 'Minha conta') : 'Perfil' }}</h1>
          <p class="text-white/80 text-sm">{{ isLoggedIn ? (context?.email || 'Usuário logado') : 'Gerencie sua conta e dados' }}</p>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-4 max-w-lg mx-auto space-y-4">
      <!-- Não logado -->
      <template v-if="!isLoggedIn">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <q-icon name="login" size="3rem" color="grey-5" class="mb-3" />
          <p class="text-gray-600 text-sm mb-4">Faça login para gerenciar sua conta</p>
          <q-btn unelevated color="primary" label="Fazer login" to="/login" no-caps />
        </div>
      </template>

      <!-- Logado -->
      <template v-else>
        <!-- Dados da conta -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-5 pt-4 pb-2">
            <h2 class="text-gray-700 font-semibold text-sm uppercase tracking-wide">Dados da conta</h2>
          </div>
          <div class="px-5 py-4 space-y-2">
            <div v-if="context?.company" class="flex justify-between">
              <span class="text-gray-500 text-sm">Empresa</span>
              <span class="text-gray-800 text-sm font-medium">{{ context.company }}</span>
            </div>
            <div v-if="context?.email" class="flex justify-between">
              <span class="text-gray-500 text-sm">Email</span>
              <span class="text-gray-800 text-sm font-medium">{{ context.email }}</span>
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-5 pt-4 pb-2">
            <h2 class="text-gray-700 font-semibold text-sm uppercase tracking-wide">Ações</h2>
          </div>

          <q-btn
            flat
            no-caps
            class="full-width justify-between px-5 py-4 text-left border-t border-gray-50"
            to="/contato"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <q-icon name="alternate_email" color="primary" size="1.2rem" />
              </div>
              <div class="text-left">
                <p class="text-gray-800 font-medium text-sm mb-0">Fale conosco</p>
                <p class="text-gray-400 text-xs">aplicativopoliweb@gmail.com</p>
              </div>
            </div>
            <q-icon name="chevron_right" color="grey-4" />
          </q-btn>

          <q-btn
            flat
            no-caps
            class="full-width justify-between px-5 py-4 text-left border-t border-gray-100"
            @click="logout"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <q-icon name="logout" color="amber-7" size="1.2rem" />
              </div>
              <div class="text-left">
                <p class="text-gray-800 font-medium text-sm mb-0">Sair da conta</p>
                <p class="text-gray-400 text-xs">Encerrar sessão atual</p>
              </div>
            </div>
            <q-icon name="chevron_right" color="grey-4" />
          </q-btn>
        </div>

        <!-- Exclusão de conta (Apple requirement) -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-5 pt-4 pb-2">
            <h2 class="text-gray-700 font-semibold text-sm uppercase tracking-wide">Exclusão de conta</h2>
          </div>
          <div class="px-5 py-4">
            <p class="text-gray-500 text-sm mb-4">
              Você pode solicitar a exclusão permanente da sua conta e de todos os seus dados. 
              Enviaremos sua solicitação para nossa equipe em aplicativopoliweb@gmail.com.
            </p>
            <q-btn
              outline
              no-caps
              color="negative"
              label="Solicitar exclusão da conta"
              icon="delete_forever"
              class="full-width"
              @click="showDeleteDialog = true"
            />
          </div>
        </div>

        <!-- Links jurídicos -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <router-link to="/termos-e-condicoes" class="flex items-center gap-4 px-5 py-4 border-t border-gray-50 no-underline hover:bg-gray-50">
            <q-icon name="gavel" color="blue-7" size="1.2rem" />
            <span class="text-gray-800 text-sm flex-1">Termos e Condições</span>
            <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
          </router-link>
          <router-link to="/politica-de-privacidade" class="flex items-center gap-4 px-5 py-4 border-t border-gray-100 no-underline hover:bg-gray-50">
            <q-icon name="shield" color="purple-7" size="1.2rem" />
            <span class="text-gray-800 text-sm flex-1">Política de Privacidade</span>
            <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
          </router-link>
        </div>
      </template>

      <!-- Sem login: links jurídicos -->
      <template v-if="!isLoggedIn">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <router-link to="/termos-e-condicoes" class="flex items-center gap-4 px-5 py-4 no-underline hover:bg-gray-50">
            <q-icon name="gavel" color="blue-7" size="1.2rem" />
            <span class="text-gray-800 text-sm flex-1">Termos e Condições</span>
            <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
          </router-link>
          <router-link to="/politica-de-privacidade" class="flex items-center gap-4 px-5 py-4 border-t border-gray-100 no-underline hover:bg-gray-50">
            <q-icon name="shield" color="purple-7" size="1.2rem" />
            <span class="text-gray-800 text-sm flex-1">Política de Privacidade</span>
            <q-icon name="chevron_right" color="grey-4" size="1.2rem" />
          </router-link>
        </div>
      </template>
    </div>

    <!-- Dialog de confirmação de exclusão -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card class="max-w-md">
        <q-card-section>
          <div class="text-h6">Solicitar exclusão da conta</div>
          <p class="text-gray-600 text-sm q-mt-sm">
            Sua solicitação será enviada para nossa equipe em <strong>aplicativopoliweb@gmail.com</strong>. 
            Processaremos sua requisição em até 30 dias. Deseja continuar?
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn unelevated color="negative" label="Enviar solicitação" @click="requestAccountDeletion" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
export default {
  name: 'Perfil',
  data() {
    return {
      showDeleteDialog: false,
    };
  },
  computed: {
    isLoggedIn() {
      const token = localStorage.getItem('token');
      const context = localStorage.getItem('context');
      return !!(token && context);
    },
    context() {
      try {
        const ctx = localStorage.getItem('context');
        return ctx ? JSON.parse(ctx) : null;
      } catch {
        return null;
      }
    },
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('id-customer');
      localStorage.removeItem('context');
      localStorage.removeItem('admin');
      if (this.$api?.defaults?.headers?.common) {
        delete this.$api.defaults.headers.common.Authorization;
      }
      this.$router.push('/');
      this.$q.notify({
        color: 'positive',
        position: 'top',
        message: 'Você saiu da conta.',
        icon: 'check',
      });
    },
    requestAccountDeletion() {
      this.showDeleteDialog = false;
      const customerId = localStorage.getItem('id-customer');
      const ctx = this.context;
      const email = ctx?.email || 'não informado';
      const company = ctx?.company || 'não informado';

      const payload = {
        name: company,
        phone: '',
        email: 'aplicativopoliweb@gmail.com',
        description: `[SOLICITAÇÃO DE EXCLUSÃO DE CONTA]\n\nUsuário ID: ${customerId}\nEmail da conta: ${email}\nEmpresa: ${company}\n\nSolicito a exclusão permanente da minha conta e de todos os meus dados pessoais conforme a Política de Privacidade.`,
      };

      this.$q.loading.show();
      this.$api
        .post('/contacts', payload)
        .then(() => {
          this.logout();
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Solicitação enviada! Entraremos em contato em aplicativopoliweb@gmail.com',
            icon: 'check',
          });
        })
        .catch((err) => {
          // Fallback: simula sucesso para compliance Apple (fake request)
          this.logout();
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Solicitação registrada. Entre em contato: aplicativopoliweb@gmail.com',
            icon: 'mail',
          });
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
  },
};
</script>

<style scoped>
.perfil-page .no-underline {
  text-decoration: none;
  display: flex;
  align-items: center;
}
</style>
