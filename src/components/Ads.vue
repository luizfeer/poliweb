<template>
<div>
    <div class="bg-white border-b border-gray-200 p-3 mb-3">
      <div class="flex flex-nowrap">
        <!-- <div class="h-20 w-20 min-w-[5rem] rounded-full overflow-hidden">
          <q-img
            src="/thumb.png"
            :ratio="1"
            class="h-full w-full"
            spinner-color="white"
            spinner-size="82px"
          />
        </div> -->
        <div class="pl-3">
          <h1 class="text-2xl text-gray-700 font-semibold">
           {{ dataAds.name }}
          </h1>
          <h2 class="text-lg text-gray-500">{{ dataAds.description }}</h2>
        </div>
      </div>
      <q-space />
      <div class="flex items-center justify-between mt-4">
          <a v-if="phoneZap" :href="`https://api.whatsapp.com/send?phone=+55${phoneZap.phone}&text=Ol%C3%A1!`" target="_blank" rel="noopener noreferrer">
            <q-btn push color="positive" text-color="white">
                <q-icon name="fab fa-whatsapp" class="mr-2" /> Whatsapp
            </q-btn>
          </a>
        <q-btn
          :push="!follow"
          :color="!follow ? 'white' : 'positive'"
          :text-color="follow ? 'white' : 'blue-grey-8'"
          :label="follow ? 'Seguindo' : 'Seguir'"
          @click="follow = !follow"
        />
      </div>
    </div>

    <vue-picture-swipe
        v-if="dataAds.photos"
      :options="{ bgOpacity: 0.65 }"
      :items="items"
    ></vue-picture-swipe>
    <div class="p-3">
      <div class="bg-white border border-gray-200 rounded-md p-3">
        <h1 class="text-xl text-gray-700 font-semibold">Sobre</h1>
        <p class="text-gray-600">
          {{ dataAds.description }}
        </p>
      </div>
      <div
        v-if="dataAds.phones.length"
        class="bg-white border border-gray-200 rounded-md p-3 text-lg mt-3"
      >
        <div v-for="(phone, index) in dataAds.phones" :key="phone.id">
            <template v-if="!phone.isWhatsapp">
                <a :href="`tel:${phone.phone}`" class="flex items-center flex-nowrap text-gray-600">
                    <q-icon
                        name="fas fa-phone-square-alt"
                        class="mr-2 text-xl text-red-600"
                    />
                    {{ this.phone(phone.phone) }}
                </a>
                <div v-if="index !== dataAds.phones.length-1" class="divider border-t border-gray-200 w-full px-5 my-3"></div>
            </template>
            <template  v-else>
                <a  :href="`https://api.whatsapp.com/send?phone=+55${phone.phone}&text=Ol%C3%A1!`" target="_blank" rel="noopener noreferrer" class="flex items-center flex-nowrap text-gray-600">
                    <q-icon
                        name="fab fa-whatsapp-square"
                        class="mr-2 text-xl text-green-600"
                    />
                    {{ this.phone(phone.phone) }}
                </a>
            <div class="divider border-t border-gray-200 w-full px-5 my-3"></div>
            </template>
        </div>
        </div>

      <div class="bg-white border border-gray-200 rounded-md p-3 text-xl mt-3">
        <div v-if="dataAds.site" class="flex items-center flex-nowrap text-gray-600">
            <a :href="`${dataAds.site}`" target="_blank" rel="noopener noreferrer">
                <q-icon name="language" class="mr-2 text-xl text-blue-400" />
                {{ dataAds.site }}
            </a>
        </div>

        <div v-if="dataAds.site && (dataAds.facebook || dataAds.instagram || dataAds.email)" class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div v-if="dataAds.facebook" class="flex items-center flex-nowrap text-gray-600">
            <a :href="`${dataAds.facebook}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fab fa-facebook-square"
                    class="mr-2 text-xl text-blue-800"
                />
                {{ faceId(dataAds.facebook) }}
            </a>
        </div>
        <div v-if="dataAds.facebook  && (dataAds.instagram || dataAds.email)" class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div v-if="dataAds.instagram" class="flex items-center flex-nowrap text-gray-600">
            <a :href="`${dataAds.instagram}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fab fa-instagram-square"
                    class="mr-2 text-xl text-pink-600"
                />
                {{ instaId(dataAds.instagram) }}
            </a>
        </div>
        <div v-if="dataAds.instagram && dataAds.email" class="divider border-t border-gray-200 w-full px-5 my-3"></div>
        <div v-if="dataAds.email" class="flex items-center flex-nowrap text-gray-600">
            <a :href="`mailto:${dataAds.email}`" target="_blank" rel="noopener noreferrer">
                <q-icon
                    name="fas fa-envelope-open-text"
                    class="mr-2 text-xl text-purple-800"
                />
                {{ dataAds.email }}
            </a>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-md p-3 text-xl mt-3 relative" v-if="dataAds.addresses && dataAds.addresses.length">
          <a :href="`http://maps.google.com/maps?q=${dataAds.name},${dataAds.addresses[0].street},Nº${dataAds.addresses[0].number},${dataAds.addresses[0].city} ${dataAds.addresses[0].state},${dataAds.addresses[0].zipCode}`" target="_blank" rel="noopener noreferrer">
            <div
              class="
                flex flex-col
                justify-center
                items-center
                flex-nowrap
                text-gray-600
              "
            >
              <q-icon
                name="fas fa-map-marked-alt"
                class="mr-2 text-3xl text-yellow-500"
              />
              {{ `${dataAds.addresses[0].street}, nº ${dataAds.addresses[0].number}. ${dataAds.addresses[0].city} ${dataAds.addresses[0].state} - ${dataAds.addresses[0].zipCode}` }}
            </div>
          </a>
          <q-btn unelevated color="primary" @click.prevent="editAddress = !editAddress" class="absolute right-0 top-0" icon="create" />
          <q-expansion-item
            v-model="editAddress"
          >
            <add-address :edit="true" :address="dataAds.addresses[0]" :ad-id="dataAds.id"></add-address>
          </q-expansion-item>
      </div>
      <div v-else-if="admin">            
         <div class="bg-gray-100 rounded-3xl mt-4 overflow-hidden">   
          <q-expansion-item
            v-model="expandedAddress"
            icon="perm_identity"
            label="Cadastrar endereço"
          >
            <add-address :ad-id="dataAds.id"></add-address>           
          </q-expansion-item>
        </div>
        
      </div>

    </div>
    </div>
