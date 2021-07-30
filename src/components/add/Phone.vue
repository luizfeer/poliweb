<template>
    <q-form
            @submit="setPhone"          
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
</template>

<script>
import { ref } from "vue";

export default {

    setup () { 

        return {
            phones: ref(''),
            formPhone: ref({
                isWhatsapp: false,
                phone: null
            }),
            setPhone(){       
                this.$q.loading.show()
                this.$api.post(`/categories/ads/${this.adId}/phones`, {...this.formPhone})
                .then((response) => {
                    //  console.log(response.data.addresses)
                    if(response.data){
                    this.phones.push(response.data.id)
                    this.$q.notify({
                    color: 'secondary',
                    position: 'top',
                    message: 'Telefone salvo com sucesso!',         
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
        }
    }
}
</script>

<style lang="scss" scoped>

</style>