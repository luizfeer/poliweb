<template>
<div>
    <div class="bg-white border-b border-gray-200 p-3 mb-3 pt-6">
        <div class="flex flex-nowrap relative">
            <!-- <q-btn @click="setAtt()" v-if="photoUpload" icon="cloud_upload" round class="absolute -top-4 z-10 ml-12"  color="secondary"/>
      <q-btn @click="openFile()" v-else-if="admin" icon="add_a_photo" round class="absolute -top-4 z-10 ml-12"  color="primary"/>     -->

            <div class="h-20 w-20 min-w-[5rem] rounded-full overflow-hidden relative" :class="admin ? 'cursor-pointer': ''" @click="openFile">
                <q-img v-if="adsComponent.files && adsComponent.files.logo && (adsComponent.files.logo || {}).length" :src="pathImg()" :ratio="1" class="h-full w-full" spinner-color="white" spinner-size="82px" />
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

        <div class="mt-3 p-1">
            <q-btn color="secondary" push v-if="admin" @click="addProduct()">
                <div class="row items-center no-wrap">
                    <q-icon left name="shopping_basket" />
                    <div class="text-center">
                        Cadastrar novo produto
                    </div>
                </div>
            </q-btn>
            <template v-if="adsComponent.files && adsComponent.files.ecommerceFiltered && adsComponent.files.ecommerceFiltered.length">
                <div class="mb-10 " v-for="category in adsComponent.files.ecommerceFiltered" :key="category">
                    <div class="row">
                        <h1 class="text-h4">{{ category[0].label.category.label }}</h1>

                        <q-btn color="secondary" flat v-if="admin" @click="addCategory(category[0].label.category)">
                            <div class="row items-center no-wrap">
                                <q-icon left name="add_circle" />
                            </div>
                        </q-btn>
                    </div>

                    <div class="q-pa-md row items-start q-gutter-md">
                        <div v-for="item in category" :key="item.id">
                            <!-- <div class="q-gutter-md row items-start">
                          <q-img  class="h-[90px] w-[90px] md:h-[180px] md:w-[180px] " fit="cover">
                              <div class="absolute-bottom text-subtitle1 text-center">
                              </div>
                          </q-img>
                      </div>
                    </div> -->
                            <q-card class="my-card">
                                <q-img :src="item.link"  style="max-height: 150px;" />
                                <q-card-section>
                                    <div class="row no-wrap items-center">
                                        <div class="col text-h6 ellipsis">
                                            <!-- {{ item.label.category.label }} -->
                                            {{ item.title.name }}
                                        </div>
                                    </div>
                                    <!-- <q-rating v-model="stars" :max="5" size="32px" /> -->
                                </q-card-section>
                                <q-card-section class="q-pt-none">
                                    <div class="text-subtitle1">
                                        R$ {{ item.subtitle.value }}
                                    </div>
                                    <div class="text-caption text-grey">
                                        {{ item.title.description }}
                                    </div>
                                </q-card-section>
                                <q-separator />
                                <q-card-actions>
                                    <!-- <q-btn flat round icon="event" />
                        <q-btn flat color="primary">
                          Reserve
                        </q-btn> -->
                                    <q-btn push color="primary" size="xs" label="Apagar" @click="openConfirmDelete(item)" />
                                    <q-btn push color="primary" size="xs" label="Editar" @click="openConfirmEdit(item)" />
                                </q-card-actions>
                            </q-card>
                        </div>
                    </div>

                </div>
            </template>
            <div v-else class="text-center text-gray-600 mt-5 flex items-center">
                <q-icon name="shopping_basket" size="2rem" /><div class="text-lg">Você ainda não cadastrou produtos. Cadastre um novo.</div>

            </div>
            <hr class="my-4">
            <q-btn color="grey-9" outline push @click="backPage()">
                <div class="row items-center no-wrap">
                    <q-icon left name="arrow_back" />
                    <div class="text-center">
                        Voltar
                    </div>
                </div>
            </q-btn>
        </div>
        <input type="file" id="gallery" ref="gallery" @change="galleryUpload()" accept="image/*" class="hidden" />

        <q-dialog v-model="confirmGallery" persistent :maximized="maximizedToggle" transition-show="slide-up" transition-hide="slide-down">
            <q-card class="">
                <q-bar>
                    <q-space />

                    <q-btn dense flat icon="minimize" @click="maximizedToggle = false" :disable="!maximizedToggle">
                        <q-tooltip v-if="maximizedToggle" class="bg-white text-primary">Minimizar</q-tooltip>
                    </q-btn>
                    <q-btn dense flat icon="crop_square" @click="maximizedToggle = true" :disable="maximizedToggle">
                        <q-tooltip v-if="!maximizedToggle" class="bg-white text-primary">Maximizar</q-tooltip>
                    </q-btn>
                    <q-btn dense flat icon="close" v-close-popup>
                        <q-tooltip class="bg-white text-primary">Fechar</q-tooltip>
                    </q-btn>
                </q-bar>

                <q-card-section>
                    <div class="text-h6">Cadastrar novo produto</div>
                </q-card-section>
                <q-card-section class="row items-center">
                    <!-- <q-avatar icon="file_upload" color="primary" text-color="white" /> -->
                    <q-img :src="preview" style="height: 270px; max-width: 400px" spinner-color="primary" spinner-size="82px" />
                </q-card-section>
                <q-form @submit.prevent.stop="sendGallery" div class="px-5">
                  <div class="row">
                        <q-input filled :rules="required" ref="name" v-model="form.title.name" type="text" lazy-rules label="Titulo do produto" class="w-full py-4" />
                    </div>
                    <div class="row">
                        <q-input filled :rules="required" ref="description" v-model="form.title.description" type="text" lazy-rules label="Descrição do produto" class="w-full py-4" />
                    </div>
                    <div class="row">
                        <q-input filled :rules="required" ref="value" v-model="form.subtitle.value" lazy-rules label="Valor do produto" class="w-full py-4" mask="#.##" fill-mask="0" reverse-fill-mask />
                    </div>
                    <div class="row">
                        <q-select v-model="form.label.category" :options="optionsCategory" filled :rules="required" ref="category" lazy-rules label="Categoria" class="w-full py-4" />
                    </div>
                </q-form>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="warning" v-close-popup />
                    <q-btn flat @click="sendGallery" label="Enviar" color="primary" />
                </q-card-actions>
            </q-card>
        </q-dialog>
        <q-dialog v-model="confirmEdit" persistent :maximized="maximizedToggle" transition-show="slide-up" transition-hide="slide-down">
            <q-card class="">
                <q-bar>
                    <q-space />

                    <q-btn dense flat icon="minimize" @click="maximizedToggle = false" :disable="!maximizedToggle">
                        <q-tooltip v-if="maximizedToggle" class="bg-white text-primary">Minimizar</q-tooltip>
                    </q-btn>
                    <q-btn dense flat icon="crop_square" @click="maximizedToggle = true" :disable="maximizedToggle">
                        <q-tooltip v-if="!maximizedToggle" class="bg-white text-primary">Maximizar</q-tooltip>
                    </q-btn>
                    <q-btn dense flat icon="close" v-close-popup>
                        <q-tooltip class="bg-white text-primary">Fechar</q-tooltip>
                    </q-btn>
                </q-bar>

                <q-card-section>
                    <div class="text-h6">Editar produto</div>
                </q-card-section>
                <q-card-section class="row items-center">
                    <!-- <q-avatar icon="file_upload" color="primary" text-color="white" /> -->
                    <q-img :src="edit.preview" style="height: 270px; max-width: 400px" spinner-color="primary" spinner-size="82px" />
                </q-card-section>
                <q-form @submit.prevent.stop="saveProduct" div class="px-5">
                  <div class="row">
                        <q-input filled :rules="required" ref="name" v-model="form.title.name" type="text" lazy-rules label="Titulo do produto" class="w-full py-4" />
                    </div>
                    <div class="row">
                        <q-input filled :rules="required" ref="description" v-model="form.title.description" type="text" lazy-rules label="Descrição do produto" class="w-full py-4" />
                    </div>
                    <div class="row">
                        <q-input filled :rules="required" ref="value" v-model="form.subtitle.value" lazy-rules label="Valor do produto" class="w-full py-4" mask="#.##" fill-mask="0" reverse-fill-mask />
                    </div>
                    <div class="row">
                        <q-select v-model="form.label.category" :options="optionsCategory" filled :rules="required" ref="category" lazy-rules label="Categoria" class="w-full py-4" />
                    </div>
                </q-form>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="warning" v-close-popup />
                    <q-btn flat @click="saveProduct()" label="Salvar" color="primary" />
                </q-card-actions>
            </q-card>
        </q-dialog>
        <q-dialog v-model="confirmDelete" persistent>
            <q-card>
                <q-card-section class="row items-center">
                    <q-avatar icon="delete" color="negative" text-color="white" />
                    <span class="q-ml-sm">Deseja apagar esse produto?</span>
                    <q-img :src="tray.preview" class="mt-4" spinner-color="primary" spinner-size="82px" style="max-height: 300px;" />
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="primary" v-close-popup />
                    <q-btn flat @click="deleteImg()" label="Apagar" color="primary" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
    <q-page-sticky position="bottom-right z-[200]" class="" :offset="[18, 18]">
        <q-fab
          icon="add"
          direction="up"
          color="accent"
        >

          <q-fab-action @click="share();" color="primary" icon="share" />
        </q-fab>
      </q-page-sticky>
