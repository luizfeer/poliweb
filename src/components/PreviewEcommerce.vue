<template>
    <div class="preview-ecommerce" v-if="admin || (ecommercePreview && ecommercePreview.length)">
      <div class="preview-ecommerce-header">
        <h2 class="preview-ecommerce-title">Produtos</h2>
        <button type="button" class="preview-ecommerce-link" @click="goToLoja">
          Ver loja completa
          <AppIcon name="chevron-right" :size="18" />
        </button>
      </div>
      <div
        class="preview-ecommerce-slider"
        v-if="ecommercePreview && ecommercePreview.length > 0"
        @mouseenter="pauseAutoScroll"
        @mouseleave="resumeAutoScroll"
        @touchstart="pauseAutoScroll"
      >
        <button v-if="ecommercePreview.length > 1" type="button" class="preview-ecommerce-nav prev" @click="scrollProducts(-1)" title="Produtos anteriores">
          <AppIcon name="chevron-right" :size="18" />
        </button>
        <div ref="productScroller" class="preview-ecommerce-scroll" @scroll="syncScrollState">
          <div class="preview-ecommerce-card" v-for="item in ecommercePreview" :key="item.id" @click="goToLoja">
            <div class="preview-ecommerce-card-inner">
              <div class="preview-ecommerce-img" @click="goToLoja">
                <q-img :src="item.link" :ratio="1" fit="cover" />
              </div>
              <div class="preview-ecommerce-body">
                <h3 class="preview-ecommerce-name">{{ item.title.name }}</h3>
                <div class="preview-ecommerce-desc" v-if="item.title.description" v-html="safeHtml(item.title.description)"></div>
                <div class="preview-ecommerce-footer">
                  <p class="preview-ecommerce-price">R$ {{ item.subtitle.value }}</p>
                  <button type="button" class="preview-ecommerce-btn" :class="{ active: item.quantityCart > 0 }" @click.stop="onComprar(item)" title="Comprar">
                    <AppIcon name="add-shopping-cart" :size="18" />
                    <span v-if="item.quantityCart > 0" class="preview-ecommerce-qty">{{ item.quantityCart }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button v-if="ecommercePreview.length > 1" type="button" class="preview-ecommerce-nav next" @click="scrollProducts(1)" title="Próximos produtos">
          <AppIcon name="chevron-right" :size="18" />
        </button>
        <div v-if="totalPages > 1" class="preview-ecommerce-dots">
          <button
            v-for="index in totalPages"
            :key="index"
            type="button"
            class="preview-ecommerce-dot"
            :class="{ active: currentPage === index - 1 }"
            @click="scrollToPage(index - 1)"
          ></button>
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
            autoScrollTimer: null,
            autoScrollPaused: false,
            currentPage: 0,
            totalPages: 1,
        })

        return {
            ...toRefs(state),
        }
    },
    watch: {
        ecommercePreview() {
          this.$nextTick(() => {
            this.syncScrollState()
            this.startAutoScroll()
          })
        },
    },
    methods: {
        safeHtml(value) {
          return String(value || '')
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\son\w+="[^"]*"/gi, '')
            .replace(/\son\w+='[^']*'/gi, '')
            .replace(/\sjavascript:/gi, '')
        },
        startAutoScroll() {
          this.stopAutoScroll()
          this.$nextTick(() => {
            this.syncScrollState()
          })
          if (!this.ecommercePreview || this.ecommercePreview.length < 2) return
          this.autoScrollTimer = window.setInterval(() => {
            if (this.autoScrollPaused) return
            this.scrollProducts(1)
          }, 4500)
        },
        stopAutoScroll() {
          if (!this.autoScrollTimer) return
          window.clearInterval(this.autoScrollTimer)
          this.autoScrollTimer = null
        },
        pauseAutoScroll() {
          this.autoScrollPaused = true
        },
        resumeAutoScroll() {
          this.autoScrollPaused = false
        },
        getScrollStep() {
          const el = this.$refs.productScroller
          if (!el) return 180
          const card = el.querySelector('.preview-ecommerce-card')
          if (!card) return Math.max(el.clientWidth * 0.8, 180)
          const styles = window.getComputedStyle(el)
          const gap = parseFloat(styles.columnGap || styles.gap || 0) || 0
          return card.getBoundingClientRect().width + gap
        },
        scrollProducts(direction) {
          const el = this.$refs.productScroller
          if (!el) return
          const maxScroll = el.scrollWidth - el.clientWidth
          if (maxScroll <= 0) return
          const step = this.getScrollStep()
          let left = el.scrollLeft + (direction * step)
          if (direction > 0 && left >= maxScroll - 6) left = 0
          if (direction < 0 && left <= 6) left = maxScroll
          el.scrollTo({ left, behavior: 'smooth' })
        },
        scrollToPage(page) {
          const el = this.$refs.productScroller
          if (!el) return
          const maxScroll = el.scrollWidth - el.clientWidth
          const pages = Math.max(this.totalPages - 1, 1)
          el.scrollTo({ left: (maxScroll / pages) * page, behavior: 'smooth' })
        },
        syncScrollState() {
          const el = this.$refs.productScroller
          if (!el) {
            this.currentPage = 0
            this.totalPages = 1
            return
          }
          const maxScroll = el.scrollWidth - el.clientWidth
          this.totalPages = maxScroll > 0 ? Math.max(Math.ceil(el.scrollWidth / el.clientWidth), 1) : 1
          this.currentPage = maxScroll > 0 ? Math.round((el.scrollLeft / maxScroll) * (this.totalPages - 1)) : 0
        },
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
    },
    mounted() {
      window.addEventListener('resize', this.syncScrollState, { passive: true })
      this.$nextTick(() => this.syncScrollState())
      this.startAutoScroll()
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.syncScrollState)
      this.stopAutoScroll()
    }
}
</script>

