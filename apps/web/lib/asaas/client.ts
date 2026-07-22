import 'server-only';

export type AsaasMode = 'sandbox' | 'production';

export type AsaasConfig = {
  apiKey: string;
  apiUrl: string;
  webhookToken: string;
  mode: AsaasMode;
};

export function getAsaasConfig(): AsaasConfig | null {
  const raw = process.env.ASAAS_API_KEY?.trim();
  if (!raw) return null;
  const apiKey = raw.replace(/^['"]|['"]$/g, '').replace(/^\\\$/, '$');
  if (!apiKey.startsWith('$')) return null;
  const mode: AsaasMode = process.env.ASAAS_MODE === 'production' ? 'production' : 'sandbox';
  const apiUrl =
    process.env.ASAAS_API_URL ??
    (mode === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3');
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? '';
  return { apiKey, apiUrl, webhookToken, mode };
}

export type AsaasCustomer = {
  id: string;
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  phone: string | null;
  mobilePhone: string | null;
};

export type AsaasSubscription = {
  id: string;
  customer: string;
  status: string;
  nextDueDate: string;
  value: number;
  cycle: string;
  billingType: string;
  description: string | null;
};

type AsaasErrorBody = {
  errors?: Array<{ code?: string; description?: string }>;
};

export class AsaasError extends Error {
  status: number;
  details: AsaasErrorBody;

  constructor(message: string, status: number, details: AsaasErrorBody) {
    super(message);
    this.name = 'AsaasError';
    this.status = status;
    this.details = details;
  }
}

async function asaasFetch<T>(
  config: AsaasConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      access_token: config.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'PortalCarmelitano/1.0',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const body = (parsed ?? {}) as AsaasErrorBody;
    const description = body.errors?.[0]?.description ?? `ASAAS ${path} failed`;
    throw new AsaasError(description, response.status, body);
  }

  return parsed as T;
}

type FindCustomerResponse = { data: AsaasCustomer[] };

export async function findCustomerByDocument(
  config: AsaasConfig,
  document: string,
): Promise<AsaasCustomer | null> {
  const params = new URLSearchParams({ cpfCnpj: document.replace(/\D/g, '') });
  const result = await asaasFetch<FindCustomerResponse>(config, `/customers?${params.toString()}`);
  return result.data[0] ?? null;
}

export type CreateCustomerInput = {
  name: string;
  email: string;
  cpfCnpj?: string | null;
  mobilePhone?: string | null;
  phone?: string | null;
  externalReference?: string;
  notificationDisabled?: boolean;
};

export async function createOrUpdateCustomer(
  config: AsaasConfig,
  input: CreateCustomerInput,
): Promise<AsaasCustomer> {
  const cpfCnpj = input.cpfCnpj?.replace(/\D/g, '') || undefined;
  const existing = cpfCnpj ? await findCustomerByDocument(config, cpfCnpj) : null;
  const payload = {
    name: input.name,
    email: input.email,
    cpfCnpj,
    mobilePhone: input.mobilePhone?.replace(/\D/g, '') || undefined,
    phone: input.phone?.replace(/\D/g, '') || undefined,
    externalReference: input.externalReference,
    notificationDisabled: input.notificationDisabled ?? false,
  };

  if (existing) {
    return asaasFetch<AsaasCustomer>(config, `/customers/${existing.id}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  return asaasFetch<AsaasCustomer>(config, '/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type CreateSubscriptionInput = {
  customer: string;
  value: number;
  nextDueDate: string;
  cycle?: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  billingType?: 'UNDEFINED' | 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  description?: string;
  externalReference?: string;
  callback?: {
    successUrl: string;
    autoRedirect?: boolean;
  };
};

export async function createSubscription(
  config: AsaasConfig,
  input: CreateSubscriptionInput,
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(config, '/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer: input.customer,
      value: input.value,
      nextDueDate: input.nextDueDate,
      cycle: input.cycle ?? 'MONTHLY',
      billingType: input.billingType ?? 'UNDEFINED',
      description: input.description,
      externalReference: input.externalReference,
      callback: input.callback,
    }),
  });
}

export async function cancelSubscription(
  config: AsaasConfig,
  subscriptionId: string,
): Promise<void> {
  await asaasFetch<unknown>(config, `/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
}

export async function getSubscription(
  config: AsaasConfig,
  subscriptionId: string,
): Promise<AsaasSubscription | null> {
  try {
    return await asaasFetch<AsaasSubscription>(config, `/subscriptions/${subscriptionId}`);
  } catch (error) {
    if (error instanceof AsaasError && error.status === 404) return null;
    throw error;
  }
}

export type AsaasPaymentSummary = {
  id: string;
  status: string;
  billingType: string;
  value: number;
  netValue: number | null;
  dueDate: string;
  paymentDate: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  description: string | null;
};

type AsaasPaymentApi = {
  id: string;
  status: string;
  billingType: string;
  value: number;
  netValue?: number | null;
  dueDate: string;
  paymentDate?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  description?: string | null;
};

type ListResponse<T> = { data: T[]; hasMore?: boolean; totalCount?: number };

export async function listPaymentsForSubscription(
  config: AsaasConfig,
  subscriptionId: string,
  limit = 20,
): Promise<AsaasPaymentSummary[]> {
  const params = new URLSearchParams({
    subscription: subscriptionId,
    limit: String(limit),
    'order[dueDate]': 'desc',
  });
  const result = await asaasFetch<ListResponse<AsaasPaymentApi>>(
    config,
    `/payments?${params.toString()}`,
  );
  return result.data.map((payment) => ({
    id: payment.id,
    status: payment.status,
    billingType: payment.billingType,
    value: payment.value,
    netValue: payment.netValue ?? null,
    dueDate: payment.dueDate,
    paymentDate: payment.paymentDate ?? null,
    invoiceUrl: payment.invoiceUrl ?? null,
    bankSlipUrl: payment.bankSlipUrl ?? null,
    description: payment.description ?? null,
  }));
}

export type UpdateSubscriptionInput = {
  value?: number;
  nextDueDate?: string;
  description?: string;
  billingType?: 'UNDEFINED' | 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  cycle?: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  updatePendingPayments?: boolean;
};

export async function updateSubscription(
  config: AsaasConfig,
  subscriptionId: string,
  input: UpdateSubscriptionInput,
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(config, `/subscriptions/${subscriptionId}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// One-shot payments (cobrança avulsa) — usado para destaque pago
// ---------------------------------------------------------------------------

export type AsaasBillingType = 'UNDEFINED' | 'PIX' | 'BOLETO' | 'CREDIT_CARD';

export type CreatePaymentInput = {
  customer: string;
  value: number;
  dueDate: string;
  billingType?: AsaasBillingType;
  description?: string;
  externalReference?: string;
  postalService?: boolean;
  callback?: {
    successUrl: string;
    autoRedirect?: boolean;
  };
};

export type AsaasPayment = {
  id: string;
  customer: string;
  status: string;
  billingType: string;
  value: number;
  netValue: number | null;
  dueDate: string;
  paymentDate: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  pixTransaction: string | null;
  description: string | null;
  externalReference: string | null;
};

type AsaasPaymentResponse = {
  id: string;
  customer: string;
  status: string;
  billingType: string;
  value: number;
  netValue?: number | null;
  dueDate: string;
  paymentDate?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  pixTransaction?: string | null;
  description?: string | null;
  externalReference?: string | null;
};

function mapPayment(payment: AsaasPaymentResponse): AsaasPayment {
  return {
    id: payment.id,
    customer: payment.customer,
    status: payment.status,
    billingType: payment.billingType,
    value: payment.value,
    netValue: payment.netValue ?? null,
    dueDate: payment.dueDate,
    paymentDate: payment.paymentDate ?? null,
    invoiceUrl: payment.invoiceUrl ?? null,
    bankSlipUrl: payment.bankSlipUrl ?? null,
    pixTransaction: payment.pixTransaction ?? null,
    description: payment.description ?? null,
    externalReference: payment.externalReference ?? null,
  };
}

export async function createPayment(
  config: AsaasConfig,
  input: CreatePaymentInput,
): Promise<AsaasPayment> {
  const payload = {
    customer: input.customer,
    value: input.value,
    dueDate: input.dueDate,
    billingType: input.billingType ?? 'PIX',
    description: input.description,
    externalReference: input.externalReference,
    postalService: input.postalService ?? false,
    callback: input.callback,
  };
  const response = await asaasFetch<AsaasPaymentResponse>(config, '/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapPayment(response);
}

export async function getPayment(
  config: AsaasConfig,
  paymentId: string,
): Promise<AsaasPayment | null> {
  try {
    const response = await asaasFetch<AsaasPaymentResponse>(config, `/payments/${paymentId}`);
    return mapPayment(response);
  } catch (error) {
    if (error instanceof AsaasError && error.status === 404) return null;
    throw error;
  }
}

export type AsaasPixQrCode = {
  encodedImage: string;
  payload: string;
  expirationDate: string;
};

export async function getPaymentPixQrCode(
  config: AsaasConfig,
  paymentId: string,
): Promise<AsaasPixQrCode | null> {
  try {
    return await asaasFetch<AsaasPixQrCode>(
      config,
      `/payments/${paymentId}/pixQrCode`,
    );
  } catch (error) {
    if (error instanceof AsaasError && error.status === 404) return null;
    throw error;
  }
}

export function dueDateFromNow(days = 1): string {
  const now = new Date();
  now.setUTCHours(12, 0, 0, 0);
  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + days);
  return due.toISOString().slice(0, 10);
}

export function trialEndDateFromNow(days = 30): string {
  const now = new Date();
  now.setUTCHours(12, 0, 0, 0);
  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + days);
  return due.toISOString().slice(0, 10);
}

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

export function isValidBrazilianDocument(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === CPF_LENGTH || digits.length === CNPJ_LENGTH;
}
