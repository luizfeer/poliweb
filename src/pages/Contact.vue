<template>
  <q-page class="contact-page">
    <section class="contact-shell">
      <header class="contact-header">
        <div>
          <p class="contact-eyebrow">Atendimento Poliweb</p>
          <h1 class="contact-title">Contato</h1>
          <p class="contact-subtitle">
            Envie sua solicitação para a equipe. Quando você está logado, seus dados da conta são anexados automaticamente para agilizar o atendimento.
          </p>
        </div>
        <a href="mailto:aplicativopoliweb@gmail.com" class="contact-email-link">
          <q-icon name="alternate_email" size="18px" />
          <span>aplicativopoliweb@gmail.com</span>
        </a>
      </header>

      <div class="contact-grid">
        <q-card flat bordered class="contact-card">
          <q-form @submit="submitForm" class="contact-form">
            <q-select
              v-model="form.tipo"
              :options="tiposSolicitacao"
              label="Tipo de solicitação"
              outlined
              emit-value
              map-options
              @update:model-value="onTipoChange"
            />

            <div class="contact-form-row">
              <q-input outlined clearable v-model="form.name" type="text" name="name" label="Nome" />
              <q-input outlined clearable v-model="form.email" type="email" name="email" label="Email para contato" />
            </div>

            <q-input outlined clearable v-model="form.phone" mask="(##) ##### - ####" name="phone" type="phone" label="Telefone" />

            <q-input
              v-model="form.description"
              outlined
              type="textarea"
              autogrow
              label="Mensagem"
              placeholder="Descreva sua dúvida, problema ou solicitação."
            />

            <div class="contact-recaptcha">
              <vue-recaptcha
                @verify="verifyMethod"
                :load-recaptcha-script="true"
                :sitekey="sitekey"
              />
            </div>

            <q-btn
              unelevated
              color="primary"
              size="lg"
              class="full-width"
              type="submit"
              label="Enviar mensagem"
              :loading="submitting"
              :disabled="!verify"
              no-caps
            />
          </q-form>
        </q-card>

        <aside class="contact-side">
          <q-card v-if="isLoggedIn" flat bordered class="contact-card contact-account-card">
            <div class="contact-card-head">
              <q-icon name="account_circle" size="22px" color="primary" />
              <div>
                <h2>Dados anexados</h2>
                <p>Sua mensagem irá com estas informações.</p>
              </div>
            </div>
            <div class="contact-info-list">
              <div v-if="accountName" class="contact-info-item">
                <span>Conta</span>
                <strong>{{ accountName }}</strong>
              </div>
              <div v-if="accountEmail" class="contact-info-item">
                <span>Email logado</span>
                <strong>{{ accountEmail }}</strong>
              </div>
              <div v-if="accountId" class="contact-info-item">
                <span>ID da conta</span>
                <strong>{{ accountId }}</strong>
              </div>
              <div v-if="accountCommerceId" class="contact-info-item">
                <span>Comércio vinculado</span>
                <strong>{{ accountCommerceId }}</strong>
              </div>
            </div>
          </q-card>

          <q-card v-else flat bordered class="contact-card contact-account-card">
            <div class="contact-card-head">
              <q-icon name="login" size="22px" color="primary" />
              <div>
                <h2>Atendimento com login</h2>
                <p>Entrar na conta preenche seus dados e facilita a identificação.</p>
              </div>
            </div>
            <q-btn outline color="primary" label="Fazer login" to="/login" no-caps class="full-width" />
          </q-card>

          <q-card flat bordered class="contact-card contact-help-card">
            <div class="contact-card-head">
              <q-icon name="support_agent" size="22px" color="primary" />
              <div>
                <h2>O que enviar</h2>
                <p>Inclua nome do comércio, cidade, telefone e detalhes do problema quando houver.</p>
              </div>
            </div>
          </q-card>
        </aside>
      </div>
    </section>
  </q-page>
</template>

<script>
import { VueRecaptcha } from 'vue-recaptcha'

function parseStoredJson(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch (_) {
    return null
  }
}

function formatAccountName(context = {}) {
  return context.company || context.name || context.user?.name || ''
}

