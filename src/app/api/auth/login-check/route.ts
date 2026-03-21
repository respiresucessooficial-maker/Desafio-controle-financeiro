import { NextResponse } from 'next/server';
import { USER_ACCESS_STATUS } from '@/lib/access-status';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

interface LoginCheckPayload {
  email?: string;
}

export async function POST(request: Request) {
  const body = await request.json() as LoginCheckPayload;
  const email = body.email?.trim().toLowerCase() ?? '';

  if (!email) {
    return NextResponse.json(
      { error: 'E-mail obrigatorio.' },
      { status: 400 },
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('status')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'Nao foi possivel validar o acesso para login.' },
      { status: 500 },
    );
  }

  if (user && user.status !== USER_ACCESS_STATUS.active) {
    return NextResponse.json(
      { error: 'Voce nao tem acesso liberado para logar no sistema. Entre em contato com o suporte.' },
      { status: 403 },
    );
  }

  return NextResponse.json({ allowed: true });
}
