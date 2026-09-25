<template>
  <article class="order-card">
    <div class="row items-start justify-between q-gutter-sm">
      <strong>Pedido {{ String(order.id).slice(0, 8) }}</strong>
      <span class="text-caption">{{ formatDate(order.created_at) }}</span>
    </div>
    <q-badge :color="statusColor(order.status)" class="q-mr-sm">{{ statusLabel(order.status) }}</q-badge><q-badge v-if="order.hidden" color="grey-7">Oculto</q-badge>
    <div class="text-caption">Gerado no site · envio pelo WhatsApp não confirmado automaticamente</div>
    <div>{{ order.customer_name }} · {{ order.customer_phone }}</div>
    <div v-if="order.delivery_address">Entrega: {{ order.delivery_address }}</div>
    <div v-else>Retirada no estabelecimento</div>
    <div>Pagamento: {{ order.payment_method }}</div>
    <div v-for="(item, index) in order.items || []" :key="`${item.productId}-${index}`">
      {{ item.quantity }}x {{ item.name }} — {{ money(item.totalCents) }}
      <div v-for="(group, groupIndex) in item.selections || []" :key="groupIndex" class="text-caption">
        {{ group.group }}: {{ (group.choices || []).map(choice => `${choice.name}${choice.priceCents ? ` (+${money(choice.priceCents)})` : ''}`).join(', ') }}
      </div>
      <div v-if="item.note" class="text-caption">Obs.: {{ item.note }}</div>
    </div>
    <div v-if="order.delivery_fee_cents">Taxa de entrega: {{ money(order.delivery_fee_cents) }}</div>
    <strong>Total: {{ money(order.total_cents) }}</strong>
  </article>
</template>

<script>
export default {
  name: 'CommerceOrderCard',
  props: { order: { type: Object, required: true } },
  methods: {
    statusLabel(value) { return ({ new: 'Novo', accepted: 'Aceito', preparing: 'Em preparo', ready: 'Pronto', completed: 'Concluído', cancelled: 'Cancelado' })[value] || 'Novo' },
    statusColor(value) { return ({ new: 'deep-orange', accepted: 'blue', preparing: 'amber-9', ready: 'teal', completed: 'positive', cancelled: 'grey-7' })[value] || 'deep-orange' },
    money(cents) { return (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short'
      }) : ''
    }
  }
}
</script>

<style scoped>
.order-card { padding: 1rem 0; border-top: 1px solid #e5e7eb; line-height: 1.7; overflow-wrap: anywhere; }
</style>
