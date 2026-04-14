<template>
  <q-page class="perfil-page">
    <section class="perfil-hero">
      <div class="perfil-hero__inner">
        <div class="perfil-hero__badge">
          <q-icon :name="isLoggedIn ? 'storefront' : 'account_circle'" size="30px" />
        </div>
        <div class="perfil-hero__copy">
          <p class="perfil-eyebrow">{{ isLoggedIn ? 'Minha conta' : 'Login/Senha' }}</p>
          <h1 class="perfil-title">
            {{ isLoggedIn ? (context?.company || context?.name || 'Sua conta') : 'Acesse sua conta' }}
          </h1>
          <p class="perfil-subtitle">
            {{ isLoggedIn ? (context?.email || 'Gerencie seus dados e seus comércios') : 'Entre para gerenciar seus dados, anúncios e senha.' }}
          </p>
        </div>
      </div>
    </section>

    <div class="perfil-content">
      <template v-if="!isLoggedIn">
        <section class="perfil-card perfil-card--highlight">
          <div class="perfil-empty">
            <div class="perfil-empty__icon">
              <q-icon name="login" size="30px" />
            </div>
            <div>
              <h2 class="perfil-section-title">Entre na sua conta</h2>
              <p class="perfil-muted">Faça login para acompanhar seus comércios e gerenciar seus dados.</p>
            </div>
          </div>

          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Fazer login"
            to="/login"
            class="full-width q-mt-md"
          />
        </section>

        <section class="perfil-card">
          <h2 class="perfil-section-title">Ajuda e políticas</h2>

          <router-link to="/termos-e-condicoes" class="perfil-link-row">
            <div class="perfil-link-row__left">
              <div class="perfil-link-row__icon bg-blue-1 text-blue-7">
                <q-icon name="gavel" size="18px" />
              </div>
              <span>Termos e Condições</span>
            </div>
            <q-icon name="chevron_right" color="grey-5" />
          </router-link>

          <router-link to="/politica-de-privacidade" class="perfil-link-row">
            <div class="perfil-link-row__left">
              <div class="perfil-link-row__icon bg-indigo-1 text-indigo-7">
                <q-icon name="shield" size="18px" />
              </div>
              <span>Política de Privacidade</span>
            </div>
            <q-icon name="chevron_right" color="grey-5" />
          </router-link>
        </section>
      </template>

      <template v-else>
        <section class="perfil-card">
          <div class="perfil-card__header">
            <div>
              <h2 class="perfil-section-title">Dados da conta</h2>
              <p class="perfil-muted">Resumo rápido da sua sessão atual.</p>
            </div>
          </div>

          <div class="perfil-info-grid">
            <div v-if="context?.company" class="perfil-info-item">
              <span class="perfil-info-label">Empresa</span>
              <strong class="perfil-info-value">{{ context.company }}</strong>
            </div>
            <div v-if="context?.name" class="perfil-info-item">
              <span class="perfil-info-label">Nome</span>
              <strong class="perfil-info-value">{{ context.name }}</strong>
            </div>
            <div v-if="context?.email" class="perfil-info-item">
              <span class="perfil-info-label">Email</span>
              <strong class="perfil-info-value perfil-info-value--wrap">{{ context.email }}</strong>
            </div>
          </div>
        </section>

        <section class="perfil-card">
          <div class="perfil-card__header">
            <div>
              <h2 class="perfil-section-title">Meus comércios</h2>
              <p class="perfil-muted">Cada anúncio mostra abaixo as categorias em que ele aparece.</p>
            </div>
            <q-btn
              flat
              round
              dense
              icon="refresh"
              color="primary"
              :loading="loadingCommerces"
              @click="fetchCommerces"
            />
          </div>

          <div v-if="loadingCommerces" class="perfil-stack">
            <div v-for="i in 3" :key="`commerce-skeleton-${i}`" class="perfil-commerce-skeleton">
              <q-skeleton type="rect" class="perfil-commerce-skeleton__media" />
              <div class="perfil-commerce-skeleton__body">
                <q-skeleton type="text" width="55%" />
                <q-skeleton type="text" width="85%" />
                <div class="perfil-chip-row">
                  <q-skeleton v-for="j in 3" :key="`chip-skeleton-${i}-${j}`" type="QChip" width="72px" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="commerces.length" class="perfil-stack">
            <article
              v-for="commerce in commerces"
              :key="commerce.id"
              class="perfil-commerce-card"
            >
              <router-link :to="`/${commerce.id}`" class="perfil-commerce-card__main">
                <div class="perfil-commerce-card__logo">
                  <q-img
                    v-if="getLogo(commerce)"
                    :src="getLogo(commerce)"
                    spinner-color="primary"
                    class="perfil-commerce-card__logo-img"
                  />
                  <div v-else class="perfil-commerce-card__logo-fallback">
                    {{ initials(commerce.name) }}
                  </div>
                </div>

                <div class="perfil-commerce-card__content">
                  <div class="perfil-commerce-card__top">
                    <h3 class="perfil-commerce-card__title">{{ commerce.name }}</h3>
                    <q-icon name="chevron_right" color="grey-5" />
                  </div>

                  <p class="perfil-commerce-card__desc">
                    {{ formatDescription(commerce.description) }}
                  </p>

                  <div class="perfil-commerce-card__meta">
                    <span>{{ activeGalleryCount(commerce) }} mídia(s)</span>
                    <span>{{ activePhonesCount(commerce) }} contato(s)</span>
                  </div>
                </div>
              </router-link>

              <div class="perfil-commerce-card__categories">
                <p class="perfil-commerce-card__categories-title">Categorias</p>
                <div v-if="commerce.categories?.length" class="perfil-chip-row">
                  <router-link
                    v-for="category in commerce.categories"
                    :key="`${commerce.id}-${category.id}`"
                    class="perfil-chip"
                    :to="categoryLink(category)"
                  >
                    {{ categoryLabel(category) }}
                  </router-link>
                </div>
                <p v-else class="perfil-muted perfil-muted--small">Nenhuma categoria vinculada.</p>
              </div>
            </article>
          </div>

          <div v-else class="perfil-empty perfil-empty--soft">
            <div class="perfil-empty__icon bg-grey-2 text-grey-7">
              <q-icon name="store_mall_directory" size="28px" />
            </div>
            <div>
              <h3 class="perfil-section-title">Nenhum comércio encontrado</h3>
              <p class="perfil-muted">Quando seus anúncios estiverem cadastrados, eles aparecerão aqui.</p>
            </div>
          </div>
        </section>

        <section class="perfil-card">
          <h2 class="perfil-section-title">Ações</h2>

          <router-link to="/contato" class="perfil-link-row">
            <div class="perfil-link-row__left">
              <div class="perfil-link-row__icon bg-blue-1 text-blue-7">
                <q-icon name="alternate_email" size="18px" />
              </div>
              <div>
                <p class="perfil-link-row__title">Fale conosco</p>
                <p class="perfil-link-row__subtitle">aplicativopoliweb@gmail.com</p>
              </div>
            </div>
            <q-icon name="chevron_right" color="grey-5" />
          </router-link>

          <button type="button" class="perfil-link-row perfil-link-row--button" @click="logout">
            <div class="perfil-link-row__left">
              <div class="perfil-link-row__icon bg-amber-1 text-amber-8">
                <q-icon name="logout" size="18px" />
              </div>
              <div>
                <p class="perfil-link-row__title">Sair da conta</p>
                <p class="perfil-link-row__subtitle">Encerrar a sessão atual</p>
              </div>
            </div>
            <q-icon name="chevron_right" color="grey-5" />
          </button>
        </section>

        <section class="perfil-card perfil-card--danger">
          <h2 class="perfil-section-title">Exclusão de conta</h2>
          <p class="perfil-muted">
            Você pode solicitar a exclusão permanente da conta e dos seus dados.
          </p>

          <q-btn
            outline
            no-caps
            color="negative"
            label="Solicitar exclusão da conta"
            icon="delete_forever"
            class="full-width q-mt-md"
            @click="showDeleteDialog = true"
          />
        </section>

        <section class="perfil-card">
          <h2 class="perfil-section-title">Ajuda e políticas</h2>

          <router-link to="/termos-e-condicoes" class="perfil-link-row">
            <div class="perfil-link-row__left">
              <div class="perfil-link-row__icon bg-blue-1 text-blue-7">
                <q-icon name="gavel" size="18px" />
              </div>
              <span>Termos e Condições</span>
            </div>
            <q-icon name="chevron_right" color="grey-5" />
          </router-link>

          <router-link to="/politica-de-privacidade" class="perfil-link-row">
            <div class="perfil-link-row__left">
              <div class="perfil-link-row__icon bg-indigo-1 text-indigo-7">
                <q-icon name="shield" size="18px" />
              </div>
              <span>Política de Privacidade</span>
            </div>
            <q-icon name="chevron_right" color="grey-5" />
          </router-link>
        </section>
      </template>
    </div>

    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card class="perfil-dialog">
        <q-card-section>
          <div class="text-h6">Solicitar exclusão da conta</div>
          <p class="text-grey-7 text-sm q-mt-sm">
            Sua solicitação será enviada para <strong>aplicativopoliweb@gmail.com</strong>.
            Deseja continuar?
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated color="negative" label="Enviar solicitação" @click="requestAccountDeletion" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { clearAuthSession } from 'src/boot/axios'
import { getAdCategories } from 'src/services/adsCategories'

