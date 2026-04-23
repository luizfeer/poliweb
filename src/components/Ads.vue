<template>
  <div class="ads-page">
    <!-- Header do anúncio -->
    <div class="ads-header">
      <div class="ads-header-content">
        <div
          class="ads-logo-wrapper"
          :class="{
            'cursor-pointer': admin || mediaItems.length,
            'ads-story-ring': mediaItems.length && !admin
          }"
          @click="onLogoClick"
        >
          <q-btn v-if="photoUpload" @click.stop="setAtt()" round class="ads-logo-edit" color="secondary" size="sm"><AppIcon name="cloud-upload" :size="20" /></q-btn>
          <q-btn v-else-if="admin" round class="ads-logo-edit" color="primary" size="sm"><AppIcon name="add-a-photo" :size="20" /></q-btn>
          <div class="ads-logo" :class="{ 'ads-story-logo': hasVideos && !admin }">
            <q-img
              v-if="adsComponent.files?.logo?.length"
              :src="pathImg()"
              :alt="adsComponent.name + ' - logo'"
              :ratio="1"
              class="h-full w-full object-cover"
              spinner-color="gray-300"
              spinner-size="40px"
            />
            <q-avatar v-else class="h-full w-full" :color="colors[Math.floor(Math.random() * colors.length)]" text-color="white">
              {{ (adsComponent.name || '').split(" ").map((n)=>n[0]).join("").toUpperCase().slice(0, 2) }}
            </q-avatar>
            <input type="file" id="file" ref="file" @change="logoUpload()" accept="image/*" class="hidden"/>
          </div>
        </div>
        <div class="ads-info">
          <div v-if="openingStatus.configured" class="ads-status-chip" :class="openingStatus.isOpen ? 'ads-status-chip--open' : 'ads-status-chip--closed'">
            <AppIcon :name="openingStatus.isOpen ? 'schedule' : 'do-not-disturb-on'" :size="16" />
            <span>{{ openingStatus.label }}</span>
          </div>
          <h1 class="ads-name">{{ adsComponent.name }}</h1>
          <p class="ads-desc" v-if="adsComponent.description">{{ adsComponent.description }}</p>
          <p v-if="openingStatus.detail" class="ads-status-detail">{{ openingStatus.detail }}</p>
        </div>
      </div>
      <div class="ads-actions">
        <a v-if="phoneZap" @click="sendAction('open-whatsapp')" :href="`https://wa.me/55${onlyNumber(phoneZap.phone)}?text=Ol%C3%A1! Vim pelo app Poliweb!`" target="_blank" rel="noopener noreferrer" class="ads-whatsapp">
          <AppIcon name="whatsapp" :size="20" />
          <span>WhatsApp</span>
        </a>
        <button type="button" class="ads-follow" :class="{ 'ads-following': follow }" @click="follows()">
          <AppIcon :name="follow ? 'check-circle' : 'add-circle-outline'" :size="18" />
          <span>{{ follow ? 'Seguindo' : 'Seguir' }}</span>
        </button>
      </div>
    </div>
    <preview-ecommerce :ecommercePreview="adsComponent.files?.ecommercePreview" :admin="admin" />

    <!-- Galeria de fotos e vídeos - estilo Stories -->
    <div class="ads-section">
      <div class="ads-gallery">
        <div class="ads-gallery-add ads-gallery-add-unified" @click="$refs.gallery?.click()">
          <AppIcon name="add-photo-alternate" :size="28" />
          <span>Fotos e vídeos</span>
        </div>
        <!-- Thumbnails de mídia (fotos + vídeos) na galeria horizontal -->
        <div
          v-for="(item, i) in mediaItems"
          :key="'gmt-' + (item.id || i)"
          class="ads-gallery-video-thumb"
          @click="openStoryAt(i)"
        >
          <template v-if="item.type === 'video'">
            <img v-if="videoThumbs[String(item.id)]" :src="videoThumbs[String(item.id)]" class="ads-video-thumb-img" :alt="adsComponent.name + ' - vídeo ' + (i + 1)" />
            <video
              v-else-if="item.link && !videoThumbFailed[String(item.id)]"
              :data-video-id="String(item.id)"
              :src="item.link"
              crossorigin="anonymous"
              preload="metadata"
              muted
              playsinline
              class="ads-video-thumb-video"
              @loadeddata="captureVideoThumb"
              @canplay="captureVideoThumb"
              @error="onVideoThumbError"
            />
            <AppIcon name="play-circle-filled" :size="32" class="text-white" />
          </template>
          <template v-else>
            <img :src="item.thumbnail || item.src" class="ads-video-thumb-img" :alt="adsComponent.name + ' - foto ' + (i + 1)" loading="lazy" />
          </template>
          <span class="ads-gallery-video-num">{{ i + 1 }}</span>
        </div>
      </div>
      <q-btn v-if="admin" flat rounded color="primary" label="Editar imagens" size="sm" :to="`/img/${adsComponent.id}`" class="mt-2"/>
      <input type="file" id="gallery" ref="gallery" @change="galleryUpload()" accept="image/*,video/*" multiple class="hidden"/>
      <input type="file" id="camera-gallery" ref="cameraGallery" @change="galleryUpload()" accept="image/*" capture="environment" class="hidden"/>
    </div>

    <!-- Descrição -->
    <div class="ads-section" v-if="adsComponent.description">
      <div class="ads-card">
        <h2 class="ads-card-title">Descrição</h2>
        <p class="ads-card-text">{{ adsComponent.description }}</p>
      </div>
    </div>

    <div class="ads-section" v-if="hasOpeningHours">
      <div class="ads-card">
        <div class="ads-hours-header">
          <h2 class="ads-card-title">Horário de funcionamento</h2>
          <span class="ads-hours-today">{{ openingStatus.today ? formatOpeningHours(openingStatus.today) : '' }}</span>
        </div>
        <div class="ads-hours-list">
          <div v-for="dayConfig in openingHoursList" :key="dayConfig.day" class="ads-hours-row">
            <span class="ads-hours-day">{{ dayConfig.label }}</span>
            <span class="ads-hours-value">{{ formatOpeningHours(dayConfig) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Categorias -->
    <div class="ads-section" v-if="adCategories.length">
      <div class="ads-card">
        <h2 class="ads-card-title">Categorias</h2>
        <div class="ads-categories-tags">
          <router-link
            v-for="cat in adCategories"
            :key="cat.id"
            :to="categoryLink(cat)"
            class="ads-category-tag"
          >
            {{ categoryLabel(cat) }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Telefones -->
    <div class="ads-section" v-if="adsComponent.phones?.length">
      <div class="ads-card">
        <h2 class="ads-card-title">Contato</h2>
        <div v-for="phoneItem in adsComponent.phones" :key="phoneItem.id" v-show="!phoneItem.deletedAt" class="ads-contact-item">
          <a
            @click="sendAction(!phoneItem.isWhatsapp ? 'open-phone' : 'open-whatsapp')"
            :href="!phoneItem.isWhatsapp ? `tel:${phoneItem.phone}` : `https://wa.me/55${onlyNumber(phoneItem.phone)}?text=Ol%C3%A1! Vim pelo app Poliweb!`"
            target="_blank"
            rel="noopener noreferrer"
            class="ads-contact-link"
          >
            <AppIcon v-if="phoneItem.isWhatsapp" name="whatsapp" :size="20" :class="phoneItem.isWhatsapp ? 'text-green-600' : 'text-primary'" />
            <AppIcon v-else name="phone" :size="20" :class="phoneItem.isWhatsapp ? 'text-green-600' : 'text-primary'" />
            <span>{{ phone(phoneItem.phone) }}</span>
          </a>
          <div v-if="admin" class="ads-contact-actions">
            <q-btn flat dense round size="sm" color="primary" @click.prevent="editPhoneData(phoneItem)"><AppIcon name="edit" :size="18" /></q-btn>
            <q-btn flat dense round size="sm" color="negative" @click.prevent="deletePhoneData=phoneItem; confirm=true"><AppIcon name="delete" :size="18" /></q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Links -->
    <div class="ads-section" v-if="adsComponent.website || adsComponent.facebook || adsComponent.instagram || adsComponent.email">
      <div class="ads-card">
        <h2 class="ads-card-title">Redes e contato</h2>
        <div class="ads-links">
          <a v-if="adsComponent.website" @click="sendAction('open-site')" :href="adsComponent.website" target="_blank" rel="noopener noreferrer" class="ads-link-item">
            <AppIcon name="language" :size="22" class="text-blue-500" />
            <span>Site</span>
          </a>
          <a v-if="adsComponent.facebook" @click="sendAction('open-facebook')" :href="adsComponent.facebook" target="_blank" rel="noopener noreferrer" class="ads-link-item">
            <AppIcon name="facebook" :size="22" class="text-blue-700" />
            <span>Facebook</span>
          </a>
          <a v-if="adsComponent.instagram" @click="sendAction('open-instagram')" :href="adsComponent.instagram" target="_blank" rel="noopener noreferrer" class="ads-link-item">
            <AppIcon name="instagram" :size="22" class="text-pink-600" />
            <span>Instagram</span>
          </a>
          <a v-if="adsComponent.email" @click="sendAction('open-mail')" :href="`mailto:${adsComponent.email}`" target="_blank" rel="noopener noreferrer" class="ads-link-item">
            <AppIcon name="email" :size="22" class="text-gray-600" />
            <span>Email</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Endereço -->
    <div class="ads-section" v-if="lastAddress">
      <div class="ads-card ads-address-card">
        <a
          @click="sendAction('open-map')"
          :href="`https://maps.google.com/maps?q=${encodeURIComponent(adsComponent.name + ',' + (lastAddress.street || '') + ',' + (lastAddress.number || '') + ',' + (lastAddress.city || '') + ' ' + (lastAddress.state || '') + ',' + (lastAddress.zipCode || ''))}`"
          target="_blank"
          rel="noopener noreferrer"
          class="ads-address-link"
        >
          <AppIcon name="place" :size="28" class="text-amber-500" />
          <div class="ads-address-text">
            {{ [lastAddress.street, lastAddress.number, lastAddress.city, lastAddress.state, lastAddress.zipCode].filter(Boolean).join(', ') }}
          </div>
          <AppIcon name="open-in-new" :size="18" class="text-gray-400" />
        </a>
        <!-- Mapa embutido: usa coordenadas quando disponível, senão usa endereço -->
        <div v-if="mapEmbedQuery" class="ads-map-wrapper mt-4 rounded-xl overflow-hidden border border-gray-200">
          <iframe
            :src="mapEmbedSrc"
            class="ads-map-iframe"
            width="100%"
            height="200"
            frameborder="0"
            style="border:0"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>

    <!-- Painel Admin -->
    <div v-if="admin" class="admin-panel">
      <p class="admin-panel-heading">Gerenciar perfil</p>

      <div class="admin-panel-card">
        <!-- Relatórios -->
        <router-link :to="`/actions/${adsComponent.id}`" class="admin-row-btn">
          <div class="arb-icon" style="background: linear-gradient(135deg,#6366f1,#4f46e5)">
            <q-icon name="bar_chart" color="white" size="18px" />
          </div>
          <div class="arb-info">
            <span class="arb-label">Relatório de acessos</span>
            <span class="arb-sub">Veja quem visitou seu perfil</span>
          </div>
          <q-icon name="chevron_right" color="grey-5" size="20px" />
        </router-link>

        <div class="admin-divider" />

        <!-- Cadastrar / Editar endereço -->
        <button
          v-if="lastAddress"
          class="admin-row-btn"
          @click="editAddress = true"
        >
          <div class="arb-icon" style="background: linear-gradient(135deg,#f59e0b,#d97706)">
            <q-icon name="edit_location" color="white" size="18px" />
          </div>
          <div class="arb-info">
            <span class="arb-label">Editar endereço</span>
            <span class="arb-sub">Atualize a localização do seu negócio</span>
          </div>
          <q-icon name="chevron_right" color="grey-5" size="20px" />
        </button>
        <button
          v-else
          class="admin-row-btn"
          @click="expand.address = true"
        >
          <div class="arb-icon" style="background: linear-gradient(135deg,#f59e0b,#d97706)">
            <q-icon name="place" color="white" size="18px" />
          </div>
          <div class="arb-info">
            <span class="arb-label">Cadastrar endereço</span>
            <span class="arb-sub">Adicione a localização do seu negócio</span>
          </div>
          <q-icon name="chevron_right" color="grey-5" size="20px" />
        </button>

        <div class="admin-divider" />

        <!-- Editar informações -->
        <button class="admin-row-btn" @click="expand.basic = true">
          <div class="arb-icon" style="background: linear-gradient(135deg,#3b82f6,#2563eb)">
            <q-icon name="edit" color="white" size="18px" />
          </div>
          <div class="arb-info">
            <span class="arb-label">Editar informações</span>
            <span class="arb-sub">Nome, descrição, redes sociais</span>
          </div>
          <q-icon name="chevron_right" color="grey-5" size="20px" />
        </button>

        <div class="admin-divider" />

        <button class="admin-row-btn" @click="expand.openingHours = true">
          <div class="arb-icon" style="background: linear-gradient(135deg,#0ea5e9,#0284c7)">
            <q-icon name="schedule" color="white" size="18px" />
          </div>
          <div class="arb-info">
            <span class="arb-label">Horário de funcionamento</span>
            <span class="arb-sub">Defina quando o negócio está aberto</span>
          </div>
          <q-icon name="chevron_right" color="grey-5" size="20px" />
        </button>

        <div class="admin-divider" />

        <!-- Postar mídia -->
        <button class="admin-row-btn" @click="expand.postarMedia = true">
          <div class="arb-icon" style="background: linear-gradient(135deg,#ec4899,#db2777)">
            <q-icon name="photo_camera" color="white" size="18px" />
          </div>
          <div class="arb-info">
            <span class="arb-label">Postar mídia</span>
            <span class="arb-sub">Adicionar fotos ou vídeos à galeria</span>
          </div>
          <q-icon name="chevron_right" color="grey-5" size="20px" />
        </button>

        <div class="admin-divider" />

        <!-- Telefone -->
        <button class="admin-row-btn" @click="resetPhone(); expand.phone = true">
          <div class="arb-icon" style="background: linear-gradient(135deg,#22c55e,#16a34a)">
            <q-icon name="phone" color="white" size="18px" />
          </div>
          <div class="arb-info">
            <span class="arb-label">Telefones</span>
            <span class="arb-sub">Adicionar, editar ou remover contatos</span>
          </div>
          <q-icon name="chevron_right" color="grey-5" size="20px" />
        </button>

        <template v-if="isSuperAdmin">
          <div class="admin-divider" />
          <button class="admin-row-btn" @click="expand.editCategories = true">
            <div class="arb-icon" style="background: linear-gradient(135deg,#8b5cf6,#7c3aed)">
              <q-icon name="category" color="white" size="18px" />
            </div>
            <div class="arb-info">
              <span class="arb-label">Editar categorias</span>
              <span class="arb-sub">Adicionar ou remover categorias do anúncio</span>
            </div>
            <q-icon name="chevron_right" color="grey-5" size="20px" />
          </button>

          <div class="admin-divider" />
          <button class="admin-row-btn" @click="confirmDeleteAd = true">
            <div class="arb-icon" style="background: linear-gradient(135deg,#ef4444,#dc2626)">
              <q-icon name="delete_forever" color="white" size="18px" />
            </div>
            <div class="arb-info">
              <span class="arb-label">Apagar anúncio</span>
              <span class="arb-sub">Remove o anúncio das listagens</span>
            </div>
            <q-icon name="chevron_right" color="grey-5" size="20px" />
          </button>
        </template>
      </div>
    </div>

    <EditCategoriesModal
      v-model="expand.editCategories"
      :ad-id="adsComponent.id"
      :categories="categories"
      @updated="loadAdCategories(); $emit('updated')"
    />

    <PostarMediaModal
      v-model="expand.postarMedia"
      @select="onPostarMediaSelect"
    />

    <!-- Bottom sheets admin -->
    <app-bottom-sheet
      v-model="expand.address"
      icon="place"
      icon-color="#f59e0b"
      title="Cadastrar endereço"
      subtitle="Informe a localização do seu negócio"
    >
      <add-address :ad-id="adsComponent.id" hide-title @saved="expand.address = false; $emit('updated')" />
      <template #actions>
        <button type="button" class="abs-action-cancel" @click="expand.address = false">Cancelar</button>
        <button type="submit" :form="'address-form-add'" class="abs-action-confirm abs-action-confirm-amber">
          <q-icon name="check" size="17px" />
          <span>Salvar</span>
        </button>
      </template>
    </app-bottom-sheet>

    <app-bottom-sheet
      v-model="editAddress"
      icon="place"
      icon-color="#f59e0b"
      title="Editar endereço"
      subtitle="Atualize a localização do seu negócio"
    >
      <add-address :edit="true" :address="lastAddress" :ad-id="adsComponent.id" hide-title @saved="editAddress = false; $emit('updated')" />
      <template #actions>
        <button type="button" class="abs-action-cancel" @click="editAddress = false">Cancelar</button>
        <button type="submit" :form="'address-form-edit'" class="abs-action-confirm abs-action-confirm-amber">
          <q-icon name="check" size="17px" />
          <span>Salvar</span>
        </button>
      </template>
    </app-bottom-sheet>

    <app-bottom-sheet
      v-model="expand.basic"
      icon="edit"
      icon-color="#3b82f6"
      title="Editar informações"
      subtitle="Atualize os dados do seu perfil"
    >
      <fix-infos :data="adsComponent" />
    </app-bottom-sheet>

    <app-bottom-sheet
      v-model="expand.openingHours"
      icon="schedule"
      icon-color="#0ea5e9"
      title="Horário de funcionamento"
      subtitle="Preencha manualmente ou cole os horários"
    >
      <opening-hours-editor
        :data="adsComponent"
        @saved="expand.openingHours = false; $emit('updated')"
      />
    </app-bottom-sheet>

    <app-bottom-sheet
      v-model="expand.phone"
      icon="phone"
      icon-color="#22c55e"
      title="Telefones"
      subtitle="Adicione, edite ou remova os números de contato"
    >
      <!-- Lista de telefones existentes -->
      <div v-if="adsComponent.phones?.filter(p => !p.deletedAt).length" class="phone-list">
        <div
          v-for="phoneItem in adsComponent.phones.filter(p => !p.deletedAt)"
          :key="phoneItem.id"
          class="phone-list-item"
        >
          <span class="phone-list-number">{{ phone(phoneItem.phone) }}</span>
          <span v-if="phoneItem.isWhatsapp" class="phone-list-badge">WhatsApp</span>
          <div class="phone-list-actions">
            <q-btn flat dense round size="sm" color="primary" @click="editPhoneData(phoneItem)" title="Editar">
              <AppIcon name="edit" :size="16" />
            </q-btn>
            <q-btn flat dense round size="sm" color="negative" @click="deletePhoneData=phoneItem; confirm=true; expand.phone=false" title="Remover">
              <AppIcon name="delete" :size="16" />
            </q-btn>
          </div>
        </div>
      </div>
      <q-form @submit="newPhone" class="phone-form">
        <p class="phone-form-label">{{ editPhone.edit ? 'Editar telefone' : 'Novo telefone' }}</p>
        <q-input
          outlined
          dense
          v-model="editPhone.phone"
          label="Número"
          name="phone"
          mask="(##) #####-####"
          placeholder="(00) 00000-0000"
          class="w-full"
        />
        <label class="phone-check-label">
          <q-checkbox v-model="editPhone.isWhatsapp" dense />
          <span>É WhatsApp?</span>
        </label>
      </q-form>
      <template #actions>
        <button class="abs-action-cancel" @click="expand.phone = false; resetPhone()">Cancelar</button>
        <button class="abs-action-confirm" @click="newPhone">
          <q-icon name="check" size="17px" />
          <span>{{ editPhone.edit ? 'Salvar' : 'Adicionar' }}</span>
        </button>
      </template>
    </app-bottom-sheet>

    <!-- Grid de mídia estilo Stories (fotos + vídeos) -->
    <div class="ads-section" v-if="mediaItems.length">
      <h2 class="ads-card-title mb-3">Fotos e vídeos</h2>
      <div class="ads-photo-grid-bleed">
        <div class="ads-media-grid">
          <div
            v-for="(item, i) in mediaItems"
            :key="'mgm-' + (item.id || i)"
            :class="item.type === 'video' ? 'ads-media-grid-video' : 'ads-media-grid-photo'"
            @click="openStoryAt(i)"
          >
            <template v-if="item.type === 'video'">
              <img v-if="videoThumbs[String(item.id)]" :src="videoThumbs[String(item.id)]" class="ads-video-thumb-img" :alt="adsComponent.name + ' - vídeo ' + (i + 1)" />
              <video
                v-else-if="item.link && !videoThumbFailed[String(item.id)]"
                :data-video-id="String(item.id)"
                :src="item.link"
                crossorigin="anonymous"
                preload="metadata"
                muted
                playsinline
                class="ads-video-thumb-video"
                @loadeddata="captureVideoThumb"
                @canplay="captureVideoThumb"
                @error="onVideoThumbError"
              />
              <div class="ads-media-grid-video-inner">
                <AppIcon name="play-circle-filled" :size="40" class="text-white" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
                <span class="ads-media-grid-video-badge">vídeo</span>
              </div>
            </template>
            <template v-else>
              <img :src="item.thumbnail || item.src" loading="lazy" class="ads-media-grid-photo-img" :alt="adsComponent.name + ' - foto ' + (i + 1)" />
            </template>
          </div>
        </div>
      </div>
    </div>

     <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar color="negative" text-color="white"><AppIcon name="delete" :size="20" /></q-avatar>
          <span class="q-ml-sm">Tem certeza que deseja deletar esse telefone?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Deletar" color="negative" @click="deletePhone()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="confirmDeleteAd" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar color="negative" text-color="white"><AppIcon name="delete" :size="20" /></q-avatar>
          <span class="q-ml-sm">Tem certeza que deseja apagar este anúncio?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Apagar anúncio" color="negative" @click="deleteAd()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
      <q-dialog v-model="confirmGallery" persistent class="gallery-upload-dialog" transition-show="scale" transition-hide="scale">
      <q-card class="gallery-upload-card">
        <div class="gallery-upload-header">
          <div class="gallery-upload-header-icon">
            <AppIcon name="cloud-upload" :size="28" />
          </div>
          <h3 class="gallery-upload-title">Enviar mídia</h3>
          <p class="gallery-upload-subtitle">
            {{ galleryItems.length }} arquivo(s) · Fotos e vídeos
          </p>
        </div>
        <q-card-section class="q-pt-none">
          <div class="gallery-upload-grid">
            <div
              v-for="(item, i) in galleryItems"
              :key="i"
              class="gallery-upload-cell"
            >
              <div class="gallery-upload-thumb-wrap">
                <img v-if="item.file.type.startsWith('image/')" :src="item.thumb" class="gallery-upload-thumb" :alt="item.file.name" />
                <video v-else :src="item.thumb" class="gallery-upload-thumb" muted playsinline preload="metadata" />
                <div class="gallery-upload-thumb-overlay" :class="{ 'gallery-upload-visible': galleryUploadResults[i] || galleryUploading }">
                  <AppIcon
                    v-if="galleryUploadResults[i]?.ok === true"
                    name="check-circle"
                    :size="28"
                    class="text-positive"
                  />
                  <AppIcon
                    v-else-if="galleryUploadResults[i]?.ok === false"
                    name="report_problem"
                    :size="28"
                    class="text-negative"
                  />
                  <AppIcon
                    v-else-if="galleryUploading"
                    name="cloud-upload"
                    :size="24"
                    class="text-white animate-pulse"
                  />
                </div>
                <q-btn
                  v-if="!galleryUploading && !galleryUploadResults.length"
                  flat
                  round
                  dense
                  icon="close"
                  size="sm"
                  class="gallery-upload-remove"
                  @click="removeGalleryItem(i)"
                />
              </div>
              <span v-if="galleryUploadResults[i]?.ok === false && galleryUploadResults[i]?.message" class="gallery-upload-cell-error">{{ galleryUploadResults[i].message }}</span>
            </div>
            <div
              v-if="!galleryUploading && !galleryUploadResults.length"
              class="gallery-upload-cell gallery-upload-add-more"
              @click="$refs.gallery?.click()"
            >
              <AppIcon name="add-photo-alternate" :size="32" />
              <span>Adicionar mais</span>
            </div>
          </div>
        </q-card-section>
        <q-card-actions class="gallery-upload-actions">
          <q-btn flat label="Cancelar" color="grey-7" :disable="galleryUploading" @click="confirmGallery = false; resetGalleryModal()" />
          <q-btn
            unelevated
            rounded
            :label="galleryUploadResults.length && !galleryUploading ? 'Concluído' : 'Enviar'"
            color="primary"
            :loading="galleryUploading"
            :disable="!galleryItems.length"
            @click="galleryUploadResults.length && !galleryUploading ? closeGalleryModal() : sendGallery()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Dialog de upload de vídeo (admin) -->
    <app-bottom-sheet
      v-model="sendVideo"
      icon="videocam"
      icon-color="#7c3aed"
      title="Enviar vídeo"
      subtitle="Selecione ou arraste um arquivo de vídeo"
    >
      <div
        class="vud-drop-area"
        :class="{ 'vud-drop-active': videoFileName || videoDragOver }"
        @click="$refs.videoInput.click()"
        @dragover.prevent="videoDragOver = true"
        @dragleave="videoDragOver = false"
        @drop.prevent="onVideoDrop"
      >
        <div class="vud-drop-inner">
          <div class="vud-drop-icon">
            <AppIcon :name="videoFileName ? 'videocam' : 'cloud-upload'" :size="36" />
          </div>
          <p class="vud-drop-label">{{ videoFileName || 'Clique ou arraste aqui' }}</p>
          <span class="vud-drop-hint">MP4 · MOV · AVI · até 100 MB</span>
        </div>
      </div>
      <input type="file" ref="videoInput" accept="video/*" class="hidden" @change="onVideoSelected" />

      <div v-if="videoUploading" class="vud-progress-wrap">
        <div class="vud-progress-bar" />
      </div>

      <template #actions>
        <button class="abs-action-cancel" @click="cancelVideoUpload">Cancelar</button>
        <button
          class="abs-action-confirm"
          :class="{ 'abs-action-disabled': !videoFilePath || videoUploading }"
          :disabled="!videoFilePath || videoUploading"
          @click="submitVideo"
        >
          <AppIcon v-if="!videoUploading" name="cloud-upload" :size="17" />
          <span>{{ videoUploading ? 'Enviando…' : 'Enviar' }}</span>
        </button>
      </template>
    </app-bottom-sheet>

    <!-- Story viewer - fotos e vídeos estilo Stories -->
    <q-dialog v-model="storyOpen" maximized transition-show="fade" transition-hide="fade" class="story-dialog">
      <div class="story-container" @touchstart="onStoryTouchStart" @touchend="onStoryTouchEnd">
        <div class="story-gradient-top" aria-hidden="true" />
        <!-- Barras de progresso -->
        <div class="story-bars">
          <div
            v-for="(item, i) in mediaItems"
            :key="i"
            class="story-bar"
          >
            <div
              class="story-bar-fill"
              :style="{ width: i < storyIndex ? '100%' : i === storyIndex ? storyProgress + '%' : '0%' }"
            />
          </div>
        </div>

        <!-- Cabeçalho -->
        <div class="story-header">
          <div class="story-header-avatar">
            <img v-if="pathImg()" :src="pathImg()" class="story-avatar-img" :alt="adsComponent.name" />
            <div v-else class="story-avatar-fallback">{{ (adsComponent.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }}</div>
          </div>
          <div class="story-header-name-wrap">
            <span class="story-header-name">{{ adsComponent.name }}</span>
            <span v-if="showStoryTime" class="story-header-time">{{ timeAgo(currentMediaItem?.createdAt) }}</span>
          </div>
          <button class="story-close-btn" @click="closeStory">✕</button>
        </div>

        <!-- Vídeo ou foto -->
        <video
          v-if="isCurrentVideo"
          ref="storyVideo"
          class="story-media"
          playsinline
          autoplay
          :src="currentMediaItem?.link"
          @ended="nextStory"
          @timeupdate="updateStoryProgress"
        />
        <img
          v-else-if="currentMediaItem?.type === 'photo'"
          :src="currentMediaItem?.src"
          class="story-media"
          :alt="adsComponent.name + ' - foto ' + (storyIndex + 1)"
        />

        <!-- Áreas de toque para navegar (esquerda / direita) -->
        <div class="story-tap-prev" @click="prevStory" />
        <div class="story-tap-next" @click="nextStory" />

        <!-- Controles inferiores -->
        <div class="story-controls">
          <button v-if="isCurrentVideo" class="story-ctrl-btn" @click.stop="toggleStoryPause">
            <AppIcon :name="storyPaused ? 'play-arrow' : 'pause'" :size="28" class="text-white" />
          </button>
          <button v-if="admin && currentMediaItem" class="story-ctrl-btn story-ctrl-delete" @click.stop="confirmStoryDelete = true">
            <AppIcon name="delete" :size="28" class="text-white" />
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- Confirmação de exclusão no story (admin) -->
    <q-dialog v-model="confirmStoryDelete" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar color="negative" text-color="white"><AppIcon name="delete" :size="20" /></q-avatar>
          <span class="q-ml-sm">{{ isCurrentVideo ? 'Tem certeza que deseja deletar esse vídeo?' : 'Tem certeza que deseja deletar essa imagem?' }}</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn flat label="Deletar" color="negative" @click="deleteStoryMedia" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Barra de ações fixa (balão vidro transparente) -->
    <div class="ads-actions-bar-wrapper">
      <div class="ads-actions-bar">
        <router-link to="/" class="ads-action-btn" title="Início">
          <AppIcon name="home" :size="22" />
          <span>Início</span>
        </router-link>
        <button type="button" class="ads-action-btn" @click="copyLink" title="Copiar link">
          <AppIcon name="link" :size="22" />
          <span>Copiar link</span>
        </button>
        <button type="button" class="ads-action-btn" @click="shareAd" title="Compartilhar">
          <AppIcon name="share" :size="22" />
          <span>Compartilhar</span>
        </button>
        <button type="button" class="ads-action-btn ads-action-whatsapp" @click="openWhatsappChooser" title="Enviar no WhatsApp">
          <AppIcon name="whatsapp" :size="22" />
          <span>WhatsApp</span>
        </button>
        <button v-if="lastAddress" type="button" class="ads-action-btn" @click="openMap" title="Ver no mapa">
          <AppIcon name="place" :size="22" />
          <span>Ver no mapa</span>
        </button>
      </div>
    </div>
    <q-dialog v-model="whatsappChooser" persistent class="wa-dialog-centered">
      <q-card class="wa-choice-card">
        <q-card-section class="wa-choice-header">
          <div class="wa-choice-icon">
            <AppIcon name="whatsapp" :size="24" class="text-white" />
          </div>
          <h3 class="wa-choice-title">O que deseja fazer?</h3>
          <p class="wa-choice-subtitle">Escolha como deseja usar o WhatsApp.</p>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="wa-choice-actions">
            <button type="button" class="admin-row-btn" @click="shareToWhatsappFriend">
              <div class="arb-icon" style="background: linear-gradient(135deg,#25d366,#128c7e)">
                <AppIcon name="share" :size="18" class="text-white" />
              </div>
              <div class="arb-info">
                <span class="arb-label">Compartilhar com um amigo</span>
                <span class="arb-sub">Envie o link do anúncio pelo WhatsApp</span>
              </div>
              <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
            </button>
            <button
              v-if="phoneZap"
              type="button"
              class="admin-row-btn"
              @click="openWhatsappCompany"
            >
              <div class="arb-icon" style="background: linear-gradient(135deg,#128c7e,#075e54)">
                <AppIcon name="chat" :size="18" class="text-white" />
              </div>
              <div class="arb-info">
                <span class="arb-label">Entrar em contato com a empresa</span>
                <span class="arb-sub">Fale diretamente com o negócio</span>
              </div>
              <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
            </button>
          </div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <button class="abs-action-cancel" @click="whatsappChooser = false">Cancelar</button>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import AddAddress from 'components/add/Address'
import FixInfos from 'components/FixInfos'
import OpeningHoursEditor from 'components/OpeningHoursEditor'
import PreviewEcommerce from 'components/PreviewEcommerce'
import AppBottomSheet from 'components/AppBottomSheet'
import EditCategoriesModal from 'components/EditCategoriesModal'
import PostarMediaModal from 'components/PostarMediaModal'
import {
  formatOpeningHours,
  getOpeningStatus,
  normalizeOpeningHours,
} from 'src/js/openingHours'
import { timeAgo as formatTimeAgo } from 'src/js/timeAgo'
import { isSuperAdmin } from 'src/js/superadmin'
import { mapState } from 'vuex'
import { getAdCategories } from 'src/services/adsCategories'

export default {
   components:{
    AddAddress,
    FixInfos,
    OpeningHoursEditor,
    PreviewEcommerce,
    AppBottomSheet,
    EditCategoriesModal,
    PostarMediaModal
    // Lightgallery,
  },
  props:{
    dataAds:{
      type: Object,
      required: true
    }
  },
  data() {
    return {
      headers: [
        { name: 'Authorization', value: '' },
        { name: 'Content-Type', value: 'multipart/form-data' }
      ],
      id: '',
      // plugins: [lgThumbnail, lgZoom]),
      colors: ['primary', 'secondary', 'accent', 'dark', 'positive', 'negative', 'info', 'warning'],
      slide: 1,
      index: [],
      adsComponent: {
          id: '',
          avatar: '',
          categoryId: '',
          customerId: '',
          description: '',
          email: '',
          facebook: '',
          instagram: '',
          name: '',
          openingHours: [],
          website: '',
          createdAt: '',
          updatedAt: '',
          deletedAt: '',
          phones: [],
          addresses: [],
          files: {
            logo: [],
            videos: [],
          }
        },
      expand: {
        action: false,
        basic: false,
        openingHours: false,
        address: false,
        phone: false,
        editCategories: false,
        postarMedia: false
      },
      editAddress: false,
      editPhone: {
        phone: '',
        isWhatsapp: false
      },
      follow: false,
      admin: false,
      confirm: false,
      confirmDeleteAd: false,
      deletePhoneData: {},
      photoUpload: false,
      confirmGallery: false,
      preview: '',
      galleryItems: [],
      galleryUploadResults: [],
      galleryUploading: false,
      storyOpen: false,
      storyIndex: 0,
      storyProgress: 0,
      storyPaused: false,
      confirmStoryDelete: false,
      whatsappChooser: false,
      sendVideo: false,
      videoFilePath: null,
      videoFileName: '',
      videoUploading: false,
      videoDragOver: false,
      videoThumbs: {},
      videoThumbFailed: {},
      storyPhotoDuration: 5000,
      storyPhotoTimer: null,
      adCategories: [],
    };
  },
  emits: ['updated'],
  computed: {
    ...mapState('categories', ['list']),
    categories() {
      return this.list || []
    },
    isSuperAdmin() {
      return isSuperAdmin()
    },
    lastAddress(){
      const addrs = this.adsComponent?.addresses
      if (!addrs || !addrs.length) return null
      return addrs[addrs.length - 1]
    },
    mapEmbedQuery() {
      const addr = this.lastAddress
      if (!addr) return null
      const parts = [
        this.adsComponent?.name,
        addr.street,
        addr.number,
        addr.neighborhood,
        addr.city,
        addr.state,
        addr.zipCode
      ].filter(Boolean)
      return parts.length ? parts.join(', ') : null
    },
    mapEmbedSrc() {
      const q = this.mapEmbedQuery
      if (!q) return ''
      return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`
    },
    phoneZap() {
      if(!this.adsComponent?.phones?.length) return false
      return this.adsComponent.phones.find(p => p.isWhatsapp) || false
    },
    shareUrl() {
      const publicBaseUrl = (process.env.PUBLIC_SITE_URL || 'https://www.poliwebapp.com.br').replace(/\/$/, '')
      const seoBaseUrl = (process.env.SEO_SITE_URL || publicBaseUrl).replace(/\/$/, '')
      const isCommerceSeoRoute = this.$route?.path?.startsWith('/comercio/')
      return isCommerceSeoRoute
        ? `${seoBaseUrl}/comercio/${this.url()}`
        : `${publicBaseUrl}/${this.url()}`
    },
    storyVideos() {
      return (this.adsComponent?.files?.videos || [])
        .filter(v => !v.deletedAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },
    hasVideos() {
      return this.storyVideos.length > 0
    },
    mediaItems() {
      const videos = this.storyVideos.map(v => ({
        type: 'video',
        id: v.id,
        createdAt: v.createdAt,
        link: v.link,
        storyIndex: this.storyVideos.indexOf(v)
      }))
      const photos = (this.adsComponent?.files?.gallery || [])
        .filter(p => !p.deletedAt)
        .map(p => ({
          type: 'photo',
          id: p.id,
          createdAt: p.createdAt,
          src: p.link,
          thumbnail: p.link
        }))
      return [...videos, ...photos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },
    currentMediaItem() {
      return this.mediaItems[this.storyIndex] || null
    },
    showStoryTime() {
      const createdAt = this.currentMediaItem?.createdAt
      if (!createdAt) return false
      const d = new Date(createdAt)
      if (isNaN(d.getTime())) return false
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      return d.getTime() >= oneWeekAgo
    },
    isCurrentVideo() {
      return this.currentMediaItem?.type === 'video'
    },
    openingHoursList() {
      return normalizeOpeningHours(this.adsComponent?.openingHours)
    },
    hasOpeningHours() {
      return this.openingHoursList.some((item) => item.enabled && item.intervals?.length)
    },
    openingStatus() {
      return getOpeningStatus(this.adsComponent?.openingHours)
    },
  },
  watch: {
    dataAds: {
      handler(val) {
        if (val && val.id) {
          this.adsComponent = { ...val }
          this.loadAdCategories()
        }
      },
      deep: true,
    },
    'adsComponent.id': {
      handler(newId, oldId) {
        if (oldId !== undefined && newId !== oldId) {
          this.videoThumbs = {}
          this.videoThumbFailed = {}
        }
      },
    },
  },
  methods: {
    captureVideoThumb(e) {
      const video = e.target
      const id = video.dataset.videoId
      if (!id || this.videoThumbs[id]) return
      const tryCapture = () => {
        try {
          const w = video.videoWidth
          const h = video.videoHeight
          if (!w || !h) return
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          ctx.drawImage(video, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          this.videoThumbs = { ...this.videoThumbs, [id]: dataUrl }
          this.$forceUpdate()
        } catch (err) {
          this.onVideoThumbError({ target: video })
        }
      }
      if (video.readyState >= 2 && video.videoWidth > 0) {
        tryCapture()
        return
      }
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked)
        tryCapture()
      }
      video.addEventListener('seeked', onSeeked)
      const t = (video.duration > 0 && isFinite(video.duration))
        ? Math.min(1, video.duration * 0.1)
        : 0
      video.currentTime = t
    },
    formatOpeningHours,
    onVideoThumbError(e) {
      const id = e.target?.dataset?.videoId
      if (id) {
        this.videoThumbFailed = { ...this.videoThumbFailed, [id]: true }
        this.$forceUpdate()
      }
    },
    onlyNumber(n) {
      return n.replace(/\D/g, '')
    },
     getFollowColor(){
      let follow = localStorage.getItem("follow")
      if(follow) follow = JSON.parse(follow)
      if(!follow) follow = []
      const index = follow.findIndex(x => x.id === this.adsComponent.id)
      if(index>-1){
        this.follow = true
        return true
      }
      return false
    },
    saveHistory(){
      this.sendAction('open')
      let history = localStorage.getItem("history")
      if(history) history = JSON.parse(history)
      if(!history) history = []
      const index = history.findIndex(x => x.id === this.adsComponent.id)
      if(index>-1){
         history.splice(index, 1);
         history.push(this.adsComponent)
      } else if(history && history.length>3){
        history.shift()
        history.push(this.adsComponent)
      } else {
        history.push(this.adsComponent)
      }
      localStorage.setItem("history", JSON.stringify(history))
    },
    follows(){
      this.sendAction('follow')
      let follow = localStorage.getItem("follow")
      if(follow) follow = JSON.parse(follow)
      if(!follow) follow = []
      const index = follow.findIndex(x => x.id === this.adsComponent.id)
      if(index>-1){
        this.follow = false
         follow.splice(index, 1)
      } else {
        this.follow = true

        follow.push(this.adsComponent)
      }
      localStorage.setItem("follow", JSON.stringify(follow))
    },
    pathImg () {
      const logo = this.adsComponent?.files?.logo
      if (!logo?.length) return ''
      const active = logo.filter((l) => !l.deletedAt)
      if (!active.length) return ''
      return active[0].link
      // let last = this.adsComponent.files.logo.length - 1
      // this.adsComponent.files.logo[-1 ? ].link
    },
    categoryLink(cat) {
      const id = cat.id
      const name = (cat.name || 'categoria').trim()
      return `/categorias/${id}/${encodeURIComponent(name)}`
    },
    findCategoryById(categoryId, list = this.categories) {
      for (const item of list || []) {
        if (Number(item.id) === Number(categoryId)) return item
        const found = this.findCategoryById(categoryId, item.subcategories || [])
        if (found) return found
      }
      return null
    },
    categoryLabel(cat) {
      const parentId = cat.categoryId
      if (!parentId) return cat.name

      const parent = this.findCategoryById(parentId)
      if (!parent?.name) return cat.name

      return `${parent.name} / ${cat.name}`
    },
    onPostarMediaSelect(type) {
      this.$nextTick(() => {
        if (type === 'camera') {
          this.$refs.cameraGallery?.click()
          return
        }
        if (type === 'video') {
          this.sendVideo = true
          return
        }
        this.$refs.gallery?.click()
      })
    },
    async loadAdCategories() {
      if (!this.adsComponent?.id) return
      try {
        const res = await getAdCategories(this.adsComponent.id)
        this.adCategories = res?.data?.categories ?? []
        this.adsComponent = {
          ...this.adsComponent,
          categories: [...this.adCategories],
          categoryIds: this.adCategories.map((category) => Number(category.id)),
        }
      } catch (_) {
        this.adCategories = []
        this.adsComponent = {
          ...this.adsComponent,
          categories: [],
          categoryIds:
            this.adsComponent?.categoryId != null
              ? [Number(this.adsComponent.categoryId)]
              : [],
        }
      }
    },
    url(){
      let url = encodeURIComponent(this.adsComponent.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase())
      url = `${this.adsComponent.id}/${url}`
      return url
    },
    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.shareUrl)
        this.$q.notify({
          color: 'positive',
          message: 'Link copiado!',
          icon: 'check_circle',
          position: 'bottom'
        })
      } catch (err) {
        this.$q.notify({
          color: 'negative',
          message: 'Não foi possível copiar',
          icon: 'error',
          position: 'bottom'
        })
      }
    },
    async shareAd() {
      this.sendAction('share')
      const shareData = {
        title: this.adsComponent.name,
        text: (this.adsComponent.description || this.adsComponent.name).slice(0, 100),
        url: this.shareUrl
      }
      try {
        if (navigator.share) {
          await navigator.share(shareData)
          this.$q.notify({
            color: 'positive',
            message: 'Compartilhado com sucesso!',
            icon: 'check_circle',
            position: 'bottom'
          })
        } else {
          await this.copyLink()
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          await this.copyLink()
        }
      }
    },
    openMap() {
      if (!this.lastAddress) return
      const addr = this.lastAddress
      const query = [this.adsComponent.name, addr.street, addr.number, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}`
      this.sendAction('open-map')
      window.open(url, '_blank')
    },
    openWhatsappChooser() {
      this.whatsappChooser = true
    },
    shareToWhatsappFriend() {
      const text = `Olha esse anúncio no Poliweb: ${this.shareUrl}`
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
      this.sendAction('share')
      this.whatsappChooser = false
      window.open(url, '_blank')
    },
    openWhatsappCompany() {
      if (!this.phoneZap) return
      const text = `Olá! Vi o anúncio no Poliweb: ${this.shareUrl}`
      const url = `https://wa.me/55${this.onlyNumber(this.phoneZap.phone)}?text=${encodeURIComponent(text)}`
      this.sendAction('open-whatsapp')
      this.whatsappChooser = false
      window.open(url, '_blank')
    },
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
          return this.adsComponent.name
        }
      },
      instaId(instUrl){
        instUrl = instUrl.split("?")[0]
        instUrl = instUrl.split("/")[3]
        if(instUrl){
          return "@"+instUrl
        }
        return this.adsComponent.name
      },
      logoUpload () {
        const file = this.$refs.file.files[0];
        this.photoUpload = true
        this.adsComponent.files.logo[this.adsComponent.files.logo.length-1].link = URL.createObjectURL(file);
      },
      galleryUpload() {
        const input = this.$refs.gallery
        const files = input?.files
        if (!files?.length) return
        const fileList = Array.from(files)
        const newItems = fileList.map((f) => ({ file: f, thumb: URL.createObjectURL(f) }))
        if (this.confirmGallery) {
          this.galleryItems.push(...newItems)
        } else {
          this.galleryItems = newItems
          this.confirmGallery = true
        }
        this.galleryUploadResults = []
        if (input) input.value = ''
      },
      removeGalleryItem(index) {
        const item = this.galleryItems[index]
        if (item?.thumb) URL.revokeObjectURL(item.thumb)
        this.galleryItems.splice(index, 1)
      },
      resetGalleryModal() {
        this.galleryItems.forEach((item) => {
          if (item?.thumb) URL.revokeObjectURL(item.thumb)
        })
        this.galleryItems = []
        this.galleryUploadResults = []
        this.preview = ''
        if (this.$refs.gallery) this.$refs.gallery.value = ''
      },
      closeGalleryModal() {
        this.confirmGallery = false
        this.resetGalleryModal()
        this.$emit('updated')
      },
      onVideoSelected() {
        const file = this.$refs.videoInput?.files?.[0]
        if (!file) return
        if (file.size > 104857600) {
          this.$q.notify({ type: 'negative', message: 'Vídeo muito grande (máx 100MB)' })
          return
        }
        this.videoFilePath = file
        this.videoFileName = file.name
      },
      onVideoDrop(e) {
        const file = e.dataTransfer?.files?.[0]
        if (!file || !file.type.startsWith('video/')) return
        if (file.size > 104857600) {
          this.$q.notify({ type: 'negative', message: 'Vídeo muito grande (máx 100MB)' })
          return
        }
        this.videoFilePath = file
        this.videoFileName = file.name
      },
      cancelVideoUpload() {
        this.sendVideo = false
        this.videoFilePath = null
        this.videoFileName = ''
      },
      submitVideo() {
        if (!this.videoFilePath) return
        this.videoUploading = true
        const formData = new FormData()
        formData.append('file_path ', this.videoFilePath)
        this.$api.post(`/categories/ads/${this.adsComponent.id}/files/videos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(() => {
          this.$q.notify({ type: 'positive', message: 'Vídeo enviado com sucesso!' })
          this.cancelVideoUpload()
          this.$emit('updated')
        })
        .catch(() => {
          this.$q.notify({ type: 'negative', message: 'Erro ao enviar o vídeo' })
        })
        .finally(() => {
          this.videoUploading = false
        })
      },
      onLogoClick() {
        if (this.admin) {
          this.$refs.file.click()
          return
        }
        if (this.mediaItems.length) {
          this.openStory()
        }
      },
      openStory() {
        this.openStoryAt(0)
      },
      openStoryAt(index) {
        this.clearStoryPhotoTimer()
        this.storyIndex = Math.max(0, Math.min(index, this.mediaItems.length - 1))
        this.storyProgress = 0
        this.storyPaused = false
        this.storyOpen = true
        this.$nextTick(() => {
          const item = this.mediaItems[this.storyIndex]
          if (item?.type === 'video') {
            if (this.$refs.storyVideo) {
              this.$refs.storyVideo.load()
              this.$refs.storyVideo.play().catch(() => {})
            }
          } else if (item?.type === 'photo') {
            this.startStoryPhotoTimer()
          }
        })
      },
      closeStory() {
        this.storyOpen = false
        this.clearStoryPhotoTimer()
        if (this.$refs.storyVideo) {
          this.$refs.storyVideo.pause()
        }
      },
      startStoryPhotoTimer() {
        this.clearStoryPhotoTimer()
        const start = Date.now()
        const tick = () => {
          if (!this.storyOpen) return
          const elapsed = Date.now() - start
          this.storyProgress = Math.min(100, (elapsed / this.storyPhotoDuration) * 100)
          if (elapsed >= this.storyPhotoDuration) {
            this.clearStoryPhotoTimer()
            this.nextStory()
          } else {
            this.storyPhotoTimer = setTimeout(tick, 50)
          }
        }
        this.storyPhotoTimer = setTimeout(tick, 50)
      },
      clearStoryPhotoTimer() {
        if (this.storyPhotoTimer) {
          clearTimeout(this.storyPhotoTimer)
          this.storyPhotoTimer = null
        }
      },
      nextStory() {
        if (this.storyIndex < this.mediaItems.length - 1) {
          this.clearStoryPhotoTimer()
          this.storyIndex++
          this.storyProgress = 0
          this.storyPaused = false
          this.$nextTick(() => {
            const item = this.mediaItems[this.storyIndex]
            if (item?.type === 'video') {
              if (this.$refs.storyVideo) {
                this.$refs.storyVideo.load()
                this.$refs.storyVideo.play().catch(() => {})
              }
            } else if (item?.type === 'photo') {
              this.startStoryPhotoTimer()
            }
          })
        } else {
          this.closeStory()
        }
      },
      prevStory() {
        if (this.storyIndex > 0) {
          this.clearStoryPhotoTimer()
          this.storyIndex--
          this.storyProgress = 0
          this.storyPaused = false
          this.$nextTick(() => {
            const item = this.mediaItems[this.storyIndex]
            if (item?.type === 'video') {
              if (this.$refs.storyVideo) {
                this.$refs.storyVideo.load()
                this.$refs.storyVideo.play().catch(() => {})
              }
            } else if (item?.type === 'photo') {
              this.startStoryPhotoTimer()
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
      timeAgo(dateStr) {
        return formatTimeAgo(dateStr)
      },
      deleteStoryMedia() {
        this.confirmStoryDelete = false
        const item = this.mediaItems[this.storyIndex]
        if (!item?.id) return
        const source = item.type === 'video'
          ? this.adsComponent?.files?.videos?.find((v) => v.id === item.id)
          : this.adsComponent?.files?.gallery?.find((p) => p.id === item.id)
        const prevDeletedAt = source?.deletedAt
        if (source) {
          source.deletedAt = new Date().toISOString()
        }
        this.storyOpen = false
        this.$q.notify({ color: 'secondary', position: 'top', message: item.type === 'video' ? 'Vídeo apagado com sucesso!' : 'Imagem apagada com sucesso!' })
        this.$api.delete(`/categories/ads/files/${item.id}`)
          .then(() => {
            this.$emit('updated')
          })
          .catch((err) => {
            if (source) source.deletedAt = prevDeletedAt
            const msg = err?.response?.data?.message || 'Erro na conexão!'
            this.$q.notify({ color: 'negative', position: 'top', message: msg, icon: 'report_problem' })
            this.$emit('updated')
          })
      },
      openFile () {
        if (!this.admin) return
       this.$refs.file.click()
      },
      editPhoneData(phone){
        this.expand.phone = true; this.editPhone = {...phone, edit: true};
      },
      resetPhone () {
        this.editPhone = {
          phone: '',
          isWhatsapp: false,
          edit: false,
          id: null
        }
      },
      sendAction(type, subtitle) {
        const uuid = localStorage.getItem('uuid')
        const id = localStorage.getItem('id-user') || null;
        let context = localStorage.getItem('context');
        context = JSON.parse(context)
        console.log(context)
        const name = context && context.name ? context.name : 'Visitante'

        const payload = {
          type,
          description: name,
          userId: id,
          uuid: uuid
        }
        this.$api.post(`/categories/ads/${this.adsComponent.id}/actions`, payload)
        .then((response) => {

        })
        .catch((err) => {
            console.log(err)
        })
        .finally(() => {
        })
      },
      deletePhone () {
        this.$q.loading.show()
        this.$api.delete(`/categories/ads/phones/${this.deletePhoneData.id}`)
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Telefone apagado com sucesso!',
              })
            }
            this.resetPhone()
            this.expand.phone = false
            this.$emit('updated')
        })
        .catch((err) => {
            let msg
            if( err.response){
            msg =  err.response.data.message
            }else {
                msg = 'Erro na conexão!'
            }
            this.$q.notify({
            color: 'negative',
            position: 'top',
            message: msg,
            icon: 'report_problem'
            })
        })
        .finally(() => {
            this.$q.loading.hide()
        })
      },
      deleteAd() {
        if (!this.isSuperAdmin || !this.adsComponent?.id) {
          this.confirmDeleteAd = false
          return
        }

        this.$q.loading.show()
        this.$api.delete(`/categories/ads/${this.adsComponent.id}`)
          .then(() => {
            this.confirmDeleteAd = false
            this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Anúncio apagado com sucesso!',
            })

            const fallbackCategoryId = this.adsComponent.categoryId
            const targetCategory = this.adCategories[0] || this.findCategoryById(fallbackCategoryId)

            if (targetCategory?.id) {
              this.$router.push(this.categoryLink(targetCategory))
              return
            }

            this.$router.push('/')
          })
          .catch((err) => {
            let msg
            if (err.response) {
              msg = err.response.data.message
            } else {
              msg = 'Erro na conexão!'
            }

            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: msg,
              icon: 'report_problem'
            })
          })
          .finally(() => {
            this.$q.loading.hide()
          })
      },
      newPhone() {
        this.$q.loading.show()
        const payload = { phone: this.onlyNumber(this.editPhone.phone), isWhatsapp: this.editPhone.isWhatsapp }
        const path = (this.editPhone.edit && this.editPhone.id)
          ? `/categories/ads/phones/${this.editPhone.id}`
          : `/categories/ads/${this.adsComponent.id}/phones`
        this.$api.post(path, payload)
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Telefone salvo com sucesso!',
              })
            }
            this.resetPhone()
            this.expand.phone = false
            this.$emit('updated')
        })
        .catch((err) => {
            let msg
            if( err.response){
            msg =  err.response.data.message
            }else {
                msg = 'Erro na conexão!'
            }
            this.$q.notify({
            color: 'negative',
            position: 'top',
            message: msg,
            icon: 'report_problem'
            })
        })
        .finally(() => {
            this.$q.loading.hide()
        })
      },
      async sendGallery() {
        const files = this.galleryItems.map((i) => i.file)
        if (!files?.length) return
        this.galleryUploading = true
        const images = files.filter((f) => (f.type || '').startsWith('image/'))
        const videos = files.filter((f) => (f.type || '').startsWith('video/'))
        const results = []
        try {
          if (images.length) {
            const formData = new FormData()
            formData.append('name', 'gallery')
            images.forEach((f) => formData.append('file', f))
            const res = await this.$api.post(
              `/categories/ads/${this.adsComponent.id}/files/gallery`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            ).then((r) => r.data)
            if (res?.batch && Array.isArray(res.results)) {
              res.results.forEach((r, i) => results.push({ ...r, index: i, fileName: images[i]?.name }))
            } else if (res?.id) {
              results.push({ index: 0, fileName: images[0]?.name, ok: true, id: res.id })
            }
          }
          for (let i = 0; i < videos.length; i++) {
            const v = videos[i]
            const formData = new FormData()
            formData.append('file_path ', v)
            try {
              await this.$api.post(
                `/categories/ads/${this.adsComponent.id}/files/videos`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              )
              results.push({ index: images.length + i, fileName: v.name, ok: true })
            } catch (e) {
              results.push({ index: images.length + i, fileName: v.name, ok: false, message: e?.response?.data?.message || 'Erro ao enviar' })
            }
          }
          this.galleryUploadResults = results.length ? results : files.map((f, i) => ({ index: i, fileName: f.name, ok: false, message: 'Não processado' }))
          const okCount = this.galleryUploadResults.filter((r) => r.ok).length
          const failCount = this.galleryUploadResults.filter((r) => !r.ok).length
          if (failCount === 0) {
            this.$q.notify({ color: 'positive', position: 'top', message: `${okCount} arquivo(s) enviado(s) com sucesso!` })
            this.$emit('updated')
          } else if (okCount > 0) {
            this.$q.notify({ color: 'warning', position: 'top', message: `${okCount} enviado(s), ${failCount} falha(s).` })
            this.$emit('updated')
          } else {
            this.$q.notify({ color: 'negative', position: 'top', message: 'Falha ao enviar.', icon: 'report_problem' })
          }
        } catch (err) {
          const msg = err?.response?.data?.message || 'Erro na conexão!'
          this.$q.notify({ color: 'negative', position: 'top', message: msg, icon: 'report_problem' })
          this.confirmGallery = false
          this.galleryItems = []
          this.galleryUploadResults = []
        } finally {
          this.galleryUploading = false
        }
      },
      setAtt(){
        this.$q.loading.show()
        let data = new FormData();
        data.append('name', 'my-picture');
        data.append('file', this.$refs.file.files[0]);
        this.$api.post(`/categories/ads/${this.adsComponent.id}/files/logo`, data , { headers: { 'Content-Type': 'multipart/form-data' }})
        .then((response) => {
            //  console.log(response.data.addresses)
            if(response.data){
              this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Cadastro salvo com sucesso!',
              })
              this.$emit('updated')
            }
        })
        .catch((err) => {
            let msg
            if( err.response){
            msg =  err.response.data.message
            }else {
                msg = 'Erro na conexão!'
            }
            this.$q.notify({
            color: 'negative',
            position: 'top',
            message: msg,
            icon: 'report_problem'
            })
        })
        .finally(() => {
            this.$q.loading.hide()
        })
      }
   },
   created () {

     this.adsComponent = { ...this.dataAds}
    console.table(this.adsComponent)

   },
  async mounted () {
    const token = localStorage.getItem('token')
    this.headers[0].value = `Bearer ${token}`
    const admin = localStorage.getItem('admin') ? true : false
    let id = localStorage.getItem('id-customer')
    id = JSON.parse(id)
    // get id to params router
    this.id = this.$route.params.id
    this.admin = admin
    if(this.adsComponent.customerId === id){
      this.admin = true
    }
    this.saveHistory()
    this.getFollowColor()
    if (this.admin && isSuperAdmin() && !this.categories.length) {
      try {
        await this.$store.dispatch('categories/fetchCategories')
      } catch (_) {}
    }
    this.loadAdCategories()
  },
  beforeUnmount() {
    if (this.pswpObserver) {
      this.pswpObserver.disconnect()
    }
  },
};
</script>
<style scoped>
.ads-page {
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, #eef2f6 0%, #e5e7eb 100%);
  min-height: 100%;
}
.ads-actions-bar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0.5rem 1rem;
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  z-index: 100;
}
.ads-actions-bar {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  justify-content: center;
  flex-wrap: nowrap;
  padding: 0.4rem 0.6rem;
  width: auto;
  max-width: min(480px, calc(100vw - 2rem));
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    0 2px 12px rgba(255, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}
.ads-actions-bar .ads-action-btn {
  flex: 0 0 auto;
  min-width: 0;
}
@media (min-width: 768px) {
  .ads-actions-bar-wrapper {
    padding: 0.75rem 1.5rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  }
  .ads-actions-bar {
    max-width: 480px;
    padding: 0.5rem 0.75rem;
  }
}
.ads-actions-bar::-webkit-scrollbar {
  display: none;
}
.ads-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.3);
  color: #4b5563;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex: 0 0 auto;
  -webkit-tap-highlight-color: transparent;
  text-decoration: none;
  transition: background 0.2s ease;
}
@media (max-width: 600px) {
  .ads-action-btn span {
    display: none;
  }
  .ads-action-btn {
    padding: 0.5rem;
    min-width: 44px;
    min-height: 44px;
  }
}
.ads-action-btn:hover,
.ads-action-btn:active {
  background: rgba(255, 255, 255, 0.5);
}
.ads-action-whatsapp {
  background: #25d366 !important;
  border-color: #25d366 !important;
  color: white !important;
}
.wa-dialog-centered :deep(.q-dialog__inner) {
  justify-content: center;
  align-items: center;
}
.wa-dialog-centered :deep(.q-dialog__backdrop) {
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.wa-choice-card {
  width: 92vw;
  max-width: 380px;
  border-radius: 14px;
  overflow: hidden;
  /* Glass effect */
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.04),
    0 12px 48px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}
.wa-choice-header {
  text-align: center;
  padding-top: 1.25rem;
}
.wa-choice-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #25d366, #128c7e);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
}
.wa-choice-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem;
}
.wa-choice-subtitle {
  font-size: 0.82rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}
.wa-choice-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
.ads-header {
  background: rgba(255, 255, 255, 0.94);
  padding: 1rem 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  overflow: visible;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}
.ads-header-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  overflow: visible;
}
.ads-logo-wrapper {
  position: relative;
  flex-shrink: 0;
  overflow: visible;
}
.ads-logo-edit {
  position: absolute;
  bottom: -4px;
  right: -4px;
  z-index: 2;
}
.ads-logo {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  overflow: hidden;
  background: #f3f4f6;
}

/* ── Área de drop (usada dentro do AppBottomSheet) ── */
.vud-drop-area {
  width: 100%;
  border: 1.5px dashed #d1d5db;
  border-radius: 12px;
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(99, 102, 241, 0.04);
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 0.25rem;
}
.vud-drop-area:hover,
.vud-drop-active {
  border-color: #7c3aed;
  background: rgba(124, 58, 237, 0.06);
}
.vud-drop-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  pointer-events: none;
}
.vud-drop-icon { color: #9ca3af; transition: color 0.2s; }
.vud-drop-active .vud-drop-icon,
.vud-drop-area:hover .vud-drop-icon { color: #7c3aed; }
.vud-drop-label {
  font-size: 0.88rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
  text-align: center;
  word-break: break-all;
  max-width: 240px;
}
.vud-drop-hint {
  font-size: 0.72rem;
  color: #9ca3af;
  letter-spacing: 0.03em;
}
.vud-progress-wrap {
  width: 100%;
  height: 3px;
  background: #e5e7eb;
  border-radius: 99px;
  overflow: hidden;
  margin-top: 0.75rem;
}
.vud-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
  border-radius: 99px;
  animation: vud-progress 1.4s ease-in-out infinite alternate;
}
@keyframes vud-progress {
  0%   { width: 15%; margin-left: 0; }
  100% { width: 55%; margin-left: 40%; }
}

/* ── Botões de ação do AppBottomSheet ── */
.abs-action-cancel {
  flex: 1;
  padding: 0.65rem;
  border-radius: 11px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.abs-action-cancel:hover { background: #f3f4f6; }
.abs-action-confirm {
  flex: 2;
  padding: 0.65rem 0.875rem;
  border-radius: 11px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  box-shadow: 0 3px 12px rgba(124, 58, 237, 0.35);
  transition: box-shadow 0.2s;
}
.abs-action-confirm:hover { box-shadow: 0 5px 18px rgba(124, 58, 237, 0.5); }
.abs-action-confirm-amber {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  box-shadow: 0 3px 12px rgba(245, 158, 11, 0.35) !important;
}
.abs-action-confirm-amber:hover {
  box-shadow: 0 5px 18px rgba(245, 158, 11, 0.5) !important;
}
.abs-action-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none !important;
}

/* ── Painel Admin ── */
.admin-panel {
  padding: 0 1rem;
  margin-top: 0.75rem;
}
.admin-panel-heading {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9ca3af;
  margin: 0 0 0.4rem 0.25rem;
}
.admin-panel-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  border: 1px solid #f3f4f6;
}
.admin-divider {
  height: 1px;
  background: #f3f4f6;
  margin-left: 56px;
}
.admin-row-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.admin-row-btn:active { background: #f9fafb; }
.arb-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.arb-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: left;
}
.arb-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
}
.arb-sub {
  font-size: 0.72rem;
  color: #9ca3af;
  line-height: 1.2;
}

/* Form de telefone no bottom sheet */
.phone-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.phone-list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}
.phone-list-number {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #374151;
}
.phone-list-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 6px;
}
.phone-list-actions {
  display: flex;
  gap: 0.25rem;
}
.phone-form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}
.phone-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}
.phone-check-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

/* Botão adicionar vídeo (admin) */
.ads-gallery-add-video {
  background: linear-gradient(135deg, #ede9fe, #ddd6fe) !important;
  border-color: #a78bfa !important;
  color: #7c3aed !important;
}

/* Thumbnail de vídeo na galeria horizontal */
.ads-gallery-video-thumb {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.ads-gallery-video-thumb::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6c3fc5 0%, #2d6cdf 100%);
  opacity: 0.7;
}
.ads-video-thumb-img,
.ads-video-thumb-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}
.ads-video-thumb-video {
  background: #1a1a1a;
}
.ads-gallery-video-thumb > *:not(.ads-video-thumb-img):not(.ads-video-thumb-video) {
  position: relative;
  z-index: 1;
}
.ads-gallery-video-num {
  color: rgba(255,255,255,0.8);
  font-size: 0.7rem;
  font-weight: 600;
}
.ads-gallery-video-time {
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  font-size: 0.65rem;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  z-index: 1;
}

/* Grid de mídia (fotos + vídeos) */
.ads-media-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
  width: 100%;
}
.ads-media-grid-video {
  aspect-ratio: 1;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  cursor: pointer;
  overflow: hidden;
  position: relative;
}
.ads-media-grid-video::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6c3fc5 0%, #2d6cdf 100%);
  opacity: 0.75;
}
.ads-media-grid-video-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  z-index: 1;
}
.ads-media-grid-video-badge {
  color: rgba(255,255,255,0.85);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(0,0,0,0.3);
  padding: 2px 6px;
  border-radius: 20px;
}
.ads-media-grid-photo {
  aspect-ratio: 1;
  overflow: hidden;
  display: block;
  cursor: pointer;
  position: relative;
}
.ads-media-grid-photo img,
.ads-media-grid-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.08);
  display: block;
}
@media (min-width: 768px) {
  .ads-media-grid-photo { aspect-ratio: 3 / 4; }
  .ads-media-grid-video { aspect-ratio: 3 / 4; }
}

/* Story ring no logo de perfil */
.ads-story-ring {
  padding: 4px;
  margin: -4px;
  border-radius: 50%;
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #833ab4, #5851db, #405de6);
  background-size: 300% 300%;
  animation: story-ring-spin 3s linear infinite;
  box-sizing: content-box;
}
.ads-story-logo {
  border: 2.5px solid white;
  border-radius: 50% !important;
  overflow: hidden;
}
@keyframes story-ring-spin {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.ads-story-logo :deep(.q-img),
.ads-story-logo :deep(.q-img__image),
.ads-story-logo :deep(.q-avatar) {
  border-radius: 50% !important;
}

/* Story player fullscreen */
.story-dialog .q-dialog__inner {
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
.story-media {
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
  background: rgba(255,255,255,0.35);
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
  width: 36px;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.8);
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
  font-size: 0.75rem;
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
  font-size: 0.9rem;
  text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.story-header-time {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.85);
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.story-close-btn {
  color: #fff;
  background: rgba(0,0,0,0.3);
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
.story-tap-prev,
.story-tap-next {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35%;
  z-index: 9;
}
.story-tap-prev { left: 0; }
.story-tap-next { right: 0; }
.story-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
  z-index: 10;
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
}
.story-ctrl-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.story-ctrl-delete:hover {
  background: rgba(239, 68, 68, 0.3);
  border-radius: 8px;
}
.ads-info {
  flex: 1;
  min-width: 0;
}
.ads-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}
.ads-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ads-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.ads-whatsapp {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #25d366;
  color: white !important;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}
.ads-follow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 0.9rem;
  color: #4b5563;
  cursor: pointer;
  min-height: 44px;
}
.ads-follow.ads-following {
  background: #10b981;
  border-color: #10b981;
  color: white;
}
.ads-section {
  padding: 1rem;
}
.ads-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  border: 1px solid #e5e7eb;
}
.ads-categories-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.ads-category-tag {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.12);
  color: #6d28d9;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.ads-category-tag:hover,
.ads-category-tag:active {
  background: rgba(124, 58, 237, 0.22);
  color: #5b21b6;
}
.ads-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 !important;
  padding: 0;
  line-height: 1.25;
}
.ads-card-text {
  font-size: 0.9375rem;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}
.ads-gallery {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}
.ads-gallery::-webkit-scrollbar {
  height: 4px;
}
.gallery-batch-list {
  max-height: 200px;
  overflow-y: auto;
}
.gallery-batch-item {
  padding: 0.35rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.gallery-batch-item:last-child {
  border-bottom: none;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ads-gallery-add {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: #9ca3af;
  font-size: 0.75rem;
  cursor: pointer;
}
.ads-contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.ads-contact-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.ads-contact-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #4b5563;
  text-decoration: none;
  font-size: 1rem;
  flex: 1;
  min-height: 44px;
}
.ads-contact-actions {
  display: flex;
  gap: 0.25rem;
}
.ads-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ads-link-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  color: #4b5563;
  text-decoration: none;
  font-size: 1rem;
  min-height: 44px;
  border-bottom: 1px solid #f3f4f6;
}
.ads-link-item:last-child {
  border-bottom: none;
}
.ads-address-card {
  padding: 1rem;
}
.ads-address-link {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #4b5563;
  text-decoration: none;
  padding: 0.5rem 0;
  min-height: 44px;
}
.ads-address-text {
  flex: 1;
  font-size: 0.9375rem;
  line-height: 1.5;
}
.ads-map-wrapper {
  background: #f9fafb;
}
.ads-map-iframe {
  display: block;
}
/* Grid estilo Instagram - mesma galeria vue-picture-swipe (PhotoSwipe lightbox)
   Wrapper quebra o padding da section: mobile = largura total, desktop = max-width */
.ads-photo-grid-bleed {
  margin: 0 -1rem;
  width: calc(100% + 2rem);
}
@media (min-width: 768px) {
  .ads-photo-grid-bleed {
    max-width: 640px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
  }
}
.ads-photo-grid {
  width: 100%;
  max-width: 100%;
}
.ads-photo-grid :deep(.my-gallery) {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
  width: 100%;
  flex-wrap: wrap !important;
}
.ads-photo-grid :deep(figure) {
  display: block !important;
  margin: 0 !important;
  margin-right: 0 !important;
  aspect-ratio: 1;
  overflow: hidden;
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100%;
  border-radius: 0 !important;
}
@media (min-width: 768px) {
  .ads-photo-grid :deep(figure) {
    aspect-ratio: 3 / 4;
  }
}
.ads-photo-grid :deep(figure a) {
  display: block;
  width: 100%;
  height: 100%;
}
.ads-photo-grid :deep(figure img) {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  object-fit: cover;
  border-radius: 0;
}
</style>
<style>
.scroll-gallery{
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  overflow-scrolling: touch;
  webkit-overflow-scrolling: touch;
}
.scroll-gallery::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.062);
  background-color: #F5F5F5;
}
.scroll-gallery::-webkit-scrollbar {
  width: 4px;
  height: 4px;
  background-color: #F5F5F5;
}
.scroll-gallery::-webkit-scrollbar-thumb {
  background-color: #25252523;
}
.my-gallery {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
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
.pswp img {
    max-width: none;
    object-fit: contain;
}

/* Modal de upload de galeria - UI moderna */
.gallery-upload-dialog .q-dialog__backdrop {
  backdrop-filter: blur(4px);
}
.gallery-upload-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0,0,0,0.12);
  max-width: 420px;
}
.gallery-upload-header {
  padding: 24px 24px 16px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
.gallery-upload-header-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.gallery-upload-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}
.gallery-upload-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}
.gallery-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
  max-height: 280px;
  overflow-y: auto;
  padding: 4px 0;
}
.gallery-upload-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
}
.gallery-upload-thumb-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: #e2e8f0;
}
.gallery-upload-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gallery-upload-thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  opacity: 0;
  transition: opacity 0.2s;
}
.gallery-upload-thumb-overlay.gallery-upload-visible {
  opacity: 1;
}
.gallery-upload-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6) !important;
  color: #fff !important;
  min-width: 28px;
  min-height: 28px;
}
.gallery-upload-remove:hover {
  background: rgba(220,38,38,0.9) !important;
}
.gallery-upload-cell-error {
  display: block;
  font-size: 0.7rem;
  color: #ef4444;
  margin-top: 2px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gallery-upload-add-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f1f5f9;
  border: 2px dashed #94a3b8;
  color: #64748b;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.gallery-upload-add-more:hover {
  background: #e2e8f0;
  border-color: #3b82f6;
  color: #3b82f6;
}
.gallery-upload-add-more span {
  font-size: 0.7rem;
  font-weight: 500;
}
.gallery-upload-actions {
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  gap: 12px;
}
.animate-pulse {
  animation: gallery-pulse 1.5s ease-in-out infinite;
}
@keyframes gallery-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ads-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.ads-status-chip--open {
  background: #dcfce7;
  color: #166534;
}

.ads-status-chip--closed {
  background: #fee2e2;
  color: #991b1b;
}

.ads-status-detail {
  margin: -2px 0 8px;
  font-size: 0.82rem;
  color: #64748b;
}

.ads-hours-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.ads-hours-today {
  font-size: 0.8rem;
  color: #64748b;
}

.ads-hours-list {
  display: grid;
  gap: 8px;
}

.ads-hours-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #e5e7eb;
}

.ads-hours-row:first-child {
  border-top: 0;
  padding-top: 0;
}

.ads-hours-day {
  font-weight: 600;
  color: #0f172a;
}

.ads-hours-value {
  color: #64748b;
  text-align: right;
}

 @import 'lightgallery/css/lightgallery.css';
  @import 'lightgallery/css/lg-thumbnail.css';
  @import 'lightgallery/css/lg-zoom.css';
</style>
