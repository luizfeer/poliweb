<template>
  <div>
    <div v-if="ads.length === 0" class="text-lg p-2 text-gray-600">
      Nenhum dado cadastrado.
    </div>

    <div v-else class="card-ads-scroll">
      <router-link
        v-for="item in adsEdited"
        :key="item.id"
        :to="`/${item.id}`"
        class="card-ads-link"
      >
        <div class="card-ads">
          <div class="card-ads-media">
            <q-img
              v-if="item.files?.logo && item.files.logo.length"
              :src="pathImg(item)"
              :ratio="1"
              class="h-full w-full"
              spinner-color="white"
              spinner-size="40px"
            />
            <q-avatar
              v-else
              rounded
              class="h-full w-full"
              :color="colors[Math.floor(Math.random() * colors.length)]"
              text-color="white"
            >
              {{ (item.name || '').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) }}
            </q-avatar>
          </div>

          <div class="card-ads-body">
            <h1 class="card-ads-title">
              {{ item.name }}
            </h1>
            <h2 class="card-ads-desc">
              {{ item.description || '' }}
            </h2>
            <h2 class="card-ads-city">
              {{ showAddress && item.addresses && item.addresses.length ? lastAddress(item.addresses).city : '' }}
            </h2>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
    export default {
        props:{
            ads: {
                type: Array,
                default() {
                    return []
                }
            },
            showAddress: {
                type: Boolean,
                default: false
            },
            reverse: {
                type: Boolean,
                default: false
            }
        },
        data() {
          return {
            colors: ['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning']
          }
        },
        computed: {

            adsEdited() {
                if(this.reverse){
                    return this.ads.slice().reverse()
                }
                return this.ads
            }
        },
        methods: {
             lastAddress(addresses){
                return addresses[addresses.length-1]
            },
             pathImg (item) {
                item.files.logo = item.files.logo.sort((b, a) =>   new Date(a.createdAt) -  new Date(b.createdAt));
                return item.files.logo[0].link
            },
        },

    }
</script>

<style lang="scss" scoped>
.card-ads-scroll {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0.25rem;
  margin-top: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.card-ads-scroll::-webkit-scrollbar {
  height: 4px;
}

.card-ads-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.6);
  border-radius: 999px;
}

.card-ads-link {
  text-decoration: none;
  min-width: 230px;
  max-width: 260px;
  flex-shrink: 0;
}

.card-ads {
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  padding: 0.6rem 0.6rem 0.7rem;
  display: flex;
  flex-direction: row;
  gap: 0.6rem;
}

.card-ads-media {
  width: 64px;
  height: 64px;
  border-radius: 0.9rem;
  overflow: hidden;
  flex-shrink: 0;
}

.card-ads-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-ads-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 2px 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-ads-desc {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
  min-height: 2.4em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-ads-city {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0.25rem 0 0 0;
  min-height: 1.1em;
}
</style>
