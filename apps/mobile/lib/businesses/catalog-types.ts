/**
 * Tipos do catálogo — sync com `apps/web/lib/businesses/catalog-types.ts`.
 * Subset v2: inclui OptionGroups, DeliverySettings e CartItem completo.
 */

export type ItemTag =
  | 'vegano'
  | 'vegetariano'
  | 'sem_gluten'
  | 'picante'
  | 'destaque'
  | 'novo'
  | 'mais_pedido';

export type OptionValue = {
  id: string;
  name: string;
  priceAdd: number;
  available: boolean;
};

export type OptionGroup = {
  id: string;
  name: string;
  description?: string;
  /** 0 = opcional; 1+ = obrigatório */
  minChoices: number;
  /** 1 = seleção única; >1 = múltiplas */
  maxChoices: number;
  values: OptionValue[];
};

export type CatalogItem = {
  id: string;
  sectionId: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  promotionalPrice?: number;
  promoValidUntil?: string;
  photoUrl?: string;
  serves?: string;
  prepTimeMin?: number;
  calories?: number;
  tags?: ItemTag[];
  available: boolean;
  displayOrder: number;
  optionGroups: OptionGroup[];
};

export type CatalogSection = {
  id: string;
  catalogId: string;
  name: string;
  description?: string;
  displayOrder: number;
  items: CatalogItem[];
};

export type Catalog = {
  id: string;
  businessId: string;
  name: string;
  catalogType: 'food_menu' | 'product_catalog';
  sections: CatalogSection[];
};

export type DeliverySettings = {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  tableServiceEnabled: boolean;
  deliveryFee?: number;
  deliveryMinOrder?: number;
  deliveryTimeMin?: number;
  pickupTimeMin?: number;
  pixKey?: string;
  acceptsCardOnDelivery: boolean;
  orderInstructions?: string;
};

export type OrderType = 'delivery' | 'pickup';
export type PaymentChoice = 'pix' | 'dinheiro' | 'cartao_entrega';

export type CartItemOption = {
  groupId: string;
  groupName: string;
  valueId: string;
  valueName: string;
  priceAdd: number;
};

export type CartItem = {
  cartItemId: string;
  catalogItemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  options: CartItemOption[];
  subtotal: number;
  notes?: string;
  photoUrl?: string;
};

export type CheckoutFormData = {
  orderType: OrderType;
  address: string;
  paymentChoice: PaymentChoice;
  changeFor: string;
  notes: string;
};

/** @deprecated use CartItem */
export type CartLine = CartItem;
