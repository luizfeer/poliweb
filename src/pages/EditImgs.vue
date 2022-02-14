<template>
  <div>
    <div class="bg-white border-b border-gray-200 p-3 mb-3 pt-6">
      <div class="flex flex-nowrap relative">  
      <!-- <q-btn @click="setAtt()" v-if="photoUpload" icon="cloud_upload" round class="absolute -top-4 z-10 ml-12"  color="secondary"/>
      <q-btn @click="openFile()" v-else-if="admin" icon="add_a_photo" round class="absolute -top-4 z-10 ml-12"  color="primary"/>     -->

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
          <!-- <q-avatar v-else rounded class="h-full w-full" :color="colors[Math.floor(Math.random() * colors.length)]" text-color="white">{{ adsComponent.name.split(" ").map((n)=>n[0]).join("").toUpperCase() }}</q-avatar>
          <input type="file" id="file" ref="file" @change="logoUpload()" accept="image/*" class="absolute h-full w-full top-0 right-0 hidden"/>      -->
        </div>
        <div class="pl-3">
          <h1 class="text-2xl text-gray-700 font-semibold">
           {{ adsComponent.name }}
          </h1>
          <h2 class="text-lg text-gray-500">{{ adsComponent.description }}</h2>
        </div>
      </div>
      <q-space />
      
    <div class="flex scroll-gallery-img mt-3 p-1">
      <!-- <div class="h-[150px] min-w-[80px] bg-gray-100 border ml-3 border-gray-400 rounded-md flex items-center justify-center cursor-pointer" 
      v-if="admin"
      @click="$refs.gallery.click()">
        <q-icon name="add_photo_alternate" class="text-gray-400 text-3xl" />
      </div> -->
      <template v-if="adsComponent.files && adsComponent.files.gallery">
      <div 
        class="m-1"
        v-for="item in adsComponent.files.gallery"
        :key="item.id"         
      >
       <div class="q-gutter-md row items-start">
        <q-img         
          :src="item.link"
          style="width: 170px; height: 170px;"
          fit="cover"
        >
          <div class="absolute-bottom text-subtitle1 text-center">
            <q-btn push color="primary" label="Apagar" @click="openConfirm(item)"/>
          </div>
        </q-img>
      </div>
    
      </div>
    </template>
    </div>
    <input type="file" id="gallery" ref="gallery" @change="galleryUpload()" accept="image/*" class="hidden"/>

  
      <q-dialog v-model="confirmGallery" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Deseja apagar essa imagem?</span>
          <q-img
            :src="tray.preview"
            class="mt-4"
            spinner-color="primary"
            spinner-size="82px"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat @click="deleteImg()" label="Apagar" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
   
  </div>
  </div>
</template>

<script>

import { ref } from "vue";


export default {
   components:{  
  },
  setup() {
    return {
      headers: ref([
        { name: 'Authorization', value: '' },
        { name: 'Content-Type', value: 'multipart/form-data' }
      ]),
      // plugins: ref([lgThumbnail, lgZoom]),
      confirmGallery: ref(false),
      tray: ref({
        preview: '',
        id:''
      }),
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

    };
  },
  methods: {
       filterDeleted(arr) {
          try {
              return arr.filter((item)=>{ return !item.deletedAt })
              
          } catch (error) {
              console.log(error)
              return arr
          }
      },
    openConfirm(item){
      this.confirmGallery = true
      this.tray = {
        preview: item.link,
        id: item.id
      }
    },
    pathImg () {
      let last = this.adsComponent.files.logo.length - 1
      return this.adsComponent.files.logo[0].link
      // this.adsComponent.files.logo[-1 ? ].link
    },
   
   
      logoUpload () {
        const file = this.$refs.file.files[0];
        this.photoUpload = true
        this.adsComponent.files.logo[this.adsComponent.files.logo.length-1].link = URL.createObjectURL(file);
      },
     
      openFile () {
        if (!this.admin) return
       this.$refs.file.click()
      },
     
      deleteImg () {
        this.$q.loading.show()       
        this.$api.delete(`/categories/ads/files/${this.tray.id}`)
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){                 
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Imagem apagada com sucesso!',         
              })
            }            
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
        // data.append('file', this.$refs.gallery.files[0]);
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
    this.loading = true
    this.$api.get(`/categories/ads/${this.$route.params.id}?nonDeleted=true`)
     .then((response) => {
        if(response.data){
            if(response.data.deletedAt){
                this.$router.push('/')
            }
            
            let filtered = response.data
            console.log(filtered)

            filtered.files.gallery = this.filterDeleted(filtered.files.gallery).slice(0).reverse();
            filtered.phones =  this.filterDeleted(filtered.phones)
            filtered.address =  this.filterDeleted(filtered.address)
            this.adsComponent = filtered
            console.log(filtered)

            this.loading = false

            
        }
      })
      .catch((err) => {
          console.log(err)
        let msg = 'Erro na conexão!'        
        this.$q.notify({
            color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
        this.$router.push({ path: '/' })          
      })
      .finally(() => {
      })
    // const el = document.getElementById('lightgallery')
    // window.lightGallery(el)
    // const token = localStorage.getItem('token')
    // if(this.adsComponent.files.gallery){
    //   this.items = this.adsComponent.files.gallery.map(x=> {
    //     return {
    //       src: x.link,
    //       thumbnail: x.link,
    //       w: x.width || 800,
    //       h: x.height || 800
    //     }
    //   })
    // }
    // this.headers[0].value = `Bearer ${token}`
   

      
  },
};
</script>
<style>
.scroll-gallery-img{
  width: 100%;
  display: flex;
  overflow-x: auto;
  overflow-y: scroll;
  overflow-scrolling: touch;
  webkit-overflow-scrolling: touch;

}
.scroll-gallery-img::-webkit-scrollbar-track
{
	-webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.062);
	background-color: #F5F5F5;
}

.scroll-gallery-img::-webkit-scrollbar
{
	width: 4px;
	height: 4px;
	background-color: #F5F5F5;
}

.scroll-gallery-img::-webkit-scrollbar-thumb
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