export default {
  name: 'Contact',
  components: {
    VueRecaptcha,
  },
  data() {
    return {
      verify: false,
      submitting: false,
      sitekey: '6LduKNwfAAAAAIgmaAoy99hVbahpMg_-MeMGOg_b',
      context: null,
      tiposSolicitacao: [
        { label: 'Geral / Dúvidas', value: 'geral' },
        { label: 'Solicitar exclusão de conta', value: 'exclusao_conta' },
        { label: 'Suporte técnico', value: 'suporte' },
        { label: 'Problema com anúncio', value: 'anuncio' },
        { label: 'Financeiro / Comercial', value: 'financeiro' },
      ],
      form: {
        tipo: 'geral',
        name: '',
        email: '',
        phone: '',
        description: ''
      }
    }
  },
  computed: {
    isLoggedIn() {
      if (typeof localStorage === 'undefined') return !!this.context
      return !!this.context || !!localStorage.getItem('token') || !!localStorage.getItem('admin')
    },
    accountName() {
      return formatAccountName(this.context || {})
    },
    accountEmail() {
      return this.context?.email || this.context?.user?.email || ''
    },
    accountId() {
      return this.context?.id || this.context?.customerId || ''
    },
    accountCommerceId() {
      return this.context?.categoryAdId || ''
    }
  },
  mounted() {
    this.context = parseStoredJson('context')
    const idCustomer = parseStoredJson('id-customer')

    if (this.accountEmail) this.form.email = this.accountEmail
    if (this.accountName) this.form.name = this.accountName
    if (this.context?.phone) this.form.phone = this.context.phone
    if (!this.accountId && idCustomer && this.context) {
      this.context = { ...this.context, id: idCustomer }
    }
  },
  methods: {
    verifyMethod() {
      this.verify = true
    },
    onTipoChange(val) {
      if (val === 'exclusao_conta') {
        this.form.description = 'Solicito a exclusão permanente da minha conta e de todos os meus dados pessoais, conforme a Política de Privacidade do Poliweb.'
      }
    },
    buildDescription() {
      const typeLabel = this.tiposSolicitacao.find((item) => item.value === this.form.tipo)?.label || this.form.tipo
      const lines = [
        `Tipo: ${typeLabel}`,
        `Email para resposta: ${this.form.email || 'não informado'}`,
        `Nome informado: ${this.form.name || 'não informado'}`,
        `Telefone informado: ${this.form.phone || 'não informado'}`,
        '',
        'Mensagem:',
        this.form.description,
        '',
        'Dados da sessão:',
        `Logado: ${this.isLoggedIn ? 'sim' : 'não'}`,
        `Conta: ${this.accountName || 'não informado'}`,
        `Email logado: ${this.accountEmail || 'não informado'}`,
        `ID da conta: ${this.accountId || 'não informado'}`,
        `Comércio vinculado: ${this.accountCommerceId || 'não informado'}`,
        `Origem: ${window.location.href}`,
        `Enviado em: ${new Date().toLocaleString('pt-BR')}`,
      ]

      return lines.join('\n').slice(0, 1024)
    },
    async submitForm() {
      if (this.form.description.trim().length <= 5) {
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: 'Digite uma mensagem',
          icon: 'report_problem'
        })
        return
      }

      this.submitting = true
      this.$q.loading.show()

      try {
        await this.$api.post('/contacts', {
          name: this.form.name || this.accountName || 'Contato sem nome',
          phone: this.form.phone || 'Não informado',
          description: this.buildDescription()
        })

        this.$q.notify({
          color: 'positive',
          position: 'top',
          message: 'Mensagem enviada com sucesso!',
          icon: 'check'
        })
        this.$router.push({ path: this.form.tipo === 'exclusao_conta' ? '/perfil' : '/' })
      } catch (err) {
        const msg = err?.response?.data?.message || 'Erro na conexão!'
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
      } finally {
        this.submitting = false
        this.$q.loading.hide()
      }
    }
  }
}
</script>

<style scoped>
.contact-page {
  min-height: 100%;
  background: #f8fafc;
  padding: 1rem;
}
.contact-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 1rem 0 6rem;
}
.contact-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.contact-eyebrow {
  margin: 0 0 0.35rem;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
.contact-title {
  margin: 0;
  color: #0f172a;
  font-size: 2rem;
  font-weight: 800;
}
.contact-subtitle {
  max-width: 44rem;
  margin: 0.45rem 0 0;
  color: #64748b;
  line-height: 1.55;
}
.contact-email-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1rem;
  align-items: start;
}
.contact-card {
  border-radius: 10px;
  background: #fff;
}
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}
.contact-form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.contact-recaptcha {
  min-height: 78px;
}
.contact-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.contact-account-card,
.contact-help-card {
  padding: 1rem;
}
.contact-card-head {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.contact-card-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 800;
}
.contact-card-head p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.45;
}
.contact-info-list {
  display: grid;
  gap: 0.65rem;
}
.contact-info-item {
  display: grid;
  gap: 0.15rem;
}
.contact-info-item span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.contact-info-item strong {
  color: #0f172a;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}
@media (max-width: 900px) {
  .contact-header {
    display: block;
  }
  .contact-email-link {
    margin-top: 0.8rem;
  }
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .contact-page {
    padding: 0.75rem;
  }
  .contact-shell {
    padding-top: 0.25rem;
  }
  .contact-title {
    font-size: 1.55rem;
  }
  .contact-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
