<template>
  <q-page class="mp">
    <div class="mp-header">
      <q-btn flat round dense icon="arrow_back" color="grey-8" @click="$router.back()" />
      <span class="mp-header__title">Posts</span>
      <q-btn unelevated round dense icon="add_a_photo" color="primary" @click="$refs.fileInput.click()" />
    </div>

    <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFiles" />

    <!-- Fila de upload -->
    <div v-if="queue.length" class="mp-queue">
      <div v-for="(item, i) in queue" :key="i" class="mp-queue__item">
        <img :src="item.preview" class="mp-queue__img" />
        <div class="mp-queue__body">
          <q-input
            v-model="item.caption"
            dense
            outlined
            label="Legenda"
            type="textarea"
            autogrow
            class="mp-queue__input"
          />
          <div class="mp-queue__actions">
            <q-btn flat no-caps dense color="negative" label="Remover" size="sm" @click="queue.splice(i, 1)" />
            <q-btn unelevated no-caps dense color="primary" label="Publicar" size="sm" :loading="item.loading" @click="publish(i)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Grid de posts -->
    <div v-if="loading" class="mp-loading">
      <q-spinner color="primary" size="32px" />
    </div>
    <div v-else-if="!posts.length && !queue.length" class="mp-empty">
      <q-icon name="photo_library" size="56px" color="grey-4" />
      <p>Nenhum post. Toque em <q-icon name="add_a_photo" size="16px" /> para publicar.</p>
    </div>
    <div v-else class="mp-grid">
      <div v-for="post in posts" :key="post.id" class="mp-cell" @click="openEdit(post)">
        <img :src="post.link" class="mp-cell__img" loading="lazy" />
        <div v-if="caption(post)" class="mp-cell__badge">
          <q-icon name="chat_bubble" size="11px" />
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="mp-more">
      <q-btn flat no-caps color="primary" label="Ver mais" :loading="loadingMore" @click="loadMore" />
    </div>

    <!-- Modal editar -->
    <q-dialog v-model="editDialog">
      <q-card class="mp-edit">
        <img :src="editPost.link" class="mp-edit__img" />
        <q-card-section class="q-pt-sm q-pb-sm">
          <q-input v-model="editCaption" outlined label="Legenda" type="textarea" autogrow />
        </q-card-section>
        <q-card-actions class="q-pt-none" align="between">
          <q-btn flat no-caps color="negative" label="Excluir" :loading="deleting" @click="remove" />
          <div class="row q-gutter-sm">
            <q-btn flat no-caps label="Cancelar" @click="editDialog = false" />
            <q-btn unelevated no-caps color="primary" label="Salvar" :loading="saving" @click="save" />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    return {
      posts: ref([]),
      loading: ref(true),
      loadingMore: ref(false),
      hasMore: ref(false),
      offset: ref(0),
      queue: ref([]),
      editDialog: ref(false),
      editPost: ref({}),
      editCaption: ref(''),
      saving: ref(false),
      deleting: ref(false),
    }
  },
  computed: {
    adId() { return this.$route.params.id },
  },
  mounted() { this.fetchPosts(true) },
  methods: {
    async fetchPosts(reset = false) {
      reset ? (this.loading = true, this.offset = 0) : (this.loadingMore = true)
      try {
        const { data } = await this.$api.get(`/categories/ads/${this.adId}/posts`, {
          params: { limit: 12, offset: this.offset },
        })
        this.posts = reset ? data : [...this.posts, ...data]
        this.hasMore = data.length === 12
        this.offset += data.length
      } catch {
        this.$q.notify({ color: 'negative', position: 'top', message: 'Erro ao carregar posts' })
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    loadMore() { this.fetchPosts(false) },
    onFiles(e) {
      Array.from(e.target.files || []).forEach(file => {
        const reader = new FileReader()
        reader.onload = ev => this.queue.push({ file, preview: ev.target.result, caption: '', loading: false })
        reader.readAsDataURL(file)
      })
      e.target.value = ''
    },
    async publish(i) {
      const item = this.queue[i]
      item.loading = true
      const form = new FormData()
      form.append('file', item.file)
      try {
        // Upload the file with type=post
        const uploadRes = await this.$api.post(
          `/categories/ads/${this.adId}/files/post`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        // Save caption via update if provided
        if (item.caption.trim() && uploadRes.data?.id) {
          await this.$api.post(`/categories/ads/files/${uploadRes.data.id}`, {
            title: null,
            subtitle: null,
            label: null,
            meta: { caption: item.caption.trim() },
          })
        }
        this.$q.notify({ color: 'secondary', position: 'top', message: 'Post publicado!' })
        this.queue.splice(i, 1)
        this.fetchPosts(true)
      } catch (e) {
        this.$q.notify({ color: 'negative', position: 'top', message: e.response?.data?.message || 'Erro ao publicar' })
        item.loading = false
      }
    },
    caption(post) {
      if (!post?.meta) return ''
      try {
        const m = typeof post.meta === 'string' ? JSON.parse(post.meta) : post.meta
        return m?.caption || ''
      } catch { return '' }
    },
    openEdit(post) {
      this.editPost = post
      this.editCaption = this.caption(post)
      this.editDialog = true
    },
    async save() {
      this.saving = true
      try {
        await this.$api.post(`/categories/ads/files/${this.editPost.id}`, {
          title: this.editPost.title || null,
          subtitle: this.editPost.subtitle || null,
          label: this.editPost.label || null,
          meta: { caption: this.editCaption },
        })
        this.$q.notify({ color: 'secondary', position: 'top', message: 'Salvo!' })
        this.editDialog = false
        this.fetchPosts(true)
      } catch {
        this.$q.notify({ color: 'negative', position: 'top', message: 'Erro ao salvar' })
      } finally { this.saving = false }
    },
    remove() {
      this.$q.dialog({ title: 'Excluir post', message: 'Tem certeza?', cancel: true }).onOk(async () => {
        this.deleting = true
        try {
          await this.$api.delete(`/categories/ads/files/${this.editPost.id}`)
          this.$q.notify({ color: 'secondary', position: 'top', message: 'Post excluído' })
          this.editDialog = false
          this.fetchPosts(true)
        } catch {
          this.$q.notify({ color: 'negative', position: 'top', message: 'Erro ao excluir' })
        } finally { this.deleting = false }
      })
    },
  },
}
</script>

<style scoped>
.mp { max-width: 600px; margin: 0 auto; padding-bottom: 40px; }

.mp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  border-bottom: 1px solid #f1f5f9;
}

.mp-header__title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.mp-queue {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.mp-queue__item {
  display: flex;
  gap: 12px;
  background: #f8fafc;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.mp-queue__img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  flex-shrink: 0;
}

.mp-queue__body {
  flex: 1;
  padding: 10px 10px 10px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mp-queue__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.mp-loading, .mp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 16px;
  color: #94a3b8;
  text-align: center;
  font-size: 0.88rem;
}

.mp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}

.mp-cell {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #f1f5f9;
}

.mp-cell__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}

.mp-cell:hover .mp-cell__img { transform: scale(1.04); }

.mp-cell__badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0,0,0,0.55);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.mp-more { display: flex; justify-content: center; margin-top: 12px; }

.mp-edit { width: 100%; max-width: 480px; border-radius: 12px; overflow: hidden; }

.mp-edit__img {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  background: #000;
  display: block;
}

.hidden { display: none; }
</style>
