<template>
  <div v-if="addressId" class="section mt-6">
    <h2 class="section-title mb-3">Vídeos recentes</h2>
    <p class="text-xs text-gray-500 mb-3">
      Assista aos vídeos dos comércios da sua cidade.
    </p>
    <div v-if="loading" class="recent-videos-scroll-wrapper">
      <div class="recent-videos-scroll flex pb-2 -mb-2">
        <div v-for="i in 4" :key="'sk-' + i" class="recent-video-skeleton flex-shrink-0 w-[200px] h-[260px] rounded-xl bg-gray-100 animate-pulse" />
      </div>
    </div>
    <div v-else-if="videos.length" class="recent-videos-scroll-wrapper">
      <div class="recent-videos-scroll flex pb-2 -mb-2">
      <div
        v-for="(video, i) in videosWithId"
        :key="video.id"
        class="recent-video-card flex-shrink-0"
        @click="openStoryAt(i)"
      >
          <div class="recent-video-header">
            <div class="recent-video-avatar">
              <q-img
                v-if="video.avatarLink || video.ad?.avatarLink"
                :src="video.avatarLink || video.ad?.avatarLink"
                class="avatar-img"
                ratio="1"
                spinner-color="gray-300"
                spinner-size="20px"
              />
              <div v-else class="avatar-placeholder">
                <AppIcon name="storefront" :size="20" class="text-gray-400" />
              </div>
            </div>
            <span class="recent-video-name">{{ video.ad?.name || 'Comércio' }}</span>
            <a
              v-if="video.ad?.whatsappPhone"
              :href="whatsappLink(video.ad.whatsappPhone)"
              target="_blank"
              rel="noopener noreferrer"
              class="recent-video-wa"
              @click.stop
            >
              <AppIcon name="whatsapp" :size="20" class="text-green-600" />
            </a>
          </div>
          <div class="recent-video-thumb">
            <img
              v-if="videoThumbs[video.id]"
              :src="videoThumbs[video.id]"
              class="recent-video-thumb-img"
              alt=""
            />
            <video
              v-else-if="video.link && !videoThumbFailed[video.id]"
              :data-video-id="video.id"
              :src="video.link"
              preload="auto"
              muted
              playsinline
              class="recent-video-thumb-video"
              @loadeddata="captureVideoThumb"
              @error="onVideoThumbError"
            />
            <div v-else class="recent-video-thumb-placeholder">
              <AppIcon name="videocam" :size="32" class="text-gray-400" />
            </div>
            <div class="recent-video-play-overlay">
              <AppIcon name="play-circle-filled" :size="48" class="text-white opacity-90" />
            </div>
            <span v-if="video.createdAt" class="recent-video-time">{{ timeAgo(video.createdAt) }}</span>
          </div>
          <p v-if="addressSummary(video.ad)" class="recent-video-address">{{ addressSummary(video.ad) }}</p>
      </div>
      </div>
    </div>
    <p v-else-if="!loading && addressId" class="text-sm text-gray-500 py-4">Nenhum vídeo disponível na sua cidade.</p>

    <!-- Story viewer - formato Stories como no Ads -->
    <q-dialog v-model="storyOpen" maximized transition-show="fade" transition-hide="fade" class="story-dialog">
      <div class="story-container" @touchstart="onStoryTouchStart" @touchend="onStoryTouchEnd">
        <div class="story-gradient-top" aria-hidden="true" />
        <div class="story-bars">
          <div v-for="(v, i) in videosWithId" :key="v.id" class="story-bar">
            <div
              class="story-bar-fill"
              :style="{ width: i < storyIndex ? '100%' : i === storyIndex ? storyProgress + '%' : '0%' }"
            />
          </div>
        </div>
        <div class="story-header">
          <div class="story-header-avatar">
            <img v-if="currentStoryAvatar" :src="currentStoryAvatar" class="story-avatar-img" />
            <div v-else class="story-avatar-fallback">
              {{ (currentStoryAd?.name || '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?' }}
            </div>
          </div>
          <div class="story-header-name-wrap">
            <button
              type="button"
              class="story-header-name story-header-name-btn"
              @click.stop="goToAd"
            >
              {{ currentStoryAd?.name || 'Comércio' }}
            </button>
            <span v-if="videosWithId[storyIndex]?.createdAt" class="story-header-time">{{ timeAgo(videosWithId[storyIndex].createdAt) }}</span>
          </div>
          <a
            v-if="currentStoryAd?.whatsappPhone"
            :href="whatsappLink(currentStoryAd.whatsappPhone)"
            target="_blank"
            rel="noopener noreferrer"
            class="story-wa-btn"
            @click.stop
          >
            <AppIcon name="whatsapp" :size="22" class="text-white" />
          </a>
          <button class="story-close-btn" @click="closeStory">✕</button>
        </div>
        <video
          ref="storyVideo"
          class="story-video"
          playsinline
          autoplay
          :src="videosWithId[storyIndex]?.link"
          @ended="nextStory"
          @timeupdate="updateStoryProgress"
        />
        <p v-if="addressSummary(currentStoryAd)" class="story-address">{{ addressSummary(currentStoryAd) }}</p>
        <div class="story-tap-prev" @click="prevStory" />
        <div class="story-tap-next" @click="nextStory" />
        <div class="story-controls">
          <button class="story-ctrl-btn" @click.stop="toggleStoryPause">
            <AppIcon :name="storyPaused ? 'play' : 'pause'" :size="28" class="text-white" />
          </button>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script>
import AppIcon from 'components/AppIcon.vue'
import { timeAgo } from 'src/js/timeAgo'
import { loadVideoThumbs, setVideoThumb } from 'src/services/videoThumbs'

export default {
  name: 'RecentVideosWidget',
  components: {
    AppIcon,
  },
  props: {
    addressId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      videos: [],
      loading: false,
      storyOpen: false,
      storyIndex: 0,
      storyProgress: 0,
      storyPaused: false,
      videoThumbs: {},
      videoThumbFailed: {},
      fetchGen: 0,
    }
  },
  beforeUnmount() {
    this.fetchGen = -1
  },
  computed: {
    videosWithId() {
      return this.videos.filter((v) => v && v.id != null)
    },
    currentStoryAd() {
      return this.videosWithId[this.storyIndex]?.ad || null
    },
    currentStoryAvatar() {
      const v = this.videosWithId[this.storyIndex]
      return v?.avatarLink || v?.ad?.avatarLink || null
    },
  },
  watch: {
    addressId: {
      immediate: true,
      handler(id, oldId) {
        if (id === oldId && oldId !== undefined) return
        if (id) {
          this.loadFromCache(id)
          this.fetchVideos()
        } else {
          this.videos = []
          this.videoThumbs = {}
          this.videoThumbFailed = {}
        }
      },
    },
    videos: {
      async handler() {
        if (this.fetchGen >= 0) {
          this.videoThumbs = {}
          this.videoThumbFailed = {}
          const ids = this.videosWithId.map((v) => v.id)
          if (ids.length) {
            const cached = await loadVideoThumbs(ids)
            if (this.fetchGen >= 0 && Object.keys(cached).length) {
              this.videoThumbs = { ...this.videoThumbs, ...cached }
            }
          }
        }
      },
    },
  },
  methods: {
    timeAgo,
    openStoryAt(index) {
      this.storyIndex = index
      this.storyProgress = 0
      this.storyPaused = false
      this.storyOpen = true
      this.$nextTick(() => {
        if (this.$refs.storyVideo) {
          this.$refs.storyVideo.load()
          this.$refs.storyVideo.play().catch(() => {})
        }
      })
    },
    closeStory() {
      this.storyOpen = false
      if (this.$refs.storyVideo) {
        this.$refs.storyVideo.pause()
      }
    },
    nextStory() {
      if (this.storyIndex < this.videosWithId.length - 1) {
        this.storyIndex++
        this.storyProgress = 0
        this.storyPaused = false
        this.$nextTick(() => {
          if (this.$refs.storyVideo) {
            this.$refs.storyVideo.load()
            this.$refs.storyVideo.play().catch(() => {})
          }
        })
      } else {
        this.closeStory()
      }
    },
    prevStory() {
      if (this.storyIndex > 0) {
        this.storyIndex--
        this.storyProgress = 0
        this.storyPaused = false
        this.$nextTick(() => {
          if (this.$refs.storyVideo) {
            this.$refs.storyVideo.load()
            this.$refs.storyVideo.play().catch(() => {})
          }
        })
      }
    },
    toggleStoryPause() {
      const v = this.$refs.storyVideo
      if (!v) return
      if (this.storyPaused) {
        v.play().catch(() => {})
        this.storyPaused = false
      } else {
        v.pause()
        this.storyPaused = true
      }
    },
    updateStoryProgress() {
      const v = this.$refs.storyVideo
      if (!v || !v.duration) return
      this.storyProgress = (v.currentTime / v.duration) * 100
    },
    onStoryTouchStart(e) {
      this._touchStartX = e.touches[0].clientX
    },
    onStoryTouchEnd(e) {
      if (this._touchStartX == null) return
      const dx = e.changedTouches[0].clientX - this._touchStartX
      if (Math.abs(dx) > 50) {
        dx < 0 ? this.nextStory() : this.prevStory()
      }
      this._touchStartX = null
    },
    captureVideoThumb(e) {
      if (this.fetchGen < 0) return
      const video = e.target
      const id = video.dataset.videoId
      if (!id || this.videoThumbs[id]) return
      const seek = () => {
        video.removeEventListener('seeked', onSeeked)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          if (this.fetchGen >= 0) {
            this.videoThumbs = { ...this.videoThumbs, [id]: dataUrl }
            setVideoThumb(id, dataUrl)
          }
        } catch (err) {
          this.onVideoThumbError({ target: video })
        }
      }
      const onSeeked = () => seek()
      video.addEventListener('seeked', onSeeked)
      const t = video.duration > 0 ? Math.min(1, video.duration * 0.1) : 0.5
      video.currentTime = t
    },
    onVideoThumbError(e) {
      if (this.fetchGen < 0) return
      const id = e.target?.dataset?.videoId
      if (id) {
        this.videoThumbFailed = { ...this.videoThumbFailed, [id]: true }
      }
    },
    goToAd() {
      const video = this.videosWithId[this.storyIndex]
      const adId = video?.categoryAdId
      const name = video?.ad?.name
      if (!adId) return
      this.closeStory()
      const slug = name
        ? encodeURIComponent(name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase())
        : ''
      this.$router.push(slug ? `/${adId}/${slug}` : `/${adId}`)
    },
    whatsappLink(phone) {
      const n = String(phone).replace(/\D/g, '')
      return `https://wa.me/${n}`
    },
    addressSummary(ad) {
      if (!ad?.address) return ''
      const a = ad.address
      const parts = []
      if (a.street) parts.push(a.street)
      if (a.number) parts.push(a.number)
      if (a.neighborhood) parts.push(a.neighborhood)
      if (a.city) parts.push(a.city)
      return parts.length ? parts.join(', ') : ''
    },
    loadFromCache(addressId) {
      try {
        const key = `cityVideos_${addressId}`
        const cached = localStorage.getItem(key)
        if (cached) {
          const parsed = JSON.parse(cached)
          this.videos = Array.isArray(parsed) ? parsed : []
        }
      } catch (_) {
        this.videos = []
      }
    },
    async fetchVideos() {
      if (!this.addressId || !this.$api) return
      const fetchId = ++this.fetchGen
      if (!this.videos.length) this.loading = true
      try {
        const response = await this.$api.get(`/cities/${this.addressId}/videos`)
        if (this.fetchGen < 0 || fetchId !== this.fetchGen) return
        const raw = response?.data?.videos ?? []
        const list = Array.isArray(raw) ? raw : []
        this.videos = list
        try {
          localStorage.setItem(`cityVideos_${this.addressId}`, JSON.stringify(list))
        } catch (_) {}
      } catch (err) {
        if (this.fetchGen < 0 || fetchId !== this.fetchGen) return
        const msg = err?.response?.data?.message || 'Erro ao carregar vídeos'
        this.$q.notify({ color: 'negative', position: 'top', message: msg, icon: 'report_problem' })
        this.videos = []
      } finally {
        if (this.fetchGen >= 0 && fetchId === this.fetchGen) this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.recent-videos-scroll-wrapper {
  margin-left: -1rem;
  margin-right: -1rem;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.recent-videos-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.recent-videos-scroll {
  display: flex;
  flex-wrap: nowrap;
  padding-left: 1rem;
  padding-right: 1rem;
  gap: 0.75rem;
}

.recent-video-card {
  display: flex;
  flex-direction: column;
  width: 200px;
  min-width: 200px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
}

.recent-video-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.recent-video-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 8px;
}

.recent-video-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #f3f4f6;
}

.recent-video-avatar .avatar-img,
.recent-video-avatar :deep(.q-img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recent-video-name {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-video-wa {
  flex-shrink: 0;
  padding: 4px;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
}

.recent-video-wa:active {
  background: rgba(34, 197, 94, 0.15);
}

.recent-video-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #f3f4f6;
}

.recent-video-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.recent-video-thumb-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #1a1a1a;
}

.recent-video-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
}

.recent-video-play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
}

