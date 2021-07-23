import { api } from 'boot/axios'
const data = []
export function get(patch, param){
   api.get(patch, param ? param : null )
     .then((response) => {
        //  console.log(response.data.addresses)
        if(response.data){
         data = response.data
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
        return data
        // this.laoding = false
    })
}

