<template>
 <lightgallery
    :settings="config"
    :onInit="onInit"
    :onBeforeSlide="onBeforeSlide"
    class="flex"
    :onSlideItemLoad="video"
  >
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
  <div ref="myDiv" v-if="items.length">

      <video ref="video" id="videoId" style="visibility: hidden; z-index:-1" class="
      absolute">
          <source :src="items[0].link" type="video/mp4">
      </video>
      <div class="border-effect relative h-24 m-4 rounded-lg" @click="open()">
        <canvas crossorigin="anonymous" class="h-full w-full absolute rounded-lg" ref="canvas" id="canvas" style="object-fit: cover; object-position: 100% 50%;"></canvas>
        <div class="glass h-full w-full b-0 top-0 left-0 right-0 absolute "></div>
        <div class="h-full w-full b-0 top-0 left-0 right-0 absolute flex items-center justify-center">
          <span class=" text-white font-bold text-3xl" style="text-shadow: 1px 1px 3px #000;">Ver videos
             <!-- <q-icon name="play_arrow"></q-icon> -->
          </span>
        </div>
      </div>
  </div>
<!-- <a href="instagram://story-camera" target="_blank" rel="noopener noreferrer"> teste</a> -->


</template>

<script>
import Lightgallery from 'lightgallery/vue';
import lgVideo from 'lightgallery/plugins/video';
import lgAutoplay from 'lightgallery/plugins/autoplay';

let lightGallery = null;
const  plugins = [lgVideo, lgAutoplay]
export default {
   components:{
    Lightgallery
  },
  data() {
    return {
      img: '',
      items: [],

        // plugins: [lgThumbnail, lgZoom]),
      config: {
        speed: 800,
        plugins: plugins,
        playsinline: true,
        progressBar : true,
        slideShowAutoplay : false,
        autoplayControls: true,
        autoplayVideoOnSlide:true,
        licenseKey: 'C6FC35D1-E1734CCA-B69150EE-25CEB158'
      },
      confirmGallery: false,
      tray: {
        preview: '',
        id:''
      },
      media: [],
      adsComponent: {
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
        },

    };
  },
  watch: {
    items(newVal, oldVal) {
        this.$nextTick(() => {
            lightGallery.refresh();
        });
    },
  },
  methods: {
  async video(e){
    await this.$nextTick()
    await this.$nextTick()
    console.log(e)
    console.log('video')
    const video = document.getElementsByClassName('lg-current')[0].firstChild.firstChild
    console.log(video)
    video.onended = function(e) {
      lightGallery.goToNextSlide();
      /*Do things here!*/
    };
    console.log(video.duration)

  },
  stopVideo(){
    console.log('asas')
    if(document.getElementsByClassName('lg-current')[0]){
      document.getElementsByClassName('lg-current')[0].firstChild.firstChild.pause()
    }
  },
   onInit: (detail) => {
            lightGallery = detail.instance;
        },
  open(){
      lightGallery.openGallery();
},
  onBeforeSlide(){
    console.log('calling before slide');
    this.stopVideo();
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
     console.log(this.$refs.myDiv)
    this.loading = true
    await this.$api.get(`/categories/ads/${this.$route.params.id}?nonDeleted=true`)
     .then((response) => {
        if(response.data){
            if(response.data.deletedAt){
                this.$router.push('/')
            }

            let filtered = response.data
            console.log(filtered.files.gallery )
            filtered.files.gallery = filtered.files.gallery.slice(0).reverse();
            filtered.files.gallery = this.filterDeleted(filtered.files.gallery);
            this.items = filtered.files.gallery


            // this.media = this.media.filter(item => {
            //   return item.link !== null;
            // });
            console.log(this.media)

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
            this.createThumb()

      })

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
</style>
