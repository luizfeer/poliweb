<template>
  <div class="q-pa-md">
    <q-table
      v-model:pagination="pagination"
      title="Contas"
      :rows="customers"
      :columns="headers"
      row-key="id"
      :loading="loading"
      :rows-per-page-options="[10, 15, 25, 50]"
      @request="onRequest"
    >
      <template v-slot:body-cell-edit="props">
        <q-td :props="props" class="text-center">
          <div class="row justify-center q-gutter-sm">
            <q-btn
              round
              color="secondary"
              icon="edit"
              @click="edit(props.row)"
            />
            <q-btn
              round
              color="primary"
              icon="lock"
              @click="editPass(props.row)"
            />
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-createdAt="props">
        <q-td :props="props" class="text-center">
          {{ format(props.row.createdAt) }}
        </q-td>
      </template>

      <template v-slot:body-cell-commerces="props">
        <q-td :props="props">
          <div v-if="props.row.commercesCount" class="column q-gutter-xs">
            <div class="row q-gutter-xs">
              <q-chip
                v-for="commerce in props.row.commercesPreview"
                :key="commerce"
                dense
                color="primary"
                text-color="white"
              >
                {{ commerce }}
              </q-chip>
            </div>
            <div class="text-caption text-grey-7">
              {{ props.row.commercesCount }} comércio(s)
            </div>
          </div>
          <div v-else class="text-grey-6">
            Nenhum comércio
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-manageCommerces="props">
        <q-td :props="props" class="text-center">
          <q-btn
            color="primary"
            label="Comércios"
            no-caps
            @click="openCommercesModal(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </div>

  <q-dialog v-model="dialogs.user">
    <q-card class="q-dialog-plugin">
      <q-form @submit="updateUser" class="p-6">
        <div class="text-h6 q-mb-md">Editar conta</div>
        <q-input filled v-model="formUser.email" type="email" label="Email" class="q-mb-md" />
        <q-input filled v-model="formUser.name" label="Nome" class="q-mb-md" />
        <q-input filled v-model="formUser.phone" label="Celular" class="q-mb-md" />
        <div class="row justify-end q-gutter-sm">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn label="Salvar" type="submit" color="primary" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="dialogs.password">
    <q-card class="q-dialog-plugin">
      <q-form @submit="updatePass" class="p-6">
        <div class="text-h6 q-mb-md">Troca de senha de {{ formPass.name }}</div>
        <q-input filled v-model="formPass.password" type="password" label="Senha" class="q-mb-md" />
        <q-input filled v-model="formPass.confirmPassword" type="password" label="Confirmar senha" class="q-mb-md" />
        <div class="row justify-end q-gutter-sm">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn label="Salvar" type="submit" color="primary" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>

  <q-dialog v-model="dialogs.commerces" maximized>
    <q-card>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">Comércios da conta</div>
          <div class="text-subtitle2 text-grey-7">
            {{ selectedCustomer.name || selectedCustomer.email }}
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-form @submit="createCommerce" class="row q-col-gutter-md items-start">
          <div class="col-12 col-md-3">
            <q-select
              filled
              v-model="commerceForm.categoryId"
              :options="categoryOptions"
              emit-value
              map-options
              option-value="value"
              option-label="label"
              label="Categoria"
              :loading="categoriesLoading"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="commerceForm.name" label="Nome do comércio" />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="commerceForm.email" type="email" label="Email" />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="commerceForm.website" label="Site" />
          </div>
          <div class="col-12 col-md-6">
            <q-input filled v-model="commerceForm.description" label="Descrição" />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="commerceForm.instagram" label="Instagram" />
          </div>
          <div class="col-12 col-md-3">
            <q-input filled v-model="commerceForm.facebook" label="Facebook" />
          </div>
          <div class="col-12">
            <q-btn color="primary" label="Criar comércio" no-caps type="submit" :loading="creatingCommerce" />
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-list bordered separator>
          <q-item v-for="commerce in commerces" :key="commerce.id">
            <q-item-section>
              <q-item-label>{{ commerce.name }}</q-item-label>
              <q-item-label caption>
                {{ commerce.description || commerce.email || 'Sem descrição' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side class="items-end">
              <div class="text-caption text-grey-7 q-mb-sm">
                {{ format(commerce.createdAt) }}
              </div>
              <q-btn
                flat
                color="primary"
                label="Abrir"
                no-caps
                @click="$router.push(`/comercio/${commerce.id}`)"
              />
            </q-item-section>
          </q-item>
          <q-item v-if="!commercesLoading && !commerces.length">
            <q-item-section class="text-grey-6">
              Nenhum comércio cadastrado nessa conta.
            </q-item-section>
          </q-item>
          <q-item v-if="commercesLoading">
            <q-item-section class="text-grey-6">
              Carregando comércios...
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { date } from 'quasar'

function format(val) {
  return date.formatDate(val, 'DD/MM/YY HH:mm')
}

function flattenLeafCategories(categories, parentPath = []) {
  const leaves = []

  categories.forEach((category) => {
    const currentPath = [...parentPath, category.name]
    if (category.subcategories && category.subcategories.length) {
      leaves.push(...flattenLeafCategories(category.subcategories, currentPath))
      return
    }

    leaves.push({
      label: currentPath.join(' > '),
      value: category.id
    })
  })

  return leaves
}

function createEmptyCommerceForm(customer = {}) {
  return {
    categoryId: null,
    name: customer.name || '',
    description: '',
    facebook: '',
    instagram: '',
    website: '',
    email: customer.email || ''
  }
}

export default {
  data() {
    return {
      loading: false,
      commercesLoading: false,
      categoriesLoading: false,
      creatingCommerce: false,
      customers: [],
      commerces: [],
      categoryOptions: [],
      selectedCustomer: {},
      dialogs: {
        user: false,
        password: false,
        commerces: false
      },
      pagination: {
        sortBy: 'id',
        descending: true,
        page: 1,
        rowsPerPage: 15,
        rowsNumber: 0
      },
      formPass: {
        id: null,
        name: '',
        password: '',
        confirmPassword: ''
      },
      formUser: {
        id: null,
        name: '',
        phone: '',
        email: ''
      },
      commerceForm: createEmptyCommerceForm(),
      headers: [
        {
          name: 'name',
          required: true,
          label: 'Nome',
          align: 'left',
          field: 'name',
          sortable: false
        },
        {
          name: 'email',
          label: 'Email',
          align: 'left',
          field: 'email',
          sortable: false
        },
        {
          name: 'phone',
          label: 'Telefone',
          align: 'center',
          field: 'phone',
          sortable: false
        },
        {
          name: 'commerces',
          label: 'Comércios',
          align: 'left',
          field: 'commercesPreview',
          sortable: false
        },
        {
          name: 'manageCommerces',
          label: 'Gerenciar',
          align: 'center',
          field: 'id',
          sortable: false
        },
        {
          name: 'createdAt',
          label: 'Criação',
          align: 'center',
          field: 'createdAt',
          sortable: false
        },
        {
          name: 'edit',
          label: 'Conta',
          align: 'center',
          field: 'id',
          sortable: false
        }
      ]
    }
  },
  methods: {
    format,
    notifyError(err) {
      const message = err?.response?.data?.message || 'Erro na conexão!'
      this.$q.notify({
        color: 'negative',
        position: 'top',
        message,
        icon: 'report_problem'
      })
    },
    edit(item) {
      this.formUser = {
        id: item.id,
        name: item.name,
        phone: item.phone,
        email: item.email
      }
      this.dialogs.user = true
    },
    editPass(item) {
      this.formPass = {
        id: item.id,
        name: item.name,
        password: '',
        confirmPassword: ''
      }
      this.dialogs.password = true
    },
    async fetchUsers(pagination = this.pagination) {
      this.loading = true

      try {
        const response = await this.$api.get('/customers', {
          params: {
            page: pagination.page,
            limit: pagination.rowsPerPage,
            nonDeleted: true
          }
        })

        this.customers = response.data.customers || []
        this.pagination = {
          ...pagination,
          rowsNumber: response.data.total || 0
        }
      } catch (err) {
        this.notifyError(err)
      } finally {
        this.loading = false
      }
    },
    onRequest(props) {
      this.fetchUsers(props.pagination)
    },
    async updateUser() {
      this.$q.loading.show()
      try {
        await this.$api.post(`/customers/${this.formUser.id}`, { ...this.formUser })
        this.$q.notify({
          color: 'secondary',
          position: 'top',
          message: 'Conta editada com sucesso!'
        })
        this.dialogs.user = false
        await this.fetchUsers()
      } catch (err) {
        this.notifyError(err)
      } finally {
        this.$q.loading.hide()
      }
    },
    async updatePass() {
      this.$q.loading.show()
      try {
        await this.$api.post(`/customers/${this.formPass.id}/password`, { ...this.formPass })
        this.$q.notify({
          color: 'secondary',
          position: 'top',
          message: 'Nova senha salva com sucesso!'
        })
        this.dialogs.password = false
      } catch (err) {
        this.notifyError(err)
      } finally {
        this.$q.loading.hide()
      }
    },
    async fetchCategoryOptions() {
      if (this.categoryOptions.length || this.categoriesLoading) return

      this.categoriesLoading = true
      try {
        const localization =
          typeof localStorage !== 'undefined'
            ? JSON.parse(localStorage.getItem('localization') || 'null')
            : null

        const addressId = localization?.id

        if (addressId) {
          const response = await this.$api.get(`/cities/${addressId}/categories`)
          this.categoryOptions = flattenLeafCategories(response.data.categories || [])
        } else {
          const response = await this.$api.get('/categories', {
            params: {
              nonDeleted: true
            }
          })
          this.categoryOptions = flattenLeafCategories(response.data.categories || [])
        }
      } catch (err) {
        this.notifyError(err)
      } finally {
        this.categoriesLoading = false
      }
    },
    async fetchCommerces(customerId) {
      this.commercesLoading = true
      try {
        const response = await this.$api.get('/categories/ads', {
          params: {
            customerId,
            nonDeleted: true
          }
        })
        this.commerces = response.data.ads || []
      } catch (err) {
        this.notifyError(err)
      } finally {
        this.commercesLoading = false
      }
    },
    async openCommercesModal(customer) {
      this.selectedCustomer = customer
      this.commerceForm = createEmptyCommerceForm(customer)
      this.dialogs.commerces = true
      await Promise.all([
        this.fetchCategoryOptions(),
        this.fetchCommerces(customer.id)
      ])
    },
    async createCommerce() {
      if (!this.selectedCustomer.id) return

      this.creatingCommerce = true
      try {
        await this.$api.post(`/categories/${this.commerceForm.categoryId}/ads`, {
          customerId: this.selectedCustomer.id,
          name: this.commerceForm.name,
          description: this.commerceForm.description || null,
          facebook: this.commerceForm.facebook || null,
          instagram: this.commerceForm.instagram || null,
          website: this.commerceForm.website || null,
          email: this.commerceForm.email || null
        })

        this.$q.notify({
          color: 'secondary',
          position: 'top',
          message: 'Comércio criado com sucesso!'
        })

        this.commerceForm = createEmptyCommerceForm(this.selectedCustomer)
        await Promise.all([
          this.fetchCommerces(this.selectedCustomer.id),
          this.fetchUsers()
        ])
      } catch (err) {
        this.notifyError(err)
      } finally {
        this.creatingCommerce = false
      }
    }
  },
  mounted() {
    this.fetchUsers()
  }
}
</script>
