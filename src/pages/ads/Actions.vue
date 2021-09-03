<template>
  <q-page class="bg-gray-100">
    
     <div class="q-px-lg q-pb-md">
       <q-option-group
        type="radio"
        class="py-4 flex"
        dense
        v-model="layout"
        :options="[
          { label: 'Curto', value: 'dense' },
          { label: 'Dividido', value: 'comfortable' }
        ]"
      />
    <q-timeline
      color="secondary"
     :layout="layout"
     >
      <q-timeline-entry heading>
        Últimas ações
      </q-timeline-entry>

      <q-timeline-entry
        v-for="item in actions"
        :key="item.id"
        :title="title(item.type)"
        :subtitle="formatDate(item.createdAt)"
        :icon="icon(item.type)"
        :color="color(item.type)"
      >
        <div>
          {{item.description}} {{desc(item.type)}}
        </div>
      </q-timeline-entry> 
    </q-timeline>
     </div>
     
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";

export default defineComponent({
  name: "Actions",
  setup() {
    return {   
      actions: ref([]),
      layout: ref('comfortable')
    }
  },
  methods: {
    title(txt){
      let action
      switch (txt) {
        case 'open-phone':
          action = 'Acessou o número de telefone'
          break;
        case 'open-whatsapp':
          action = "Acessou o whatsapp"
          break;
           case 'open-site':
             action = 'Acessou o site'
          break;
           case 'open-facebook':
             action = 'Acessou o perfil do facebook'
          break;
           case 'open-instagram':
             action = 'Acessou o perfil do instagram'
          break;
           case 'open-mail':
             action = 'Acessou o email'
          break;
           case 'open-map':
             action = 'Acessou o endereço no mapa'
          break;
           case 'open-photos':
             action = 'Olhou as fotos públicadas'
          break;
           case 'open':
             action = 'Acessou seu comércio'
          break;
           case 'share':
             action = 'Compartilhou com alguém'
          break;

        default:
          action = 'Acessou'
          break;
      }
      return action
    },
    desc(txt){
      let action
      switch (txt) {
        case 'open-phone':
          action = 'acessou o número de telefone da sua empresa.'
          break;
        case 'open-whatsapp':
          action = "acessou o whatsapp da sua empresa."
          break;
           case 'open-site':
             action = 'acessou o atalho para o site da sua empresa.'
          break;
           case 'open-facebook':
             action = 'acessou o perfil do facebook da sua empresa.'
          break;
           case 'open-instagram':
             action = 'acessou o perfil do instagram da sua empresa.'
          break;
           case 'open-mail':
             action = 'acessou o email da sua empresa.'
          break;
           case 'open-map':
             action = 'buscou o endereço no mapa da sua empresa.'
          break;
           case 'open-photos':
             action = 'olhou as fotos públicadas da sua empresa.'
          break;
           case 'open':
             action = 'encontrou e abriu a página da sua empresa.'
          break;
           case 'share':
             action = 'compartilhou sua empresa com alguém.'
          break;
          case 'followw':
             action = 'seguiu sua empresa.'
          break;

        default:
          action = 'acessou sua empresa.'
          break;
      }
      return action
    },
    formatDate(date){
     let formatter = new Intl.DateTimeFormat('pt-BR', {
       weekday: 'long',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
         minute: '2-digit',
      })
      return formatter.format(new Date(date))
    },
    icon(type){
      let icon
      switch (type) {
        case 'open-phone':
          icon = 'fas fa-phone-square-alt'
          break;
        case 'open-whatsapp':
          icon = "fab fa-whatsapp-square"
          break;
           case 'open-site':
             icon = 'language'
          break;
           case 'open-facebook':
             icon = 'fab fa-facebook-square'
          break;
           case 'open-instagram':
             icon = 'fab fa-instagram-square'
          break;
           case 'open-mail':
             icon = 'fas fa-envelope-open-text'
          break;
           case 'open-map':
             icon = 'fas fa-map-marked-alt'
          break;
           case 'open-photos':
             icon = 'collections'
          break;
           case 'open':
             icon = 'visibility'
          break;
           case 'share':
             icon = 'share'
          break;
           case 'follow':
             icon = 'login'
          break;

        default:
          icon = 'done'
          break;
      }
      return icon
    },
    color(type){
      let color
      switch (type) {
        case 'open-phone':
          color = 'red-6'
          break;
        case 'open-whatsapp':
          color = "green-6"
          break;
           case 'open-site':
             color = 'blue-4'
          break;
           case 'open-facebook':
             color = 'blue-8'
          break;
           case 'open-instagram':
             color = 'pink-6'
          break;
           case 'open-mail':
             color = 'purple-8'
          break;
           case 'open-map':
             color = 'yellow-8'
          break;
           case 'open-photos':
             color = 'orange-6'
          break;
           case 'open':
             color = 'green-4'
          break;
           case 'share':
             color = 'red-3'
          break;

        default:
          color = 'green-2'
          break;
      }
      return color
    },
     async getData () {     
      this.$api.get(`/categories/ads/${this.$route.params.id}/actions`)
      .then((response) => {
        if(response.data){
         this.actions = response.data.actions.slice().reverse()
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
  async mounted () {
    this.getData()  
  }
});
</script>
<style>

.q-timeline__subtitle {
    font-size: 12px;
    margin-bottom: 8px;
    opacity: .4;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
}


.q-timeline h6 {
    line-height: inherit;
}
.q-timeline__title {
    margin-top: 0;
    margin-bottom: 16px;
}
h6 {
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 2rem;
    letter-spacing: .0125em;
    color: rgb(70, 70, 70);
}
</style>
