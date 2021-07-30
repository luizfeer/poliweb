<template>
<div>
    <div class="bg-white border-b border-gray-200 p-3 mb-3">
      <div class="flex flex-nowrap">  
        <div class="h-20 w-20 min-w-[5rem] rounded-full overflow-hidden">

          <!-- <q-img
            v-if="avatar"
            :src="avatar"
            :ratio="1"
            class="h-full w-full"
            spinner-color="white"
            spinner-size="82px"
          /> -->
          <q-avatar rounded class="h-full w-full" :color="colors[Math.floor(Math.random() * colors.length)]" text-color="white">{{ adsComponent.name.split(" ").map((n)=>n[0]).join("").toUpperCase() }}</q-avatar>
        </div>
          <!-- <input type="file" id="file" ref="file" v-on:change="handleFileUpload()"/>     
          <button v-on:click="setAtt()">Enviar</button> -->
           <!-- <q-uploader
              label="Individual upload"
              multiple
              style="max-width: 300px"
            />
          {{ adsComponent.avatar }} -->
        <div class="pl-3">
          <h1 class="text-2xl text-gray-700 font-semibold">
           {{ adsComponent.name }}
          </h1>
          <h2 class="text-lg text-gray-500">{{ adsComponent.description }}</h2>
        </div>
      </div>
      <q-space />
      <div class="flex items-center justify-between mt-4">
          <a v-if="phoneZap" :href="`https://api.whatsapp.com/send?phone=+55${phoneZap.phone}&text=Ol%C3%A1!`" target="_blank" rel="noopener noreferrer">
            <q-btn push color="positive" text-color="white">
                <q-icon name="fab fa-whatsapp" class="mr-2" /> Whatsapp
            </q-btn>
          </a>
        <q-btn
          :push="!follow"
          :color="!follow ? 'white' : 'positive'"
          :text-color="follow ? 'white' : 'blue-grey-8'"
          :label="follow ? 'Seguindo' : 'Seguir'"
          @click="follow = !follow"
        />
      </div>
    </div>
    
    <div class="p-3">
      <div class="bg-white border border-gray-200 rounded-md p-3">
        <h1 class="text-xl text-gray-700 font-semibold">Descrição</h1>
        <p class="text-gray-600">
          {{ adsComponent.description }}
        </p>
      </div>
      <div
        v-if="adsComponent.phones.length"
        class="bg-white border border-gray-200 rounded-md p-3 text-lg mt-3"
      >
        <div v-for="(phone, index) in adsComponent.phones" :key="phone.id" v-show="!phone.deletedAt">
            
                <a  :href="!phone.isWhatsapp ? `tel:${phone.phone}` : `https://api.whatsapp.com/send?phone=+55${phone.phone}&text=Ol%C3%A1!`" target="_blank" rel="noopener noreferrer" class="flex items-center flex-nowrap text-gray-600">
                    <q-icon
                        :name="phone.isWhatsapp ? 'fab fa-whatsapp-square' : 'fas fa-phone-square-alt' "
                        class="mr-2 text-xl"
                        :class="!phone.isWhatsapp ? 'text-red-600' : 'text-green-600'"
                    />
                    {{ this.phone(phone.phone) }}
                    <q-btn unelevated color="primary" class="ml-5 py-1 p-x-4" @click.prevent="editPhoneData(phone)" v-if="admin"> <q-icon class="text-sm" name="create"/> </q-btn>
                    <q-btn unelevated color="negative" class="ml-5 py-1 p-x-4" @click.prevent="deletePhoneData=phone; confirm=true" v-if="admin"> <q-icon class="text-sm" name="delete"/> </q-btn>
                </a>
            <div class="divider border-t border-gray-200 w-full px-5 my-3" v-if="(index+1) < adsComponent.phones.length"></div>    
        </div>
        </div>

      <div class="bg-white border border-gray-200 rounded-md p-3 text-xl mt-3">
        <div v-if="adsComponent.site" class="flex items-center flex-nowrap text-gray-600">
            <a :href="`${adsComponent.site}`" target="_blank" rel="noopener noreferrer">
                <q-icon name="language" class="mr-2 text-xl text-blue-400" />
                {{ adsComponent.site }}
            </a>
        </div>

        <div v-if="adsComponent.site && (adsComponent.facebook || adsComponent.instagram || adsComponent.email)" class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div v-if="adsComponent.facebook" class="flex items-center flex-nowrap text-gray-600">
            <a :href="`${adsComponent.facebook}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fab fa-facebook-square"
                    class="mr-2 text-xl text-blue-800"
                />
                {{ faceId(adsComponent.facebook) }}
            </a>
        </div>
        <div v-if="adsComponent.facebook  && (adsComponent.instagram || adsComponent.email)" class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div v-if="adsComponent.instagram" class="flex items-center flex-nowrap text-gray-600">
            <a :href="`${adsComponent.instagram}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fab fa-instagram-square"
                    class="mr-2 text-xl text-pink-600"
                />
                {{ instaId(adsComponent.instagram) }}
            </a>
        </div>
        <div v-if="adsComponent.instagram && adsComponent.email" class="divider border-t border-gray-200 w-full px-5 my-3"></div>
        <div v-if="adsComponent.email" class="flex items-center flex-nowrap text-gray-600">
            <a :href="`mailto:${adsComponent.email}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fas fa-envelope-open-text"
                    class="mr-2 text-xl text-purple-800"
                />
                {{ adsComponent.email }}
            </a>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-md p-3 text-xl mt-3 relative" v-if="adsComponent.addresses && adsComponent.addresses.length">
          <a :href="`http://maps.google.com/maps?q=${adsComponent.name},${adsComponent.addresses[0].street},Nº${adsComponent.addresses[0].number},${adsComponent.addresses[0].city} ${adsComponent.addresses[0].state},${adsComponent.addresses[0].zipCode}`" target="_blank" rel="noopener noreferrer">
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
              {{ `${adsComponent.addresses[0].street}, nº ${adsComponent.addresses[0].number}. ${adsComponent.addresses[0].city} ${adsComponent.addresses[0].state} - ${adsComponent.addresses[0].zipCode}` }}
            </div>
          </a>
          <q-btn unelevated color="primary" @click.prevent="editAddress = !editAddress" v-if="admin" class="absolute right-0 top-0" icon="create" />
          <q-expansion-item
            v-if="admin"
            v-model="editAddress"
          >
            <add-address :edit="true" :address="adsComponent.addresses[0]" :ad-id="adsComponent.id"></add-address>
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
    <q-page-container>
      <q-page padding>
        <q-page-sticky position="bottom-right" class="" :offset="[18, 18]">
                <q-fab
                  icon="add"
                  direction="up"
                  color="accent"
                >
                  <q-fab-action @click="share()" color="primary" icon="share" />
                  <q-fab-action @click="map()" color="secondary" icon="travel_explore" />
                </q-fab>
          </q-page-sticky>
                       
        </q-page>
      </q-page-container>
    </div>
