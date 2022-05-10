<template>

     <Stories :stories="media" />
    <!-- <a
      data-lg-size="1400-1400"
      class="gallery-item"
      data-src="https://images.unsplash.com/photo-1544550285-f813152fb2fd?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80"
      data-sub-html="<h4>Photo by - <a href='https://unsplash.com/@asoshiation' >Shah </a></h4><p> Location - <a href='https://unsplash.com/s/photos/shinimamiya%2C-osaka%2C-japan'>Shinimamiya, Osaka, Japan</a></p>"
    >
      <img
        class="img-responsive"
        src="https://images.unsplash.com/photo-1544550285-f813152fb2fd?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=240&q=80"
      />
    </a>
    <a
      data-lg-size="1400-1400"
      class="gallery-item"
      data-src="https://images.unsplash.com/photo-1584592740039-cddf0671f3d4?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80"
      data-sub-html="<h4>Photo by - <a href='https://unsplash.com/@katherine_xx11' >Katherine Gu </a></h4><p> For all those years we were alone and helpless.</p>"
    >
      <img
        style="width: 200px"
        class="img-responsive"
        src="https://images.unsplash.com/photo-1584592740039-cddf0671f3d4?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=240&q=80"
      />
    </a>
    -->

</template>

<script>
// import { Stories } from "vue-insta-stories";
export default {
   components:{
    // Stories
  },
  data() {
    return {
        // plugins: [lgThumbnail, lgZoom]),
      config: {
        speed: 800,
        playsinline: true,
        progressBar : true,
        slideShowAutoplay : true,
        autoplayControls: true,
        videojs: true,
        autoplayVideoOnSlide:true,
        licenseKey: 'C6FC35D1-E1734CCA-B69150EE-25CEB158'
      },
      confirmGallery: false,
      tray: {
        preview: '',
        id:''
      },
      media:{
        username: "Jessica Valentine",
        picture: "https://randomuser.me/api/portraits/men/61.jpg",
        time: "12h",
        images: []
      }

    };
  },
  watch: {
    media(newVal, oldVal) {
        this.$nextTick(() => {
            lightGallery.refresh();
        });
    },
  },
  methods: {
    filterItems(arr) {
      try {
       let images = []
       arr.forEach(element => {
         let obj
         if(element.fileType === "image/webp") {
           obj =  element.link
         } else {
            obj = {
              url: element.link,
              type: "video"
            }
          }
          images.push(obj)
       });
      console.log(images)
       return images

      } catch (error) {
        console.log(error)
        return arr
      }
    },
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
            console.log(filtered.files.gallery )

            filtered.files.gallery = this.filterDeleted(filtered.files.gallery).slice(0).reverse();
            this.media.images = this.filterItems(filtered.files.gallery)
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
  @import 'lightgallery/css/lg-video.css';
  @import 'lightgallery/css/lg-autoplay.css';

  .lg-backdrop {
    background-color: #000000d1;
  }
</style>
