<template>
  <q-page class="bg-gray-100">
    <div class="bg-white border-b border-gray-200 p-3 mb-3">
      <div class="flex flex-nowrap">
        <div class="h-20 w-20 min-w-[5rem] rounded-full overflow-hidden">
          <q-img
            src="/thumb.png"
            :ratio="1"
            class="h-full w-full"
            spinner-color="white"
            spinner-size="82px"
          />
        </div>
        <div class="pl-3">
          <h1 class="text-2xl text-gray-700 font-semibold">
            Favorita Moda Íntima
          </h1>
          <h2 class="text-lg text-gray-500">Conceição da Aparecida</h2>
        </div>
      </div>
      <q-space />
      <div class="flex items-center justify-between mt-4">
        <q-btn push color="positive" text-color="white">
          <q-icon name="fab fa-whatsapp" class="mr-2" /> Whatsapp
        </q-btn>
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
      :options="{ bgOpacity: 0.65 }"
      :items="items"
    ></vue-picture-swipe>
    <div class="p-3">
      <div class="bg-white border border-gray-200 rounded-md p-3">
        <h1 class="text-xl text-gray-700 font-semibold">Sobre</h1>
        <p class="text-gray-600">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ad, molestiae
          corrupti. Similique, ab blanditiis? Modi illo, itaque molestias,
          tempora aspernatur repudiandae aliquid ipsam quos nesciunt neque
          fugiat eius facere quis!
        </p>
      </div>
      <div class="bg-white border border-gray-200 rounded-md p-3 text-lg mt-3">
        <div class="flex items-center flex-nowrap text-gray-600">
          <q-icon
            name="fas fa-phone-square-alt"
            class="mr-2 text-xl text-red-600"
          />
          (35) 3562-2084
        </div>

        <div class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div class="flex items-center flex-nowrap text-gray-600">
          <q-icon
            name="fab fa-whatsapp-square"
            class="mr-2 text-xl text-green-600"
          />
          (35) 99963-8710
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-md p-3 text-xl mt-3">
        <div class="flex items-center flex-nowrap text-gray-600">
          <q-icon name="language" class="mr-2 text-xl text-blue-400" />
          favoritamodaintima.com.br
        </div>

        <div class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div class="flex items-center flex-nowrap text-gray-600">
          <q-icon
            name="fab fa-facebook-square"
            class="mr-2 text-xl text-blue-800"
          />
          Favorita Moda Intima
        </div>
        <div class="divider border-t border-gray-200 w-full px-5 my-3"></div>

        <div class="flex items-center flex-nowrap text-gray-600">
          <q-icon
            name="fab fa-instagram-square"
            class="mr-2 text-xl text-pink-600"
          />
          @favorita_acessorios
        </div>
        <div class="divider border-t border-gray-200 w-full px-5 my-3"></div>
        <div class="flex items-center flex-nowrap text-gray-600">
          <q-icon
            name="fas fa-envelope-open-text"
            class="mr-2 text-xl text-purple-800"
          />
          favoritaviashop@hotmail.com
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-md p-3 text-xl mt-3">
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
          Rua Coronel Joaquim Firmino da Silva, 537
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { ref } from "vue";
// import VuePictureSwipe from "vue-picture-swipe";

export default defineComponent({
  name: "Categorias",
  components: {
    // VuePictureSwipe,
  },
  setup() {
    return {
      slide: ref(1),
      follow: ref(false),
      items: [
        {
          src: "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
          thumbnail:
            "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
          w: 634,
          h: 951,
          alt: "some numbers on a grey background", // optional alt attribute for thumbnail image
        },
        {
          src: "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
          thumbnail:
            "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
          w: 1200,
          h: 900,
        },
        {
          src: "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
          thumbnail:
            "https://images.unsplash.com/photo-1607868894760-4241c06dd023?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
          w: 634,
          h: 951,
          alt: "some numbers on a grey background", // optional alt attribute for thumbnail image
        },
        {
          src: "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
          thumbnail:
            "https://images.unsplash.com/photo-1565632444383-283cfa0dbe62?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=967&q=80",
          w: 1200,
          h: 900,
        },
      ],
    };
  },
});
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
