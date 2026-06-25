<template>
  <q-page class="admin-contacts-page">
    <section class="admin-contacts-shell">
      <header class="admin-contacts-header">
        <div>
          <p class="admin-contacts-eyebrow">Super admin</p>
          <h1>Mensagens de contato</h1>
          <p>Listagem das solicitações enviadas pelo formulário público.</p>
        </div>
        <q-btn
          unelevated
          color="primary"
          icon="refresh"
          label="Atualizar"
          no-caps
          :loading="loading"
          @click="fetchContacts"
        />
      </header>

      <div class="admin-contacts-stats">
        <q-card flat bordered class="admin-stat-card">
          <span>Total</span>
          <strong>{{ contacts.length }}</strong>
        </q-card>
        <q-card flat bordered class="admin-stat-card">
          <span>Hoje</span>
          <strong>{{ todayCount }}</strong>
        </q-card>
        <q-card flat bordered class="admin-stat-card">
          <span>Selecionada</span>
          <strong>{{ selectedContact?.id || '-' }}</strong>
        </q-card>
      </div>

      <q-card flat bordered class="admin-contacts-card">
        <div class="admin-contacts-toolbar">
          <q-input
            v-model="search"
            outlined
            dense
            clearable
            debounce="200"
            placeholder="Buscar por nome, telefone ou mensagem"
            class="admin-contacts-search"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <q-table
          :rows="filteredContacts"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :rows-per-page-options="[10, 20, 50, 100]"
          v-model:pagination="pagination"
          flat
        >
          <template #body-cell-createdAt="props">
            <q-td :props="props">
              {{ formatDate(props.row.createdAt) }}
            </q-td>
          </template>

          <template #body-cell-description="props">
            <q-td :props="props">
              <div class="admin-message-preview">
                {{ previewText(props.row.description) }}
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                dense
                unelevated
                color="primary"
                icon="visibility"
                label="Ler"
                no-caps
                @click="openContact(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </section>

    <q-dialog v-model="dialogOpen">
      <q-card class="admin-contact-dialog">
        <q-card-section class="row items-start justify-between q-gutter-md">
          <div>
            <div class="text-h6">Mensagem #{{ selectedContact?.id }}</div>
            <div class="text-caption text-grey-7">
              {{ formatDate(selectedContact?.createdAt) }}
            </div>
          </div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="admin-contact-detail">
          <div class="admin-contact-detail-grid">
            <div>
              <span>Nome</span>
              <strong>{{ selectedContact?.name || '-' }}</strong>
            </div>
            <div>
              <span>Telefone</span>
              <strong>{{ selectedContact?.phone || '-' }}</strong>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="admin-contact-message" v-html="renderHtml(selectedContact?.description)"></div>
        </q-card-section>

        <q-card-actions align="between">
          <q-btn flat color="grey-7" label="Fechar" no-caps v-close-popup />
          <q-btn
            outline
            color="primary"
            icon="content_copy"
            label="Copiar"
            no-caps
            @click="copyMessage"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { copyToClipboard, date } from 'quasar'

