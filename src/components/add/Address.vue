<template>
    <q-form
      :id="formId"
      @submit="setAddress"
      class="address-form"
    >
      <div class="address-form-fields">
        <div v-if="!hideTitle" class="address-form-title">
          {{ edit ? 'Atualize o endereço' : 'Cadastre o endereço' }}
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
    </q-form>
</template>

<script>
import { ref } from "vue";
export default {
    emits: ['saved'],
    props:{
        adId: {
           type: Number,
           required: true,
        },
        addressEdit: {
          type: Object         
        },
        address:{
          type: Object,
        },
        edit:{
          type: Boolean,
        },
        hideTitle: {
          type: Boolean,
          default: false,
        },
    },
    setup (props) { 
        const formId = `address-form-${props.edit ? 'edit' : 'add'}`
        return {
            formId,
            formAddress: ref({
                zipCode: "37860000",
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
      mounted () {
        if (this.address) {
          Object.assign(this.formAddress, this.address)
        }
      },
      methods: {
        setAddress(){
              this.$q.loading.show()
              let link = `/categories/ads/${this.adId}/addresses`          
              if(this.edit){
                link = `/categories/ads/addresses/${this.formAddress.id}`
              }
              this.$api.post(link, {...this.formAddress})
              .then((response) => {
                  //  console.log(response.data.addresses)
                  if(response.data){                 
                  this.$q.notify({
                  color: 'secondary',
                  position: 'top',
                  message: 'Endereço salvo com sucesso!',         
                  })
                  this.$emit('saved')
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
    }
}
</script>

<style lang="scss" scoped>
.address-form {
  padding: 0 0.5rem;
}
.address-form-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}
.address-form-fields .row {
  margin-bottom: 0.5rem;
}
</style>