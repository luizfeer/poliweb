<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
    class="edit-categories-modal"
    maximized
  >
    <div class="edit-categories-sheet menu-modal-sheet">
      <div class="menu-modal-handle" />
      <div class="edit-categories-header">
        <q-btn flat round dense icon="close" @click="$emit('update:modelValue', false)" />
        <h2 class="edit-categories-title">Editar categorias</h2>
      </div>

      <div class="edit-categories-body">
        <!-- Lista das categorias atuais -->
        <section class="edit-categories-section">
          <h3 class="edit-categories-section-title">Categorias do anúncio</h3>
          <p class="edit-categories-hint">O anúncio deve ter ao menos uma categoria.</p>
          <div class="edit-categories-current">
            <q-chip
              v-for="cat in currentCategories"
              :key="cat.id"
              removable
              :disable="currentCategories.length <= 1"
              @remove="onRemove(cat)"
              class="edit-categories-chip"
            >
              <q-avatar v-if="cat.iconLink" size="24px">
                <q-img :src="cat.iconLink" :ratio="1" />
              </q-avatar>
              {{ categoryLabel(cat) }}
            </q-chip>
            <p v-if="!currentCategories.length && !loading" class="text-gray-500 text-sm">Nenhuma categoria.</p>
          </div>
        </section>

        <!-- Adicionar categorias - árvore com filtro -->
        <section class="edit-categories-section">
          <h3 class="edit-categories-section-title">Adicionar categoria</h3>
          <q-input
            v-model="filterText"
            filled
            dense
            placeholder="Filtrar por nome..."
            class="edit-categories-filter"
            clearable
          >
            <template #prepend>
              <AppIcon name="search" :size="20" class="text-gray-400" />
            </template>
          </q-input>

          <div class="edit-categories-tree">
            <CategoryTreeItem
              v-for="item in filteredCategories"
              :key="item.id"
              :item="item"
              :selected-ids="selectedIds"
              @select="onAdd"
            />
          </div>
        </section>
      </div>

      <q-banner v-if="errorMsg" dense class="bg-negative text-white rounded-borders q-mx-4 q-mb-2">
        {{ errorMsg }}
        <template #action>
          <q-btn flat dense icon="close" @click="errorMsg = ''" />
        </template>
      </q-banner>
    </div>
  </q-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import AppIcon from 'components/AppIcon'
import CategoryTreeItem from 'components/CategoryTreeItem.vue'
import { getAdCategories, addAdCategory, removeAdCategory } from 'src/services/adsCategories'

export default {
  name: 'EditCategoriesModal',
  components: { AppIcon, CategoryTreeItem },
  props: {
    modelValue: { type: Boolean, default: false },
    adId: { type: [Number, String], required: true },
    categories: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue', 'updated'],
  setup(props, { emit }) {
    const currentCategories = ref([])
    const loading = ref(false)
    const errorMsg = ref('')
    const filterText = ref('')

    const selectedIds = computed(() =>
      currentCategories.value.map((c) => Number(c.id))
    )

    function findCategoryById(categoryId, list = props.categories) {
      for (const item of list || []) {
        if (Number(item.id) === Number(categoryId)) return item
        const found = findCategoryById(categoryId, item.subcategories || [])
        if (found) return found
      }
      return null
    }

    function categoryLabel(category) {
      const parentId = category?.categoryId
      if (!parentId) return category?.name || ''

      const parent = findCategoryById(parentId)
      return parent?.name ? `${parent.name} / ${category.name}` : category.name
    }

    function matchesFilter(item, filter) {
      if (!filter || !filter.trim()) return true
      const f = filter.trim().toLowerCase()
      const name = (item.name || '').toLowerCase()
      if (name.includes(f)) return true
      const subs = item.subcategories || []
      return subs.some((s) => matchesFilter(s, filter))
    }

    const filteredCategories = computed(() => {
      const list = props.categories || []
      const filter = filterText.value
      if (!filter || !filter.trim()) return list
      return list
        .filter((item) => matchesFilter(item, filter))
        .map((item) => {
          if (!item.subcategories?.length) return item
          const filteredSubs = item.subcategories
            .filter((s) => matchesFilter(s, filter))
            .map((s) => {
              if (!s.subcategories?.length) return s
              return {
                ...s,
                subcategories: s.subcategories.filter((sub) =>
                  matchesFilter(sub, filter)
                ),
              }
            })
            .filter((s) => s.subcategories?.length || matchesFilter(s, filter))
          return { ...item, subcategories: filteredSubs }
        })
    })

    async function loadCurrent() {
      if (!props.adId) return
      loading.value = true
      errorMsg.value = ''
      try {
        const res = await getAdCategories(props.adId)
        currentCategories.value = res?.data?.categories ?? []
      } catch (err) {
        errorMsg.value =
          err?.response?.data?.message || 'Erro ao carregar categorias.'
        currentCategories.value = []
      } finally {
        loading.value = false
      }
    }

    async function onAdd(categoryId) {
      if (!categoryId || selectedIds.value.includes(Number(categoryId))) return
      errorMsg.value = ''
      try {
        await addAdCategory(props.adId, Number(categoryId))
        await loadCurrent()
        emit('updated')
      } catch (err) {
        errorMsg.value =
          err?.response?.data?.message || 'Não foi possível adicionar.'
      }
    }

    async function onRemove(adCategory) {
      if (currentCategories.value.length <= 1) return
      const categoryId = Number(adCategory.id)
      errorMsg.value = ''
      try {
        await removeAdCategory(props.adId, categoryId)
        await loadCurrent()
        emit('updated')
      } catch (err) {
        errorMsg.value =
          err?.response?.data?.message || 'Não foi possível remover.'
      }
    }

    watch(
      () => [props.modelValue, props.adId],
      ([open, id]) => {
        if (open && id) loadCurrent()
      },
      { immediate: true }
    )

    return {
      currentCategories,
      loading,
      errorMsg,
      filterText,
      selectedIds,
      filteredCategories,
      categoryLabel,
      onAdd,
      onRemove,
    }
  },
}
</script>

<style scoped>
.edit-categories-sheet {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.edit-categories-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.edit-categories-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #111827;
}
.edit-categories-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
}
.edit-categories-section {
  margin-bottom: 1.5rem;
}
.edit-categories-section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
}
.edit-categories-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}
.edit-categories-current {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2.5rem;
}
.edit-categories-chip {
  font-weight: 500;
}
.edit-categories-filter {
  margin-bottom: 0.75rem;
}
.edit-categories-tree {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
