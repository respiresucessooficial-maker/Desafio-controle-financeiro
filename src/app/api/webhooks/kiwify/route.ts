import { NextResponse } from 'next/server';
import { USER_ACCESS_STATUS } from '@/lib/access-status';
import {
  extractKiwifyCustomerData,
  extractKiwifyOrderId,
  getKiwifyTokenFromPayload,
  isChargebackEvent,
  isApprovedKiwifyPurchase,
  isRefundEvent,
  isSubscriptionCanceledEvent,
  isSubscriptionOverdueEvent,
} from '@/lib/kiwify';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

function getExpectedToken() {
  return process.env.KIWIFY_WEBHOOK_SECRET?.trim() ?? '';
}

function getReceivedToken(request: Request, payload: unknown) {
  const url = new URL(request.url);

  return (
    url.searchParams.get('token')?.trim() ||
    request.headers.get('x-webhook-token')?.trim() ||
    request.headers.get('x-kiwify-token')?.trim() ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    getKiwifyTokenFromPayload(payload)
  );
}

export async function POST(request: Request) {
  const payload = await request.json();
  const expectedToken = getExpectedToken();
  const receivedToken = getReceivedToken(request, payload);

  if (expectedToken && receivedToken !== expectedToken) {
    return NextResponse.json({ error: 'Webhook nao autorizado.' }, { status: 401 });
  }

  const customer = extractKiwifyCustomerData(payload);

  if (!customer) {
    return NextResponse.json(
      { error: 'Webhook sem nome, e-mail ou CPF do cliente.' },
      { status: 400 },
    );
  }

  const orderId = extractKiwifyOrderId(payload);
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: existingUser, error: findUserError } = await supabaseAdmin
    .from('users')
    .select('id, status')
    .eq('cpf', customer.cpf)
    .maybeSingle();

  if (findUserError) {
    return NextResponse.json(
      { error: 'Nao foi possivel consultar o cadastro do cliente.' },
      { status: 500 },
    );
  }

  if (isRefundEvent(payload) || isChargebackEvent(payload) || isSubscriptionCanceledEvent(payload) || isSubscriptionOverdueEvent(payload)) {
    if (!existingUser) {
      return NextResponse.json({
        success: true,
        ignored: true,
        message: 'Cliente nao encontrado para inativacao.',
      });
    }

    const { error: inactivateError } = await supabaseAdmin
      .from('users')
      .update({
        status: USER_ACCESS_STATUS.inactive,
        kiwify_order_id: orderId || null,
        kiwify_payload: payload,
      })
      .eq('id', existingUser.id);

    if (inactivateError) {
      return NextResponse.json(
        { error: 'Nao foi possivel inativar o cliente.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente inativado com sucesso.',
    });
  }

  if (!isApprovedKiwifyPurchase(payload)) {
    return NextResponse.json({
      success: true,
      ignored: true,
      message: 'Evento recebido, mas ignorado por nao exigir alteracao de acesso.',
    });
  }

  const payloadToSave = {
    full_name: customer.fullName,
    email: customer.email,
    cpf: customer.cpf,
    status: USER_ACCESS_STATUS.pending,
    source: 'kiwify',
    kiwify_order_id: orderId || null,
    kiwify_payload: payload,
  };

  const result = existingUser
    ? await supabaseAdmin.from('users').update(payloadToSave).eq('id', existingUser.id)
    : await supabaseAdmin.from('users').insert(payloadToSave);

  if (result.error) {
    return NextResponse.json(
      { error: 'Nao foi possivel salvar o pre-cadastro do cliente.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: existingUser
      ? 'Cadastro encontrado e movido para status pendente.'
      : 'Pre-cadastro salvo com status pendente.',
  });
}
