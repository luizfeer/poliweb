<template>
  <div class="product-options-editor">
    <div class="row items-center justify-between q-mb-sm">
      <strong>Variações e adicionais</strong>
      <q-btn flat color="primary" label="Adicionar grupo" @click="addGroup" />
    </div>
    <p class="text-caption">Ex.: tamanho (escolha uma opção) ou extras (várias opções). Valores são somados ao preço do produto.</p>
    <div v-for="(group, groupIndex) in groups" :key="groupIndex" class="option-editor-group">
      <div class="row q-gutter-sm items-center">
        <q-input :model-value="group.name" filled label="Nome do grupo" class="col" @update:model-value="setGroup(groupIndex, 'name', $event)" />
        <q-btn flat round icon="delete" color="negative" @click="removeGroup(groupIndex)" />
      </div>
      <div class="row q-gutter-sm q-my-sm">
        <q-select :model-value="group.type" :options="typeOptions" emit-value map-options filled label="Tipo" class="col" @update:model-value="setGroup(groupIndex, 'type', $event)" />
        <q-toggle :model-value="group.required" label="Obrigatório" @update:model-value="setGroup(groupIndex, 'required', $event)" />
      </div>
      <div v-for="(choice, choiceIndex) in group.choices" :key="choiceIndex" class="row q-gutter-sm items-center q-mb-sm">
        <q-input :model-value="choice.name" filled label="Opção" class="col" @update:model-value="setChoice(groupIndex, choiceIndex, 'name', $event)" />
        <q-input :model-value="choice.price" filled type="number" min="0" step="0.01" label="Adição (R$)" style="width: 130px" @update:model-value="setChoice(groupIndex, choiceIndex, 'price', $event)" />
        <q-btn flat round icon="delete" color="negative" @click="removeChoice(groupIndex, choiceIndex)" />
      </div>
      <q-btn flat color="primary" label="Adicionar opção" @click="addChoice(groupIndex)" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductOptionsEditor',
  props: { modelValue: { type: Array, default: () => [] } },
  emits: ['update:modelValue'],
  data() { return { typeOptions: [{ label: 'Escolha uma', value: 'single' }, { label: 'Escolha várias', value: 'multiple' }] } },
  computed: { groups() { return this.modelValue || [] } },
  methods: {
    update(mutator) {
      const groups = JSON.parse(JSON.stringify(this.groups))
      mutator(groups)
      this.$emit('update:modelValue', groups)
    },
    addGroup() { this.update(groups => groups.push({ name: '', type: 'single', required: true, choices: [{ name: '', price: '0' }] })) },
    removeGroup(index) { this.update(groups => groups.splice(index, 1)) },
    setGroup(index, key, value) { this.update(groups => { groups[index][key] = value }) },
    addChoice(index) { this.update(groups => groups[index].choices.push({ name: '', price: '0' })) },
    removeChoice(groupIndex, choiceIndex) { this.update(groups => groups[groupIndex].choices.splice(choiceIndex, 1)) },
    setChoice(groupIndex, choiceIndex, key, value) { this.update(groups => { groups[groupIndex].choices[choiceIndex][key] = value }) }
  }
}
</script>

<style scoped>
.product-options-editor { margin: 1rem 0; }
.option-editor-group { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin: 0.75rem 0; }
</style>
