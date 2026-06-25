<template>
  <q-page class="admin-dashboard-page">
    <section class="admin-dashboard-shell">
      <header class="admin-dashboard-header">
        <div>
          <p class="admin-dashboard-eyebrow">Super admin</p>
          <h1>Painel administrativo</h1>
          <p>Atalhos rápidos para gerenciamento do Poliweb.</p>
        </div>
      </header>

      <div v-if="!allowed" class="admin-dashboard-denied">
        <q-icon name="lock" size="30px" color="primary" />
        <h2>Acesso restrito</h2>
        <p>Entre com a conta de super admin para abrir este painel.</p>
        <q-btn color="primary" label="Fazer login" to="/adm/login" no-caps unelevated />
      </div>

      <div v-else class="admin-dashboard-grid">
        <router-link
          v-for="item in shortcuts"
          :key="item.to"
          :to="item.to"
          class="admin-dashboard-card"
        >
          <span class="admin-dashboard-icon">
            <q-icon :name="item.icon" size="24px" />
          </span>
          <span class="admin-dashboard-card-body">
            <strong>{{ item.title }}</strong>
            <small>{{ item.description }}</small>
          </span>
          <q-icon name="chevron_right" color="grey-5" size="22px" />
        </router-link>
      </div>
    </section>
  </q-page>
</template>

<script>
import { isSuperAdmin } from 'src/js/superadmin'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      shortcuts: [
        {
          title: 'Mensagens',
          description: 'Ler contatos enviados pelo formulário',
          icon: 'mark_email_unread',
          to: '/adm/contatos'
        },
        {
          title: 'Usuários',
          description: 'Listar contas e gerenciar comércios',
          icon: 'group',
          to: '/adm/users'
        },
        {
          title: 'Ícones',
          description: 'Gerenciar ícones de categorias',
          icon: 'insert_emoticon',
          to: '/adm/icons'
        },
        {
          title: 'Cidades',
          description: 'Gerenciar cidades e endereços',
          icon: 'location_city',
          to: '/adm/cidades'
        },
        {
          title: 'Categorias',
          description: 'Abrir painel de categorias',
          icon: 'category',
          to: '/painel/categorias/list'
        },
        {
          title: 'Adicionar anúncio',
          description: 'Cadastrar comércio por categoria',
          icon: 'add_business',
          to: '/painel/ads/add'
        }
      ]
    }
  },
  computed: {
    allowed() {
      return typeof localStorage === 'undefined' || isSuperAdmin()
    }
  }
}
</script>

<style scoped>
.admin-dashboard-page {
  min-height: 100%;
  background: #f8fafc;
  padding: 1rem;
}
.admin-dashboard-shell {
  width: min(1060px, 100%);
  margin: 0 auto;
  padding: 1rem 0 6rem;
}
.admin-dashboard-header {
  margin-bottom: 1rem;
}
.admin-dashboard-eyebrow {
  margin: 0 0 0.25rem;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
.admin-dashboard-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.9rem;
  font-weight: 800;
}
.admin-dashboard-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
}
.admin-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}
.admin-dashboard-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-height: 92px;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: inherit;
  text-decoration: none;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}
.admin-dashboard-card:hover {
  transform: translateY(-1px);
  border-color: #bfdbfe;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}
.admin-dashboard-icon {
  display: inline-flex;
  width: 46px;
  height: 46px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
}
.admin-dashboard-card-body {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}
.admin-dashboard-card-body strong {
  color: #0f172a;
  font-size: 1rem;
}
.admin-dashboard-card-body small {
  color: #64748b;
  line-height: 1.4;
}
.admin-dashboard-denied {
  display: grid;
  justify-items: start;
  gap: 0.7rem;
  max-width: 420px;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}
.admin-dashboard-denied h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 800;
}
.admin-dashboard-denied p {
  margin: 0;
  color: #64748b;
}
@media (max-width: 720px) {
  .admin-dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
