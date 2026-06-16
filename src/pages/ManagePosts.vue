<template>
  <q-page class="mp-page">
    <div class="mp-header">
      <q-btn flat round icon="arrow_back" @click="$router.back()" />
      <h1 class="mp-header__title">Fotos do perfil</h1>
      <q-btn flat round icon="add_a_photo" @click="triggerUpload" />
    </div>

    <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFilesSelected" />

    <!-- Upload preview queue -->
    <div v-if="uploadQueue.length" class="mp-queue">
      <div v-for="(item, i) in uploadQueue" :key="i" class="mp-queue__item">
        <img :src="item.preview" class="mp-queue__img" />
        <div class="mp-queue__info">
          <q-input
            v-model="item.caption"
            dense
            filled
            label="Legenda"
            autogrow
            class="mp-queue__caption"
          />
          <div class="mp-queue__actions">
            <q-btn flat no-caps dense color="negative" label="Remover" @click="removeFromQueue(i)" />
            <q-btn no-caps dense unelevated color="primary" label="Publicar" :loading="item.loading" @click="uploadPost(i)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Existing posts grid -->
    <div v-if="loading" class="mp-loading">
      <q-spinner color="primary" size="32px" />
    </div>

    <div v-else-if="!posts.length && !uploadQueue.length" class="mp-empty">
      <q-icon name="photo_library" size="56px" color="grey-4" />
      <p>Nenhuma foto publicada. Toque em <b>+</b> para adicionar.</p>
    </div>

    <div v-else class="mp-grid">
      <div v-for="post in posts" :key="post.id" class="mp-grid__item" @click="openEdit(post)">
        <img :src="post.link" :alt="postCaption(post)" loading="lazy" class="mp-grid__img" />
        <div class="mp-grid__overlay">
          <q-icon name="edit" size="20px" color="white" />
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="mp-more">
      <q-btn flat no-caps color="primary" label="Ver mais" :loading="loadingMore" @click="loadMore" />
    </div>

    <!-- Edit dialog -->
    <q-dialog v-model="editDialog">
      <q-card class="mp-edit-card">
        <q-card-section class="mp-edit-card__img-wrap">
          <img :src="editPost.link" class="mp-edit-card__img" />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="editCaption"
            filled
            label="Legenda"
            autogrow
            type="textarea"
          />
        </q-card-section>
        <q-card-actions align="between">
          <q-btn flat no-caps color="negative" label="Excluir" :loading="deleting" @click="deletePost" />
          <div class="row gap-2">
            <q-btn flat no-caps label="Cancelar" @click="editDialog = false" />
            <q-btn no-caps unelevated color="primary" label="Salvar" :loading="saving" @click="saveEdit" />
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
      uploadQueue: ref([]),
      editDialog: ref(false),
      editPost: ref({}),
      editCaption: ref(''),
      saving: ref(false),
      deleting: ref(false),
    }
  },
  computed: {
    adId() {
      return this.$route.params.id
    },
  },
  mounted() {
    this.fetchPosts(true)
  },
  methods: {
    async fetchPosts(reset = false) {
      if (reset) { this.loading = true; this.offset = 0 }
      else this.loadingMore = true

      try {
        const res = await this.$api.get(`/categories/ads/${this.adId}/posts`, {
          params: { limit: 12, offset: this.offset },
        })
        const data = res.data || []
        this.posts = reset ? data : [...this.posts, ...data]
        this.hasMore = data.length === 12
        this.offset += data.length
      } catch (e) {
        this.$q.notify({ color: 'negative', position: 'top', message: 'Erro ao carregar fotos' })
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    loadMore() { this.fetchPosts(false) },
    triggerUpload() { this.$refs.fileInput.click() },
    onFilesSelected(e) {
      const files = Array.from(e.target.files || [])
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          this.uploadQueue.push({ file, preview: ev.target.result, caption: '', loading: false })
        }
        reader.readAsDataURL(file)
      })
      e.target.value = ''
    },
    removeFromQueue(i) { this.uploadQueue.splice(i, 1) },
    async uploadPost(i) {
      const item = this.uploadQueue[i]
      item.loading = true

      const form = new FormData()
      form.append('file', item.file)

      try {
        const meta = item.caption ? JSON.stringify({ caption: item.caption }) : null
        const params = meta ? `?meta=${encodeURIComponent(meta)}` : ''
        await this.$api.post(`/categories/ads/${this.adId}/files/post${params}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        this.$q.notify({ color: 'secondary', position: 'top', message: 'Foto publicada!' })
        this.uploadQueue.splice(i, 1)
        this.fetchPosts(true)
      } catch (e) {
        const msg = e.response?.data?.message || 'Erro ao publicar'
        this.$q.notify({ color: 'negative', position: 'top', message: msg })
        item.loading = false
      }
    },
    postCaption(post) {
      if (!post?.meta) return ''
      try {
        const m = typeof post.meta === 'string' ? JSON.parse(post.meta) : post.meta
        return m?.caption || ''
      } catch { return '' }
    },
    openEdit(post) {
      this.editPost = post
      this.editCaption = this.postCaption(post)
      this.editDialog = true
    },
    async saveEdit() {
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
      } catch (e) {
        const msg = e.response?.data?.message || 'Erro ao salvar'
        this.$q.notify({ color: 'negative', position: 'top', message: msg })
      } finally {
        this.saving = false
      }
    },
    async deletePost() {
      this.$q.dialog({
        title: 'Excluir foto',
        message: 'Tem certeza que deseja excluir esta foto?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        this.deleting = true
        try {
          await this.$api.delete(`/categories/ads/files/${this.editPost.id}`)
          this.$q.notify({ color: 'secondary', position: 'top', message: 'Foto excluída' })
          this.editDialog = false
          this.fetchPosts(true)
        } catch {
          this.$q.notify({ color: 'negative', position: 'top', message: 'Erro ao excluir' })
        } finally {
          this.deleting = false
        }
      })
    },
  },
}
</script>

<style scoped>
.mp-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 0 40px;
}

.mp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 4px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.mp-header__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.mp-queue {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 12px 0;
}

.mp-queue__item {
  display: flex;
  gap: 12px;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.mp-queue__img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  flex-shrink: 0;
}

.mp-queue__info {
  flex: 1;
  padding: 8px 8px 8px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mp-queue__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.mp-loading,
.mp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 16px;
  color: #94a3b8;
  text-align: center;
  font-size: 0.9rem;
}

.mp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  margin-top: 2px;
}

.mp-grid__item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #f1f5f9;
}

.mp-grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}

.mp-grid__item:hover .mp-grid__img {
  transform: scale(1.04);
}

.mp-grid__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.mp-grid__item:hover .mp-grid__overlay {
  opacity: 1;
}

.mp-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.mp-edit-card {
  width: 100%;
  max-width: 480px;
  border-radius: 12px;
}

.mp-edit-card__img-wrap {
  padding: 0;
}

.mp-edit-card__img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  background: #000;
  display: block;
}

.hidden {
  display: none;
}
</style>