export default {
  name: 'Perfil',
  data() {
    return {
      showDeleteDialog: false,
      loadingCommerces: false,
      commerces: [],
    }
  },
  computed: {
    isLoggedIn() {
      if (typeof localStorage === 'undefined') return false
      const token = localStorage.getItem('token')
      const context = localStorage.getItem('context')
      return !!(token && context)
    },
    context() {
      if (typeof localStorage === 'undefined') return null
      try {
        const ctx = localStorage.getItem('context')
        return ctx ? JSON.parse(ctx) : null
      } catch {
        return null
      }
    },
    customerId() {
      if (typeof localStorage === 'undefined') return null
      const raw = localStorage.getItem('id-customer')
      if (!raw) return null
      try {
        return JSON.parse(raw)
      } catch {
        return raw
      }
    },
  },
  mounted() {
    if (this.isLoggedIn) {
      this.fetchCommerces()
    }
  },
  methods: {
    async fetchCommerces() {
      if (!this.customerId) return

      this.loadingCommerces = true
      try {
        const response = await this.$api.get('/categories/ads', {
          params: {
            customerId: this.customerId,
            nonDeleted: true,
          },
        })

        const ads = response?.data?.ads || []
        const detailedCommerces = await Promise.all(
          ads.map(async (commerce) => {
            let detailedCommerce = commerce

            try {
              const detailResponse = await this.$api.get(
                `/categories/ads/${commerce.id}?nonDeleted=true`
              )
              if (detailResponse?.data) {
                detailedCommerce = detailResponse.data
              }
            } catch (_) {}

            try {
              const categoriesResponse = await getAdCategories(commerce.id)
              return {
                ...detailedCommerce,
                categories: categoriesResponse?.data?.categories || [],
              }
            } catch (_) {
              return {
                ...detailedCommerce,
                categories: [],
              }
            }
          })
        )

        this.commerces = detailedCommerces.sort((a, b) => a.name.localeCompare(b.name))
      } catch (err) {
        const msg = err?.response?.data?.message || 'Erro na conexão!'
        this.$q.notify({
          color: 'negative',
          position: 'top',
          message: msg,
          icon: 'report_problem',
        })
      } finally {
        this.loadingCommerces = false
      }
    },
    initials(name) {
      if (!name) return 'AD'
      return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    },
    getLogo(commerce) {
      const logos = commerce?.files?.logo || []
      const activeLogos = logos
        .filter((item) => !item.deletedAt && item.link)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return activeLogos[0]?.link || null
    },
    activeGalleryCount(commerce) {
      const gallery = commerce?.files?.gallery || []
      const videos = commerce?.files?.videos || []
      return [...gallery, ...videos].filter((item) => !item.deletedAt).length
    },
    activePhonesCount(commerce) {
      return (commerce?.phones || []).filter((item) => !item.deletedAt).length
    },
    categoryLink(category) {
      return `/categorias/${category.id}/${encodeURIComponent(category.name || 'categoria')}`
    },
    categoryLabel(category) {
      if (!category?.name) return 'Categoria'
      if (category.isPrimary) return `${category.name} · principal`
      return category.name
    },
    formatDescription(description) {
      if (!description) return 'Sem descrição cadastrada.'
      if (description.length <= 92) return description
      return `${description.slice(0, 92)}...`
    },
    logout() {
      clearAuthSession()
      localStorage.removeItem('id-customer')
      this.$router.push('/')
      this.$q.notify({
        color: 'positive',
        position: 'top',
        message: 'Você saiu da conta.',
        icon: 'check',
      })
    },
    requestAccountDeletion() {
      this.showDeleteDialog = false
      const email = this.context?.email || 'não informado'
      const company = this.context?.company || 'não informado'

      const payload = {
        name: company,
        phone: '',
        email: 'aplicativopoliweb@gmail.com',
        description: `[SOLICITAÇÃO DE EXCLUSÃO DE CONTA]\n\nUsuário ID: ${this.customerId}\nEmail da conta: ${email}\nEmpresa: ${company}\n\nSolicito a exclusão permanente da minha conta e de todos os meus dados pessoais conforme a Política de Privacidade.`,
      }

      this.$q.loading.show()
      this.$api
        .post('/contacts', payload)
        .then(() => {
          this.logout()
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Solicitação enviada! Entraremos em contato em aplicativopoliweb@gmail.com',
            icon: 'check',
          })
        })
        .catch(() => {
          this.logout()
          this.$q.notify({
            color: 'positive',
            position: 'top',
            message: 'Solicitação registrada. Entre em contato: aplicativopoliweb@gmail.com',
            icon: 'mail',
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
.perfil-page {
  min-height: 100%;
  padding-bottom: 96px;
  background:
    radial-gradient(circle at top, rgba(59, 130, 246, 0.14), transparent 34%),
    linear-gradient(180deg, #e5e7eb 0%, #eef2f7 44%, #e5e7eb 100%);
}

.perfil-hero {
  padding: 18px 16px 68px;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  color: white;
}

.perfil-hero__inner {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.perfil-hero__badge {
  width: 58px;
  height: 58px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
  flex-shrink: 0;
}

.perfil-eyebrow {
  margin: 0 0 4px;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.perfil-title {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.15;
  font-weight: 800;
}

.perfil-subtitle {
  margin: 6px 0 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.82);
}

.perfil-content {
  max-width: 720px;
  margin: -42px auto 0;
  padding: 0 14px;
  display: grid;
  gap: 14px;
}

.perfil-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 22px;
  padding: 16px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(10px);
}

.perfil-card--highlight {
  border-color: rgba(147, 197, 253, 0.9);
}

.perfil-card--danger {
  border-color: rgba(254, 202, 202, 0.95);
}

.perfil-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.perfil-section-title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.25;
  font-weight: 700;
  color: #0f172a;
}

.perfil-muted {
  margin: 4px 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #64748b;
}

.perfil-muted--small {
  font-size: 0.8rem;
}

.perfil-empty {
  display: flex;
  align-items: center;
  gap: 12px;
}

.perfil-empty--soft {
  padding: 6px 2px 2px;
}

.perfil-empty__icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: #1d4ed8;
  flex-shrink: 0;
}

.perfil-info-grid {
  display: grid;
  gap: 10px;
}

.perfil-info-item {
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px 14px;
}

.perfil-info-label {
  display: block;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin-bottom: 4px;
}

.perfil-info-value {
  display: block;
  font-size: 0.95rem;
  color: #0f172a;
}

.perfil-info-value--wrap {
  overflow-wrap: anywhere;
}

.perfil-stack {
  display: grid;
  gap: 12px;
}

.perfil-commerce-card {
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  overflow: hidden;
}

.perfil-commerce-card__main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  text-decoration: none;
}

.perfil-commerce-card__logo {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  overflow: hidden;
  flex-shrink: 0;
  background: #dbeafe;
}

.perfil-commerce-card__logo-img {
  width: 100%;
  height: 100%;
}

.perfil-commerce-card__logo-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #1d4ed8;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.perfil-commerce-card__content {
  min-width: 0;
  flex: 1;
}

.perfil-commerce-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.perfil-commerce-card__title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: #0f172a;
}

.perfil-commerce-card__desc {
  margin: 6px 0 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: #475569;
}

.perfil-commerce-card__meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.76rem;
  color: #64748b;
}

.perfil-commerce-card__meta span {
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 5px 9px;
}

.perfil-commerce-card__categories {
  border-top: 1px solid #e2e8f0;
  padding: 12px 14px 14px;
}

.perfil-commerce-card__categories-title {
  margin: 0 0 8px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.perfil-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.perfil-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  padding: 6px 10px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.25;
  text-decoration: none;
}

.perfil-link-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px 0;
  text-decoration: none;
  color: inherit;
  border-top: 1px solid #f1f5f9;
}

.perfil-link-row:first-of-type {
  border-top: 0;
}

.perfil-link-row--button {
  background: transparent;
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  cursor: pointer;
  text-align: left;
}

.perfil-link-row__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.perfil-link-row__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perfil-link-row__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: #0f172a;
}

.perfil-link-row__subtitle {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #64748b;
}

.perfil-commerce-skeleton {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
}

.perfil-commerce-skeleton__media {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  flex-shrink: 0;
}

.perfil-commerce-skeleton__body {
  flex: 1;
}

.perfil-dialog {
  width: min(92vw, 420px);
  border-radius: 22px;
}

@media (min-width: 768px) {
  .perfil-content {
    padding: 0 18px;
  }

  .perfil-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
