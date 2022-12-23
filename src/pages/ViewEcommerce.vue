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

            <template v-if="(adsComponent.files && adsComponent.files.ecommerceFiltered)">
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
                                <q-img :src="item.link" />
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
                                    <q-btn push color="primary" size="xs" label="Adicionar ao carrinho" @click="addToCart(item)" />
                                </q-card-actions>
                            </q-card>
                        </div>
                    </div>

                </div>
            </template>
        </div>

    </div>
    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered>
        <div class="col-dx">
            <div class="cart ">
                <h2 class="text-h5 p-2 md:p-4">Seu carrinho</h2>
                <div class="cart-list" v-if="queries.cart.length">
                    <div class="cart-item w-full produto" v-for="(item, id) in queries.cart" :key="'id-' + id">
                        <div class="row w-full p-2 md:p-4">
                            <q-img class="col" spinner-color="black" style="height: 60px; max-width: 90px" :src="item.link" alt="" />

                            <div class="col row">
                                <h4 class="title col-12 text-no-wrap">{{ item.name }}</h4>
                                <div class="row w-full">
                                    <div class="col-8">
                                        <div class="quantity row items-end">
                                            <div class="h-5 w-5 items-center justify-center flex bg-gray-500 rounded-full font-extrabold cursor-pointer" @click="sub(item)">
                                                <q-icon :name="item.quantity<2 ? 'close' :'remove'" size="sm" color="white" style="font-size: 10px;" />
                                            </div>
                                            <input type="text" @keypress="isNumber($event)" v-model.number="item.quantity" class="w-10 border-2 text-center border-gray-400 rounded-md mx-1" @input="calcItem(item)">
                                            <div class="h-5 w-5 items-center justify-center flex bg-gray-500 rounded-full font-extrabold cursor-pointer" @click="add(item)">
                                                <q-icon name="add" size="sm" color="white" style="font-size: 10px;" />
                                            </div>
                                        </div>
                                    </div>
                                    <div class=" col-4 price text-left text-bold italic text-green-900">{{ RS(item.value) }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- <div>
                            <div class="total">{{ item.subtitle.value * item.quantity }}</div> -->
                        <!-- </div> -->
                    </div>

                    <div class="text-lg text-right w-full text-gray-700">
                        <span class="total-title ">Total </span>
                        <span class="font-bold">{{ RS(total) }}</span>
                    </div>
                </div>
                <div class="empty-contents px-4" v-else>
                    <p class="italic text-gray-700">Seu carrinho ainda está vazio</p>
                </div>
            </div>
        </div>
        <!-- drawer content -->
    </q-drawer>
</div>
</template>

<script>
import {
    reactive,
    toRefs,
    ref
} from "vue";
import {
    categoryes
} from 'src/js/CategoryesEcommerce'
import {
    db
} from '../db/db';
import {
    liveQuery
} from "dexie";
export default {
    components: {},
    setup() {
        return {
            db,
            queries: reactive({
                cart: [],
                itemsError: null
            }),
            idAd: ref(''),
            rightDrawerOpen: ref(true),
            preview: ref(''),
            maximizedToggle: ref(true),
            admin: ref(false),
            cart: ref([]),
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
        total() {
            let total = 0;
            for (let i = 0; i < this.queries.cart.length; i++) {
                total += this.queries.cart[i].value * this.queries.cart[i].quantity;
            }
            return total;
        }
    },
    methods: {
        initialDb() {
            const queryRefs = toRefs(this.queries);
            this.subscription = liveQuery( async () => {
                return db.cart.where({ad: this.idAd}).toArray()
            }).subscribe(
                (items) => {
                    console.log('aa', items)
                    // Success result:
                    queryRefs.cart.value = items;
                    queryRefs.itemsError.value = null;
                },
                (error) => {
                    queryRefs.itemsError.value = error;
                }
            );

        },
       async addToCart(item) {
          const quantityCount = await db.cart.where({ad: this.idAd, idProd: item.id}).first();
          let quantity = quantityCount ? quantityCount.quantity+1 : 1;
            db.cart.put({
               ...(quantityCount && {id: quantityCount.id}),
               ad: item.categoryAdId,
               link: item.link,
               label: item.label.category.label,
               category: item.label.category.category,
               value: item.subtitle.value,
               name: item.title.name,
               idProd: item.id,
               quantity: quantity
            })
        },
        isNumber(evt) {
            evt = (evt) ? evt : window.event;
            var charCode = (evt.which) ? evt.which : evt.keyCode;
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                evt.preventDefault();
            } else {
                return true;
            }
        },
        RS(value) {
            return value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
        },
        add(item) {
            db.cart.where({id: item.id}).modify(item => ++item.quantity);
        },
        sub(item) {

            if (item.quantity > 1) {
              db.cart.where({id: item.id}).modify(item => --item.quantity);

            } else {
              db.cart.where({id: item.id}).delete()
            }
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

        pathImg() {
            let last = this.adsComponent.files.logo.length - 1
            return this.adsComponent.files.logo[0].link
            // this.adsComponent.files.logo[-1 ? ].link
        }
    },
    created() {
        this.adsComponent = {
            ...this.dataAds
        }
        console.table(this.adsComponent)

    },
    mounted() {
        // On mount, subscribe to your query:
        this.idAd = parseFloat(this.$route.params.id)
        this.initialDb()
        const admin = localStorage.getItem('admin') ? true : false
        let id = localStorage.getItem('id-customer')
        id = JSON.parse(id)
        this.admin = admin
        if (this.adsComponent.customerId === id) {
            this.admin = true
        }
        this.loading = true
        this.$api.get(`/categories/ads/${this.idAd}?nonDeleted=true`)
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
    unmounted() {
        // Stop subscribing:
        this.subscription.unsubscribe();
    },
};
</script>

<style scoped>
.produto:nth-child(even) {
    background: #eee;
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
