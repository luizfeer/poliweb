<template>
<div class="w-full px-4 mb-5">
 <lightgallery
    v-if="videos.length > 0"
    :settings="config"
    :onInit="onInit"
    :onAfterSlide="onAfterSlide"
    class="flex"
    :onBeforeOpen="videoEvent"
  >
    <!-- :onSlideItemLoad="videoEvent" -->
    <!-- <a
            v-for="item in items"
            :key="item.id"
            data-lg-size="500-400"
            className="gallery-item"
            :data-src="item.src"
        >
            <img className="img-responsive" :src="item.thumb" />
        </a> -->
    <template
      v-for="(item, index) in items"
      :key="index"
    >
      <a
          v-if="item.fileType==='image/webp'"
          :data-lg-size="`${item.width}-${item.height}`"
          className="gallery-item"
          :data-src="item.link"
        >

      </a>


       <a
        v-else
        class="gallery-item"
        :data-video="JSON.stringify({source: [{src:item.link, type:'video/mp4'}], attributes: {preload: true, autoplay: 'autoplay'}})"
        data-poster=""
      >

    </a>
    </template>
  </lightgallery>
   <div class="h-16 w-full bg-gray-100 border border-gray-400 rounded-md flex items-center justify-center cursor-pointer"
      v-if="admin"
      @click="sendVideo=true">
        <q-icon name="add" class="text-gray-400 text-3xl" /> Adicionar Video
      </div>
  <div ref="myDiv" v-if="items.length">

      <video ref="video" id="videoId" style="visibility: hidden; z-index:-1" class="
      absolute">
          <source :src="items[0].link" type="video/mp4">
      </video>
      <div class="border-effect relative h-24 m-4 rounded-lg cursor-pointer" @click="open()">
        <div class="h-full w-full b-0 top-0 left-0 right-0 absolute z-10 overflow-hidden rounded-lg">
          <q-img :src="thumb" class="h-full w-full absolute rounded-lg" style=" transform: scale(1.5)"></q-img>
          <canvas crossorigin="anonymous" class="h-full w-full absolute rounded-lg" ref="canvas" id="canvas" style="object-fit: cover; object-position: 100% 50%;"></canvas>
          <div class="glass h-full w-full b-0 top-0 left-0 right-0 absolute z-10"></div>
          <div class="h-full w-full b-0 top-0 left-0 right-0 absolute flex items-center justify-center">
            <span class=" text-white font-bold text-3xl z-20" style="text-shadow: 1px 1px 3px #000;">Ver videos
              <!-- <q-icon name="play_arrow"></q-icon> -->
            </span>
          </div>
        </div>
      </div>
  </div>
  <!-- div to buttons navbar -->
  <div id="buttons-video">
    <div class="flex justify-between items-center absolute bottom-0 w-full z-[1999] p-4">
        <q-btn
          @click="stopVideo"
          class="text-white"
          flat
          dense
          color="white"
          :icon="videoPaused ? 'play_circle_filled' : 'pause'"
        ></q-btn>
        <q-btn
          @click="()=>{confirmDelete=true;stopVideo()}"
          class="text-white"
          flat
          dense
          color="white"
          v-if="admin"
          icon="delete"
        ></q-btn>
    </div>
  </div>
<!-- <a href="instagram://story-camera" target="_blank" rel="noopener noreferrer"> teste</a> -->
 <q-dialog v-model="confirmDelete" persistent class="z-[99999]">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Tem certeza que deseja deletar esse Video?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Deletar" color="negative" @click="deleteVideo()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
      <q-dialog v-model="sendVideo" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="file_upload" color="primary" text-color="white" />
          <span class="q-ml-sm">Envie um novo video</span>
          <q-uploader
            ref="uploader"
            :multiple="false"
            class="w-full mt-4"
            :factory="uploadFile"
            label="Escolha um video com até 100mb"
            @rejected="onRejected"
            max-file-size="104857600"
            accept="video/*"
          />
            <!-- @added="added"
            @finish="uploaded"
            @uploaded="uploaded" -->
            <!-- :filter="checkFileSize" -->
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat @click="upload" label="Enviar" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</div>
</template>

<script>
import Lightgallery from 'lightgallery/vue';
import lgVideo from 'lightgallery/plugins/video';


