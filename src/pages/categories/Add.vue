<template>
  <q-page class="bg-gray-100">
    <q-form
      @submit="onSubmit"
      @reset="onReset"
      class="p-6"
    >
    <span class="text-xl">
      {{ nameCategorie ? "Criando uma sub-categoria dentro da categoria " + nameCategorie : 'Criando uma nova categoria' }}
    </span>

      <div class="mt-10">
        <div class="row">
          <q-select
            v-if="!nameCategorie"
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
            class="pb-8 w-full"
          >
          <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Sem cadastros
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-input filled v-model="form.name" lazy-rules label="Nome da categoria" class="w-full py-2" />
        </div>
         <div class="my-4">
            <q-input filled v-model="iconName" lazy-rules label="Pesquisar nos icone" @blur="filterIcon()" class="w-full py-2">
            <template v-slot:append>
            <q-icon v-if="iconName !== ''"  name="clear" class="cursor-pointer" @click="iconName = '';filterIcon()" />
            <q-icon  name="search" @click="filterIcon()"/>
          </template>
          </q-input>
            <q-select
              filled
              v-model="thumb"
              :options="imgs"
              label="Icone"
              color="teal"
              option-label="id"
              clearable
              options-selected-class="text-deep-orange"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-img :src="scope.opt.link" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label v-html="scope.opt.name" />
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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

export default defineComponent({
  name: "AddCategorias",
  data() {
    return {
      iconName: '',
      loading: false,
      slide: 1,
      follow: false,
      citys: [],
      selectedCity: null,
      emittedValue: null,
      nameCategorie: '',
      imgs: [],
      imgsRequest: [],
      thumb: '',
      form: {
        name: null,
        categoryId: null,
        addressId: null,
      }
    }
  },
  watch: {
    selectedCity(val) {
      this.form.addressId = val.id
    },
    thumb(val){
      this.form.iconId = val.id
    }
  },
  methods: {
    onSubmit(){
      this.$q.loading.show()
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
        this.$router.push({ path: '/' })

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
      },
      filterIcon(){
      try {
        this.loading = true
        const icons = this.imgsRequest.filter((item)=>{ return item.name.includes(this.iconName) })
        this.imgs = icons
      } catch (error) {

      } finally {
        this.loading = false
      }

    }
  } ,
 async mounted () {
   if(this.$route.params.id){
    this.form.categoryId = this.$route.params.id
    this.nameCategorie = this.$route.params.name
   }

   await this.$api.get('/icons')
  .then((response) => {
        //  console.log(response.data.addresses)
        if(response.data){
        const icons = response.data.icons.filter((item)=>{ return !item.deletedAt })

         this.imgs = icons
         this.imgsRequest = icons
        }
      })
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
