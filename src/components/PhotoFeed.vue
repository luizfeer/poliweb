<template>
  <div class="pf">
    <div v-if="loading" class="pf__loading">
      <q-spinner color="primary" size="32px" />
    </div>

    <div v-else-if="!posts.length" class="pf__empty">
      <q-icon name="photo_library" size="48px" color="grey-4" />
      <p>Nenhum post ainda</p>
    </div>

    <div v-else>
      <div class="pf__grid">
        <div
          v-for="(post, i) in posts"
          :key="post.id"
          class="pf__cell"
          @click="openAt(i)"
        >
          <img :src="post.link" :alt="caption(post)" loading="lazy" class="pf__img" />
          <div v-if="caption(post)" class="pf__badge">
            <q-icon name="chat_bubble" size="12px" />
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="pf__more">
        <q-btn flat no-caps color="primary" label="Ver mais" :loading="loadingMore" @click="loadMore" />
      </div>
    </div>

    <!-- Lightbox -->
    <q-dialog v-model="dialog" maximized transition-show="fade" transition-hide="fade">
      <div class="pf__lb" @click.self="dialog = false">
        <div class="pf__lb-card">
          <!-- Header -->
          <div class="pf__lb-header">
            <div class="pf__lb-avatar">{{ initials }}</div>
            <div class="pf__lb-meta">
              <span class="pf__lb-name">{{ adName }}</span>
              <span class="pf__lb-date">{{ formatDate(currentPost.createdAt) }}</span>
            </div>
            <q-btn flat round dense icon="close" color="grey-7" @click="dialog = false" />
          </div>

          <!-- Image -->
          <img :src="currentPost.link" :alt="caption(currentPost)" class="pf__lb-img" />

          <!-- Caption -->
          <div v-if="caption(currentPost)" class="pf__lb-caption">
            <span class="pf__lb-caption-name">{{ adName }}</span>
            {{ caption(currentPost) }}
          </div>

          <!-- Nav -->
          <div class="pf__lb-nav">
            <q-btn flat round dense icon="chevron_left" :disable="current === 0" @click="prev" />
            <span class="pf__lb-count">{{ current + 1 }} / {{ posts.length }}</span>
            <q-btn flat round dense icon="chevron_right" :disable="current === posts.length - 1" @click="next" />
          </div>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  props: {
    adId: { type: [Number, String], required: true },
    adName: { type: String, default: '' },
  },
  setup() {
    return {
      posts: ref([]),
      loading: ref(true),
      loadingMore: ref(false),
      hasMore: ref(false),
      offset: ref(0),
      dialog: ref(false),
      current: ref(0),
    }
  },
  computed: {
    currentPost() { return this.posts[this.current] || {} },
    initials() {
      return (this.adName || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    },
  },
  mounted() { this.fetch(true) },
  watch: {
    adId() { this.posts = []; this.offset = 0; this.fetch(true) },
  },
  methods: {
    async fetch(reset = false) {
      reset ? (this.loading = true, this.offset = 0) : (this.loadingMore = true)
      try {
        const { data } = await this.$api.get(`/categories/ads/${this.adId}/posts`, {
          params: { limit: 12, offset: this.offset },
        })
        this.posts = reset ? data : [...this.posts, ...data]
        this.hasMore = data.length === 12
        this.offset += data.length
      } catch { /* silent */ }
      finally { this.loading = false; this.loadingMore = false }
    },
    loadMore() { this.fetch(false) },
    openAt(i) { this.current = i; this.dialog = true },
    prev() { if (this.current > 0) this.current-- },
    next() { if (this.current < this.posts.length - 1) this.current++ },
    caption(post) {
      if (!post?.meta) return ''
      try {
        const m = typeof post.meta === 'string' ? JSON.parse(post.meta) : post.meta
        return m?.caption || ''
      } catch { return '' }
    },
    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    },
  },
}
</script>

<style scoped>
.pf__loading,
.pf__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  color: #94a3b8;
  font-size: 0.88rem;
}

.pf__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}

.pf__cell {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #f1f5f9;
}

.pf__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}

.pf__cell:hover .pf__img { transform: scale(1.04); }

.pf__badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0,0,0,0.55);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.pf__more {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

/* Lightbox */
.pf__lb {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.pf__lb-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.pf__lb-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.pf__lb-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.pf__lb-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pf__lb-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.pf__lb-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.pf__lb-img {
  width: 100%;
  max-height: 55vh;
  object-fit: contain;
  background: #000;
  display: block;
}

.pf__lb-caption {
  padding: 10px 14px;
  font-size: 0.875rem;
  color: #1e293b;
  line-height: 1.5;
  border-top: 1px solid #f1f5f9;
}

.pf__lb-caption-name {
  font-weight: 700;
  margin-right: 6px;
}

.pf__lb-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-top: 1px solid #f1f5f9;
}

.pf__lb-count {
  font-size: 0.8rem;
  color: #64748b;
}
</style>
