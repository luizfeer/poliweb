<template>
  <q-page class="bg-blue-100 w-full h-full row justify-center items-center">
    <div class="column">
      <div class="row" v-touch-hold:2000.touch="handleHold">
        <h5 class="text-h5 text-black q-my-md select-none">Login</h5>
      </div>
      <div class="row px-4">
        <q-form @submit="login">

        <q-card square bordered class="q-pa-lg shadow-1 max-w-[300px]">
          <q-card-section class="px-3">
            <q-input square filled clearable v-model="form.email" type="email" label="Email" class="mb-5" />
            <q-input square filled clearable v-model="form.password" type="password" label="Senha" />
          </q-card-section>
          <q-card-actions class="q-px-md">
            <q-btn unelevated color="light-blue-7" size="lg" class="full-width" type="submit" label="Login"/>
          </q-card-actions>
          <q-card-section class="text-center q-pa-none">
            <p class="text-grey-6">Cadastre-se em breve</p>
          </q-card-section>
        </q-card>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'Login',
  data () {
    return {
      form:{
        email: '',
        password: ''
      },
      data:[]
    }
  },
  methods:{
  //  ...mapActions({
  //   setLogin: 'login/setMe'
  // }),
  handleHold ({ evt, ...newInfo }) {
    this.$router.push({ path: '/adm/login' })

  },
  login () {
    this.$q.loading.show()
    this.$api.post('/customers/login', {...this.form})
      .then((response) => {
        const data = response.data
        console.log(data)
        if(data){
          try {
            this.$api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            localStorage.setItem("token", data.token)
            localStorage.setItem("id-customer",  JSON.stringify(data.context.id))
            localStorage.setItem("context",  JSON.stringify({...data.context, when: new Date()}))
            localStorage.removeItem('admin')
            const path = data.context.categoryAdId ? `/${data.context.categoryAdId}` : '/'
            this.$router.push({ path: path })

          } catch (error) {
            console.log(error)
          }
        }
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
.q-card {
  width: 360px;
}
</style>
