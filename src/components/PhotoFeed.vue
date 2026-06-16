<template>
  <div class="photo-feed">
    <div v-if="loading" class="photo-feed__loading">
      <q-spinner color="primary" size="32px" />
    </div>

    <div v-else-if="!posts.length" class="photo-feed__empty">
      <q-icon name="photo_library" size="48px" color="grey-4" />
      <p>Nenhuma foto publicada ainda</p>
    </div>

    <div v-else>
      <div class="photo-feed__grid">
        <div
          v-for="(post, i) in posts"
          :key="post.id"
          class="photo-feed__item"
          @click="openAt(i)"
        >
          <img :src="post.link" :alt="postCaption(post)" loading="lazy" class="photo-feed__img" />
          <div v-if="postCaption(post)" class="photo-feed__overlay">
            <q-icon name="chat_bubble_outline" size="16px" />
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="photo-feed__load-more">
        <q-btn flat no-caps color="primary" label="Ver mais" :loading="loadingMore" @click="loadMore" />
      </div>
    </div>

    <!-- Lightbox -->
    <q-dialog v-model="dialog" maximized>
      <div class="photo-feed__lightbox" @click.self="dialog = false">
        <q-btn round flat color="white" icon="close" class="photo-feed__lightbox-close" @click="dialog = false" />

        <div class="photo-feed__lightbox-content">
          <q-btn round flat color="white" icon="chevron_left" class="photo-feed__nav photo-feed__nav--left" @click="prev" :disable="current === 0" />

          <div class="photo-feed__lightbox-inner">
            <img :src="currentPost.link" :alt="postCaption(currentPost)" class="photo-feed__lightbox-img" />
            <div v-if="postCaption(currentPost) || currentPost.title" class="photo-feed__lightbox-caption">
              <p v-if="currentPost.title" class="photo-feed__lightbox-title">{{ currentPost.title }}</p>
              <p v-if="postCaption(currentPost)" class="photo-feed__lightbox-desc">{{ postCaption(currentPost) }}</p>
              <p class="photo-feed__lightbox-date">{{ formatDate(currentPost.createdAt) }}</p>
            </div>
          </div>

          <q-btn round flat color="white" icon="chevron_right" class="photo-feed__nav photo-feed__nav--right" @click="next" :disable="current === posts.length - 1" />
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  props: {
    adId: { type: [Number, String], required: true },
  },
  setup(props) {
    const posts = ref([])
    const loading = ref(true)
    const loadingMore = ref(false)
    const offset = ref(0)
    const hasMore = ref(false)
    const dialog = ref(false)
    const current = ref(0)
    const LIMIT = 12

    return { posts, loading, loadingMore, offset, hasMore, dialog, current, LIMIT }
  },
  computed: {
    currentPost() {
      return this.posts[this.current] || {}
    },
  },
  mounted() {
    this.fetchPosts(true)
  },
  watch: {
    adId() {
      this.posts = []
      this.offset = 0
      this.fetchPosts(true)
    },
  },
  methods: {
    async fetchPosts(reset = false) {
      if (reset) {
        this.loading = true
        this.offset = 0
      } else {
        this.loadingMore = true
      }

      try {
        const res = await this.$api.get(`/categories/ads/${this.adId}/posts`, {
          params: { limit: this.LIMIT, offset: this.offset },
        })
        const data = res.data || []
        if (reset) {
          this.posts = data
        } else {
          this.posts = [...this.posts, ...data]
        }
        this.hasMore = data.length === this.LIMIT
        this.offset += data.length
      } catch {
        // silent
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    loadMore() {
      this.fetchPosts(false)
    },
    openAt(i) {
      this.current = i
      this.dialog = true
    },
    prev() {
      if (this.current > 0) this.current--
    },
    next() {
      if (this.current < this.posts.length - 1) this.current++
    },
    postCaption(post) {
      if (!post?.meta) return ''
      try {
        const m = typeof post.meta === 'string' ? JSON.parse(post.meta) : post.meta
        return m?.caption || ''
      } catch {
        return ''
      }
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    },
  },
}
</script>

<style scoped>
.photo-feed__loading,
.photo-feed__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.photo-feed__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}

.photo-feed__item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #f1f5f9;
}

.photo-feed__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}

.photo-feed__item:hover .photo-feed__img {
  transform: scale(1.04);
}

.photo-feed__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-feed__item:hover .photo-feed__overlay {
  opacity: 1;
}

.photo-feed__load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.photo-feed__lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.photo-feed__lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}

.photo-feed__lightbox-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 600px;
  padding: 0 8px;
}

.photo-feed__lightbox-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.photo-feed__lightbox-img {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
}

.photo-feed__lightbox-caption {
  width: 100%;
  background: #fff;
  padding: 12px 16px;
}

.photo-feed__lightbox-title {
  margin: 0 0 4px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #0f172a;
}

.photo-feed__lightbox-desc {
  margin: 0 0 4px;
  font-size: 0.85rem;
  color: #334155;
  white-space: pre-line;
}

.photo-feed__lightbox-date {
  margin: 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.photo-feed__nav {
  flex-shrink: 0;
}
</style>
