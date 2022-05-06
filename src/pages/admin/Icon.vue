<template>
  <div>
    <div class="bg-white border-b border-gray-200 p-3 mb-3 pt-6">
      <div class="flex flex-nowrap relative">

          <q-btn  @click="confirmUpload=true">Enviar novo icone</q-btn>
          <input type="file" id="file" ref="file" @change="logoUpload()" accept="image/*" class="absolute h-full w-full top-0 right-0 hidden"/>

      </div>
      <q-space />
    </div>

    <div class="flex scroll-gallery-img mt-3 p-1">
      <!-- <div class="h-[150px] min-w-[80px] bg-gray-100 border ml-3 border-gray-400 rounded-md flex items-center justify-center cursor-pointer"
      v-if="admin"
      @click="$refs.gallery.click()">
        <q-icon name="add_photo_alternate" class="text-gray-400 text-3xl" />
      </div> -->
      <template v-if="icons">
      <div
        class="m-1"
        v-for="item in icons"
        :key="item.id"
      >
       <div class="q-gutter-md row items-start">
        <q-img
          :src="item.link"
          class="h-[90px] w-[90px] md:h-[180px] md:w-[180px] "
          fit="cover"
        >
          <div class="absolute-bottom text-subtitle1 text-center flex flex-col">
            <span>
              {{ item.name }}
            </span>
            <q-btn push color="primary" size="xs" label="Apagar" @click="openConfirm(item)"/>
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

    <q-dialog v-model="confirmUpload" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm w-full">Enviar novo icone</span>
          <q-input filled v-model="name" lazy-rules label="Nome do icone" class="w-full py-2" />

          <q-btn  @click="openFile">Escolher foto</q-btn>
          <q-img v-if="newIcon" :src="newIcon" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat @click="sendImg()" label="Enviar" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script>


export default {
   components:{
  },
  data() {
    return {
      newIcon:null,
      name: '',
      confirmUpload: false,
      confirmGallery: false,
      tray: {
        preview: '',
        id:''
      },
      admin: false,
      icons: {
          id: '',
        },

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
      logoUpload () {
        const file = this.$refs.file.files[0];
        // this.photoUpload = true
        this.newIcon = URL.createObjectURL(file);
      },

      openFile () {
        if (!this.admin) return
       this.$refs.file.click()
      },

      deleteImg () {
        this.$q.loading.show()
        this.$api.delete(`/icons/${this.tray.id}`)
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

      sendImg () {
        this.$q.loading.show()
        let data = new FormData();
        data.append('name', this.name);
        data.append('file', this.$refs.file.files[0]);
        this.$api.post(`/icons/${this.name}`, data , { headers: { 'Content-Type': 'multipart/form-data' }})
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
      }
   },
  mounted () {
    this.loading = true
    this.admin = localStorage.getItem('admin') ? true : false

    this.$api.get(`/icons?nonDeleted=true`)
     .then((response) => {
        if(response.data){
            let filtered = response.data.icons
            this.icons =  this.filterDeleted(filtered)
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
        // this.$router.push({ path: '/' })
      })
      .finally(() => {
      })
    // const el = document.getElementById('lightgallery')
    // window.lightGallery(el)
    // const token = localStorage.getItem('token')
    // if(this.icons.files.gallery){
    //   this.items = this.icons.files.gallery.map(x=> {
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
