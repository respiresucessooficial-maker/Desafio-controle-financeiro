import { NextResponse } from 'next/server';
import { USER_ACCESS_STATUS } from '@/lib/access-status';
import {
  extractKiwifyCustomerData,
  extractKiwifyOrderId,
  getKiwifyTokenFromPayload,
  isApprovedKiwifyPurchase,
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

  if (!isApprovedKiwifyPurchase(payload)) {
    return NextResponse.json({
      success: true,
      ignored: true,
      message: 'Evento recebido, mas ignorado por nao representar pagamento aprovado.',
    });
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
      { error: 'Nao foi possivel consultar o pre-cadastro.' },
      { status: 500 },
    );
  }

  if (existingUser?.status === USER_ACCESS_STATUS.active) {
    return NextResponse.json({
      success: true,
      message: 'Cliente ja possui cadastro ativo. Nenhuma alteracao foi feita.',
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
    message: 'Pre-cadastro salvo com status pendente.',
  });
}