.recent-video-time {
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  z-index: 2;
}

.recent-video-address {
  font-size: 0.7rem;
  color: #6b7280;
  margin: 0;
  padding: 6px 10px 10px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Story viewer */
.story-dialog :deep(.q-dialog__inner) {
  padding: 0 !important;
}
.story-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
}
.story-gradient-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 140px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.65) 0%, transparent 100%);
  pointer-events: none;
  z-index: 5;
}
.story-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.story-bars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 4px;
  padding: 10px 10px 0;
  z-index: 10;
}
.story-bar {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  overflow: hidden;
}
.story-bar-fill {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  transition: width 0.25s linear;
}
.story-header {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  z-index: 10;
}
.story-header-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}
.story-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.story-avatar-fallback {
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
}
.story-header-name-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.story-header-name {
  flex: 1;
  color: #fff;
  font-weight: 600;
  font-size: 1.15rem;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.story-header-time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.story-header-name-btn {
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.story-header-name-btn:active {
  opacity: 0.85;
}
.story-wa-btn {
  flex-shrink: 0;
  padding: 6px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.9);
  -webkit-tap-highlight-color: transparent;
}
.story-close-btn {
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  flex-shrink: 0;
}
.story-address {
  position: absolute;
  bottom: 60px;
  left: 12px;
  right: 12px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.8rem;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  z-index: 10;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.story-tap-prev,
.story-tap-next {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35%;
  z-index: 9;
}
.story-tap-prev {
  left: 0;
}
.story-tap-next {
  right: 0;
}
.story-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  z-index: 10;
}
.story-ctrl-btn {
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
