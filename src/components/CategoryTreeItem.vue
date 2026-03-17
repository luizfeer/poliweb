<template>
  <div class="category-tree-item" :style="{ paddingLeft: `${depth * 12}px` }">
    <div class="category-tree-row">
      <q-btn
        v-if="hasChildren"
        flat
        dense
        round
        size="sm"
        :icon="expanded ? 'expand_more' : 'chevron_right'"
        @click="expanded = !expanded"
        class="category-tree-toggle"
      />
      <span v-else class="category-tree-spacer" />
      <div class="category-tree-content">
        <span class="category-tree-name">{{ item.name }}</span>
        <q-btn
          v-if="!isSelected"
          flat
          dense
          round
          size="sm"
          color="primary"
          icon="add_circle_outline"
          @click="$emit('select', item.id)"
          class="category-tree-add"
        >
          <q-tooltip>Adicionar</q-tooltip>
        </q-btn>
        <q-chip v-else dense size="sm" color="primary" text-color="white">Adicionada</q-chip>
      </div>
    </div>
    <div v-if="hasChildren && expanded" class="category-tree-children">
      <CategoryTreeItem
        v-for="(sub, idx) in (item.subcategories || [])"
        :key="`${item.id}-${idx}`"
        :item="sub"
        :selected-ids="selectedIds"
        :depth="depth + 1"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'CategoryTreeItem',
  props: {
    item: { type: Object, required: true },
    selectedIds: { type: Array, default: () => [] },
    depth: { type: Number, default: 0 },
  },
  emits: ['select'],
  setup(props) {
    const expanded = ref(true)
    const hasChildren = computed(
      () => Array.isArray(props.item.subcategories) && props.item.subcategories.length > 0
    )
    const isSelected = computed(() =>
      props.selectedIds.includes(Number(props.item.id))
    )
    return { expanded, hasChildren, isSelected }
  },
}
</script>

<style scoped>
.category-tree-item {
  margin-bottom: 2px;
}
.category-tree-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
}
.category-tree-toggle,
.category-tree-spacer {
  width: 28px;
  flex-shrink: 0;
}
.category-tree-spacer {
  display: inline-block;
}
.category-tree-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.category-tree-name {
  font-size: 0.9rem;
  color: #374151;
}
.category-tree-add {
  flex-shrink: 0;
}
.category-tree-children {
  margin-top: 2px;
}
</style>
