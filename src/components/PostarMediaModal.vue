<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
    class="postar-media-modal"
  >
    <div class="postar-media-sheet menu-modal-sheet">
      <div class="menu-modal-handle" />
      <div class="postar-media-header">
        <q-btn flat round dense icon="close" @click="$emit('update:modelValue', false)" />
        <h2 class="postar-media-title">Postar mídia</h2>
      </div>
      <p class="postar-media-subtitle">Escolha o tipo de mídia para adicionar à galeria do anúncio.</p>

      <div class="postar-media-options">
        <button type="button" class="postar-media-option" @click="onSelect('camera')">
          <div class="postar-media-option-icon" style="background: linear-gradient(135deg,#0ea5e9,#0284c7)">
            <AppIcon name="add-a-photo" :size="24" class="text-white" />
          </div>
          <div class="postar-media-option-info">
            <span class="postar-media-option-label">Câmera</span>
            <span class="postar-media-option-sub">Tirar uma foto agora</span>
          </div>
          <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
        </button>

        <div class="postar-media-divider" />

        <button type="button" class="postar-media-option" @click="onSelect('gallery')">
          <div class="postar-media-option-icon" style="background: linear-gradient(135deg,#3b82f6,#2563eb)">
            <AppIcon name="add-photo-alternate" :size="24" class="text-white" />
          </div>
          <div class="postar-media-option-info">
            <span class="postar-media-option-label">Galeria</span>
            <span class="postar-media-option-sub">Escolher foto do celular</span>
          </div>
          <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
        </button>

        <div class="postar-media-divider" />

        <button type="button" class="postar-media-option" @click="onSelect('video')">
          <div class="postar-media-option-icon" style="background: linear-gradient(135deg,#7c3aed,#6d28d9)">
            <AppIcon name="videocam" :size="24" class="text-white" />
          </div>
          <div class="postar-media-option-info">
            <span class="postar-media-option-label">Vídeo</span>
            <span class="postar-media-option-sub">Adicionar vídeo à galeria</span>
          </div>
          <AppIcon name="chevron-right" :size="20" class="text-gray-400" />
        </button>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import AppIcon from 'components/AppIcon'

export default {
  name: 'PostarMediaModal',
  components: { AppIcon },
  props: {
    modelValue: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'select'],
  methods: {
    onSelect(type) {
      this.$emit('update:modelValue', false)
      this.$emit('select', type)
    },
  },
}
</script>

<style scoped>
.postar-media-sheet {
  border-radius: 20px 20px 0 0;
  padding: 0 0 calc(2rem + env(safe-area-inset-bottom, 0px));
}
.postar-media-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.postar-media-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #111827;
}
.postar-media-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 1rem 1rem;
}
.postar-media-options {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  overflow: hidden;
  margin: 0 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  border: 1px solid #f3f4f6;
}
.postar-media-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.postar-media-option:active {
  background: #f9fafb;
}
.postar-media-option-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.postar-media-option-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.postar-media-option-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
}
.postar-media-option-sub {
  font-size: 0.75rem;
  color: #9ca3af;
}
.postar-media-divider {
  height: 1px;
  background: #f3f4f6;
  margin-left: 68px;
}
</style>
