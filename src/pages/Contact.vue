<template>
  <q-page class="bg-blue-100 w-full h-full row justify-center items-center px-3 md:px-20 ">
    <div class="column w-full md:max-w-[40rem]">
      <div class="row">
        <h5 class="text-h5 text-black q-my-md">Contato</h5>
      </div>
      <div class="row">
        <q-form @submit="login" class="w-full">

        <q-card square bordered class="p-2 pt-5 md:p-5 shadow-1">
            <q-input outlined clearable v-model="form.name" type="text" name="name" label="Nome" class="mb-5"/>
            <q-input outlined clearable v-model="form.phone"  mask="(##) ##### - ####" name="phone" type="phone" label="Telefone" class="mb-5"/>
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
  name: 'Login',
  components: {
    VueRecaptcha,
  },
  data () {
    return {
      verify:false,
      sitekey: '6LduKNwfAAAAAIgmaAoy99hVbahpMg_-MeMGOg_b',
      form:{
        name: '',
        phone: '',
        description: ''
      },
      data:[]
    }
  },
  methods:{
    verifyMethod(e){
      this.verify = true
      console.log(e)
    },
  login () {
    if(this.form.description.length<=5){
       this.$q.notify({
          color: 'negative',
          position: 'top',
          message: 'Digite uma menssagem',
          icon: 'report_problem'
        })
        return
    }
    this.$q.loading.show()
    this.$api.post('/contacts', {...this.form})
      .then((response) => {
        const data = response.data
        console.log(data)
        this.$router.push({ path: '/' })
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
