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
            <section v-if="admin" class="commerce-panel">
                <h2>Configurações de pedidos</h2>
                <q-toggle v-model="commerceSettings.acceptsDelivery" label="Realizo entregas" />
                <q-input v-if="commerceSettings.acceptsDelivery" v-model="deliveryFeeInput" filled label="Taxa de entrega (R$)" type="number" min="0" step="0.01" />
                <q-input v-if="commerceSettings.acceptsDelivery" v-model="commerceSettings.deliveryInfo" filled type="textarea" maxlength="500" label="Informações de entrega (áreas atendidas, prazo, horários)" />
                <p>Formas de pagamento aceitas</p>
                <div class="row q-gutter-sm q-mb-md">
                    <q-checkbox v-for="method in standardPayments" :key="method" v-model="commerceSettings.paymentMethods" :val="method" :label="method" />
                </div>
                <div class="row q-gutter-sm q-mb-md">
                    <q-input v-model="customPayment" dense filled label="Outra forma de pagamento" @keyup.enter="addPayment" />
                    <q-btn outline label="Adicionar" @click="addPayment" />
                </div>
                <div class="row q-gutter-sm q-mb-md">
                    <q-chip v-for="method in commerceSettings.paymentMethods.filter(item => !standardPayments.includes(item))" :key="method" removable @remove="removePayment(method)">{{ method }}</q-chip>
                </div>
                <q-btn color="primary" label="Salvar configurações" :loading="savingSettings" @click="saveCommerceSettings" />
            </section>
            <section v-if="admin" class="commerce-panel">
                <div class="row items-center justify-between">
                    <h2>Últimos pedidos</h2>
                    <div class="row q-gutter-xs">
                        <q-btn flat label="Atualizar" @click="loadOrders" />
                        <q-btn color="primary" outline label="Ver todos" @click="openOrders" />
                        <q-btn color="positive" label="Acompanhar ao vivo" @click="$router.push(`/ecommerce/${$route.params.id}/pedidos`)" />
                    </div>
                </div>
                <p v-if="!orders.length">Nenhum pedido registrado.</p>
                <CommerceOrderCard v-for="order in orders" :key="order.id" :order="order" />
            </section>
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
        <q-dialog v-model="ordersDialog" maximized transition-show="slide-up" transition-hide="slide-down">
            <q-card class="orders-dialog">
                <q-bar><div class="text-weight-bold">Todos os pedidos</div><q-space /><q-btn flat dense icon="close" v-close-popup /></q-bar>
                <q-card-section class="orders-dialog-content">
                    <p class="text-caption">Pedidos gerados no site. O envio pelo WhatsApp não é confirmado automaticamente.</p>
                    <div class="orders-filters">
                        <q-input v-model="ordersFilters.search" filled label="Buscar cliente, telefone ou pedido" maxlength="120" @keyup.enter="applyOrdersFilters" />
                        <q-input v-model="ordersFilters.from" filled type="date" label="De" stack-label />
                        <q-input v-model="ordersFilters.to" filled type="date" label="Até" stack-label />
                        <q-select v-model="ordersFilters.payment" filled clearable :options="commerceSettings.paymentMethods" label="Pagamento" />
                        <q-select v-model="ordersFilters.fulfillment" filled clearable emit-value map-options :options="fulfillmentOptions" label="Entrega ou retirada" />
                    </div>
                    <div class="row q-gutter-sm q-my-md">
                        <q-btn color="primary" label="Filtrar" :loading="ordersLoading" @click="applyOrdersFilters" />
                        <q-btn flat label="Limpar filtros" @click="clearOrdersFilters" />
                    </div>
                    <div v-if="ordersLoading" class="text-center q-pa-lg"><q-spinner color="primary" size="32px" /></div>
                    <template v-else>
                        <p>{{ ordersTotal }} {{ ordersTotal === 1 ? 'pedido encontrado' : 'pedidos encontrados' }}</p>
                        <p v-if="!allOrders.length">Nenhum pedido para os filtros escolhidos.</p>
                        <CommerceOrderCard v-for="order in allOrders" :key="order.id" :order="order" />
                        <div v-if="ordersTotal > ordersPageSize" class="row justify-center q-mt-lg">
                            <q-pagination :model-value="ordersPage" :max="Math.ceil(ordersTotal / ordersPageSize)" :max-pages="5" boundary-numbers color="primary" @update:model-value="changeOrdersPage" />
                        </div>
                    </template>
                </q-card-section>
            </q-card>
        </q-dialog>
        <q-dialog v-model="showSetupDialog" persistent>
            <q-card class="product-type-card">
                <q-card-section>
                    <div class="text-h6">Configure os pedidos da sua loja</div>
                    <p>Escolha como o cliente compra antes de cadastrar produtos.</p>
                </q-card-section>
                <q-card-section class="q-pt-none">
                    <q-toggle v-model="commerceSettings.acceptsDelivery" label="Fazer entregas e pedir endereço ao cliente" />
                    <template v-if="commerceSettings.acceptsDelivery">
                        <q-input v-model="deliveryFeeInput" filled label="Taxa de entrega (R$)" type="number" min="0" step="0.01" class="q-mb-sm" />
                        <q-input v-model="commerceSettings.deliveryInfo" filled type="textarea" maxlength="500" label="Regiões, prazo e horários de entrega" class="q-mb-sm" />
                    </template>
                    <p>Formas de pagamento aceitas</p>
                    <q-checkbox v-for="method in standardPayments" :key="method" v-model="commerceSettings.paymentMethods" :val="method" :label="method" />
                    <q-input v-model="customPayment" filled label="Outra forma de pagamento" @keyup.enter="addPayment" class="q-mt-sm" />
                    <q-btn flat label="Adicionar pagamento" @click="addPayment" />
                    <div><q-chip v-for="method in commerceSettings.paymentMethods.filter(item => !standardPayments.includes(item))" :key="method" removable @remove="removePayment(method)">{{ method }}</q-chip></div>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn color="primary" label="Salvar e continuar" :loading="savingSettings" @click="saveCommerceSettings" />
                </q-card-actions>
            </q-card>
        </q-dialog>
        <q-dialog v-model="productTypeDialog">
            <q-card class="product-type-card">
                <q-card-section><div class="text-h6">O que você vai vender?</div><p>Vamos sugerir os campos para cadastrar pelo celular.</p></q-card-section>
                <q-card-section class="q-pt-none">
                    <button type="button" class="product-type-option" @click="chooseProductType('food')"><strong>Comida ou bebida</strong><span>Tamanhos, sabores e adicionais</span></button>
                    <button type="button" class="product-type-option" @click="chooseProductType('clothing')"><strong>Roupa ou calçado</strong><span>Tamanhos e outras variações</span></button>
                    <button type="button" class="product-type-option" @click="chooseProductType('other')"><strong>Outro produto</strong><span>Cadastro simples; opções podem ser adicionadas</span></button>
                </q-card-section>
            </q-card>
        </q-dialog>

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
                    <ProductOptionsEditor v-model="form.meta.productOptions" />
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
                    <ProductOptionsEditor v-model="form.meta.productOptions" />
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
import { normalizeUploadImage } from 'src/js/normalizeUploadImage'
import { commerceApi, defaultCommerceSettings } from 'src/js/commerceApi'
import ProductOptionsEditor from 'src/components/ProductOptionsEditor.vue'
import CommerceOrderCard from 'src/components/CommerceOrderCard.vue'

