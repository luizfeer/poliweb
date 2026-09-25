import { api } from 'src/boot/axios'

export async function commerceApi(adId, resource, method = 'GET', body) {
  try {
    const response = await api.request({
      url: `/commerce/stores/${encodeURIComponent(adId)}/${resource}`,
      method,
      ...(body ? { data: body } : {})
    })
    return response.data
  } catch (cause) {
    const error = new Error(cause.response?.data?.message || 'Não foi possível concluir a operação.')
    error.status = cause.response?.status || 503
    throw error
  }
}

export const defaultCommerceSettings = () => ({
  acceptsDelivery: false,
  isFoodDelivery: false,
  acceptingOrders: true,
  deliveryPromptAnswered: false,
  isOpen: true,
  label: 'Aberto agora',
  deliveryFeeCents: 0,
  deliveryInfo: '',
  paymentMethods: ['Pix', 'Cartão', 'Dinheiro']
})