let lightGallery = null;
const  plugins = [lgVideo]
export default {
   components:{
    Lightgallery
  },
  props: {
    videos: {
      type: Array,
      default: ()=> []
    },
    thumb: {
      type: String,
      default: ''
    },
    id: {
      type: Number,
      default: 0
    },
    admin: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
        file_path : null,
      img: '',
      sendVideo: false,
      confirmDelete: false,
      videoPaused: false,
      actualSlide: '',
      items: [],
      config: {
        speed: 800,
        slideShowInterval: 15000,
        plugins: plugins,
        playsinline: true,
        licenseKey: 'C6FC35D1-E1734CCA-B69150EE-25CEB158'
      },
      media: [],

    };
  },
  computed: {
    headers() {
      return this.$api.defaults.headers.common
    },
    baseApi(){
      return this.$api.defaults.baseURL
    }
  },
  watch: {
    items(newVal, oldVal) {
        this.$nextTick(() => {
            lightGallery.refresh();
        });
    },
  },
  methods: {
    upload(e) {
      this.$refs.uploader.upload();
    },
    uploadFile(files) {
      return new Promise((resolve, reject) => {
        const myUploader = this.$refs.uploader
        this.file_path = files[0]
        const fileData = new FormData()

        fileData.append('file_path ', this.file_path)

        //Replace http://localhost:8000 with your API URL
        const uploadFile = this.$api.post(`/categories/ads/${this.id}/files/videos`, fileData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then((response) => {
          console.log(response.data);

        // Notify plugin needs to be installed
        // https://quasar.dev/quasar-plugins/notify#Installation
          this.$q.notify({
            type: 'positive',
            message: `Video enviado com sucesso!`
          })
          this.sendVideo = false
          location.reload()
          myUploader.removeFile(files)
          resolve(files)
        }).catch((error) => {
          this.$q.notify({
            type: 'negative',
            message: `Error Uploaded`
          })
          console.log(error);
          reject(error)
        })
      })
    },
    onRejected (rejectedEntries) {
      console.log(rejectedEntries)
      // Notify plugin needs to be installed
      // https://quasar.dev/quasar-plugins/notify#Installation
      this.$q.notify({
        type: 'negative',
        message: `Erro ao enviar o video`
      })
    },
  deleteVideo() {
    this.confirmDelete = false;
    this.$q.loading.show()
        this.$api.delete(`/categories/ads/files/${this.videos[this.actualSlide].id}`)
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Videeo apagado com sucesso!',
              })
            }
            location.reload()
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
  async videoEvent(e){
    await this.$nextTick()
    await this.$nextTick()
    const toolbar = document.getElementsByClassName('lg-outer')[0]
    const buttons  = document.getElementById('buttons-video')
    toolbar.append(buttons)
    const video = document.getElementsByClassName('lg-current')[0].firstChild.firstChild
    console.log(video)
    console.log('n',lightGallery.slide)
    video.onended = function(e) {
      lightGallery.goToNextSlide();
      /*Do things here!*/
    };
    console.log(video.duration)

  },
  stopVideo(){
    if(document.getElementsByClassName('lg-current')[0]){
      if(this.videoPaused){
        document.getElementsByClassName('lg-current')[0].firstChild.firstChild.play()
        this.videoPaused = false
      } else {
        document.getElementsByClassName('lg-current')[0].firstChild.firstChild.pause()
        this.videoPaused = true
      }
    }
  },
  onInit: (detail) => {
    lightGallery = detail.instance;
  },
  open(){
    lightGallery.openGallery();
  },
  onAfterSlide({index}){
    this.actualSlide = index
    console.log('n', index);
    // this.stopVideo();
  },
    filterDeleted(arr) {
      try {
        return arr.filter(item => {
          return item.deletedAt === null;
        });
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
    formatMedia(media) {
      //format media to lightgallery format
      let newMedia = []
      media.forEach(item => {
        newMedia.push({
          id: item.id,
          size: '800-800',
          src: item.link,
          thumb: item.link,
          subHtml: '',
          fileType: item.fileType

        })
      })
      return newMedia
    },


      async createThumb(){
        await this.$nextTick()
        console.log('a')
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('a')

        const video = this.$refs.video
        const canvas = this.$refs.canvas


        const context = canvas.getContext('2d')
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        console.log(video)
        console.log(canvas)
        console.log(context)
        // const dataURL = canvas2.toDataURL()
        // this.img = dataURL
      }

   },

  async mounted () {
      console.log(this.$api.defaults.headers.common)

      console.log(this.$refs.myDiv)
      this.items = this.videos
      try {

        if(videos.length > 0){
          this.createThumb()
        }
      } catch (error) {

      }



      // video.addEventListener('play', function () {
      //     canvas.style.display = 'none'
      //     // img.style.display = 'none'
      // }, false);

      // video.addEventListener('pause', function () {
      //     canvas.style.display = 'block'
      //     // img.style.display = 'block'
      // }, false)



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
  @import 'lightgallery/css/lightgallery.css';
  @import 'lightgallery/css/lg-thumbnail.css';
  @import 'lightgallery/css/lg-video.css';
  @import 'lightgallery/css/lg-autoplay.css';
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


  .lg-backdrop {
    background-color: #000000d1;
  }
  .border-effect {
	position: relative;

	background: linear-gradient(0deg, #000, #272727);
}

.border-effect:before, .border-effect:after {
  border-radius: .5rem;
	content: '';
	position: absolute;
	left: -2px;
	top: -2px;
	background: linear-gradient(45deg, #fb0094, #0000ff,#ff0000, #fb0094,#ffff00, #fb0094, #0000ff,#ff0000, #fb0094,#ffff00);
  /* background: linear-gradient(45deg, #fb0094, #0000ff, #00ff00,#ffff00, #ff0000, #fb0094,
		#0000ff, #00ff00,#ffff00, #ff0000); */
	background-size: 400%;
	width: calc(100% + 4px);
	height: calc(100% + 4px);
	z-index: -1;
	animation: steam 20s linear infinite;
}

@keyframes steam {
	0% {
		background-position: 0 0;
	}
	50% {
		background-position: 400% 0;
	}
	100% {
		background-position: 0 0;
	}
}

.border-effect:after {
	filter: blur(2px);
}

.border-effect canvas{
	filter: blur(2px);
}

.border-effect:hover .glass{
  display:none;
}
.border-effect:hover .glass{
  display: block;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
}
.lg-video-cont {
  height: 100% !important;
  width: 100% !important;
}
.lg-backdrop {
    background-color: #000000;
}
#buttons-video{
  display: none;
}
.lg-components-open #buttons-video{
  display: block;
}
</style>