<style scoped>
.preview-ecommerce {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.95rem 0;
  margin: 1rem 0;
}
.preview-ecommerce-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem 0.75rem;
}
.preview-ecommerce-title {
  font-size: 1rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
}
.preview-ecommerce-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #059669;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0;
  -webkit-tap-highlight-color: transparent;
}
.preview-ecommerce-slider {
  position: relative;
  padding: 0 1rem 0.5rem;
}
.preview-ecommerce-scroll {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 0 0.35rem;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.preview-ecommerce-scroll::-webkit-scrollbar {
  display: none;
}
.preview-ecommerce-card {
  flex: 0 0 calc((100% - 0.75rem) / 2);
  scroll-snap-align: start;
  cursor: pointer;
}
.preview-ecommerce-card-inner {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.preview-ecommerce-card-inner:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10), 0 2px 8px rgba(15, 23, 42, 0.05);
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
  object-fit: cover !important;
  object-position: center;
}
.preview-ecommerce-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}
.preview-ecommerce-name {
  font-size: 0.9rem;
  font-weight: 700;
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
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.preview-ecommerce-desc :deep(p),
.preview-ecommerce-desc :deep(ul),
.preview-ecommerce-desc :deep(ol) {
  margin: 0;
}
.preview-ecommerce-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.preview-ecommerce-price {
  font-size: 0.98rem;
  font-weight: 800;
  color: #059669;
  margin: 0;
  line-height: 1.2;
}
.preview-ecommerce-btn {
  position: relative;
  width: 36px;
  height: 36px;
  min-width: 36px;
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
.preview-ecommerce-btn:hover,
.preview-ecommerce-btn.active {
  background: #059669;
  border-color: #059669;
  color: white;
}
.preview-ecommerce-btn:active {
  transform: scale(0.94);
}
.preview-ecommerce-qty {
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
.preview-ecommerce-nav {
  position: absolute;
  top: 38%;
  z-index: 2;
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}
.preview-ecommerce-nav.prev {
  left: 0.35rem;
  transform: translateY(-50%) rotate(180deg);
}
.preview-ecommerce-nav.next {
  right: 0.35rem;
  transform: translateY(-50%);
}
.preview-ecommerce-dots {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
  padding-top: 0.65rem;
}
.preview-ecommerce-dot {
  width: 7px;
  height: 7px;
  border: 0;
  border-radius: 999px;
  background: #d1d5db;
  padding: 0;
  cursor: pointer;
  transition: width 0.2s ease, background 0.2s ease;
}
.preview-ecommerce-dot.active {
  width: 18px;
  background: #059669;
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
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.9375rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
@media (min-width: 640px) {
  .preview-ecommerce-card {
    flex-basis: calc((100% - 1.5rem) / 3);
  }
}
@media (min-width: 900px) {
  .preview-ecommerce-card {
    flex-basis: calc((100% - 2.25rem) / 4);
  }
}
</style>
