<template>
  <q-page class="login-page w-full min-h-full row justify-center items-center">
    <div class="login-container column items-center">
      <div class="row cursor-pointer" @click="goToAdmin">
        <h1 class="login-title text-h5 text-weight-medium select-none">Login</h1>
      </div>
      <div class="row q-mt-lg">
        <q-form @submit="login" class="full-width">
          <q-card flat class="login-card">
            <q-card-section class="q-pa-lg">
              <q-input
                v-model="form.email"
                type="email"
                label="Email"
                outlined
                dense
                clearable
                class="login-input q-mb-md"
              />
              <q-input
                v-model="form.password"
                type="password"
                label="Senha"
                outlined
                dense
                clearable
                class="login-input"
              />
            </q-card-section>
            <q-card-actions class="q-px-lg q-pb-lg q-pt-none">
              <q-btn
                unelevated
                no-caps
                size="md"
                class="login-btn full-width"
                type="submit"
                label="Entrar"
              />
            </q-card-actions>
            <q-card-section class="text-center q-pa-none q-pb-md">
              <p class="login-footer-text">Cadastre-se em breve</p>
            </q-card-section>
          </q-card>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script>
import { persistAuthSession } from 'src/boot/axios'

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
  goToAdmin () {
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
            persistAuthSession(data, { isAdmin: false })
            localStorage.setItem("id-customer",  JSON.stringify(data.context.id))
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

<style lang="scss" scoped>
.login-page {
  background: #f6f9fc;
}

.login-container {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.login-title {
  color: #32325d !important;
  letter-spacing: -0.5px;
  transition: color 0.2s ease;
}

.cursor-pointer:hover .login-title {
  color: #635bff !important;
}

.login-card {
  width: 400px;
  max-width: 90vw;
  background: #ffffff !important;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
}

.login-input {
  :deep(.q-field__control) {
    &::before {
      border-color: #e6e9eb !important;
    }
    &:hover::before {
      border-color: #c4c4c4 !important;
    }
  }
  :deep(.q-field--outlined .q-field__control:before) {
    border-width: 1px;
  }
}

.login-btn {
  background: #635bff !important;
  color: #ffffff !important;
  font-weight: 500;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.login-btn:hover {
  background: #5851ea !important;
}

.login-footer-text {
  color: #8898aa;
  font-size: 0.875rem;
  margin: 0;
}
</style>