</div>
</template>

<script>
import {
    ref
} from "vue";
import {
    categoryes
} from 'src/js/CategoryesEcommerce'

export default {
    components: {},
    setup() {
        return {
            required: [val => !!val || 'Campo obrigatório'],
            confirmDelete: ref(false),
            tray: ref({
                preview: '',
                id: ''
            }),
            rightDrawerOpen: ref(false),
            headers: ref([{
                    name: 'Authorization',
                    value: ''
                },
                {
                    name: 'Content-Type',
                    value: 'multipart/form-data'
                }
            ]),
            // plugins: ref([lgThumbnail, lgZoom]),
            confirmGallery: ref(false),
            edit: ref({
                preview: '',
                id: ''
            }),
            confirmEdit: ref(false),
            preview: ref(''),
            maximizedToggle: ref(true),
            admin: ref(false),
            form: ref({
                title: {},
                subtitle: {},
                label: {},
            }),
            resetForm: ref({
                title: {},
                subtitle: {},
                label: {},
            }),
            optionsCategory: ref(categoryes),
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
                    logo: [],
                    ecommerce: []
                }
            }),

        };
    },
    methods: {
      backPage() {
        this.$router.go(-1)
      },
      async share() {
        const shareData = {
          title: this.adsComponent.name,
          text: 'Confira loja: '+ this.adsComponent.name,
          url: `https://www.poliwebapp.com.br/loja/${this.adsComponent.id}`,
        }
        try {
          await navigator.share(shareData)
        } catch(err) {
          console.logg('Error: ' + err)
        }
    },
        addProduct() {
          this.$refs.gallery.click()
        },
        galleryUpload() {
            const file = this.$refs.gallery.files[0];
            this.preview = URL.createObjectURL(file);
            this.confirmGallery = true
        },
        openFile() {
            if (!this.admin) return
            this.$refs.file.click()
        },

        deleteImg() {
            this.$q.loading.show()
            this.$api.delete(`/categories/ads/files/${this.tray.id}`)
                .then((response) => {
                    //  console.log(response.data.addresses)
                    if (response.data) {
                        this.$q.notify({
                            color: 'secondary',
                            position: 'top',
                            message: 'Produto apagado com sucesso!',
                        })
                    }
                    this.$router.go(0)
                })
                .catch((err) => {
                    let msg
                    if (err.response) {
                        msg = err.response.data.message
                    } else {
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
        sendGallery() {
            this.$refs.name.validate()
            this.$refs.category.validate()
            this.$refs.value.validate()
            this.$refs.description.validate()


            if (this.$refs.name.hasError || this.$refs.category.hasError || this.$refs.value.hasError || this.$refs.description.hasError) {
                $q.notify({
                    color: 'negative',
                    message: 'Você precisa preencher todos os campos!',
                })
                return
            }
            this.$q.loading.show()
            let data = new FormData();
            data.append('file', this.$refs.gallery.files[0]);
            // data.append('name', 'ecommerce');
            const url = new URLSearchParams()
            url.append('title', JSON.stringify(this.form.title));
            url.append('subtitle', JSON.stringify(this.form.subtitle));
            url.append('label', JSON.stringify(this.form.label));
            this.$api.post(`/categories/ads/${this.adsComponent.id}/files/ecommerce?${url.toString()}`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then((response) => {
                    //  console.log(response.data.addresses)
                    if (response.data) {
                        this.$q.notify({
                            color: 'secondary',
                            position: 'top',
                            message: 'Produto salvo com sucesso!',
                        })
                        this.$router.go(0)
                    }
                    // $router.go(0)
                })
                .catch((err) => {
                    let msg
                    if (err.response) {
                        msg = err.response.data.message
                    } else {
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
        saveProduct() {
            this.$refs.name.validate()
            this.$refs.category.validate()
            this.$refs.value.validate()
            this.$refs.description.validate()


            if (this.$refs.name.hasError || this.$refs.category.hasError || this.$refs.value.hasError || this.$refs.description.hasError) {
                $q.notify({
                    color: 'negative',
                    message: 'Você precisa preencher todos os campos!',
                })
                return
            }
            this.$q.loading.show()
            const data = {
                title: JSON.stringify(this.form.title),
                subtitle: JSON.stringify(this.form.subtitle),
                label: JSON.stringify(this.form.label)
            }
            this.$api.post(`/categories/ads/files/${this.edit.id}`, {
                    ...data
                })
                .then((response) => {
                    //  console.log(response.data.addresses)
                    if (response.data) {
                        this.$q.notify({
                            color: 'secondary',
                            position: 'top',
                            message: 'Produto atualziado com sucesso!',
                        })
                        this.$router.go(0)
                    }
                    // $router.go(0)
                })
                .catch((err) => {
                    let msg
                    if (err.response) {
                        msg = err.response.data.message
                    } else {
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
        filterEatchType(arr) {
            if (!arr) return
            let productsFiltered = {}
            try {
                arr.forEach(element => {
                    let label = JSON.parse(element.label)
                    if (label && label.category && label.category.category) {
                        let title = JSON.parse(element.title)
                        let subtitle = JSON.parse(element.subtitle)
                        if (!productsFiltered[label.category.category]) {
                            productsFiltered[label.category.category] = []
                        }
                        productsFiltered[label.category.category].push({
                            ...element,
                            label: label,
                            title: title,
                            subtitle: subtitle,
                        })
                    }
                });
                return productsFiltered

            } catch (error) {
                console.log(error)
                // return arr
            }
        },
        filterDeleted(arr) {
            if (!arr) return
            try {
                return arr.filter((item) => {
                    return !item.deletedAt
                })

            } catch (error) {
                console.log(error)
                return arr
            }
        },
        sortAb(arr) {
            if (!arr) return
            try {
                return arr.sort((b, a) => new Date(a.createdAt) - new Date(b.createdAt));
            } catch (error) {
                console.log(error)
                return arr
            }
        },
        openConfirmDelete(item) {
            this.confirmDelete = true
            this.tray = {
                preview: item.link,
                id: item.id
            }
        },
        openConfirmEdit(item) {
            this.confirmEdit = true
            this.edit = {
                ...item,
                preview: item.link,
            }
            this.form = this.resetForm
            this.form = {
                title: item.title,
                subtitle: item.subtitle,
                label: item.label,
            }
        },
        pathImg() {
            let last = this.adsComponent.files.logo.length - 1
            return this.adsComponent.files.logo[0].link
            // this.adsComponent.files.logo[-1 ? ].link
        },

        logoUpload() {
            const file = this.$refs.file.files[0];
            this.photoUpload = true
            this.adsComponent.files.logo[this.adsComponent.files.logo.length - 1].link = URL.createObjectURL(file);
        },

    },
    created() {
        this.adsComponent = {
            ...this.dataAds
        }
        console.table(this.adsComponent)

    },
    mounted() {
        const admin = localStorage.getItem('admin') ? true : false
        let id = localStorage.getItem('id-customer')
        id = JSON.parse(id)
        this.admin = admin
        if (this.adsComponent.customerId === id) {
            this.admin = true
        }
        this.loading = true
        this.$api.get(`/categories/ads/${this.$route.params.id}?nonDeleted=true`)
            .then((response) => {
                if (response.data) {
                    console.log(response.data)
                    if (response.data.deletedAt) {
                        this.$router.push('/')
                    }

                    let filtered = {
                        files: {
                            ecommerce: []
                        },
                        ...response.data
                    }
                    filtered.files.ecommerce = this.filterDeleted(filtered.files.ecommerce)
                    filtered.files.ecommerce = this.sortAb(filtered.files.ecommerce)
                    filtered.files.ecommerceFiltered = this.filterEatchType(filtered.files.ecommerce)
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
                this.$router.push({
                    path: '/'
                })
            })
            .finally(() => {})
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

<style scoped>
.my-card {
    width: 100%;
    min-width: 280px;
}

.scroll-gallery-img {
    width: 100%;
    display: flex;
    overflow-x: auto;
    overflow-y: scroll;
    overflow-scrolling: touch;
    webkit-overflow-scrolling: touch;

}

.scroll-gallery-img::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.062);
    background-color: #F5F5F5;
}

.scroll-gallery-img::-webkit-scrollbar {
    width: 4px;
    height: 4px;
    background-color: #F5F5F5;
}

.scroll-gallery-img::-webkit-scrollbar-thumb {
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
