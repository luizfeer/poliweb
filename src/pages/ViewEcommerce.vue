<template>
<div class="ecommerce-page">
    <div class="ecommerce-header ecommerce-header-glass">
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

        <div class="ecommerce-actions-bar">
            <button type="button" class="ecommerce-action-btn" @click="copyLink" title="Copiar link">
                <AppIcon name="link" :size="22" />
                <span>Copiar link</span>
            </button>
            <button type="button" class="ecommerce-action-btn" @click="shareStore" title="Compartilhar">
                <AppIcon name="share" :size="22" />
                <span>Compartilhar</span>
            </button>
            <button type="button" class="ecommerce-action-btn ecommerce-action-whatsapp" :class="{ disabled: !phoneZap }" @click="openWhatsappChooser" title="Enviar no WhatsApp">
                <AppIcon name="whatsapp" :size="22" />
                <span>WhatsApp</span>
            </button>
        </div>

        <div class="ecommerce-shop-tools" v-if="totalProducts && !selectedProduct">
            <div class="ecommerce-shop-summary">
                <span>{{ totalProducts }} produtos</span>
                <span>{{ ecommerceCategories.length }} categorias</span>
            </div>
            <label class="ecommerce-search">
                <AppIcon name="search" :size="18" class="text-gray-400" />
                <input v-model="productSearch" type="search" placeholder="Buscar produto" />
            </label>
            <div class="ecommerce-category-tabs" v-if="ecommerceCategories.length > 1">
                <button type="button" class="ecommerce-category-tab" :class="{ active: !selectedCategory }" @click="setSelectedCategory('')">
                    Todos
                </button>
                <button
                  v-for="category in ecommerceCategories"
                  :key="category.key"
                  type="button"
                  class="ecommerce-category-tab"
                  :class="{ active: selectedCategory === category.key }"
                  @click="setSelectedCategory(category.key)"
                >
                    {{ category.label }}
                </button>
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

    <q-dialog v-model="whatsappChooser" persistent class="wa-dialog-centered">
        <q-card class="wa-choice-card">
            <q-card-section class="wa-choice-header">
                <div class="wa-choice-icon">
                    <AppIcon name="whatsapp" :size="24" class="text-white" />
                </div>
                <h3 class="wa-choice-title">O que deseja fazer?</h3>
                <p class="wa-choice-subtitle">Escolha como deseja usar o WhatsApp.</p>
            </q-card-section>
            <q-card-section class="q-pt-none">
                <div class="wa-choice-actions">
                    <button type="button" class="admin-row-btn" @click="shareToWhatsappFriend">
                        <div class="arb-icon" style="background: linear-gradient(135deg,#25d366,#128c7e)">
                            <AppIcon name="share" :size="18" class="text-white" />
                        </div>
                        <div class="arb-info">
                            <span class="arb-label">Compartilhar com um amigo</span>
                            <span class="arb-sub">Envie o link da loja pelo WhatsApp</span>
                        </div>
                        <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
                    </button>
                    <button v-if="phoneZap" type="button" class="admin-row-btn" @click="openWhatsappCompany">
                        <div class="arb-icon" style="background: linear-gradient(135deg,#128c7e,#075e54)">
                            <AppIcon name="chat" :size="18" class="text-white" />
                        </div>
                        <div class="arb-info">
                            <span class="arb-label">Entrar em contato com a loja</span>
                            <span class="arb-sub">Fale diretamente com o negócio</span>
                        </div>
                        <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
                    </button>
                </div>
            </q-card-section>
            <q-card-actions align="center" class="q-pb-md">
                <button class="abs-action-cancel" @click="whatsappChooser = false">Cancelar</button>
            </q-card-actions>
        </q-card>
    </q-dialog>

    <div class="ecommerce-desktop-layout">
    <div class="ecommerce-content">
        <section v-if="selectedProduct" class="product-detail">
            <button type="button" class="product-detail-back" @click="backToStore">
                <AppIcon name="arrow-back" :size="20" />
                <span>Voltar para loja</span>
            </button>

            <div class="product-detail-main">
                <div class="product-detail-media" @click="openModalImg(selectedProduct)">
                    <q-img :src="selectedProduct.link" :ratio="1" />
                </div>
                <div class="product-detail-info">
                    <p class="product-detail-category">{{ selectedProduct.label?.category?.label || 'Produto' }}</p>
                    <h2 class="product-detail-title">{{ selectedProduct.title?.name }}</h2>
                    <div v-if="selectedProduct.title?.description" class="product-detail-description" v-html="safeHtml(selectedProduct.title.description)"></div>
                    <p class="product-detail-price">R$ {{ selectedProduct.subtitle?.value }}</p>

                    <div class="product-detail-actions">
                        <button type="button" class="product-buy-btn" :disabled="!phoneZap" @click="buyNow(selectedProduct)">
                            Comprar agora
                        </button>
                        <button type="button" class="product-cart-btn" @click="addToCart(selectedProduct)">
                            <AppIcon name="add-shopping-cart" :size="20" />
                            <span>Adicionar</span>
                            <strong v-if="selectedProduct.quantityCart > 0">{{ selectedProduct.quantityCart }}</strong>
                        </button>
                    </div>
                    <p v-if="!phoneZap" class="product-detail-warning">Esta loja nao possui WhatsApp ativo para receber pedidos.</p>
                </div>
            </div>

            <div class="product-info-panel">
                <h3>Informacoes do produto</h3>
                <div class="product-info-grid">
                    <div v-for="info in selectedProductInfo" :key="info.label" class="product-info-item">
                        <span>{{ info.label }}</span>
                        <strong>{{ info.value }}</strong>
                    </div>
                </div>
            </div>

            <div v-if="recommendedProducts.length" class="product-recommendations">
                <div class="product-recommendations-header">
                    <h3>Recomendados</h3>
                    <button type="button" @click="backToStore">Ver todos</button>
                </div>
                <div class="product-recommendations-grid">
                    <article
                      v-for="item in recommendedProducts"
                      :key="item.id"
                      class="product-recommendation-card"
                      @click="goToProduct(item)"
                    >
                        <q-img :src="item.link" :ratio="1" />
                        <div>
                            <h4>{{ item.title?.name }}</h4>
                            <p>R$ {{ item.subtitle?.value }}</p>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <template v-else-if="filteredEcommerceCategories.length">
            <div class="ecommerce-category" v-for="category in filteredEcommerceCategories" :key="categoryKey(category)">
                <div class="ecommerce-category-header">
                    <h2 class="ecommerce-category-title">{{ categoryLabel(category) }}</h2>
                    <div class="ecommerce-view-toggle">
                        <button type="button" class="ecommerce-view-btn" :class="{ active: viewMode === 'card' }" @click="setViewMode('card')" title="Cards">
                            <AppIcon name="layout-grid" :size="18" />
                        </button>
                        <button type="button" class="ecommerce-view-btn" :class="{ active: viewMode === 'list' }" @click="setViewMode('list')" title="Lista">
                            <AppIcon name="list" :size="18" />
                        </button>
                        <button type="button" class="ecommerce-view-btn" :class="{ active: viewMode === 'compact' }" @click="setViewMode('compact')" title="Compacto">
                            <AppIcon name="layout-list" :size="18" />
                        </button>
                    </div>
                </div>
                <div class="ecommerce-grid" :class="'view-' + viewMode">
                    <div class="ecommerce-card" v-for="item in category" :key="item.id" @click="goToProduct(item)">
                        <div class="ecommerce-card-img">
                            <q-img :src="item.link" :ratio="1" fit="cover" />
                        </div>
                        <div class="ecommerce-card-body">
                            <h3 class="ecommerce-card-title">{{ item.title.name }}</h3>
                            <div class="ecommerce-card-desc" v-if="item.title.description && viewMode !== 'compact'" v-html="safeHtml(item.title.description)"></div>
                            <div class="ecommerce-card-footer">
                                <p class="ecommerce-card-price">R$ {{ item.subtitle.value }}</p>
                                <button
                                  type="button"
                                  class="ecommerce-card-add"
                                  :class="{ active: item.quantityCart > 0 }"
                                  :aria-label="item.quantityCart > 0 ? 'Adicionar mais um item' : 'Adicionar ao carrinho'"
                                  @click.stop="addToCart(item)"
                                >
                                    <AppIcon name="add-shopping-cart" :size="18" />
                                    <span v-if="item.quantityCart > 0" class="ecommerce-card-qty">{{ item.quantityCart }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <div v-else-if="totalProducts" class="ecommerce-empty-state">
            <AppIcon name="search" :size="42" class="text-gray-300" />
            <p>Nenhum produto encontrado</p>
            <button type="button" @click="productSearch = ''; selectedCategory = ''">Limpar filtros</button>
        </div>
        <div v-else class="ecommerce-empty-state">
            <AppIcon name="shopping-basket" :size="42" class="text-gray-300" />
            <p>Esta loja ainda nao possui produtos disponiveis.</p>
        </div>

        <q-btn color="grey-8" flat @click="backPage()" class="ecommerce-back">
            <AppIcon name="arrow-back" :size="20" class="mr-2" />
            Voltar
        </q-btn>
    </div>
    <aside class="ecommerce-desktop-sidebar">
        <div class="desktop-social-panel">
            <div class="desktop-store-mini">
                <div class="desktop-store-logo">
                    <q-img v-if="pathImg()" :src="pathImg()" :ratio="1" fit="cover" />
                    <q-avatar v-else rounded class="h-full w-full" :color="colors[Math.floor(Math.random() * colors.length)]" text-color="white">{{ (adsComponent.name || '').split(" ").map((n)=>n[0]).join("").toUpperCase().slice(0, 2) }}</q-avatar>
                </div>
                <div>
                    <h2>{{ adsComponent.name }}</h2>
                    <p>{{ totalProducts }} produtos</p>
                </div>
            </div>
            <div class="desktop-social-actions">
                <button type="button" @click="copyLink" title="Copiar link">
                    <AppIcon name="link" :size="19" />
                    <span>Link</span>
                </button>
                <button type="button" @click="shareStore" title="Compartilhar">
                    <AppIcon name="share" :size="19" />
                    <span>Compartilhar</span>
                </button>
                <button type="button" :disabled="!phoneZap" @click="openWhatsappChooser" title="WhatsApp">
                    <AppIcon name="whatsapp" :size="19" />
                    <span>WhatsApp</span>
                </button>
            </div>
        </div>
        <div class="desktop-cart-panel">
            <div class="cart-header">
                <h2 class="cart-title">Carrinho</h2>
                <span class="desktop-cart-count">{{ totalItems }} itens</span>
            </div>
            <div v-if="queries.cart.length" class="cart-body">
                <div class="cart-list desktop-cart-list">
                    <div class="cart-item" v-for="(item, id) in queries.cart" :key="'desktop-id-' + id">
                        <q-img class="cart-item-img" :src="item.link" alt="" />
                        <div class="cart-item-info">
                            <h4 class="cart-item-name">{{ item.name }}</h4>
                            <div class="cart-item-row">
                                <div class="cart-qty">
                                    <button type="button" class="cart-qty-btn" @click="sub(item)">
                                        <AppIcon :name="item.quantity <= 1 ? 'close' : 'remove'" :size="14" />
                                    </button>
                                    <input type="number" min="0" v-model.number="item.quantity" class="cart-qty-input" @change="updateQuantity(item)">
                                    <button type="button" class="cart-qty-btn" @click="add(item)">
                                        <AppIcon name="add" :size="14" />
                                    </button>
                                </div>
                                <span class="cart-item-price">{{ RS(item.value * item.quantity) }}</span>
                            </div>
                            <textarea
                              v-model="item.note"
                              class="cart-item-note"
                              rows="2"
                              maxlength="180"
                              placeholder="Observacao do item"
                              @change="updateCartNote(item)"
                            ></textarea>
                        </div>
                    </div>
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total</span>
                        <span class="cart-total-value">{{ RS(total) }}</span>
                    </div>
                    <q-btn color="secondary" label="Finalizar pedido" class="cart-checkout" unelevated :disable="!phoneZap" @click="botaoPedido()" />
                    <p v-if="!phoneZap" class="cart-checkout-warning">A loja nao possui WhatsApp ativo para receber pedidos.</p>
                </div>
            </div>
            <div v-else class="cart-empty desktop-cart-empty">
                <AppIcon name="shopping-cart" :size="34" class="text-gray-300 mb-2" />
                <p>Adicione produtos para montar o pedido</p>
            </div>
        </div>
    </aside>
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
                                    <button type="button" class="cart-qty-btn" @click="sub(item)">
                                        <AppIcon :name="item.quantity <= 1 ? 'close' : 'remove'" :size="14" />
                                    </button>
                                    <input type="number" min="0" v-model.number="item.quantity" class="cart-qty-input" @change="updateQuantity(item)">
                                    <button type="button" class="cart-qty-btn" @click="add(item)">
                                        <AppIcon name="add" :size="14" />
                                    </button>
                                </div>
                                <span class="cart-item-price">{{ RS(item.value * item.quantity) }}</span>
                            </div>
                            <textarea
                              v-model="item.note"
                              class="cart-item-note"
                              rows="2"
                              maxlength="180"
                              placeholder="Observacao do item"
                              @change="updateCartNote(item)"
                            ></textarea>
                        </div>
                    </div>
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total</span>
                        <span class="cart-total-value">{{ RS(total) }}</span>
                    </div>
                    <q-btn color="secondary" label="Finalizar pedido" class="cart-checkout" unelevated :disable="!phoneZap" @click="botaoPedido()" />
                    <p v-if="!phoneZap" class="cart-checkout-warning">A loja nao possui WhatsApp ativo para receber pedidos.</p>
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
                <a v-if="phoneZap" :href="`https://wa.me/55${phoneZap}?text=${pedido}`" target="_blank" class="text-green-700 font-bold p-4">SIM</a>
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

const ECOMMERCE_VIEW_KEY = 'poliweb_ecommerce_view_mode'

export default {
    components: {},
    setup() {
        const colors = ['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning']
        const stored = typeof localStorage !== 'undefined' && localStorage.getItem(ECOMMERCE_VIEW_KEY)
        const validModes = ['card', 'list', 'compact']
        const viewMode = ref(validModes.includes(stored) ? stored : 'card')
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
            whatsappChooser: ref(false),
            productSearch: ref(''),
            selectedCategory: ref(''),
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
        activePhones() {
            return (this.adsComponent?.phones || []).filter((phone) => !phone.deletedAt)
        },
        phoneZap() {
            const whatsapp = this.activePhones.find((phone) => phone.isWhatsapp && phone.phone)
            return whatsapp ? whatsapp.phone.replace(/[^0-9]/g, '') : false
        },
        ecommerceCategories() {
            const filtered = this.adsComponent?.files?.ecommerceFiltered
            if (!filtered) return []
            return Object.values(filtered)
                .filter((category) => Array.isArray(category) && category.length)
                .map((category) => ({
                    key: this.categoryKey(category),
                    label: this.categoryLabel(category),
                    items: category
                }))
        },
        allProducts() {
            return this.ecommerceCategories.flatMap((category) => category.items)
        },
        totalProducts() {
            return this.ecommerceCategories.reduce((total, category) => total + category.items.length, 0)
        },
        selectedProduct() {
            const productId = this.$route.params.productId
            if (!productId) return null
            return this.allProducts.find((item) => String(item.id) === String(productId)) || null
        },
        selectedProductInfo() {
            const item = this.selectedProduct
            if (!item) return []
            return [
                { label: 'Produto', value: item.title?.name || '-' },
                { label: 'Categoria', value: item.label?.category?.label || '-' },
                { label: 'Valor', value: item.subtitle?.value ? this.RS(Number(item.subtitle.value)) : '-' },
                { label: 'Codigo', value: String(item.id || '-') },
                { label: 'Loja', value: this.adsComponent?.name || '-' }
            ]
        },
        recommendedProducts() {
            const item = this.selectedProduct
            if (!item) return []
            const sameCategory = this.allProducts.filter((product) =>
                product.id !== item.id &&
                product.label?.category?.category === item.label?.category?.category
            )
            const fallback = this.allProducts.filter((product) => product.id !== item.id)
            return (sameCategory.length ? sameCategory : fallback).slice(0, 6)
        },
        filteredEcommerceCategories() {
            const search = this.normalizeText(this.productSearch)
            return this.ecommerceCategories
                .filter((category) => !this.selectedCategory || category.key === this.selectedCategory)
                .map((category) => ({
                    ...category,
                    items: category.items.filter((item) => this.productMatchesSearch(item, search))
                }))
                .filter((category) => category.items.length)
                .map((category) => category.items)
        },
        shareUrl() {
            return typeof window !== 'undefined' ? `${window.location.origin}${this.$route.fullPath}` : ''
        },
    },
    methods: {
        categoryKey(category) {
            return String(category?.[0]?.label?.category?.category || category?.[0]?.label?.category?.label || 'sem-categoria')
        },
        categoryLabel(category) {
            return category?.[0]?.label?.category?.label || 'Produtos'
        },
        setSelectedCategory(categoryKey) {
            this.selectedCategory = categoryKey
        },
        normalizeText(value) {
            return String(value || '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim()
        },
        safeHtml(value) {
            return String(value || '')
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/\son\w+="[^"]*"/gi, '')
                .replace(/\son\w+='[^']*'/gi, '')
                .replace(/\sjavascript:/gi, '')
        },
        productMatchesSearch(item, search) {
            if (!search) return true
            const haystack = [
                item?.title?.name,
                item?.title?.description,
                item?.label?.category?.label,
                item?.subtitle?.value
            ].map((value) => this.normalizeText(value)).join(' ')
            return haystack.includes(search)
        },
        productRoute(item) {
            return `/loja/${this.$route.params.id}/produto/${item.id}`
        },
        goToProduct(item) {
            if (!item?.id) return
            this.$router.push(this.productRoute(item))
        },
        backToStore() {
            this.$router.push(`/loja/${this.$route.params.id}`)
        },
        syncProductQuantities(cartItems = this.queries.cart) {
            const byProductId = {}
            ;(cartItems || []).forEach((cartItem) => {
                byProductId[String(cartItem.idProd)] = Number(cartItem.quantity || 0)
            })
            this.allProducts.forEach((product) => {
                product.quantityCart = byProductId[String(product.id)] || 0
            })
        },
        setViewMode(mode) {
            this.viewMode = mode
            try {
                localStorage.setItem(ECOMMERCE_VIEW_KEY, mode)
            } catch (_) {}
        },
       openModalImg(item) {
        this.componentProps.show = true
          this.componentProps.props = item
      },
        async copyLink() {
            try {
                await navigator.clipboard.writeText(this.shareUrl)
                this.$q.notify({
                    color: 'positive',
                    message: 'Link copiado!',
                    icon: 'check_circle',
                    position: 'bottom'
                })
            } catch (err) {
                this.$q.notify({
                    color: 'negative',
                    message: 'Não foi possível copiar',
                    icon: 'error',
                    position: 'bottom'
                })
            }
        },
        async shareStore() {
            const shareData = {
                title: this.adsComponent.name,
                text: (this.adsComponent.description || this.adsComponent.name).slice(0, 100),
                url: this.shareUrl
            }
            try {
                if (navigator.share) {
                    await navigator.share(shareData)
                    this.$q.notify({
                        color: 'positive',
                        message: 'Compartilhado com sucesso!',
                        icon: 'check_circle',
                        position: 'bottom'
                    })
                } else {
                    await this.copyLink()
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    await this.copyLink()
                }
            }
        },
        openWhatsappChooser() {
            if (!this.phoneZap) {
                this.$q.notify({
                    color: 'warning',
                    message: 'A loja nao possui WhatsApp ativo.',
                    icon: 'report_problem',
                    position: 'bottom'
                })
                return
            }
            this.whatsappChooser = true
        },
        shareToWhatsappFriend() {
            const text = `Olha essa loja no Poliweb: ${this.shareUrl}`
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`
            this.whatsappChooser = false
            window.open(url, '_blank')
        },
        openWhatsappCompany() {
            const url = `https://wa.me/55${this.phoneZap}?text=Ol%C3%A1! Vim pelo app Poliweb!`
            this.whatsappChooser = false
            window.open(url, '_blank')
        },
        backPage() {
            this.$router.go(-1)
        },
        async botaoPedido() {
            if (!this.phoneZap) {
                this.$q.notify({
                    color: 'warning',
                    message: 'A loja nao possui WhatsApp ativo para receber pedidos.',
                    icon: 'report_problem',
                    position: 'bottom'
                })
                return
            }
            this.pedido = await this.geraPedidoWhatsapp()
            this.confirmPedido = true
        },
        async buyNow(item) {
            if (!this.phoneZap) {
                this.$q.notify({
                    color: 'warning',
                    message: 'A loja nao possui WhatsApp ativo para receber pedidos.',
                    icon: 'report_problem',
                    position: 'bottom'
                })
                return
            }
            await this.addToCart(item)
            await this.botaoPedido()
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
                if (this.queries.cart[i].note) {
                    pedido += `Obs: ${this.queries.cart[i].note}\n`;
                }
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
                    this.syncProductQuantities(items)
                },
                (error) => {
                    queryRefs.itemsError.value = error;
                }
            );

        },
        async addToCart(item) {
            item.quantityCart = Number(item.quantityCart || 0) + 1
            const quantityCount = await db.cart.where({
                ad: this.idAd,
                idProd: item.id
            }).first();
            let quantity = quantityCount ? quantityCount.quantity + 1 : 1;
            await db.cart.put({
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
                note: quantityCount?.note || '',
                quantity: quantity
            })
            const cartItems = await db.cart.where({ ad: this.idAd }).toArray()
            this.queries.cart = cartItems
            this.syncProductQuantities(cartItems)
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
            const qty = parseInt(item.quantity, 10);
            if (!Number.isFinite(qty)) {
                item.quantity = 1;
                db.cart.where({ id: item.id }).modify(i => { i.quantity = 1; });
                return;
            }
            if (qty <= 0) {
                db.cart.where({ id: item.id }).delete();
                return;
            }
            item.quantity = qty;
            db.cart.where({ id: item.id }).modify(i => { i.quantity = qty; });
        },
        updateCartNote(item) {
            const note = String(item.note || '').slice(0, 180)
            item.note = note
            db.cart.where({ id: item.id }).modify(i => { i.note = note; });
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
            return logo.filter((item) => !item.deletedAt && item.link)[0]?.link || ''
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
                    filtered.phones = this.filterDeleted(filtered.phones)
                    filtered.files.logo = this.filterDeleted(filtered.files.logo)
                    filtered.files.ecommerce = this.sortAb(filtered.files.ecommerce)
                    filtered.files.ecommerceFiltered = this.filterEatchType(filtered.files.ecommerce)
                    this.adsComponent = filtered
                    this.syncProductQuantities()
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
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}
.ecommerce-header-glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.ecommerce-actions-bar {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.75rem;
  flex-wrap: nowrap;
  justify-content: center;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.ecommerce-actions-bar::-webkit-scrollbar { display: none; }
.ecommerce-action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(229, 231, 235, 0.8);
  background: rgba(255, 255, 255, 0.9);
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex: 1 1 0;
  min-width: 0;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  text-decoration: none;
}
@media (max-width: 600px) {
  .ecommerce-action-btn span { display: none; }
  .ecommerce-action-btn { padding: 0.5rem; flex: 0 0 auto; }
}
.ecommerce-action-btn:active { background: rgba(243, 244, 246, 0.9); }
.ecommerce-action-whatsapp {
  background: #25d366 !important;
  border-color: #25d366 !important;
  color: white !important;
}
.ecommerce-action-btn.disabled {
  opacity: 0.55;
}
.ecommerce-shop-tools {
  margin-top: 0.85rem;
  display: grid;
  gap: 0.65rem;
}
.ecommerce-shop-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}
.ecommerce-shop-summary span {
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: rgba(243, 244, 246, 0.9);
  border: 1px solid rgba(229, 231, 235, 0.9);
}
.ecommerce-search {
  height: 42px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(209, 213, 219, 0.9);
}
.ecommerce-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #374151;
  font-size: 0.9rem;
}
.ecommerce-category-tabs {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.15rem;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.ecommerce-category-tabs::-webkit-scrollbar {
  display: none;
}
.ecommerce-category-tab {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: white;
  color: #4b5563;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.ecommerce-category-tab.active {
  color: white;
  border-color: #059669;
  background: #059669;
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
.ecommerce-desktop-layout {
  width: 100%;
}
.ecommerce-desktop-sidebar {
  display: none;
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
    grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
    gap: 0.75rem;
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
.ecommerce-grid.view-list .ecommerce-card-footer {
  margin: 0 0 0 auto;
  flex: 0 0 auto;
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
.ecommerce-grid.view-compact .ecommerce-card-add {
  width: 32px;
  height: 32px;
}
@media (min-width: 640px) {
  .ecommerce-grid.view-compact {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
@media (min-width: 1024px) {
  .ecommerce-page {
    background: #f3f4f6;
  }
  .ecommerce-header {
    position: static;
    padding: 1rem 1.25rem;
  }
  .ecommerce-header-glass {
    background: #ffffff;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  }
  .ecommerce-header-inner,
  .ecommerce-actions-bar,
  .ecommerce-shop-tools,
  .ecommerce-actions {
    max-width: 1220px;
    margin-left: auto;
    margin-right: auto;
  }
  .ecommerce-actions-bar {
    justify-content: flex-start;
  }
  .ecommerce-action-btn {
    flex: 0 0 auto;
    min-height: 36px;
    padding: 0.35rem 0.7rem;
  }
  .ecommerce-shop-tools {
    grid-template-columns: minmax(180px, auto) minmax(260px, 360px);
    align-items: center;
  }
  .ecommerce-category-tabs {
    grid-column: 1 / -1;
  }
  .ecommerce-cart-fab {
    display: none !important;
  }
  .ecommerce-desktop-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 318px;
    gap: 1rem;
    max-width: 1220px;
    margin: 0 auto;
    padding: 1rem 1.25rem 2rem;
    align-items: start;
  }
  .ecommerce-content {
    padding: 0;
    padding-bottom: 2rem;
    min-width: 0;
  }
  .ecommerce-desktop-sidebar {
    display: grid;
    gap: 0.85rem;
    position: sticky;
    top: 1rem;
    max-height: calc(100vh - 2rem);
    overflow: auto;
    scrollbar-width: thin;
  }
  .desktop-social-panel,
  .desktop-cart-panel {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }
  .desktop-social-panel {
    padding: 0.85rem;
  }
  .desktop-store-mini {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }
  .desktop-store-logo {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
  }
  .desktop-store-mini h2 {
    margin: 0;
    color: #1f2937;
    font-size: 0.98rem;
    font-weight: 800;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .desktop-store-mini p {
    margin: 0.2rem 0 0;
    color: #6b7280;
    font-size: 0.78rem;
  }
  .desktop-social-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
    margin-top: 0.85rem;
  }
  .desktop-social-actions button {
    min-height: 54px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    color: #374151;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.2rem;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
  }
  .desktop-social-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .desktop-social-actions button:hover:not(:disabled) {
    color: #059669;
    border-color: #bbf7d0;
    background: #ecfdf5;
  }
  .desktop-cart-panel {
    padding: 0.85rem;
  }
  .desktop-cart-count {
    color: #6b7280;
    font-size: 0.78rem;
    font-weight: 700;
  }
  .desktop-cart-list {
    max-height: 42vh;
  }
  .desktop-cart-empty {
    min-height: 170px;
    padding: 1rem;
  }
  .ecommerce-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }
  .ecommerce-card {
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
  }
  .ecommerce-card-img {
    aspect-ratio: 4 / 3;
  }
  .ecommerce-card-body {
    padding: 0.62rem;
    gap: 0.35rem;
  }
  .ecommerce-card-title {
    font-size: 0.86rem;
    line-height: 1.25;
  }
  .ecommerce-card-desc {
    font-size: 0.72rem;
    line-height: 1.3;
    -webkit-line-clamp: 1;
  }
  .ecommerce-card-price {
    font-size: 0.9rem;
  }
  .ecommerce-card-add {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
  .ecommerce-grid.view-list .ecommerce-card-img {
    width: 78px;
    min-width: 78px;
  }
  .ecommerce-grid.view-list .ecommerce-card {
    min-height: 78px;
  }
  .ecommerce-grid.view-list .ecommerce-card-body {
    padding: 0.55rem 0.75rem;
  }
  .ecommerce-grid.view-compact {
    grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
    gap: 0.6rem;
  }
  .ecommerce-grid.view-compact .ecommerce-card-img {
    aspect-ratio: 4 / 3;
  }
}
.ecommerce-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.ecommerce-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10), 0 2px 8px rgba(15, 23, 42, 0.05);
}
.ecommerce-card-img {
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}
.ecommerce-card-img :deep(.q-img__content),
.ecommerce-card-img :deep(img) {
  object-fit: cover !important;
  object-position: center;
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
.ecommerce-card-desc :deep(p),
.ecommerce-card-desc :deep(ul),
.ecommerce-card-desc :deep(ol) {
  margin: 0;
}
.ecommerce-card-price {
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
  margin: 0;
}
.ecommerce-card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.ecommerce-card-add {
  position: relative;
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 999px;
  border: 1px solid #d1fae5;
  background: #ecfdf5;
  color: #059669;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.ecommerce-card-add:hover,
.ecommerce-card-add.active {
  background: #059669;
  border-color: #059669;
  color: white;
}
.ecommerce-card-add:active {
  transform: scale(0.94);
}
.ecommerce-card-qty {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: #2563eb;
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 18px;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.32);
}
.product-detail {
  display: grid;
  gap: 1rem;
  max-width: 1040px;
  margin: 0 auto;
}
.product-detail-back {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  background: transparent;
  color: #4b5563;
  font-weight: 700;
  cursor: pointer;
}
.product-detail-main {
  display: grid;
  grid-template-columns: minmax(260px, 420px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}
.product-detail-media {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}
.product-detail-media :deep(img) {
  object-fit: contain !important;
}
.product-detail-info,
.product-info-panel,
.product-recommendations {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}
.product-detail-category {
  margin: 0 0 0.35rem;
  color: #059669;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
.product-detail-title {
  margin: 0;
  color: #1f2937;
  font-size: 1.55rem;
  line-height: 1.2;
  font-weight: 800;
}
.product-detail-description {
  margin: 0.75rem 0 0;
  color: #6b7280;
  line-height: 1.5;
}
.product-detail-description :deep(p) {
  margin: 0 0 0.65rem;
}
.product-detail-description :deep(p:last-child) {
  margin-bottom: 0;
}
.product-detail-description :deep(ul),
.product-detail-description :deep(ol) {
  margin: 0.65rem 0;
  padding-left: 1.25rem;
}
.product-detail-price {
  margin: 1rem 0 0;
  color: #059669;
  font-size: 1.65rem;
  font-weight: 900;
}
.product-detail-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
  margin-top: 1rem;
}
.product-buy-btn,
.product-cart-btn {
  min-height: 46px;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.product-buy-btn {
  border: 0;
  color: white;
  background: #059669;
}
.product-buy-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.product-cart-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid #d1fae5;
  color: #059669;
  background: #ecfdf5;
  padding: 0 0.9rem;
}
.product-cart-btn strong {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #2563eb;
  color: white;
  font-size: 0.72rem;
  line-height: 20px;
}
.product-detail-warning {
  margin: 0.75rem 0 0;
  color: #b45309;
  font-size: 0.85rem;
}
.product-info-panel h3,
.product-recommendations h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 800;
}
.product-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.65rem;
  margin-top: 0.85rem;
}
.product-info-item {
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
}
.product-info-item span {
  color: #6b7280;
  font-size: 0.75rem;
}
.product-info-item strong {
  color: #374151;
  font-size: 0.9rem;
}
.product-recommendations-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}
.product-recommendations-header button {
  border: 0;
  background: transparent;
  color: #059669;
  font-weight: 800;
  cursor: pointer;
}
.product-recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}
.product-recommendation-card {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}
.product-recommendation-card :deep(img) {
  object-fit: contain !important;
}
.product-recommendation-card div {
  padding: 0.65rem;
}
.product-recommendation-card h4 {
  margin: 0;
  color: #374151;
  font-size: 0.85rem;
  line-height: 1.25;
}
.product-recommendation-card p {
  margin: 0.35rem 0 0;
  color: #059669;
  font-weight: 800;
}
@media (max-width: 720px) {
  .product-detail-main {
    grid-template-columns: 1fr;
  }
  .product-detail-title {
    font-size: 1.3rem;
  }
  .product-detail-actions {
    grid-template-columns: 1fr;
  }
}
.ecommerce-back {
  margin-top: 1rem;
}
.ecommerce-empty-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  color: #6b7280;
  background: white;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem 1rem;
}
.ecommerce-empty-state p {
  margin: 0;
  font-size: 0.95rem;
}
.ecommerce-empty-state button {
  min-height: 36px;
  border: 0;
  border-radius: 8px;
  padding: 0 0.9rem;
  color: white;
  background: #059669;
  font-weight: 700;
  cursor: pointer;
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
.cart-item-note {
  width: 100%;
  margin-top: 0.55rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
  font-size: 0.78rem;
  line-height: 1.35;
  resize: vertical;
  min-height: 44px;
  max-height: 96px;
  outline: 0;
}
.cart-item-note:focus {
  border-color: #86efac;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
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
.cart-checkout-warning {
  margin: 0.65rem 0 0;
  color: #b45309;
  font-size: 0.8rem;
  text-align: center;
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
@media (min-width: 1024px) {
  .ecommerce-card {
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
  }
  .ecommerce-card-img {
    aspect-ratio: 4 / 3;
  }
  .ecommerce-card-body {
    padding: 0.62rem;
    gap: 0.35rem;
  }
  .ecommerce-card-title {
    font-size: 0.86rem;
    line-height: 1.25;
  }
  .ecommerce-card-desc {
    font-size: 0.72rem;
    line-height: 1.3;
    -webkit-line-clamp: 1;
  }
  .ecommerce-card-price {
    font-size: 0.9rem;
  }
  .ecommerce-card-add {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
  .product-detail {
    max-width: none;
  }
  .product-detail-main {
    grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  }
  .product-detail-title {
    font-size: 1.35rem;
  }
  .product-detail-price {
    font-size: 1.45rem;
  }
  .product-recommendations-grid {
    grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  }
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
