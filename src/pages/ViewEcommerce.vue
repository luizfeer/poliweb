<template>
<div class="ecommerce-page">
    <div class="ecommerce-header">
        <div class="ecommerce-header-inner">
            <div class="ecommerce-logo" :class="{ 'cursor-pointer': admin }" @click="admin && $router.push(`/ecommerce/${$route.params.id}`)">
                <q-img v-if="adsComponent.files && adsComponent.files.logo && (adsComponent.files.logo || {}).length" :src="pathImg()" :ratio="1" class="h-full w-full object-cover" spinner-color="gray-300" spinner-size="40px" />
                <q-avatar v-else rounded class="h-full w-full" :color="colors[Math.floor(Math.random() * colors.length)]" text-color="white">{{ (adsComponent.name || '').split(" ").map((n)=>n[0]).join("").toUpperCase().slice(0, 2) }}</q-avatar>
            </div>
            <div class="ecommerce-info">
                <h1 class="ecommerce-name">{{ adsComponent.name }}</h1>
                <p class="ecommerce-desc" v-if="adsComponent.description">{{ adsComponent.description }}</p>
            </div>
        </div>

        <div class="ecommerce-actions">
            <q-btn color="secondary" push v-if="admin" @click="$router.push(`/ecommerce/${$route.params.id}`)" size="sm" class="ecommerce-btn-add">
                <AppIcon name="shopping-basket" :size="18" class="mr-1" />
                Cadastrar produto
            </q-btn>
            <q-btn @click="rightDrawerOpen = !rightDrawerOpen" color="secondary" round dense class="ecommerce-cart-fab" :class="{ 'has-items': queries.cart.length }">
                <AppIcon name="shopping-cart" :size="24" />
                <q-badge v-if="queries.cart.length" color="primary" floating>{{ totalItems }}</q-badge>
            </q-btn>
        </div>
    </div>

    <div class="ecommerce-content">
        <template v-if="(adsComponent.files && adsComponent.files.ecommerceFiltered)">
            <div class="ecommerce-category" v-for="category in adsComponent.files.ecommerceFiltered" :key="category">
                <div class="ecommerce-category-header">
                    <h2 class="ecommerce-category-title">{{ category[0].label.category.label }}</h2>
                    <div class="ecommerce-view-toggle">
                        <button type="button" class="ecommerce-view-btn" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'" title="Cards">
                            <AppIcon name="layout-grid" :size="18" />
                        </button>
                        <button type="button" class="ecommerce-view-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="Lista">
                            <AppIcon name="list" :size="18" />
                        </button>
                        <button type="button" class="ecommerce-view-btn" :class="{ active: viewMode === 'compact' }" @click="viewMode = 'compact'" title="Compacto">
                            <AppIcon name="layout-list" :size="18" />
                        </button>
                    </div>
                </div>
                <div class="ecommerce-grid" :class="'view-' + viewMode">
                    <div class="ecommerce-card" v-for="item in category" :key="item.id">
                        <div class="ecommerce-card-img" @click="openModalImg(item)">
                            <q-img :src="item.link" :ratio="1" class="object-cover" />
                        </div>
                        <div class="ecommerce-card-body">
                            <h3 class="ecommerce-card-title">{{ item.title.name }}</h3>
                            <p class="ecommerce-card-desc" v-if="item.title.description && viewMode !== 'compact'">{{ item.title.description }}</p>
                            <p class="ecommerce-card-price">R$ {{ item.subtitle.value }}</p>
                            <q-btn :color="item.quantityCart > 0 ? 'secondary' : 'primary'" size="sm" unelevated class="ecommerce-card-btn" @click="addToCart(item)">
                                <q-badge v-if="item.quantityCart > 0" color="white" text-color="secondary" floating>{{ item.quantityCart }}</q-badge>
                                <AppIcon name="add-shopping-cart" :size="16" class="mr-1" />
                                {{ viewMode === 'compact' ? '+' : (item.quantityCart > 0 ? 'Adicionar mais' : 'Adicionar') }}
                            </q-btn>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <q-btn color="grey-8" flat @click="backPage()" class="ecommerce-back">
            <AppIcon name="arrow-back" :size="20" class="mr-2" />
            Voltar
        </q-btn>
    </div>
    <q-drawer v-model="rightDrawerOpen" side="right" bordered :width="360" :breakpoint="600" overlay behavior="mobile" class="cart-drawer">
        <div class="cart">
            <div class="cart-header">
                <h2 class="cart-title">Seu carrinho</h2>
                <q-btn flat round dense @click="rightDrawerOpen = false" class="cart-close">
                    <AppIcon name="close" :size="22" />
                </q-btn>
            </div>
            <div v-if="queries.cart.length" class="cart-body">
                <div class="cart-list">
                    <div class="cart-item" v-for="(item, id) in queries.cart" :key="'id-' + id">
                        <q-img class="cart-item-img" :src="item.link" alt="" />
                        <div class="cart-item-info">
                            <h4 class="cart-item-name">{{ item.name }}</h4>
                            <div class="cart-item-row">
                                <div class="cart-qty">
                                    <button type="button" class="cart-qty-btn" @click="sub(item)" :disabled="item.quantity <= 1">
                                        <AppIcon :name="item.quantity <= 1 ? 'close' : 'remove'" :size="14" />
                                    </button>
                                    <input type="number" min="1" v-model.number="item.quantity" class="cart-qty-input" @change="updateQuantity(item)">
                                    <button type="button" class="cart-qty-btn" @click="add(item)">
                                        <AppIcon name="add" :size="14" />
                                    </button>
                                </div>
                                <span class="cart-item-price">{{ RS(item.value * item.quantity) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total</span>
                        <span class="cart-total-value">{{ RS(total) }}</span>
                    </div>
                    <q-btn color="secondary" label="Finalizar pedido" class="cart-checkout" unelevated @click="botaoPedido()" />
                </div>
            </div>
            <div v-else class="cart-empty">
                <AppIcon name="shopping-cart" :size="48" class="text-gray-300 mb-3" />
                <p>Seu carrinho está vazio</p>
                <p class="text-caption text-grey">Adicione produtos para continuar</p>
            </div>
        </div>
    </q-drawer>
    <q-dialog v-model="confirmPedido">
        <q-card>
            <q-card-section>
                <div class="text-h6">Confirmar pedido</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
                Tem certeza que deseja realizar o pedido?
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat label="Não" v-close-popup />
                <a :href="`https://wa.me/55${phoneZap}?text=${pedido}`" target="_blank" class="text-green-700 font-bold p-4">SIM</a>
            </q-card-actions>
        </q-card>
    </q-dialog>
    <div class="ecommerce-spacer"></div>
    <div class="ecommerce-mobile-bar" v-if="queries.cart.length && isMobile">
        <div class="ecommerce-mobile-bar-inner">
            <div class="ecommerce-mobile-total">
                <span class="ecommerce-mobile-items">{{ totalItems }} itens</span>
                <span class="ecommerce-mobile-value">{{ RS(total) }}</span>
            </div>
            <button type="button" class="ecommerce-mobile-btn" @click="rightDrawerOpen = true">Ver carrinho</button>
        </div>
    </div>
</div>
<q-dialog v-model="componentProps.show" class="ecommerce-img-dialog">
    <q-btn @click="componentProps.show = false" class="absolute top-4 right-4 z-10" round dense flat>
      <AppIcon name="close" :size="24" />
    </q-btn>
    <q-card>
        <q-card-section>
            <img :src="componentProps.props.link" style="max-width: 300px;"/>
        </q-card-section>
    </q-card>
</q-dialog>
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
        const colors = ['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning']
        const viewMode = ref('card')
        return {
            db,
            colors,
            viewMode,
            componentProps: ref({
              show:false,
              props:{
                img:''
              }
            }),
            queries: reactive({
                cart: [],
                itemsError: null
            }),
            idAd: ref(''),
            pedido: ref(''),
            confirmPedido: ref(false),
            rightDrawerOpen: ref(false),
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
        },
        totalItems() {
            let total = 0;
            for (let i = 0; i < this.queries.cart.length; i++) {
                total += this.queries.cart[i].quantity;
            }
            return total;
        },
        isMobile() {
            return this.$q.screen.lt.sm;
        },
         phoneZap() {
            if (!this.adsComponent?.phones?.length) return false
            for (let index = 0; index < this.adsComponent.phones.length; index++) {
                const element = this.adsComponent.phones[index];
                if (element.isWhatsapp) {
                    return element.phone.replace(/[^0-9]/g, '')
                }
            }
            return false
        },
    },
    methods: {
       openModalImg(item) {
        this.componentProps.show = true
          this.componentProps.props = item
      },
        backPage() {
            this.$router.go(-1)
        },
        async botaoPedido() {
            this.pedido = await this.geraPedidoWhatsapp()
            this.confirmPedido = true
        },
        async geraPedidoWhatsapp() {
            let pedido = '* 🚨POLIWEB ECOMMERCE*' + '\n';
            let date = new Date();
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            let hour = date.getHours();
            let minutes = date.getMinutes();
            pedido += `Pedido realizado: ${day}/${month}/${year} às ${hour}:${minutes} \n\n`;
            'Olá, gostaria de fazer o seguinte pedido: \n';
            for (let i = 0; i < this.queries.cart.length; i++) {
                pedido += `${this.queries.cart[i].quantity}x ${this.queries.cart[i].name}  - [${this.RS(this.queries.cart[i].quantity*this.queries.cart[i].value)}]\n`;
            }
            pedido += `\n*Total: ${this.RS(this.total)}* \n`;
            console.log(pedido);
            return encodeURIComponent(pedido);
        },
        initialDb() {
            const queryRefs = toRefs(this.queries);
            this.subscription = liveQuery(async () => {
                return db.cart.where({
                    ad: this.idAd
                }).toArray()
            }).subscribe(
                (items) => {
                    queryRefs.cart.value = items;
                    queryRefs.itemsError.value = null;
                },
                (error) => {
                    queryRefs.itemsError.value = error;
                }
            );

        },
        async addToCart(item) {
            item.quantityCart++
            const quantityCount = await db.cart.where({
                ad: this.idAd,
                idProd: item.id
            }).first();
            let quantity = quantityCount ? quantityCount.quantity + 1 : 1;
            db.cart.put({
                ...(quantityCount && {
                    id: quantityCount.id
                }),
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
        RS(value) {
            return value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
        },
        add(item) {
            db.cart.where({
                id: item.id
            }).modify(item => ++item.quantity);
        },
        sub(item) {
            if (item.quantity > 1) {
                db.cart.where({ id: item.id }).modify(i => --i.quantity);
            } else {
                db.cart.where({ id: item.id }).delete();
            }
        },
        updateQuantity(item) {
            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
            item.quantity = qty;
            db.cart.where({ id: item.id }).modify(i => { i.quantity = qty; });
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
                            quantityCart: 0
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
            const logo = this.adsComponent?.files?.logo
            if (!logo?.length) return ''
            return logo[0].link
        }
    },
    created() {
        if (this.dataAds) {
            this.adsComponent = { ...this.dataAds }
        }
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
.ecommerce-page {
  padding-bottom: env(safe-area-inset-bottom);
  min-height: 100vh;
  background: #f9fafb;
}
.ecommerce-header {
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}
.ecommerce-header-inner {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.ecommerce-logo {
  width: 64px;
  height: 64px;
  min-width: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
}
.ecommerce-info {
  flex: 1;
  min-width: 0;
}
.ecommerce-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}
.ecommerce-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ecommerce-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  gap: 0.5rem;
}
.ecommerce-cart-fab {
  position: fixed !important;
  right: 1rem;
  top: 5.5rem;
  z-index: 20;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}
.ecommerce-cart-fab.has-items {
  animation: pulse-badge 2s ease-in-out infinite;
}
@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.ecommerce-content {
  padding: 1rem;
  padding-bottom: 6rem;
}
.ecommerce-category {
  margin-bottom: 1.5rem;
}
.ecommerce-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.ecommerce-category-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  padding-left: 0.25rem;
}
.ecommerce-view-toggle {
  display: flex;
  gap: 0.25rem;
}
.ecommerce-view-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  -webkit-tap-highlight-color: transparent;
}
.ecommerce-view-btn:hover,
.ecommerce-view-btn.active {
  background: #f3f4f6;
  color: #059669;
  border-color: #059669;
}
.ecommerce-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
@media (min-width: 640px) {
  .ecommerce-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
@media (min-width: 1024px) {
  .ecommerce-grid.view-card {
    grid-template-columns: repeat(3, 1fr);
  }
}
/* Lista: layout horizontal */
.ecommerce-grid.view-list {
  grid-template-columns: 1fr;
  gap: 0.5rem;
}
.ecommerce-grid.view-list .ecommerce-card {
  flex-direction: row;
  min-height: 100px;
}
.ecommerce-grid.view-list .ecommerce-card-img {
  width: 100px;
  min-width: 100px;
  aspect-ratio: 1;
  flex-shrink: 0;
}
.ecommerce-grid.view-list .ecommerce-card-body {
  flex: 1;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}
.ecommerce-grid.view-list .ecommerce-card-title {
  flex: 1 1 100%;
  -webkit-line-clamp: 1;
}
.ecommerce-grid.view-list .ecommerce-card-desc {
  display: none;
}
.ecommerce-grid.view-list .ecommerce-card-price {
  margin: 0;
}
.ecommerce-grid.view-list .ecommerce-card-btn {
  margin: 0 0 0 auto;
}
/* Compacto: grid mais denso */
.ecommerce-grid.view-compact {
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}
.ecommerce-grid.view-compact .ecommerce-card-img {
  aspect-ratio: 1;
}
.ecommerce-grid.view-compact .ecommerce-card-body {
  padding: 0.5rem;
  gap: 0.25rem;
}
.ecommerce-grid.view-compact .ecommerce-card-title {
  font-size: 0.8125rem;
  -webkit-line-clamp: 2;
}
.ecommerce-grid.view-compact .ecommerce-card-desc {
  display: none;
}
.ecommerce-grid.view-compact .ecommerce-card-price {
  font-size: 0.875rem;
}
.ecommerce-grid.view-compact .ecommerce-card-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  min-height: 32px;
}
@media (min-width: 640px) {
  .ecommerce-grid.view-compact {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
.ecommerce-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}
.ecommerce-card-img {
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
}
.ecommerce-card-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}
.ecommerce-card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ecommerce-card-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ecommerce-card-price {
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
  margin: 0;
}
.ecommerce-card-btn {
  margin-top: auto;
  font-size: 0.8125rem;
}
.ecommerce-back {
  margin-top: 1rem;
}
.ecommerce-spacer {
  height: 1rem;
}
.ecommerce-mobile-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  padding: 0.75rem 1rem;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  z-index: 100;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
}
.ecommerce-mobile-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 480px;
  margin: 0 auto;
}
.ecommerce-mobile-total {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.ecommerce-mobile-items {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.9);
}
.ecommerce-mobile-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}
.ecommerce-mobile-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #047857;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* Cart drawer */
.cart {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
}
.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.cart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}
.cart-close {
  margin: -0.5rem;
}
.cart-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.cart-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}
.cart-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.cart-item:last-child {
  border-bottom: none;
}
.cart-item-img {
  width: 64px;
  min-width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}
.cart-item-info {
  flex: 1;
  min-width: 0;
}
.cart-item-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cart-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.cart-qty {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.cart-qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  -webkit-tap-highlight-color: transparent;
}
.cart-qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.cart-qty-input {
  width: 40px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
}
.cart-item-price {
  font-weight: 600;
  color: #059669;
  font-size: 0.9375rem;
}
.cart-footer {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}
.cart-total-value {
  font-size: 1.25rem;
  color: #059669;
}
.cart-checkout {
  width: 100%;
  min-height: 48px;
  font-weight: 600;
}
.cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}
</style>
<style>
.ecommerce-img-dialog .q-btn.absolute {
  background: rgba(255,255,255,0.9);
  color: #374151;
}
.ecommerce-img-dialog .q-btn.absolute:hover {
  background: white;
}
</style>
