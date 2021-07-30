<template>
  <q-page class="bg-gray-100">
    
    <span class="text-xl">
      {{ "Criando um anúncio dentro da categoria " + nameCategorie }}
    </span>
     <q-carousel
        v-model="slide"
        transition-prev="slide-right"
        transition-next="slide-left"
        animated
        class="h-[auto] bg-gray-100"          
      >
        <q-carousel-slide name="0" class="">
          <q-form
            @submit="setCustomer"
            @reset="onReset"
            class="p-6"
          >
          <div class="mt-10">
            <div class="row">      
              <q-input filled v-model="formUser.email" type="email" lazy-rules label="Email" class="w-full py-2" />
              </div>
              <div class="row">      
                <q-input filled v-model="formUser.password" type="passowrd" lazy-rules label="Senha" class="w-full py-2" />
              </div>
              <div class="row">      
                <q-input filled v-model="formUser.confirmPassword"  type="passowrd" lazy-rules label="Confirmar senha" class="w-full py-2" />
              </div>
              <div class="row">      
                <q-input filled v-model="formUser.phone" lazy-rules label="Celular" class="w-full py-2" />
              </div>
              <div class="row">      
                <q-input filled v-model="formUser.name" lazy-rules label="Nome" class="w-full py-2" />
              </div>            
          </div>
          <q-btn label="Salvar" type="submit" color="primary"/>
          </q-form>
        </q-carousel-slide>
         <q-carousel-slide name="1" class="">
          <q-form
            @submit="setAd"
            @reset="onReset"
            class="p-6"
          >
          <div class="mt-10">
             <div class="row ">      
              <q-input filled v-model="formAds.name" lazy-rules label="Nome *" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAds.description" type="text" lazy-rules label="Descrição" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAds.facebook" type="text" lazy-rules label="Facebook" class="w-full py-2" />
            </div>
             <div class="row">      
              <q-input filled v-model="formAds.instagram" type="text" lazy-rules label="Instagram" class="w-full py-2" />
            </div>
             <div class="row ">      
              <q-input filled v-model="formAds.email" type="text" lazy-rules label="Email" class="w-full py-2" />
            </div>
             <div class="row">      
              <q-input filled v-model="formAds.website" type="text" lazy-rules label="Site" class="w-full py-2" />
            </div>                    
          </div>
          <q-btn label="Salvar" type="submit" color="primary"/>
          </q-form>
        </q-carousel-slide>
        <q-carousel-slide name="2" class="">
          <q-form
            @submit="setPhone"
            @reset="onReset"
            class="p-6"
          >
          <div class="mt-10">
            <div class="title">
              {{ phones.length ? 'Cadastre um novo telefone, ou pule para cadastrar um endereço' : 'Cadastrar telefone' }}
            </div>

             <div class="row">      
              <q-input filled v-model="formPhone.phone" lazy-rules label="Número:" name="phone" class="w-full py-2" />
            </div>
            <div class="row">      
               <div class="q-gutter-sm">
                  <q-checkbox v-model="formPhone.isWhatsapp" label="É Whatsapp?" />
                </div>
            </div>            
          </div>
          <q-btn label="Salvar" type="submit" color="primary"/>
          <q-btn label="Pular" color="primary" @click="slide='3'"/>
          </q-form>
        </q-carousel-slide>
        <q-carousel-slide name="3" class="">
          <q-form
            @submit="setAddress"
            @reset="onReset"
            class="p-6"
          >
          <div class="mt-10">
            <div class="title">
             Cadastre o endereço
            </div>

            <div class="row">      
              <q-input filled v-model="formAddress.zipCode" type="text" lazy-rules label="CEP" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAddress.city" type="text" lazy-rules label="Cidade" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAddress.state" type="text" lazy-rules label="Estado" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAddress.country" type="text" lazy-rules label="País" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAddress.street" type="text" lazy-rules label="Endereço" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAddress.number" type="text" lazy-rules label="Número" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAddress.complement" type="text" lazy-rules label="Complemento (Opcional)" class="w-full py-2" />
            </div>
            <div class="row">      
              <q-input filled v-model="formAddress.neighborhood" type="text" lazy-rules label="Bairro" class="w-full py-2" />
            </div>

          </div>
          <q-btn label="Salvar" type="submit" color="primary"/>
         
          </q-form>
        </q-carousel-slide>
     </q-carousel>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";

export default defineComponent({
  name: "AddCategorias",
  setup() {
    return {   
      slide: ref('0'), 
      nameCategorie: ref(''),
      categoryId: ref(''),
      adId: ref(''),
      phones: ref(''),
      formUser: ref({
        name: null,
        phone: null,
        email: "",
        password: "1234",
        confirmPassword: "1234"
      }),
      formAds: ref({
        customerId: null,
        name: null,
        description: null,
        facebook: null,
        instagram: null,
        website: null,
        email: null,
        avatar: null,
        }),
        formPhone: ref({
          isWhatsapp: false,
	        phone: null
        }),
        formAddress: ref({
         zipCode: "37800000",
         city: "Nova Resende",
         state: "MG",
         coordinates: {
           lat: -21.114253,
           long: -46.409309
          },
         country: "Brasil",
         street: "",
         number: "",
         complement: null,
         neighborhood: ""
        })
    }
  },
  watch: {
    selectedCity(val) {
      this.form.addressId = val.id
    },
    'formUser.name'(val){
      this.formAds.name = val
    }
  },
  methods: {    
    setCustomer(){
      this.$q.loading.show()
      this.$api.post('/customers', {...this.formUser})
      .then((response) => {
        //  console.log(response.data.addresses)
        if(response.data){
          this.formAds.customerId = response.data.id
          this.slide = "1"
          this.$q.notify({
          color: 'secondary',
          position: 'top',
          message: 'Usuário com sucesso!',         
        })
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
      .finally(() => {
         this.$q.loading.hide()

      })
    },
    setAd(){
      this.$q.loading.show()
      this.$api.post(`/categories/${this.categoryId}/ads`, {...this.formAds})
      .then((response) => {
        //  console.log(response.data.addresses)
        if(response.data){
          this.adId = response.data.id
          this.slide = "2"
          this.$q.notify({
          color: 'secondary',
          position: 'top',
          message: 'Anúncio com sucesso!',         
        })
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
      .finally(() => {
        this.$q.loading.hide()
      })
    },
    setPhone(){       
      this.$q.loading.show()
      this.$api.post(`/categories/ads/${this.adId}/phones`, {...this.formPhone})
      .then((response) => {
        if(response.data){
          this.$q.notify({
          color: 'secondary',
          position: 'top',
          message: 'Telefone salvo com sucesso!',         
        })
        }
        this.formPhone = {
          isWhatsapp: false,
	        phone: null
        }
        // this.phones.push({...response.data.id})
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
      .finally(() => {
        this.$q.loading.hide()
      })
      },
      setAddress(){
      this.$q.loading.show()
      this.$api.post(`/categories/ads/${this.adId}/addresses`, {...this.formAddress})
      .then((response) => {
        //  console.log(response.data.addresses)
        if(response.data){
          this.$q.notify({
            color: 'secondary',
          position: 'top',
          message: 'Endereço com sucesso!',         
        })
        this.$router.push({ path: `/categorias/${this.categoryId}` })
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
      .finally(() => {
        this.$q.loading.hide()

      })
      },
    onReset () {
      form.name = null
      form.addressId = null
      selectedCity = null
    }
  }, 
 async mounted () {
    if(this.$route.params.id){
      this.categoryId = this.$route.params.id
      this.nameCategorie = this.$route.params.name
    }
  },
});
</script>
<style>
</style>
