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
          <!-- div if phoneZap is false msg: "Não há telefone cadastrado, cadastre um" -->

          <div v-if="!phoneZap && !loading" class="text-center text-red-900 mt-5 m-4 p-4 border-red-500 border rounded-md row items-center">
            <div class="col-3">
              <AppIcon name="phone" :size="80" />
            </div>
            <div class="col text-left">
              <div class="text-base font-bold mb-2">Não há telefone com whatsapp cadastrado, cadastre um para receber os pedidos em seu número.</div>
              <div class="text-sm">Você só poderá ter um ecommerce se tiver um número com whatsapp cadastrado!</div>
              <div class="text-sm">Volte e edite seu perfil com um novo numero whatsapp!</div>
            </div>
          </div>

            <q-btn color="secondary" push v-if="admin && phoneZap" @click="addProduct()">
                <div class="row items-center no-wrap">
                    <AppIcon name="shopping-basket" :size="20" class="mr-2" />
                    <div class="text-center">
                        Cadastrar novo produto
                    </div>
                </div>
            </q-btn>
            <template v-if="adsComponent.files && adsComponent.files.ecommerceFiltered && (Object.keys(adsComponent.files.ecommerceFiltered).length)">
                <div class="admin-ecommerce-category" v-for="category in adsComponent.files.ecommerceFiltered" :key="category">
                    <div class="admin-ecommerce-category-header">
                        <h2 class="admin-ecommerce-category-title">{{ category[0].label.category.label }}</h2>

                        <button type="button" class="admin-ecommerce-add-category" v-if="admin" @click="addCategory(category[0].label.category)">
                            <AppIcon name="add-circle" :size="18" />
                        </button>
                    </div>

                    <div class="admin-ecommerce-grid">
                        <article class="admin-ecommerce-card" v-for="item in category" :key="item.id">
                            <div class="admin-ecommerce-card-img">
                                <q-img :src="item.link" :ratio="1" fit="cover" />
                            </div>
                            <div class="admin-ecommerce-card-body">
                                <h3 class="admin-ecommerce-card-title">{{ item.title.name }}</h3>
                                <div class="admin-ecommerce-card-desc" v-if="item.title.description" v-html="safeHtml(item.title.description)"></div>
                                <div class="admin-ecommerce-card-footer">
                                    <p class="admin-ecommerce-card-price">R$ {{ item.subtitle.value }}</p>
                                    <div class="admin-ecommerce-card-actions">
                                        <button type="button" class="admin-ecommerce-icon-btn danger" title="Apagar" @click="openConfirmDelete(item)">
                                            <AppIcon name="delete" :size="18" />
                                        </button>
                                        <button type="button" class="admin-ecommerce-icon-btn" title="Editar" @click="openConfirmEdit(item)">
                                            <AppIcon name="edit" :size="18" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                </div>
            </template>
            <div v-else class="text-center text-gray-600 mt-5 flex  m-4 p-4 border-gray-500 border rounded-md row items-center">
                <AppIcon name="shopping-basket" :size="32" />
                <div class="text-lg">Você ainda não tem produtos cadastrados. Toque em "Cadastrar novo produto" para começar.</div>

            </div>
            <hr class="my-4">
            <q-btn color="grey-9" outline push @click="backPage()">
                <div class="row items-center no-wrap">
                    <AppIcon name="arrow-back" :size="20" class="mr-2" />
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

                    <q-btn dense flat @click="maximizedToggle = false" :disable="!maximizedToggle">
                        <template #icon><AppIcon name="minimize" :size="20" /></template>
                        <q-tooltip v-if="maximizedToggle" class="bg-white text-primary">Minimizar</q-tooltip>
                    </q-btn>
                    <q-btn dense flat @click="maximizedToggle = true" :disable="maximizedToggle">
                        <template #icon><AppIcon name="maximize" :size="20" /></template>
                        <q-tooltip v-if="!maximizedToggle" class="bg-white text-primary">Maximizar</q-tooltip>
                    </q-btn>
                    <q-btn dense flat v-close-popup>
                        <template #icon><AppIcon name="close" :size="20" /></template>
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
                    <div class="row product-description-editor-wrap">
                        <label class="product-description-label">Descrição do produto</label>
                        <q-editor
                          v-model="form.title.description"
                          min-height="8rem"
                          placeholder="Escreva a descrição do produto..."
                          :toolbar="editorToolbar"
                          class="w-full product-description-editor"
                          :class="{ 'product-description-editor-error': descriptionError }"
                          @update:model-value="descriptionError = false"
                        />
                        <div v-if="descriptionError" class="product-description-error">Campo obrigatório</div>
                    </div>
                    <div class="row">
                        <q-input filled :rules="required" ref="value" v-model="form.subtitle.value" lazy-rules label="Valor do produto" class="w-full py-4" mask="#.##" fill-mask="0" reverse-fill-mask />
                    </div>
                    <div class="row">
                        <q-select v-model="form.label.category" :options="optionsCategory" filled :rules="required" ref="category" lazy-rules label="Categoria" class="w-full py-4" />
                    </div>
                </q-form>

                <q-card-actions align="right" class="product-dialog-actions">
                    <q-btn outline label="Cancelar" color="warning" v-close-popup />
                    <q-btn unelevated @click="sendGallery" label="Enviar" color="primary" />
                </q-card-actions>
            </q-card>
        </q-dialog>
        <q-dialog v-model="confirmEdit" persistent :maximized="maximizedToggle" transition-show="slide-up" transition-hide="slide-down">
            <q-card class="">
                <q-bar>
                    <q-space />

                    <q-btn dense flat @click="maximizedToggle = false" :disable="!maximizedToggle">
                        <template #icon><AppIcon name="minimize" :size="20" /></template>
                        <q-tooltip v-if="maximizedToggle" class="bg-white text-primary">Minimizar</q-tooltip>
                    </q-btn>
                    <q-btn dense flat @click="maximizedToggle = true" :disable="maximizedToggle">
                        <template #icon><AppIcon name="maximize" :size="20" /></template>
                        <q-tooltip v-if="!maximizedToggle" class="bg-white text-primary">Maximizar</q-tooltip>
                    </q-btn>
                    <q-btn dense flat v-close-popup>
                        <template #icon><AppIcon name="close" :size="20" /></template>
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
                    <div class="row product-description-editor-wrap">
                        <label class="product-description-label">Descrição do produto</label>
                        <q-editor
                          v-model="form.title.description"
                          min-height="8rem"
                          placeholder="Escreva a descrição do produto..."
                          :toolbar="editorToolbar"
                          class="w-full product-description-editor"
                          :class="{ 'product-description-editor-error': descriptionError }"
                          @update:model-value="descriptionError = false"
                        />
                        <div v-if="descriptionError" class="product-description-error">Campo obrigatório</div>
                    </div>
                    <div class="row">
                        <q-input filled :rules="required" ref="value" v-model="form.subtitle.value" lazy-rules label="Valor do produto" class="w-full py-4" mask="#.##" fill-mask="0" reverse-fill-mask />
                    </div>
                    <div class="row">
                        <q-select v-model="form.label.category" :options="optionsCategory" filled :rules="required" ref="category" lazy-rules label="Categoria" class="w-full py-4" />
                    </div>
                </q-form>

                <q-card-actions align="right" class="product-dialog-actions">
                    <q-btn outline label="Cancelar" color="warning" v-close-popup />
                    <q-btn unelevated @click="saveProduct()" label="Salvar" color="primary" />
                </q-card-actions>
            </q-card>
        </q-dialog>
        <q-dialog v-model="confirmDelete" persistent>
            <q-card>
                <q-card-section class="row items-center">
                    <q-avatar color="negative" text-color="white"><template #icon><AppIcon name="delete" :size="24" /></template></q-avatar>
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
        <q-fab icon="add" direction="up" color="accent">

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
} from 'src/js/CategoryesEcommerceNew'

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
            loading: ref(true),
            confirmEdit: ref(false),
            descriptionError: ref(false),
            editorToolbar: ref([
                ['bold', 'italic', 'underline'],
                ['unordered', 'ordered'],
                ['link'],
                ['undo', 'redo']
            ]),
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
    computed: {
        phoneZap() {
            if (!(this.adsComponent.phones||{}).length) return false
            for (let index = 0; index < this.adsComponent.phones.length; index++) {
                const element = this.adsComponent.phones[index];
                if (element.isWhatsapp && !element.deletedAt) {
                    return element
                }
            }
            return false
        },
    },
    methods: {
        backPage() {
            this.$router.go(-1)
        },
        async share() {
            const shareData = {
                title: this.adsComponent.name,
                text: 'Confira loja: ' + this.adsComponent.name,
                url: `https://www.poliwebapp.com.br/loja/${this.adsComponent.id}`,
            }
            try {
                await navigator.share(shareData)
            } catch (err) {
                console.logg('Error: ' + err)
            }
        },
        addProduct() {
            this.$refs.gallery.click()
        },
        galleryUpload() {
            const file = this.$refs.gallery.files[0];
            this.preview = URL.createObjectURL(file);
            this.descriptionError = false
            this.confirmGallery = true
        },
        openFile() {
            if (!this.admin) return
            this.$refs.file.click()
        },
        hasDescription() {
            const value = String(this.form.title?.description || '')
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim()
            this.descriptionError = !value
            return !this.descriptionError
        },
        safeHtml(value) {
            return String(value || '')
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/\son\w+="[^"]*"/gi, '')
                .replace(/\son\w+='[^']*'/gi, '')
                .replace(/\sjavascript:/gi, '')
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
            const descriptionValid = this.hasDescription()

            if (this.$refs.name.hasError || this.$refs.category.hasError || this.$refs.value.hasError || !descriptionValid) {
                this.$q.notify({
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
            const descriptionValid = this.hasDescription()

            if (this.$refs.name.hasError || this.$refs.category.hasError || this.$refs.value.hasError || !descriptionValid) {
                this.$q.notify({
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
            this.descriptionError = false
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
    async mounted() {
      const admin = await localStorage.getItem('admin') ? true : false
        let id = await localStorage.getItem('id-customer')
        id = JSON.parse(id)
        this.admin = admin

        this.loading = true
        await this.$api.get(`/categories/ads/${this.$route.params.id}?nonDeleted=true`)
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
                    filtered.phones = this.filterDeleted(filtered.phones)
                    filtered.files.logo = this.filterDeleted(filtered.files.logo)
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

        if (this.adsComponent.customerId === id) {
            this.admin = true
        }
        console.log(this.adsComponent, id, this.admin)
        if (!this.admin) {
            this.$router.push(`/${this.$route.params.id}`)
        }

    },
};
</script>

<style scoped>
.product-dialog-actions {
    gap: 0.5rem;
    padding: 1rem 1.25rem 1.25rem;
}

.product-dialog-actions :deep(.q-btn) {
    min-width: 104px;
    font-weight: 700;
}

.product-description-editor-wrap {
    display: block;
    width: 100%;
    padding: 1rem 0;
}

.product-description-label {
    display: block;
    margin-bottom: 0.45rem;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 700;
}

.product-description-editor {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    overflow: hidden;
}

.product-description-editor-error {
    border-color: #c10015;
}

.product-description-error {
    margin-top: 0.35rem;
    color: #c10015;
    font-size: 0.75rem;
}

.admin-ecommerce-category {
    margin-bottom: 2.5rem;
}

.admin-ecommerce-category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.admin-ecommerce-category-title {
    margin: 0;
    color: #1f2937;
    font-size: 1.15rem;
    line-height: 1.25;
    font-weight: 800;
}

.admin-ecommerce-add-category {
    width: 36px;
    height: 36px;
    border: 1px solid #d1fae5;
    border-radius: 999px;
    background: #ecfdf5;
    color: #059669;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.admin-ecommerce-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.9rem;
}

@media (min-width: 640px) {
    .admin-ecommerce-grid {
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    }
}

.admin-ecommerce-card {
    overflow: hidden;
    border-radius: 8px;
    background: white;
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.admin-ecommerce-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10), 0 2px 8px rgba(15, 23, 42, 0.05);
}

.admin-ecommerce-card-img {
    aspect-ratio: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
}

.admin-ecommerce-card-img :deep(.q-img__content),
.admin-ecommerce-card-img :deep(img) {
    object-fit: cover !important;
    object-position: center;
}

.admin-ecommerce-card-body {
    padding: 0.75rem;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.5rem;
}

.admin-ecommerce-card-title {
    color: #374151;
    font-size: 0.95rem;
    line-height: 1.25;
    font-weight: 700;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.admin-ecommerce-card-desc {
    color: #6b7280;
    font-size: 0.78rem;
    line-height: 1.35;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.admin-ecommerce-card-desc :deep(p),
.admin-ecommerce-card-desc :deep(ul),
.admin-ecommerce-card-desc :deep(ol) {
    margin: 0;
}

.admin-ecommerce-card-footer {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.admin-ecommerce-card-price {
    color: #059669;
    font-size: 1rem;
    line-height: 1.2;
    font-weight: 800;
    margin: 0;
}

.admin-ecommerce-card-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.admin-ecommerce-icon-btn {
    width: 34px;
    height: 34px;
    border: 1px solid #d1fae5;
    border-radius: 999px;
    background: #ecfdf5;
    color: #059669;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.admin-ecommerce-icon-btn:hover {
    background: #059669;
    border-color: #059669;
    color: white;
}

.admin-ecommerce-icon-btn.danger {
    border-color: #fee2e2;
    background: #fef2f2;
    color: #dc2626;
}

.admin-ecommerce-icon-btn.danger:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
}

.admin-ecommerce-icon-btn:active {
    transform: scale(0.94);
}

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
