<template>
    <q-form
      @submit="setAddress"
      class="p-4"
    >
      <div class="">
        <div class="title">
          Editar informações basicas
        </div>
        <div class="row">      
          <q-input filled v-model="formData.name" type="text" lazy-rules label="Nome" class="w-full py-2" />
        </div>
        <div class="row">      
          <q-input filled v-model="formData.description" type="text" lazy-rules label="Descrição" class="w-full py-2" />
        </div>
        <div class="row">      
          <q-input filled v-model="formData.facebook" type="text" lazy-rules label="Facebook" class="w-full py-2" />
        </div>
        <div class="row">      
          <q-input filled v-model="formData.instagram" type="text" lazy-rules label="Instagram" class="w-full py-2" />
        </div>
        <div class="row">      
          <q-input filled v-model="formData.email" type="email" lazy-rules label="Email" class="w-full py-2" />
        </div>
        <div class="row">      
          <q-input filled v-model="formData.website" type="text" lazy-rules label="Site" class="w-full py-2" />
        </div>
      </div>
      <q-btn label="Salvar" type="submit" color="primary"/>         
    </q-form>
</template>

<script>
import { ref } from "vue";
export default {
    props:{
        data: {
           type: Object,
           required: true,
        },       
    },
    setup () { 
        return {
            formData: ref({
             name: '',
             description: '',
             facebook: '',
             instagram: '',
             website: '',
             email: '',
             avatar: null
            })            
        }
      },
      mounted () {       
          this.formData = this.data        
      },
      methods: {
        setAddress(){
              this.$q.loading.show()            

              this.$api.post(`/categories/ads/${this.formData.id}`, {...this.formData})
              .then((response) => {
                  //  console.log(response.data.addresses)
                  if(response.data){                 
                  this.$q.notify({
                  color: 'secondary',
                  position: 'top',
                  message: 'Endereço salvo com sucesso!',         
                  })
                  }
                  
                  
                    // this.$router.go(0)
                  
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

</style>