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
      <div v-for="(choice, choiceIndex) in group.choices" :key="choiceIndex" class="choice-editor">
        <div>
          <button v-if="choice.imageUrl" type="button" class="choice-thumb" title="Ampliar imagem" @click="openImage(choice.imageUrl)">
            <img :src="choice.imageUrl" :alt="choice.name || 'Imagem da opção'" />
          </button>
          <button v-else type="button" class="choice-thumb choice-thumb-empty" title="Adicionar imagem opcional" :disabled="uploadingImage" @click="pickImage(groupIndex, choiceIndex)">
            <q-icon name="add_a_photo" size="24px" /><span>Foto</span>
          </button>
          <div v-if="choice.imageUrl" class="choice-image-actions">
            <q-btn flat dense icon="photo_camera" title="Trocar imagem" :disable="uploadingImage" @click="pickImage(groupIndex, choiceIndex)" />
            <q-btn flat dense icon="close" title="Remover imagem" :disable="uploadingImage" @click="removeImage(groupIndex, choiceIndex)" />
          </div>
        </div>
        <div class="choice-fields">
          <q-input :model-value="choice.name" filled label="Opção" @update:model-value="setChoice(groupIndex, choiceIndex, 'name', $event)" />
          <q-input :model-value="choice.price" filled type="number" min="0" step="0.01" label="Adição (R$)" @update:model-value="setChoice(groupIndex, choiceIndex, 'price', $event)" />
        </div>
        <q-btn flat round icon="delete" color="negative" :disable="uploadingImage" title="Remover opção" @click="removeChoice(groupIndex, choiceIndex)" />
      </div>
      <q-btn flat color="primary" label="Adicionar opção" @click="addChoice(groupIndex)" />
    </div>
    <input ref="optionImageInput" type="file" accept="image/*" class="hidden" @change="uploadImage" />
    <q-dialog v-model="showImagePreview"><q-card class="image-preview-card"><q-img :src="expandedImage" fit="contain" /><q-card-actions align="right"><q-btn flat label="Fechar" v-close-popup /></q-card-actions></q-card></q-dialog>
  </div>
</template>

<script>
import { normalizeUploadImage } from 'src/js/normalizeUploadImage'

export default {
  name: 'ProductOptionsEditor',
  props: { modelValue: { type: Array, default: () => [] }, adId: { type: [Number, String], required: true } },
  emits: ['update:modelValue'],
  data() { return {
    typeOptions: [{ label: 'Escolha uma', value: 'single' }, { label: 'Escolha várias', value: 'multiple' }],
    uploadingImage: false, pendingImageChoice: null, showImagePreview: false, expandedImage: ''
  } },
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
    setChoice(groupIndex, choiceIndex, key, value) { this.update(groups => { groups[groupIndex].choices[choiceIndex][key] = value }) },
    removeImage(groupIndex, choiceIndex) {
      this.update(groups => {
        delete groups[groupIndex].choices[choiceIndex].imageFileId
        delete groups[groupIndex].choices[choiceIndex].imageUrl
      })
    },
    openImage(url) { this.expandedImage = url; this.showImagePreview = true },
    pickImage(groupIndex, choiceIndex) {
      this.pendingImageChoice = { groupIndex, choiceIndex }
      this.$refs.optionImageInput.value = ''
      this.$refs.optionImageInput.click()
    },
    async uploadImage(event) {
      const file = event.target.files?.[0]
      const target = this.pendingImageChoice
      if (!file || !target) return
      this.uploadingImage = true
      try {
        const data = new FormData()
        data.append('file', await normalizeUploadImage(file))
        const response = await this.$api.post(`/categories/ads/${this.adId}/files/product_option_image`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const imageFileId = Number(response.data.id)
        if (!Number.isSafeInteger(imageFileId) || !response.data.link) throw new Error('Imagem não retornada pela API.')
        this.update(groups => {
          const choice = groups[target.groupIndex]?.choices[target.choiceIndex]
          if (!choice) throw new Error('Opção removida durante o envio.')
          choice.imageFileId = imageFileId
          choice.imageUrl = response.data.link
        })
      } catch (error) {
        this.$q.notify({ color: 'negative', message: error.response?.data?.message || error.message || 'Erro ao enviar imagem.' })
      } finally { this.uploadingImage = false; this.pendingImageChoice = null }
    }
  }
}
</script>

<style scoped>
.product-options-editor { margin: 1rem 0; }
.option-editor-group { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin: 0.75rem 0; }
.choice-editor { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; gap: 0.65rem; align-items: start; margin: 0.7rem 0; }
.choice-fields { display: grid; grid-template-columns: minmax(0, 1fr) 130px; gap: 0.5rem; }
.choice-thumb { width: 70px; height: 70px; padding: 0; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; background: white; cursor: pointer; }
.choice-thumb img { width: 100%; height: 100%; object-fit: cover; }
.choice-thumb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6b7280; font-size: 0.7rem; }
.choice-image-actions { display: flex; justify-content: center; }
.image-preview-card { width: min(90vw, 600px); }.image-preview-card :deep(.q-img) { max-height: 75vh; }
@media (max-width: 600px) { .choice-fields { grid-template-columns: 1fr; } }
</style>
