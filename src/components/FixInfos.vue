<template>
  <q-form @submit="saveAd" class="fix-infos-form">
    <div class="fix-card">
      <div class="fix-card__header">
        <div>
          <p class="fix-card__eyebrow">Informações básicas</p>
          <h3 class="fix-card__title">Dados do anúncio</h3>
        </div>
      </div>

      <div class="fix-grid">
        <q-input filled v-model="formData.name" type="text" lazy-rules label="Nome" class="w-full" />
        <q-input filled v-model="formData.description" type="textarea" autogrow lazy-rules label="Descrição" class="w-full" />
        <q-input filled v-model="formData.facebook" type="text" lazy-rules label="Facebook" class="w-full" />
        <q-input filled v-model="formData.instagram" type="text" lazy-rules label="Instagram" class="w-full" />
        <q-input filled v-model="formData.email" type="email" lazy-rules label="Email" class="w-full" />
        <q-input filled v-model="formData.website" type="text" lazy-rules label="Site" class="w-full" />
      </div>
    </div>

    <div class="fix-actions">
      <q-btn label="Salvar" type="submit" color="primary" no-caps unelevated />
    </div>
  </q-form>
</template>

<script>
import { ref } from 'vue'

export default {
  emits: ['updated'],
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  setup() {
    return {
      formData: ref({
        id: null,
        name: '',
        description: '',
        facebook: '',
        instagram: '',
        website: '',
        email: '',
        avatar: null,
        categoryIds: [],
      }),
    }
  },
  watch: {
    data: {
      immediate: true,
      deep: true,
      handler(d) {
        if (!d) return
        const ids = Array.isArray(d.categoryIds)
          ? [...d.categoryIds]
          : d.categoryId != null
            ? [Number(d.categoryId)]
            : Array.isArray(d.categories)
              ? d.categories.map((c) => Number(c.id))
              : []

        Object.assign(this.formData, {
          ...d,
          categoryIds: ids,
        })
      },
    },
  },
  methods: {
    saveAd() {
      this.$q.loading.show()

      const payload = { ...this.formData }
      if (Array.isArray(payload.categoryIds)) {
        payload.categoryIds = payload.categoryIds.map(Number)
      }

      this.$api.post(`/categories/ads/${this.formData.id}`, payload)
        .then((response) => {
          if (response.data) {
            this.$q.notify({
              color: 'secondary',
              position: 'top',
              message: 'Informações salvas com sucesso!',
            })
            this.$emit('updated')
          }
        })
        .catch((err) => {
          const msg = err.response ? err.response.data.message : 'Erro na conexão!'
          this.$q.notify({
            color: 'negative',
            position: 'top',
            message: msg,
            icon: 'report_problem',
          })
        })
        .finally(() => {
          this.$q.loading.hide()
        })
    },
  },
}
</script>

<style scoped>
.fix-infos-form {
  display: grid;
  gap: 16px;
  padding: 8px;
}

.fix-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.fix-card__header {
  margin-bottom: 14px;
}

.fix-card__eyebrow {
  margin: 0 0 4px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.fix-card__title {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
  font-weight: 700;
}

.fix-grid {
  display: grid;
  gap: 12px;
}

.fix-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