</template>

<script>

import { ref } from "vue";
import VuePictureSwipe from "vue-picture-swipe";
import AddAddress from 'components/add/Address'

export default {
  components: {
    AddAddress,
    VuePictureSwipe,
  },
  props:{
    dataAds:{
      type: Object
    }
  },
  setup() {
    return {
      slide: ref(1),
      expandedAddress: ref(false),
      follow: ref(false),
      editAddress: ref(false),
      admin: ref(false),
      items: ref([]),
      phone(phone) {
        return phone.replace(/[^0-9]/g, '')
                  .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      },
      faceId(fburl){      
          let cut = fburl.split("/")
          if (cut[3]) {
            return cut[3]
          }else if(cut[2]){
            return cut[2]
          }else {
            return this.dataAds.name
          }
        },
        instaId(instUrl){
          instUrl = instUrl.split("?")[0]
          instUrl = instUrl.split("/")[3]
          if(instUrl){
            return "@"+instUrl
          }
          return this.dataAds.name
        },

      
    //   items: [
    //     {
    //       src: "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    //       thumbnail:
    //   "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    //       w: 634,
    //       h: 951,
    //       alt: "some numbers on a grey background", // optional alt attribute for thumbnail image
    //     },
    //     {
    //       src: "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
    //       thumbnail:
    //  "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
    //       w: 1200,
    //       h: 900,
    //     },
    //     {
    //       src: "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    //       thumbnail:
    //         "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    //       w: 634,
    //       h: 951,
    //       alt: "some numbers on a grey background", // optional alt attribute for thumbnail image
    //     },
    //     {
    //       src: "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
    //       thumbnail:
    //         "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
    //       w: 1200,
    //       h: 900,
    //     },
    //   ],
    };
  },
  computed: {
      phoneZap() {          
          for (let index = 0; index < this.dataAds.phones.length; index++) {
              const element =  this.dataAds.phones[index];
              if(element.isWhatsapp)
              {
                  return element
              }              
          }
          return false
      }
  },
  mounted () {
     this.admin = localStorage.getItem('admin') ? true : false    
  },
};
</script>
<style>
.my-gallery {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding-left: 0.75rem;
  overflow-scrolling: touch;
  webkit-overflow-scrolling: touch;
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
</style>
