<template>
<div class="q-pa-md">
    <q-table
      title="Treats"
      :rows="customers"
      :columns="headers"
      color="primary"
      row-key="name"
      :pagination="{rowsPerPage: 15 }"
      :filter="filter"
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Procurar">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <!-- <q-btn
          color="primary"
          icon-right="archive"
          label="Baixar"
          no-caps
          @click="exportTable"
        />       -->
      </template>
      
      <template v-slot:body-cell-edit="props">        
          <q-td key="edit" :props="props">
            <q-btn             
              round
              color="secondary"
              @click="edit(props.row)"
              icon="ion-create"
              class="mr-3"
            />
             <q-btn             
              round
              color="primary"
              @click="editPass(props.row)"
              icon="lock"
            />
            
          </q-td>        
      </template>
      <template v-slot:body-cell-createdAt="props">        
          <q-td key="createdAt" :props="props">
            {{ format(props.row.createdAt)}}
          </q-td>
      </template>      
    </q-table>
  </div>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-form
            @submit="updateUser"
            class="p-6"
          >
          <div class="mt-10">
            <div class="row">      
              <q-input filled v-model="formUser.email" type="email" lazy-rules label="Email" class="w-full py-2" />
              </div>
              <div class="row">      
                <q-input filled v-model="formUser.name" lazy-rules label="Nome" class="w-full py-2" />
              </div>      
               <div class="row">      
                <q-input filled v-model="formUser.phone" lazy-rules label="Celular" class="w-full py-2" />
              </div>          
          </div>
          <q-btn label="Salvar" type="submit" color="primary"/>
        </q-form>
    </q-card>
  </q-dialog>
  <q-dialog ref="dialogPass" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-form
            @submit="updatePass"
            class="p-6"
          >
          <div class="mt-10">
            <div class="row">   
              Troca de senha de {{ formPass.name }}
              <div class="row">      
                <q-input filled v-model="formPass.password" type="passowrd" lazy-rules label="Senha" class="w-full py-2" />
              </div>
              <div class="row">      
                <q-input filled v-model="formPass.confirmPassword"  type="passowrd" lazy-rules label="Confirmar senha" class="w-full py-2" />
              </div>  
            </div>          
                    
          </div>
          <q-btn label="Salvar" type="submit" color="primary"/>
        </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import { exportFile, useQuasar } from 'quasar'
import { date } from 'quasar'

function format (val) {
  return date.formatDate(val, 'DD/MM/YY HH:mm')
}

function wrapCsvValue (val, formatFn) {
  let formatted = formatFn !== void 0
    ? formatFn(val)
    : val

  formatted = formatted === void 0 || formatted === null
    ? ''
    : String(formatted)

  formatted = formatted.split('"').join('""')
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  return `"${formatted}"`
}

export default {
  data() {
    return {
      filter: '',
      loading: false,
      customers: [],
      formPass: {
        password: "",
        confirmPassword: ""
      },
      formUser: {
        name: null,
        phone: null,
        email: "",
      },
      headers: [
        {
          name: 'nome',
          required: true,
          label: 'Nome',
          align: 'center',
          field: 'name',
          sortable: true
        },
        { name: 'edit', label: 'Editar', field: 'id',  align: 'center', },       
        { name: 'email', align: 'center', label: 'Email', field: 'email', sortable: true },
        { name: 'phone', label: 'Telefone', field: 'phone', sortable: true,  align: 'center', },
        { name: 'createdAt', label: 'Criação', field: 'createdAt', sortable: true,  align: 'center',  },       
        // { name: 'id', label: 'ID', field: 'id' },       
        // { name: 'calcium', label: 'Calcium (%)', field: 'calcium', sortable: true, sort: (a, b) => parseInt(a, 10) - parseInt(b, 10) },
        // { name: 'iron', label: 'Iron (%)', field: 'iron', sortable: true, sort: (a, b) => parseInt(a, 10) - parseInt(b, 10) }
      ]
    }
  },
  methods: {
    format,
    edit(item){
      this.formUser = { 
        name: item.name,
        phone: item.phone,
        email: item.email,
        id: item.id
      }

      this.show()
    },
    editPass(item){
      this.formPass = { 
        name: item.name,
        id: item.id,
        password:'',
        confirmPassword:''
      }

      this.$refs.dialogPass.show()

    },
    show () {
      this.$refs.dialog.show()
    },
    hide () {
      this.$refs.dialog.hide()
    },
    
    updateUser(){
      this.$q.loading.show()
      this.$api.post(`/customers/${this.formUser.id}`, {...this.formUser})
      .then((response) => {
        //  console.log(response.data.addresses)
          this.getUsers()

        if(response.data){
          this.$q.notify({
            color: 'secondary',
          position: 'top',
          message: 'Editado com sucesso!',         
        })
        this.$refs.dialog.hide()

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
      updatePass(){
      this.$q.loading.show()
      this.$api.post(`/customers/${this.formPass.id}/password`, {...this.formPass})
      .then((response) => {
        //  console.log(response.data.addresses)
          this.getUsers()
        if(response.data){
          this.$q.notify({
            color: 'secondary',
          position: 'top',
          message: 'Nova senha salva com sucesso!',         
        })
          this.$refs.dialogPass.hide()

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
      getUsers(){
        this.loading = true
        this.$api.get(`/customers?nonDeleted=true`)
        .then((response) => {
            if(response.data){
            const customers = response.data.customers 
            this.customers = customers.filter((item)=>{ return !item.deletedAt })   
      
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
          this.loading = false
        })
      }
  },
  beforeMount() {
   this.getUsers()
   },
   
  setup () {
    const $q = useQuasar()

    return {
      date, 
      exportTable () {
        // naive encoding to csv format
        const content = [columns.map(col => wrapCsvValue(col.label))].concat(
          rows.map(row => columns.map(col => wrapCsvValue(
            typeof col.field === 'function'
              ? col.field(row)
              : row[ col.field === void 0 ? col.name : col.field ],
            col.format
          )).join(','))
        ).join('\r\n')

        const status = exportFile(
          'table-export.csv',
          content,
          'text/csv'
        )

        if (status !== true) {
          $q.notify({
            message: 'Browser denied file download...',
            color: 'negative',
            icon: 'warning'
          })
        }
      }
    }
  }
}

</script>
<style>
.my-table-details {
  font-size: 0.85em;
  font-style: italic;
  max-width: 200px;
  white-space: normal;
  color: #555;
  margin-top: 4px;
}
</style>