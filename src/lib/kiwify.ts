import { normalizeCPF } from '@/lib/cpf';

type JsonObject = Record<string, unknown>;

export interface KiwifyCustomerData {
  fullName: string;
  email: string;
  cpf: string;
}

function asObject(value: unknown): JsonObject {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }

  return '';
}

export function getKiwifyTokenFromPayload(payload: unknown) {
  const data = asObject(payload);

  return getFirstString(
    data.token,
    data.webhook_token,
    data.webhookToken,
  );
}

export function getKiwifyEvent(payload: unknown) {
  const data = asObject(payload);

  return getFirstString(
    data.event,
    data.event_name,
    data.trigger,
    data.webhook_event,
  ).toLowerCase();
}

export function getKiwifyOrderStatus(payload: unknown) {
  const data = asObject(payload);

  return getFirstString(
    data.order_status,
    data.status,
    data.orderStatus,
  ).toLowerCase();
}

export function extractKiwifyCustomerData(payload: unknown): KiwifyCustomerData | null {
  const data = asObject(payload);
  const customer = asObject(data.Customer ?? data.customer);

  const cpf = normalizeCPF(
    getFirstString(
      customer.CPF,
      customer.cpf,
      data.customer_cpf,
      data.cpf,
    ),
  );

  const fullName = getFirstString(
    customer.full_name,
    customer.name,
    data.customer_name,
    data.name,
  );

  const email = getFirstString(
    customer.email,
    data.customer_email,
    data.email,
  ).toLowerCase();

  if (!cpf || !fullName || !email) {
    return null;
  }

  return { cpf, email, fullName };
}

export function extractKiwifyOrderId(payload: unknown) {
  const data = asObject(payload);

  return getFirstString(
    data.order_id,
    data.orderId,
    data.order_ref,
  );
}

export function isApprovedKiwifyPurchase(payload: unknown) {
  const event = getKiwifyEvent(payload);
  const orderStatus = getKiwifyOrderStatus(payload);

  return event === 'compra_aprovada' ||
    event === 'purchase_approved' ||
    orderStatus === 'paid';
}

export function isRefundEvent(payload: unknown) {
  const event = getKiwifyEvent(payload);
  const orderStatus = getKiwifyOrderStatus(payload);

  return event === 'reembolso' ||
    event === 'refund' ||
    orderStatus === 'refunded';
}

export function isChargebackEvent(payload: unknown) {
  const event = getKiwifyEvent(payload);
  const orderStatus = getKiwifyOrderStatus(payload);

  return event === 'chargeback' ||
    orderStatus === 'chargeback';
}

export function isSubscriptionCanceledEvent(payload: unknown) {
  const event = getKiwifyEvent(payload);
  const orderStatus = getKiwifyOrderStatus(payload);

  return event === 'subscription_canceled' ||
    event === 'assinatura_cancelada' ||
    orderStatus === 'canceled';
}

export function isSubscriptionOverdueEvent(payload: unknown) {
  const event = getKiwifyEvent(payload);
  const orderStatus = getKiwifyOrderStatus(payload);

  return event === 'subscription_overdue' ||
    event === 'assinatura_atrasada' ||
    orderStatus === 'overdue';
}