export default {
    components: { ProductOptionsEditor, CommerceOrderCard },
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
            productTypeDialog: ref(false),
            showSetupDialog: ref(false),
            commerceSettings: ref(defaultCommerceSettings()),
            deliveryFeeInput: ref('0'),
            customPayment: ref(''),
            standardPayments: ref(['Pix', 'Cartão', 'Dinheiro']),
            savingSettings: ref(false),
            orders: ref([]),
            ordersDialog: ref(false),
            ordersLoading: ref(false),
            ordersRequestId: ref(0),
            allOrders: ref([]),
            ordersTotal: ref(0),
            ordersPage: ref(1),
            ordersPageSize: ref(20),
            ordersFilters: ref({ search: '', from: '', to: '', payment: null, fulfillment: null }),
            fulfillmentOptions: ref([{ label: 'Entrega', value: 'delivery' }, { label: 'Retirada', value: 'pickup' }]),
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
                meta: { productOptions: [] },
            }),
            resetForm: ref({
                title: {},
                subtitle: {},
                label: {},
                meta: { productOptions: [] },
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
        money(cents) { return (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
        addPayment() {
            const value = this.customPayment.trim().slice(0, 60)
            if (value && !this.commerceSettings.paymentMethods.some(item => item.toLowerCase() === value.toLowerCase())) this.commerceSettings.paymentMethods.push(value)
            this.customPayment = ''
        },
        removePayment(method) { this.commerceSettings.paymentMethods = this.commerceSettings.paymentMethods.filter(item => item !== method) },
        async loadCommerceSettings() {
            try {
                this.commerceSettings = await commerceApi(this.$route.params.id, 'settings')
                this.deliveryFeeInput = String(this.commerceSettings.deliveryFeeCents / 100)
                this.showSetupDialog = !this.commerceSettings.configured
            } catch (error) { this.$q.notify({ color: 'negative', message: error.message }) }
        },
        async saveCommerceSettings() {
            const fee = Math.round(Number(this.deliveryFeeInput) * 100)
            if (!this.commerceSettings.paymentMethods.length || !Number.isSafeInteger(fee) || fee < 0) {
                this.$q.notify({ color: 'warning', message: 'Selecione um pagamento e informe uma taxa válida.' }); return
            }
            this.savingSettings = true
            try {
                this.commerceSettings = await commerceApi(this.$route.params.id, 'settings', 'PUT', {
                    ...this.commerceSettings, deliveryFeeCents: fee
                })
                this.showSetupDialog = false
                this.$q.notify({ color: 'positive', message: 'Configurações salvas.' })
            } catch (error) { this.$q.notify({ color: 'negative', message: error.message }) }
            finally { this.savingSettings = false }
        },
        async loadOrders() {
            try { this.orders = await commerceApi(this.$route.params.id, 'orders') }
            catch (error) { this.$q.notify({ color: 'negative', message: error.message }) }
        },
        openOrders() {
            this.ordersDialog = true
            this.ordersPage = 1
            this.loadAllOrders()
        },
        async loadAllOrders() {
            const requestId = ++this.ordersRequestId
            this.ordersLoading = true
            const params = new URLSearchParams({ view: 'all', page: String(this.ordersPage) })
            for (const [key, value] of Object.entries(this.ordersFilters)) {
                if (value) params.set(key, String(value))
            }
            try {
                const result = await commerceApi(this.$route.params.id, `orders?${params.toString()}`)
                if (requestId === this.ordersRequestId) {
                    this.allOrders = result.orders
                    this.ordersTotal = result.total
                    this.ordersPageSize = result.pageSize
                }
            } catch (error) {
                if (requestId === this.ordersRequestId) this.$q.notify({ color: 'negative', message: error.message })
            } finally { if (requestId === this.ordersRequestId) this.ordersLoading = false }
        },
        applyOrdersFilters() {
            if (this.ordersFilters.from && this.ordersFilters.to && this.ordersFilters.from > this.ordersFilters.to) {
                this.$q.notify({ color: 'warning', message: 'A data inicial deve vir antes da data final.' }); return
            }
            this.ordersPage = 1
            this.loadAllOrders()
        },
        clearOrdersFilters() {
            this.ordersFilters = { search: '', from: '', to: '', payment: null, fulfillment: null }
            this.ordersPage = 1
            this.loadAllOrders()
        },
        changeOrdersPage(page) {
            this.ordersPage = page
            this.loadAllOrders()
        },
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
            this.productTypeDialog = true
        },
        chooseProductType(type) {
            const presets = {
                food: [
                    { name: 'Variação (ex.: tamanho ou sabor)', type: 'single', required: true, choices: [{ name: '', price: '0' }] },
                    { name: 'Adicionais', type: 'multiple', required: false, choices: [{ name: '', price: '0' }] }
                ],
                clothing: [{ name: 'Tamanho', type: 'single', required: true,
                    choices: ['P', 'M', 'G', 'GG'].map(name => ({ name, price: '0' })) }],
                other: []
            }
            this.form = { title: {}, subtitle: {}, label: {}, meta: { productKind: type, productOptions: presets[type] } }
            this.productTypeDialog = false
            this.$refs.gallery.click()
        },
        galleryUpload() {
            const file = this.$refs.gallery.files[0];
            if (!file) return
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
        hasValidOptions() {
            const groups = this.form.meta?.productOptions || []
            const valid = groups.every(group => group.name?.trim() && ['single', 'multiple'].includes(group.type) &&
                group.choices?.length && group.choices.every(choice => choice.name?.trim() &&
                    /^\d+(?:[.,]\d{1,2})?$/.test(String(choice.price ?? ''))))
            if (!valid) this.$q.notify({ color: 'negative', message: 'Preencha os nomes e valores das variações e adicionais.' })
            return valid
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
            this.$api.delete(this.tray.source === 'v2'
                ? `/commerce/stores/${this.adsComponent.id}/products/${this.tray.productId}`
                : `/categories/ads/files/${this.tray.id}`)
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
        async sendGallery() {
            this.$refs.name.validate()
            this.$refs.category.validate()
            this.$refs.value.validate()
            const descriptionValid = this.hasDescription()
            if (this.$refs.name.hasError || this.$refs.category.hasError || this.$refs.value.hasError || !descriptionValid || !this.hasValidOptions()) {
                this.$q.notify({ color: 'negative', message: 'Você precisa preencher todos os campos!' })
                return
            }
            this.$q.loading.show()
            let uploadedId = null
            try {
                const data = new FormData()
                data.append('file', await normalizeUploadImage(this.$refs.gallery.files[0]))
                const upload = await this.$api.post(`/categories/ads/${this.adsComponent.id}/files/product_image`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                uploadedId = Number(upload.data.id)
                await this.$api.post(`/commerce/stores/${this.adsComponent.id}/products`, this.productPayload(uploadedId))
                this.$q.notify({ color: 'positive', message: 'Produto salvo com sucesso!' })
                this.$router.go(0)
            } catch (err) {
                if (uploadedId) await this.$api.delete(`/categories/ads/files/${uploadedId}`).catch(() => {})
                this.$q.notify({ color: 'negative', message: err.response?.data?.message || err.message || 'Erro ao salvar produto.' })
            } finally { this.$q.loading.hide() }
        },
        productPayload(imageFileId) {
            return {
                imageFileId,
                kind: this.form.meta?.productKind || 'other',
                name: this.form.title.name.trim(),
                description: this.form.title.description || '',
                categoryKey: String(this.form.label.category.category),
                categoryLabel: this.form.label.category.label,
                basePriceCents: Math.round(Number(String(this.form.subtitle.value).replace(',', '.')) * 100),
                options: this.form.meta?.productOptions || []
            }
        },
        async saveProduct() {
            this.$refs.name.validate()
            this.$refs.category.validate()
            this.$refs.value.validate()
            const descriptionValid = this.hasDescription()
            if (this.$refs.name.hasError || this.$refs.category.hasError || this.$refs.value.hasError || !descriptionValid || !this.hasValidOptions()) {
                this.$q.notify({ color: 'negative', message: 'Você precisa preencher todos os campos!' })
                return
            }
            this.$q.loading.show()
            try {
                const imageFileId = this.edit.imageFileId || this.edit.id
                const payload = this.productPayload(Number(imageFileId))
                if (this.edit.source === 'v2') {
                    await this.$api.put(`/commerce/stores/${this.adsComponent.id}/products/${this.edit.productId}`, payload)
                } else {
                    await this.$api.post(`/commerce/stores/${this.adsComponent.id}/products`, payload)
                }
                this.$q.notify({ color: 'positive', message: 'Produto atualizado com sucesso!' })
                this.$router.go(0)
            } catch (err) {
                this.$q.notify({ color: 'negative', message: err.response?.data?.message || 'Erro ao atualizar produto.' })
            } finally { this.$q.loading.hide() }
        },
        filterEatchType(arr) {
            if (!arr) return
            let productsFiltered = {}
            try {
                arr.forEach(element => {
                    try {
                    let label = typeof element.label === 'string' ? JSON.parse(element.label) : element.label
                    if (label && label.category && label.category.category) {
                        let title = typeof element.title === 'string' ? JSON.parse(element.title) : element.title
                        let subtitle = typeof element.subtitle === 'string' ? JSON.parse(element.subtitle) : element.subtitle
                        if (!productsFiltered[label.category.category]) {
                            productsFiltered[label.category.category] = []
                        }
                        productsFiltered[label.category.category].push({
                            ...element,
                            label: label,
                            title: { ...title, options: element.meta?.productOptions || title.options || [] },
                            subtitle: subtitle,
                        })
                    }
                    } catch (_) { /* Um arquivo antigo inválido não oculta os demais produtos. */ }
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
                id: item.id,
                source: item.source,
                productId: item.productId
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
                title: { name: item.title.name, description: item.title.description },
                subtitle: item.subtitle,
                label: item.label,
                meta: { ...(item.meta || {}), productKind: item.meta?.productKind || 'other',
                    productOptions: item.meta?.productOptions || item.title.options || [] },
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
            .then(async (response) => {
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
                    try {
                        const { data: products } = await this.$api.get(`/commerce/stores/${this.$route.params.id}/products`)
                        const imageIds = new Set(products.map(product => Number(product.imageFileId)))
                        filtered.files.ecommerce = [...products.filter(product => product.active), ...filtered.files.ecommerce.filter(file => !imageIds.has(Number(file.id)))]
                    } catch (_) { /* Mantém o catálogo legado disponível durante a migração. */ }
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
        if (this.admin) {
            this.loadCommerceSettings()
            this.loadOrders()
            if (this.$route.query.pedidos === 'todos') this.openOrders()
        }
        console.log(this.adsComponent, id, this.admin)
        if (!this.admin) {
            this.$router.push(`/${this.$route.params.id}`)
        }

    },
};
</script>

<style scoped>
.product-type-card { width: min(100%, 440px); }
.product-type-option { display: flex; flex-direction: column; width: 100%; text-align: left; padding: 1rem; margin-bottom: 0.65rem; border: 1px solid #d1d5db; border-radius: 10px; background: white; }
.product-type-option strong { color: #1f2937; }
.product-type-option span { color: #6b7280; font-size: 0.875rem; }
.product-type-option:focus-visible { outline: 2px solid #059669; }
.commerce-panel { margin: 1.5rem 0; padding: 1.25rem; background: white; border: 1px solid #e5e7eb; border-radius: 12px; }
.commerce-panel h2 { font-size: 1.2rem; font-weight: 700; margin: 0 0 1rem; }
.commerce-panel p { margin: 1rem 0 0.5rem; }
.orders-dialog-content { max-width: 960px; margin: 0 auto; }
.orders-filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
@media (max-width: 600px) { .orders-filters { grid-template-columns: 1fr; } }
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
