<template>
  <q-page class="bg-gray-100">
    <q-form
      @submit="onSubmit"
      @reset="onReset"
      class="q-gutter-md"
    >
    
      <div class="q-pa-md mt-10">
        <div class="q-gutter-md row">        
          <q-select
            filled
            v-model="selectedCity"
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            :options="citys"
            lazy-rules
            option-label="city"     
            hint="Cidade da categoria"
            style="width: 250px; padding-bottom: 32px"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Sem cadastros
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-input filled v-model="form.name" lazy-rules label="Nome da categoria" />
        </div>
      </div>
      
      <div>
        <q-btn label="Salvar" type="submit" color="primary"/>
      </div>
    </q-form>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";

export default defineComponent({
  name: "AddCategorias",
  setup() {
    return {
      slide: ref(1),
      follow: ref(false),
      citys: ref([]),     
      selectedCity: ref(null),
      emittedValue: ref(null),
      form: ref({
        name: null,
        categoryId: null,
        addressId: null,
      })
    }
  },
  watch: {
    selectedCity(val) {
      this.form.addressId = val.id
    }
  },
  methods: {    
    onSubmit(){
      this.$api.post('/categories', {...this.form})
      .then((response) => {
        //  console.log(response.data.addresses)
        if(response.data){
          this.$q.notify({
          color: 'secondary',
          position: 'top',
          message: 'Cadastrado com sucesso!',
         
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
      this.laoding = false
    })

    },
     onReset () {
        form.name = null
        form.addressId = null
        selectedCity = null
      }
  } , 
 async mounted () {
   await this.$api.get('/address')
  .then((response) => {
        //  console.log(response.data.addresses)
        if(response.data){
         this.citys = response.data.addresses
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
      this.laoding = false
    })
  },
});
</script>
<style>
</style>
