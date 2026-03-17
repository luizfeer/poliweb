<template>
  <q-page class="bg-blue-100 w-full min-h-full row justify-center items-start px-3 md:px-20 py-6">
    <div class="column w-full md:max-w-[40rem]">
      <div class="row mb-2">
        <h5 class="text-h5 text-black q-my-md">Contato</h5>
      </div>
      <div class="row mb-3">
        <p class="text-gray-600 text-sm">
          Entre em contato conosco: <a href="mailto:contato@poliwebapp.com.br" class="text-primary font-medium">contato@poliwebapp.com.br</a>
        </p>
      </div>
      <div class="row">
        <q-form @submit="submitForm" class="w-full">
        <q-card square bordered class="p-2 pt-5 md:p-5 shadow-1">
            <q-select
              v-model="form.tipo"
              :options="tiposSolicitacao"
              label="Tipo de solicitação"
              outlined
              dense
              class="mb-5"
              emit-value
              map-options
              @update:model-value="onTipoChange"
            />
            <q-input outlined clearable v-model="form.name" type="text" name="name" label="Nome" class="mb-5"/>
            <q-input outlined clearable v-model="form.email" type="email" name="email" label="Email para contato" class="mb-5"/>
            <q-input outlined clearable v-model="form.phone" mask="(##) ##### - ####" name="phone" type="phone" label="Telefone" class="mb-5"/>
            <div class="rounded-md mb-5">
                <q-editor placeholder="Digite sua mensagem.." v-model="form.description" min-height="5rem" />
            </div>
            <vue-recaptcha
              @verify="verifyMethod"
              :load-recaptcha-script="true"
              :sitekey="sitekey"
            ></vue-recaptcha>

          <q-card-actions class="q-px-md">
            <q-btn unelevated color="light-blue-7" size="lg" class="full-width" type="submit" label="Enviar" :disabled="!verify"/>
          </q-card-actions>

        </q-card>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script>
 import { VueRecaptcha } from 'vue-recaptcha';
export default {
  name: 'Contact',
  components: {
    VueRecaptcha,
  },
  data () {
    return {
      verify: false,
      sitekey: '6LduKNwfAAAAAIgmaAoy99hVbahpMg_-MeMGOg_b',
      tiposSolicitacao: [
        { label: 'Geral / Dúvidas', value: 'geral' },
        { label: 'Solicitar exclusão de conta', value: 'exclusao_conta' },
        { label: 'Suporte técnico', value: 'suporte' },
      ],
      form: {
        tipo: 'geral',
        name: '',
        email: '',
        phone: '',
        description: ''
      },
      data: []
    }
  },
  mounted() {
    try {
      const ctx = localStorage.getItem('context')
      if (ctx) {
        const parsed = JSON.parse(ctx)
        if (parsed?.email) this.form.email = parsed.email
        if (parsed?.company) this.form.name = parsed.company
      }
    } catch (_) {}
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
    submitForm () {
    if (this.form.description.length <= 5) {
       this.$q.notify({
          color: 'negative',
          position: 'top',
          message: 'Digite uma mensagem',
          icon: 'report_problem'
        })
        return
    }
    const payload = {
      ...this.form,
      description: `[${this.form.tipo.toUpperCase()}]\n\n${this.form.description}\n\n---\nResposta: contato@poliwebapp.com.br`
    }
    this.$q.loading.show()
    this.$api.post('/contacts', payload)
      .then((response) => {
        const data = response.data
        console.log(data)
        this.$router.push({ path: this.form.tipo === 'exclusao_conta' ? '/perfil' : '/' })
        this.$q.notify({
          color: 'positive',
          position: 'top',
          message: 'Mensagem enviada com sucesso!',
          icon: 'check'
        })
        // if(data){
        //  this.$api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        //  localStorage.setItem("token", data.token)
        //  localStorage.setItem("id-customer",  JSON.stringify(data.context.id))
        //  localStorage.setItem("context",  JSON.stringify(data.context))
        //  localStorage.removeItem('admin')

        // }
      })
      .catch((err) => {
        let msg
        if( err.response){
          msg =  err.response.data.message
        }else {
          msg = 'Erro na conexão!'
        }
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
      })
      .finally(()=>{
        this.$q.loading.hide()
      })
    }
  }
}
</script>

<style>
</style>
