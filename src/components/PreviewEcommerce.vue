<template>
    <div class="preview-ecommerce" v-if="admin || (ecommercePreview && ecommercePreview.length)">
      <div class="preview-ecommerce-header">
        <h2 class="preview-ecommerce-title">Produtos</h2>
        <button type="button" class="preview-ecommerce-link" @click="goToLoja">
          Ver loja completa
          <AppIcon name="chevron-right" :size="18" />
        </button>
      </div>
      <div class="preview-ecommerce-scroll" v-if="ecommercePreview && ecommercePreview.length > 0">
        <div class="preview-ecommerce-card" v-for="item in ecommercePreview" :key="item.id" @click="goToLoja">
          <div class="preview-ecommerce-card-inner" @click.stop>
            <div class="preview-ecommerce-img" @click="goToLoja">
              <q-img :src="item.link" :ratio="1" />
            </div>
            <div class="preview-ecommerce-body">
              <h3 class="preview-ecommerce-name">{{ item.title.name }}</h3>
              <p class="preview-ecommerce-desc" v-if="item.title.description">{{ item.title.description }}</p>
              <p class="preview-ecommerce-price">R$ {{ item.subtitle.value }}</p>
              <q-btn flat :color="item.quantityCart > 0 ? 'secondary' : 'primary'" size="sm" class="preview-ecommerce-btn" @click.stop="onComprar(item)">
                <q-badge v-if="item.quantityCart > 0" color="primary" floating>{{ item.quantityCart }}</q-badge>
                Comprar
              </q-btn>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="admin" class="preview-ecommerce-empty" @click="goToLoja">
        <AppIcon name="add-shopping-cart" :size="32" class="text-gray-400" />
        <span>Adicionar produtos à loja</span>
      </div>
    </div>
</template>

<script>
import {
    reactive,
    toRefs
} from 'vue'

export default {
    props: {
      ecommercePreview: {
          type: Array
      },
      admin: {
          type: Boolean,
          default: false
      },
      addToCart: {
          type: Function,
          default: null
      }
    },
    setup() {
        const state = reactive({
            count: 0,
        })

        return {
            ...toRefs(state),
        }
    },
    methods: {
        goToLoja() {
          const id = this.$route.params.id
          if (this.admin) {
            this.$router.push(`/ecommerce/${id}`)
          } else {
            this.$router.push(`/loja/${id}`)
          }
        },
        onComprar(item) {
          if (this.addToCart) {
            this.addToCart(item)
          } else {
            this.goToLoja()
          }
        }
    }
}
</script>

<style scoped>
.preview-ecommerce {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  margin: 1rem 0;
}
.preview-ecommerce-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem 0.75rem;
}
.preview-ecommerce-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}
.preview-ecommerce-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #059669;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
  -webkit-tap-highlight-color: transparent;
}
.preview-ecommerce-scroll {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 1rem 0.5rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.preview-ecommerce-scroll::-webkit-scrollbar {
  display: none;
}
.preview-ecommerce-card {
  flex-shrink: 0;
  width: 160px;
  cursor: pointer;
}
.preview-ecommerce-card-inner {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.preview-ecommerce-img {
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}
.preview-ecommerce-img :deep(.q-img__content) {
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-ecommerce-img :deep(img) {
  object-fit: contain !important;
  object-position: center;
}
.preview-ecommerce-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.preview-ecommerce-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview-ecommerce-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview-ecommerce-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #059669;
  margin: 0;
}
.preview-ecommerce-btn {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
}
.preview-ecommerce-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  margin: 0 1rem;
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  color: #6b7280;
  font-size: 0.9375rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
