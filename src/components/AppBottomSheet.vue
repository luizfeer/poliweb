<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :persistent="persistent"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
    class="abs-dialog"
  >
    <div class="abs-backdrop" @click.self="!persistent && $emit('update:modelValue', false)">
      <div class="abs-sheet menu-modal-sheet">
        <!-- Handle bar (mobile) -->
        <div class="abs-handle" />

        <!-- Botão fechar -->
        <button v-if="!persistent && showClose" class="abs-close" @click="$emit('update:modelValue', false)">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Ícone decorativo -->
        <div v-if="icon || $slots.icon" class="abs-icon-wrap">
          <div class="abs-icon-ring" :style="iconRingStyle">
            <slot name="icon">
              <app-icon :name="icon" :size="26" class="abs-icon-inner" />
            </slot>
          </div>
        </div>

        <!-- Título e subtítulo -->
        <h2 v-if="title" class="abs-title">{{ title }}</h2>
        <p v-if="subtitle" class="abs-subtitle">{{ subtitle }}</p>

        <!-- Conteúdo principal -->
        <div class="abs-body">
          <slot />
        </div>

        <!-- Ações -->
        <div v-if="$slots.actions" class="abs-actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import AppIcon from 'components/AppIcon'

export default {
  name: 'AppBottomSheet',
  components: { AppIcon },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    persistent: {
      type: Boolean,
      default: false
    },
    showClose: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    iconColor: {
      type: String,
      default: '#6366f1'
    },
    iconBg: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  computed: {
    iconRingStyle() {
      const bg = this.iconBg || `linear-gradient(135deg, ${this.iconColor}cc, ${this.iconColor})`
      return { background: bg }
    }
  }
}
</script>

<style scoped>
.abs-dialog :deep(.q-dialog__inner) {
  padding: 0 !important;
}

.abs-backdrop {
  width: 100vw;
  min-height: 100dvh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: transparent;
}

@media (min-width: 520px) {
  .abs-backdrop {
    align-items: center;
    padding: 1.5rem;
  }
}

.abs-sheet {
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  max-height: 90dvh;
  border-radius: 20px 20px 0 0;
  padding: 0.875rem 1rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  overflow: hidden;
}

@media (min-width: 520px) {
  .abs-sheet {
    border-radius: 22px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.9);
    padding: 2rem 2rem;
    padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
  }
}

/* Handle bar */
.abs-handle {
  width: 32px;
  height: 4px;
  background: rgba(0,0,0,0.14);
  border-radius: 99px;
  margin: 0 auto 0.875rem;
}

@media (min-width: 520px) {
  .abs-handle { display: none; }
}

/* Fechar */
.abs-close {
  position: absolute;
  top: 1.1rem;
  right: 1.1rem;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.07);
  color: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.abs-close:hover { background: rgba(0,0,0,0.12); }

/* Ícone */
.abs-icon-wrap { margin-bottom: 0.6rem; }
.abs-icon-ring {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}
.abs-icon-inner { color: #fff !important; }

/* Textos */
.abs-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.2rem;
  text-align: center;
  letter-spacing: -0.01em;
}
.abs-subtitle {
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0 0 0.875rem;
  text-align: center;
  line-height: 1.4;
}

/* Body */
.abs-body {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Ações */
.abs-actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  margin-top: 0.75rem;
}
</style>
