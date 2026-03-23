<template>
  <div class="ad-category-selector">
    <div class="ad-category-label">Categorias do anúncio</div>
    <p class="ad-category-hint">O anúncio deve ter ao menos uma categoria.</p>

    <!-- Chips das categorias selecionadas -->
    <div class="ad-category-chips">
      <q-chip
        v-for="cat in selectedCategories"
        :key="cat.id"
        removable
        :disable="selectedCategories.length <= 1"
        @remove="onRemove(cat.id)"
        class="ad-category-chip"
      >
        <q-avatar v-if="cat.iconLink" class="ad-category-chip-avatar">
          <q-img :src="cat.iconLink" :ratio="1" />
        </q-avatar>
        {{ categoryLabel(cat) }}
      </q-chip>
    </div>

    <!-- Seletor para adicionar nova categoria -->
    <q-select
      v-model="newCategoryId"
      :options="availableOptions"
      option-value="id"
      option-label="name"
      emit-value
      map-options
      filled
      dense
      label="Adicionar categoria"
      class="ad-category-select mt-2"
      :disable="availableOptions.length === 0"
      @update:model-value="onAdd"
    >
      <template #prepend>
        <AppIcon name="add-circle" :size="20" class="text-primary" />
      </template>
    </q-select>

    <q-banner v-if="errorMsg" dense class="bg-negative text-white mt-2 rounded-borders">
      {{ errorMsg }}
      <template #action>
        <q-btn flat dense icon="close" @click="errorMsg = ''" />
      </template>
    </q-banner>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { addAdCategory, removeAdCategory } from 'src/services/adsCategories'

export default {
  name: 'AdCategorySelector',
  props: {
    adId: { type: [Number, String], required: true },
    modelValue: { type: Array, default: () => [] },
    categories: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const categoryIds = ref([...props.modelValue])
    const errorMsg = ref('')
    const newCategoryId = ref(null)

    watch(() => props.modelValue, (val) => {
      categoryIds.value = Array.isArray(val) ? [...val] : []
    }, { immediate: true })

    const selectedCategories = computed(() => {
      const ids = categoryIds.value
      return props.categories.filter((c) => ids.includes(Number(c.id)))
    })

    const availableOptions = computed(() => {
      const ids = new Set(categoryIds.value.map(Number))
      return props.categories.filter((c) => !ids.has(Number(c.id)))
    })

    function emitUpdate() {
      emit('update:modelValue', [...categoryIds.value])
    }

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

    async function onAdd(categoryId) {
      if (!categoryId) return
      const prev = [...categoryIds.value]
      categoryIds.value.push(Number(categoryId))
      emitUpdate()
      newCategoryId.value = null

      try {
        await addAdCategory(props.adId, Number(categoryId))
      } catch (err) {
        categoryIds.value = prev
        emitUpdate()
        errorMsg.value = err?.response?.data?.message || 'Não foi possível adicionar a categoria.'
      }
    }

    async function onRemove(categoryId) {
      if (categoryIds.value.length <= 1) return
      const prev = [...categoryIds.value]
      categoryIds.value = categoryIds.value.filter((id) => Number(id) !== Number(categoryId))
      emitUpdate()

      try {
        await removeAdCategory(props.adId, Number(categoryId))
      } catch (err) {
        categoryIds.value = prev
        emitUpdate()
        errorMsg.value = err?.response?.data?.message || 'Não foi possível remover a categoria.'
      }
    }

    return {
      categoryIds,
      selectedCategories,
      availableOptions,
      newCategoryId,
      errorMsg,
      categoryLabel,
      onAdd,
      onRemove,
    }
  },
}
</script>

<style scoped>
.ad-category-selector {
  margin-bottom: 1rem;
}
.ad-category-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}
.ad-category-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}
.ad-category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2rem;
}
.ad-category-chip {
  font-weight: 500;
}
.ad-category-chip-avatar {
  width: 24px;
  height: 24px;
}
.ad-category-select {
  max-width: 100%;
}
</style>