export default {
  name: 'AdminContacts',
  data() {
    return {
      loading: false,
      contacts: [],
      search: '',
      selectedContact: null,
      dialogOpen: false,
      pagination: {
        sortBy: 'createdAt',
        descending: true,
        page: 1,
        rowsPerPage: 20
      },
      columns: [
        {
          name: 'id',
          label: '#',
          field: 'id',
          align: 'left',
          sortable: true
        },
        {
          name: 'createdAt',
          label: 'Data',
          field: 'createdAt',
          align: 'left',
          sortable: true
        },
        {
          name: 'name',
          label: 'Nome',
          field: 'name',
          align: 'left',
          sortable: true
        },
        {
          name: 'phone',
          label: 'Telefone',
          field: 'phone',
          align: 'left',
          sortable: false
        },
        {
          name: 'description',
          label: 'Mensagem',
          field: 'description',
          align: 'left',
          sortable: false
        },
        {
          name: 'actions',
          label: '',
          field: 'id',
          align: 'right',
          sortable: false
        }
      ]
    }
  },
  computed: {
    filteredContacts() {
      const term = (this.search || '').toLowerCase().trim()
      if (!term) return this.contacts

      return this.contacts.filter((item) => {
        const haystack = [
          item.id,
          item.name,
          item.phone,
          item.description,
          item.createdAt
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(term)
      })
    },
    todayCount() {
      const today = date.formatDate(new Date(), 'YYYY-MM-DD')
      return this.contacts.filter((item) => date.formatDate(item.createdAt, 'YYYY-MM-DD') === today).length
    }
  },
  mounted() {
    this.fetchContacts()
  },
  methods: {
    formatDate(value) {
      return value ? date.formatDate(value, 'DD/MM/YYYY HH:mm') : '-'
    },
    normalizeHtml(value = '') {
      return String(value || '')
    },
    previewText(value = '') {
      const clean = this.extractText(value).replace(/\s+/g, ' ').trim()
      return clean.length > 140 ? `${clean.slice(0, 140)}...` : clean
    },
    extractText(value = '') {
      const source = this.normalizeHtml(value)
      if (!source) return ''

      if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return source
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
          .replace(/<[^>]*>/g, '')
      }

      const doc = new DOMParser().parseFromString(source, 'text/html')
      return doc.body?.textContent || ''
    },
    renderHtml(value = '') {
      const source = this.normalizeHtml(value)
      if (!source) return ''

      if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return source
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      }

      const doc = new DOMParser().parseFromString(source, 'text/html')
      const allowedTags = new Set(['A', 'B', 'BR', 'BLOCKQUOTE', 'CODE', 'DIV', 'EM', 'I', 'LI', 'OL', 'P', 'PRE', 'SPAN', 'STRONG', 'UL', 'U'])

      const walk = (node) => {
        Array.from(node.children || []).forEach((child) => {
          if (!allowedTags.has(child.tagName)) {
            const text = doc.createTextNode(child.textContent || '')
            child.replaceWith(text)
            return
          }

          Array.from(child.attributes || []).forEach((attr) => {
            const name = attr.name.toLowerCase()
            const value = attr.value

            if (name.startsWith('on')) {
              child.removeAttribute(attr.name)
              return
            }

            if (child.tagName === 'A') {
              if (name === 'href') {
                const href = String(value || '').trim()
                if (!/^(https?:|mailto:|tel:|\/)/i.test(href)) {
                  child.removeAttribute(attr.name)
                  return
                }
                child.setAttribute('target', '_blank')
                child.setAttribute('rel', 'noopener noreferrer')
                return
              }

              if (name === 'title' || name === 'target' || name === 'rel') return
            }

            child.removeAttribute(attr.name)
          })

          walk(child)
        })
      }

      walk(doc.body)
      return doc.body.innerHTML
    },
    async fetchContacts() {
      this.loading = true
      try {
        const response = await this.$api.get('/contacts')
        this.contacts = response.data.contacts || []
      } catch (err) {
        const msg = err?.response?.data?.message || 'Erro ao carregar mensagens'
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem'
        })
      } finally {
        this.loading = false
      }
    },
    openContact(contact) {
      this.selectedContact = contact
      this.dialogOpen = true
    },
    async copyMessage() {
      if (!this.selectedContact) return

      await copyToClipboard([
        `Mensagem #${this.selectedContact.id}`,
        `Data: ${this.formatDate(this.selectedContact.createdAt)}`,
        `Nome: ${this.selectedContact.name || '-'}`,
        `Telefone: ${this.selectedContact.phone || '-'}`,
        '',
        this.selectedContact.description || ''
      ].join('\n'))

      this.$q.notify({
        color: 'positive',
        position: 'top',
        message: 'Mensagem copiada',
        icon: 'check'
      })
    }
  }
}
</script>

<style scoped>
.admin-contacts-page {
  min-height: 100%;
  background: #f8fafc;
  padding: 1rem;
}
.admin-contacts-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding-bottom: 6rem;
}
.admin-contacts-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 1rem 0;
}
.admin-contacts-eyebrow {
  margin: 0 0 0.25rem;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
.admin-contacts-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.9rem;
  font-weight: 800;
}
.admin-contacts-header p:last-child {
  margin: 0.35rem 0 0;
  color: #64748b;
}
.admin-contacts-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.admin-stat-card {
  display: grid;
  gap: 0.25rem;
  border-radius: 10px;
  padding: 1rem;
  background: #fff;
}
.admin-stat-card span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
.admin-stat-card strong {
  color: #0f172a;
  font-size: 1.45rem;
}
.admin-contacts-card {
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
}
.admin-contacts-toolbar {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}
.admin-contacts-search {
  max-width: 520px;
}
.admin-message-preview {
  max-width: 560px;
  color: #334155;
  white-space: normal;
  overflow-wrap: anywhere;
}
.admin-contact-dialog {
  width: min(760px, calc(100vw - 2rem));
  max-width: 760px;
  border-radius: 10px;
}
.admin-contact-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.admin-contact-detail-grid div {
  display: grid;
  gap: 0.2rem;
}
.admin-contact-detail-grid span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}
.admin-contact-detail-grid strong {
  color: #0f172a;
  overflow-wrap: anywhere;
}
.admin-contact-message {
  margin: 0;
  color: #0f172a;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
@media (max-width: 720px) {
  .admin-contacts-header {
    display: block;
  }
  .admin-contacts-header .q-btn {
    margin-top: 0.85rem;
  }
  .admin-contacts-stats,
  .admin-contact-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
