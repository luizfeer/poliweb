<template>
  <div>
    <div class="bg-white border-b border-gray-200 p-3 mb-3 pt-6">
      <div class="flex flex-nowrap relative">  
      <q-btn @click="setAtt()" v-if="photoUpload" icon="cloud_upload" round class="absolute -top-4 z-10 ml-12"  color="secondary"/>
      <q-btn @click="openFile()" v-else-if="admin" icon="add_a_photo" round class="absolute -top-4 z-10 ml-12"  color="primary"/>    

        <div class="h-20 w-20 min-w-[5rem] rounded-full overflow-hidden relative"
        :class="admin ? 'cursor-pointer': ''"
        @click="openFile">
          <q-img
            v-if="adsComponent.files && adsComponent.files.logo && adsComponent.files.logo.length"
            :src="pathImg()"
            :ratio="1"
            class="h-full w-full"
            spinner-color="white"
            spinner-size="82px"
          />
          <q-avatar v-else rounded class="h-full w-full" :color="colors[Math.floor(Math.random() * colors.length)]" text-color="white">{{ adsComponent.name.split(" ").map((n)=>n[0]).join("").toUpperCase() }}</q-avatar>
          <input type="file" id="file" ref="file" @change="logoUpload()" accept="image/*" class="absolute h-full w-full top-0 right-0 hidden"/>     
        </div>
        <div class="pl-3">
          <h1 class="text-2xl text-gray-700 font-semibold">
           {{ adsComponent.name }}
          </h1>
          <h2 class="text-lg text-gray-500">{{ adsComponent.description }}</h2>
        </div>
      </div>
      <q-space />
      <div class="flex items-center justify-between mt-4">
          <a  @click="sendAction('open-whatsapp')" v-if="phoneZap" :href="`https://api.whatsapp.com/send?phone=+55${phoneZap.phone}&text=Ol%C3%A1!`" target="_blank" rel="noopener noreferrer">
            <q-btn push color="positive" text-color="white">
                <q-icon name="fab fa-whatsapp" class="mr-2" /> Whatsapp
            </q-btn>
          </a>
        <q-btn
          :push="!follow"
          :color="!follow ? 'white' : 'positive'"
          :text-color="follow ? 'white' : 'blue-grey-8'"
          :label="follow ? 'Seguindo' : 'Seguir'"
          @click="follows()"
        />
      </div>
    </div>
    <div class="flex scroll-gallery ">
      <div class="h-[150px] min-w-[80px] bg-gray-100 border ml-3 border-gray-400 rounded-md flex items-center justify-center cursor-pointer" 
      v-if="admin"
      @click="$refs.gallery.click()">
        <q-icon name="add_photo_alternate" class="text-gray-400 text-3xl" />
      </div>
      <vue-picture-swipe 
        class="ml-3"
        v-if="items && items.length"
        @click="openGallery()"
        :items="items"
        :options="{ bgOpacity: 0.75 }"    
      >
      </vue-picture-swipe>
    </div>
    <input type="file" id="gallery" ref="gallery" @change="galleryUpload()" accept="image/*" class="hidden"/>

    <div class="p-3">
      <div class="bg-white border border-gray-200 rounded-md p-3">
        <h1 class="text-xl text-gray-700 font-semibold">Descrição</h1>
        <p class="text-gray-600">
          {{ adsComponent.description }}
        </p>
      </div>
      <div
        v-if="adsComponent.phones && adsComponent.phones.length"
        class="bg-white border border-gray-200 rounded-md p-3 text-lg mt-3"
      >
        <div v-for="(phone, index) in adsComponent.phones" :key="phone.id" v-show="!phone.deletedAt">
            
                <a @click="sendAction(!phone.isWhatsapp ? 'open-phone' : 'open-whatsapp')" :href="!phone.isWhatsapp ? `tel:${phone.phone}` : `https://api.whatsapp.com/send?phone=+55${phone.phone}&text=Ol%C3%A1!`"
                target="_blank" rel="noopener noreferrer"
                class="flex items-start flex-nowrap text-gray-600 flex-col sm:flex-row">
                    <div>
                      <q-icon
                          :name="phone.isWhatsapp ? 'fab fa-whatsapp-square' : 'fas fa-phone-square-alt' "
                          class="mr-2 text-xl"
                          :class="!phone.isWhatsapp ? 'text-red-600' : 'text-green-600'"
                      />
                      {{ this.phone(phone.phone) }}
                    </div>
                    <div class="p-2">
                      <q-btn unelevated color="primary" class="mr-2 py-1 p-x-4" @click.prevent="editPhoneData(phone)" v-if="admin"> <q-icon class="text-sm" name="create"/> </q-btn>
                      <q-btn unelevated color="negative" class="py-1 p-x-4" @click.prevent="deletePhoneData=phone; confirm=true" v-if="admin"> <q-icon class="text-sm" name="delete"/> </q-btn>
                    </div>
                </a>
            <div class="divider border-t border-gray-200 w-full px-5 my-3" v-if="(index+1) < adsComponent.phones.length"></div>    
        </div>
        </div>

      <div class="bg-white border border-gray-200 rounded-md p-3 text-xl mt-3">
        <div v-if="adsComponent.website" class="flex items-center flex-nowrap text-gray-600">
            <a  @click="sendAction('open-site')" :href="`${adsComponent.website}`" target="_blank" rel="noopener noreferrer">
                <q-icon name="language" class="mr-2 text-xl text-blue-400" />
                {{ adsComponent.website }}
            </a>
        </div>

        <div v-if="adsComponent.website && (adsComponent.facebook || adsComponent.instagram || adsComponent.email)" class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div v-if="adsComponent.facebook" class="flex items-center flex-nowrap text-gray-600">
            <a  @click="sendAction('open-facebook')" :href="`${adsComponent.facebook}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fab fa-facebook-square"
                    class="mr-2 text-xl text-blue-800"
                />
                {{ faceId(adsComponent.facebook) }}
            </a>
        </div>
        <div v-if="adsComponent.facebook  && (adsComponent.instagram || adsComponent.email)" class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div v-if="adsComponent.instagram" class="flex items-center flex-nowrap text-gray-600">
            <a  @click="sendAction('open-instagram')" :href="`${adsComponent.instagram}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fab fa-instagram-square"
                    class="mr-2 text-xl text-pink-600"
                />
                {{ instaId(adsComponent.instagram) }}
            </a>
        </div>
        <div v-if="adsComponent.instagram && adsComponent.email" class="divider border-t border-gray-200 w-full px-5 my-3"></div>
        <div v-if="adsComponent.email" class="flex items-center flex-nowrap text-gray-600">
            <a  @click="sendAction('open-mail')" :href="`mailto:${adsComponent.email}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fas fa-envelope-open-text"
                    class="mr-2 text-xl text-purple-800"
                />
                {{ adsComponent.email }}
            </a>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-md p-3 text-xl mt-3 relative" v-if="adsComponent.addresses && adsComponent.addresses.length">
          <a @click="sendAction('open-map')" :href="`http://maps.google.com/maps?q=${adsComponent.name},${lastAddress.street},Nº${lastAddress.number},${lastAddress.city} ${lastAddress.state},${lastAddress.zipCode}`" target="_blank" rel="noopener noreferrer">
            <div
              class="
                flex flex-col
                justify-center
                items-center
                flex-nowrap
                text-gray-600
              "
            >
              <q-icon
                name="fas fa-map-marked-alt"
                class="mr-2 text-3xl text-yellow-500"
              />
              {{ `${lastAddress.street}, nº ${lastAddress.number}. ${lastAddress.city} ${lastAddress.state} - ${lastAddress.zipCode}` }}
            </div>
          </a>
          <q-btn unelevated color="primary" @click.prevent="editAddress = !editAddress" v-if="admin" class="absolute right-0 top-0" icon="create" />
          <q-expansion-item
            v-if="admin"
            v-model="editAddress"
          >
            <add-address :edit="true" :address="lastAddress" :ad-id="adsComponent.id"></add-address>
          </q-expansion-item>
      </div>
      <div v-else-if="admin">            
         <div class="bg-gray-100 rounded-3xl mt-4 overflow-hidden">          
          <q-expansion-item
            v-model="expand.address"
            icon="perm_identity"
            label="Cadastrar endereço"
          >
            <add-address :ad-id="adsComponent.id"></add-address>           
          </q-expansion-item>
          
        </div>
        
      </div>
       <div v-if="admin">            
         <div class="bg-gray-100 rounded-3xl mt-4 overflow-hidden">
            <q-expansion-item
              v-model="expand.action"
              icon="perm_identity"
              label="Acompanhe a interação dos visitantes"
            >
              <q-btn label="Acessar Relatórios" :to="`/actions/${adsComponent.id}`" class="my-4 mx-2" color="primary"/>                   
            </q-expansion-item> 
            <q-expansion-item
              v-model="expand.basic"
              icon="perm_identity"
              label="Editar informações básicas"
            >
              <fix-infos :data="adsComponent"></fix-infos>      
            </q-expansion-item> 
            
            <q-expansion-item
              v-model="expand.phone"
              v-if="editPhone.edit"
              icon="perm_identity"
              label="Editar telefone"
            >
             <q-form
                @submit="newPhone"
                class="p-4"
              >
                <div class="row">      
                  <q-input filled v-model="editPhone.phone" lazy-rules label="Número:" name="phone" class="w-full py-2" />
                </div>
                <div class="row">      
                  <div class="q-gutter-sm">
                      <q-checkbox v-model="editPhone.isWhatsapp" label="É Whatsapp?" />
                    </div>
                </div>
                <q-btn label="Salvar" type="submit" color="primary"/>  <q-btn color="negative" class="ml-4" label="Cancelar edição" @click="resetPhone" />
              </q-form>                   
            </q-expansion-item>
            <q-expansion-item
              v-else
              v-model="expand.phone"
              icon="perm_identity"
              label="Criar novo telefone"
            >
             <q-form
                @submit="newPhone"
                class="p-4"
              >
                <div class="row">      
                  <q-input filled v-model="editPhone.phone" lazy-rules label="Número:" name="phone" class="w-full py-2" />
                </div>
                <div class="row">      
                  <div class="q-gutter-sm">
                      <q-checkbox v-model="editPhone.isWhatsapp" label="É Whatsapp?" />
                    </div>
                </div>  
                <q-btn label="Salvar" type="submit" color="primary"/>   
             </q-form>             
            </q-expansion-item> 
         </div>
       </div>
    </div>
     <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Tem certeza que deseja deletar esse telefone?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Deletar" color="negative" @click="deletePhone()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
      <q-dialog v-model="confirmGallery" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="file_upload" color="primary" text-color="white" />
          <span class="q-ml-sm">Deseja enviar essa imagem?</span>
          <q-img
            :src="preview"
            spinner-color="primary"
            spinner-size="82px"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat @click="sendGallery" label="Enviar" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-page-sticky position="bottom-right" class="" :offset="[18, 18]">
        <q-fab
          icon="add"
          direction="up"
          color="accent"
        >
      
          <q-fab-action @click="share();sendAction('share')" color="primary" icon="share" />
          <q-fab-action @click="map();sendAction('open-map')" color="secondary" icon="travel_explore" />
        </q-fab>
      </q-page-sticky>
  </div>