</template>

<script>
//  import { Options, Vue } from 'vue-class-component';
    // import Lightgallery from 'lightgallery/vue';
    // import lgThumbnail from 'lightgallery/plugins/thumbnail';
    // import lgZoom from 'lightgallery/plugins/zoom';
// import 'lightgallery/dist/css/lightgallery.css'

import { ref } from "vue";
import AddAddress from 'components/add/Address'
import FixInfos from 'components/FixInfos'

export default {
   components:{  
    AddAddress,
    FixInfos    
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
      // plugins: ref([lgThumbnail, lgZoom]),
      colors: ref(['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning']),
      slide: ref(1),
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
          files: []
        }),
      expand: ref({
        basic: false,
        address: false,
        phone: false
      }),
      follow: ref(false),
      editAddress: ref(false),
      editPhone: ref({
        phone: '',
        isWhatsapp: false
      }),
      admin: ref(false),
      items: ref([]),
      confirm: ref(false),
      deletePhoneData: ref({})
      
    //   items: [
    //     {
    //       src: "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    //       thumbnail:
    //   "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    //       w: 634,
    //       h: 951,
    //       alt: "some numbers on a grey background", // optional alt attribute for thumbnail image
    //     },
    //     {
    //       src: "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
    //       thumbnail:
    //  "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
    //       w: 1200,
    //       h: 900,
    //     },
    //     {
    //       src: "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    //       thumbnail:
    //         "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    //       w: 634,
    //       h: 951,
    //       alt: "some numbers on a grey background", // optional alt attribute for thumbnail image
    //     },
    //     {
    //       src: "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
    //       thumbnail:
    //         "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
    //       w: 1200,
    //       h: 900,
    //     },
    //   ],
    };
  },
  computed: {
     modalGallerys () {
      let arr = [];
      this.adsComponent.files.forEach((value, index) => {
        let obj = {
          thumb: value.link,
          src: value.link
        };
        arr.push(obj);
      });
      return arr;
    },
    avatar() {
      return this.adsComponent.files.find( x => x.isThumbnail ).link
    },
    phoneZap() {     
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
    map() {
      const url = `http://maps.google.com/maps?q=${this.adsComponent.name},${this.adsComponent.addresses[0].city}`
      window.open(url, '_blank');
    },
    async share() {     
        const shareData = {
          title: this.adsComponent.name,
          text: this.adsComponent.name,
          url: `https://www.poliewbapp.com.br/`,
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
      handleFileUpload(){
        this.adsComponent.avatar = this.$refs.file.files[0];
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
      setAtt(){
        
        this.$q.loading.show()            
        // let formData = new FormData();
        // formData.append('avatar', this.$refs.file.files[0]);
        // formData.append('name', this.adsComponent.name);
        // formData.append('description', this.adsComponent.description);
        // formData.append('facebook', this.adsComponent.facebook);
        // formData.append('instagram', this.adsComponent.instagram);
        // formData.append('email', this.adsComponent.email);
        // formData.append('website', this.adsComponent.website);
        this.adsComponent.avatar = "https://lh3.googleusercontent.com/tBi5STLJrxCGqCaKuPbZgyAjBpFT3_Gy1r_HWgK3VuHDJMgxIgpyXEEylvsXuDfJLnKNLnqU4bgETdR9ri_aCYC4gfncZ5Wj_Qubv_o9tADDYHjyRkfmjl4nq0l2Uy7E5rEhcleMXbXG1jrPzo38jXJBnlbnW0GyE_LlahiqwnX8eut-z6L-ct-UjqC9ULx9BwhlDGpR0QrOGoMTBexxNFIBS-rI-EmyaQaZ0QZ_ihOmtqhw6E0YY4sJBWN1-AQ475PIrgarWirptXBhHCsMLkDbzkmQpJVmBWvHhUjjnpcixqq7ra1Qnjk9tsLKVeGcLKb7n_E5G-tCpbJOV6Ow9thxlNwcx570rrk3ASKJrcf-vL_8hDxrqbze35E3oQBPvdeMfazlSVff1tUAccKz5XtF3LUXVDwG3qPDUvfVIlTgZ6SpM7kjFwIjI2poL7S-MbWT8xi458a77yXezCB7hwTyLRbvCGXSRiU-d2VXEDD4tw3wgpRTJRqE81c-qrMhX61YlGb-14Rv2V4VDCWxXas8xmy7rIgKS0Q1QbIwFBBtmGOuPLWrhe4C3lNQ6r6V_WXfnXUaw3GnSyaYZ20H4dgokdFyy7fU9le6aRHBVT9dfNg2TxRr8ka0bmz1WiXhA49dTuf6eyRz0vRoGZQrZjEbXShCE6M_pk9ox6vVS6Xeg1b7-rmYxCQQOgE9bn5sTKIAdjmn3grmAb0XD_sh4U-uWg=w437-h969-no?authuser=0"

        this.$api.post(`/categories/ads/${this.adsComponent.id}`, this.adsComponent , { headers: { 'Content-Type': 'multipart/form-data' }})
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
    this.admin = localStorage.getItem('admin') ? true : false    
  },
};
</script>
<style>
.my-gallery {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding-left: 0.75rem;
  overflow-scrolling: touch;
  webkit-overflow-scrolling: touch;
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
 @import 'lightgallery/css/lightgallery.css';
    @import 'lightgallery/css/lg-thumbnail.css';
    @import 'lightgallery/css/lg-zoom.css';
</style>