</template>

<script>
 import VuePictureSwipe from 'vue3-picture-swipe';
import { ref } from "vue";

import AddAddress from 'components/add/Address'
import FixInfos from 'components/FixInfos'

export default {
   components:{  
    AddAddress,
    FixInfos,
    VuePictureSwipe
    // Lightgallery,
  },
  props:{
    dataAds:{
      type: Object,
      required: true
    }
  },
  setup() {
    return {
      headers: ref([
        { name: 'Authorization', value: '' },
        { name: 'Content-Type', value: 'multipart/form-data' }
      ]),
      // plugins: ref([lgThumbnail, lgZoom]),
      colors: ref(['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning']),
      slide: ref(1),
      index: ref([]),
      openGalleryStatus: ref(false),
      adsComponent: ref({
          id: '',
          avatar: '',
          categoryId: '',
          customerId: '',
          description: '',
          email: '',
          facebook: '',
          instagram: '',
          name: '',
          website: '',
          createdAt: '',
          updatedAt: '',
          deletedAt: '',
          phones: [],
          addresses: [],
          files: {
            logo: []
          }          
        }),
      expand: ref({
        action: false,
        basic: false,
        address: false,
        phone: false
      }),
      editAddress: ref(false),
      editPhone: ref({
        phone: '',
        isWhatsapp: false
      }),
      follow: ref(false),
      admin: ref(false),
      confirm: ref(false),
      deletePhoneData: ref({}),
      photoUpload: ref(false),     
      confirmGallery: ref(false),
      preview: ref(''),  
      items: ref(),
    };
  },
  computed: {
    lastAddress(){
      console.log(this.adsComponent.addresses[this.adsComponent.addresses.length-1])
      console.log(this.adsComponent.addresses.length)
      return this.adsComponent.addresses[this.adsComponent.addresses.length-1]
    },
    phoneZap() {
      if(!this.adsComponent.phones.length) return false
        for (let index = 0; index < this.adsComponent.phones.length; index++) {
            const element =  this.adsComponent.phones[index];
            if(element.isWhatsapp)
            {
                return element
            }              
        }
        return false
    }
  },
  methods: {
    openGallery(){
      if(!this.openGalleryStatus){
        this.sendAction('open-photos')
        this.openGalleryStatus = true
      }
    },
     getFollowColor(){
      let follow = localStorage.getItem("follow")    
      if(follow) follow = JSON.parse(follow)  
      if(!follow) follow = []
      const index = follow.findIndex(x => x.id === this.adsComponent.id)
      if(index>-1){
        this.follow = true
        return true
      }
      return false
    },
    saveHistory(){
      this.sendAction('open')
      let history = localStorage.getItem("history")
      if(history) history = JSON.parse(history)      
      if(!history) history = []
      const index = history.findIndex(x => x.id === this.adsComponent.id)
      if(index>-1){
         history.splice(index, 1);
         history.push(this.adsComponent)
      } else if(history && history.length>3){
        history.shift()
        history.push(this.adsComponent)
      } else {
        history.push(this.adsComponent)
      }
      localStorage.setItem("history", JSON.stringify(history))
    },
    follows(){
      this.sendAction('follow')
      let follow = localStorage.getItem("follow")
      if(follow) follow = JSON.parse(follow)     
      if(!follow) follow = []
      const index = follow.findIndex(x => x.id === this.adsComponent.id)
      if(index>-1){
        this.follow = false
         follow.splice(index, 1)
      } else {
        this.follow = true

        follow.push(this.adsComponent)
      }
      localStorage.setItem("follow", JSON.stringify(follow))
    },
    pathImg () {
      let last = this.adsComponent.files.logo.length - 1
      return this.adsComponent.files.logo[last].link
      // this.adsComponent.files.logo[-1 ? ].link
    },
    url(){
      let url = encodeURIComponent(this.adsComponent.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase())
      url = `${this.adsComponent.id}/${url}`
      return url
    },
    map() {
      const url = `http://maps.google.com/maps?q=${this.adsComponent.name},${this.lastAddress.city}`
      this.sendAction('open-map')
      window.open(url, '_blank');
    },
    async share() {     
        const shareData = {
          title: this.adsComponent.name,
          text: this.adsComponent.name,
          url: `https://www.poliwebapp.com.br/${this.url()}`,
        }
        try {
          await navigator.share(shareData)         
        } catch(err) {
          console.logg('Error: ' + err)
        }    
    },
      phone(phone) {
        return phone.replace(/[^0-9]/g, '')
                  .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      },
      faceId(fburl){           
        let cut = fburl.split("/")
        if (cut[3]) {
          return cut[3]
        }else if(cut[2]){
          return cut[2]
        }else {
          return this.adsComponent.name
        }
      },
      instaId(instUrl){        
        instUrl = instUrl.split("?")[0]
        instUrl = instUrl.split("/")[3]
        if(instUrl){
          return "@"+instUrl
        }
        return this.adsComponent.name
      },
      logoUpload () {
        const file = this.$refs.file.files[0];
        this.photoUpload = true
        this.adsComponent.files.logo[this.adsComponent.files.logo.length-1].link = URL.createObjectURL(file);
      },
      galleryUpload () {
        const file = this.$refs.gallery.files[0];
        this.preview = URL.createObjectURL(file);
        this.confirmGallery = true
      },
      openFile () {
        if (!this.admin) return
       this.$refs.file.click()
      },
      editPhoneData(phone){
        this.expand.phone = true; this.editPhone = {...phone, edit: true}; 
      },
      resetPhone () {
        this.editPhone ={
          phone: '',
          isWhatsapp: false
        }
      },
      sendAction(type, subtitle) {
        const uuid = localStorage.getItem('uuid')
        const id = localStorage.getItem('id-user') || null;
        let context = localStorage.getItem('context');        
        context = JSON.parse(context)
        console.log(context)
        const name = context && context.name ? context.name : 'Visitante'        
  
        const payload = {
          type,
          description: name,
          userId: id,
          uuid: uuid
        }
        this.$api.post(`/categories/ads/${this.adsComponent.id}/actions`, payload)
        .then((response) => {
            
        })
        .catch((err) => {
            console.log(err)      
        })
        .finally(() => {       
        })
      },
      deletePhone () {
        this.$q.loading.show()       
        this.$api.delete(`/categories/ads/phones/${this.deletePhoneData.id}`)
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){                 
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Telefone apagado com sucesso!',         
              })
            }
            this.resetPhone()
            this.expand.phone = false
            this.$router.go(0)      
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
      newPhone() {
        this.$q.loading.show()
        let path
        if(this.editPhone.edit){
          path = `/categories/ads/phones/${this.editPhone.id}`
        } else {
          path = `/categories/ads/${this.adsComponent.id}/phones`
        }
        this.$api.post(path, this.editPhone)
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){                 
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Telefone salvo com sucesso!',         
              })
            }
            this.resetPhone()
            this.expand.phone = false
            this.$router.go(0)      
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
      sendGallery () {
        this.$q.loading.show()            
        let data = new FormData();
        data.append('name', 'gallery');
        data.append('file', this.$refs.gallery.files[0]);
        this.$api.post(`/categories/ads/${this.adsComponent.id}/files/gallery`, data , { headers: { 'Content-Type': 'multipart/form-data' }})
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){                 
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Imagem salva com sucesso!',         
              })
            this.$router.go(0)
            }
            // $router.go(0)          
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
      setAtt(){        
        this.$q.loading.show()            
        let data = new FormData();
        data.append('name', 'my-picture');
        data.append('file', this.$refs.file.files[0]);
        this.$api.post(`/categories/ads/${this.adsComponent.id}/files/logo`, data , { headers: { 'Content-Type': 'multipart/form-data' }})
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){                 
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Cadastro salvo com sucesso!',         
              })
            }
            // $router.go(0)          
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
      }
   },
   created () {
     this.adsComponent = { ...this.dataAds}
    console.table(this.adsComponent)

   },
  mounted () {
    // const el = document.getElementById('lightgallery')
    // window.lightGallery(el)
    const token = localStorage.getItem('token')
    if(this.adsComponent.files.gallery){
      this.items = this.adsComponent.files.gallery.map(x=> {
        return {
          src: x.link,
          thumbnail: x.link,
          w: x.width || 800,
          h: x.height || 800
        }
      })
    }
    this.headers[0].value = `Bearer ${token}`
    const admin = localStorage.getItem('admin') ? true : false
    let id = localStorage.getItem('id-customer')
    id = JSON.parse(id)
    this.admin = admin
    if(this.adsComponent.customerId === id){
      this.admin = true
    }
      this.saveHistory()
      this.getFollowColor()
  },
};
</script>
<style>
.scroll-gallery{
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  overflow-scrolling: touch;
  webkit-overflow-scrolling: touch;

}
.scroll-gallery::-webkit-scrollbar-track
{
	-webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.062);
	background-color: #F5F5F5;
}

.scroll-gallery::-webkit-scrollbar
{
	width: 4px;
	height: 4px;
	background-color: #F5F5F5;
}

.scroll-gallery::-webkit-scrollbar-thumb
{
	background-color: #25252523;
}
.my-gallery {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
}

.my-gallery img {
  width: 100%;
  height: auto;
  object-fit: cover;
  min-height: 150px;
  min-width: 150px;
}

.my-gallery figure {
  display: flex;
  margin: 0 !important;
  margin-right: 0.75rem !important;
  width: 150px;
  min-width: 150px;
  height: 150px;
  overflow: hidden;
  border-radius: 0.5rem;
}

.my-gallery figcaption {
  display: none;
}
.pswp img {
    max-width: none;
    object-fit: contain;
}
 @import 'lightgallery/css/lightgallery.css';
  @import 'lightgallery/css/lg-thumbnail.css';
  @import 'lightgallery/css/lg-zoom.css';
</style>
