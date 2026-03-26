import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Informe um e-mail valido para recuperar a senha.' },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const adminSupabase = createSupabaseAdminClient();

    const { data: userRecord, error: userError } = await adminSupabase
      .from('users')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { error: 'Nao foi possivel consultar a base de usuarios.' },
        { status: 500 },
      );
    }

    if (!userRecord) {
      return NextResponse.json(
        { error: 'Nenhuma conta encontrada com esse e-mail.' },
        { status: 404 },
      );
    }

    const origin = new URL(request.url).origin;
    const redirectTo = `${origin}/auth/callback?next=/redefinir-senha`;

    const publicSupabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { error: resetError } = await publicSupabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (resetError) {
      return NextResponse.json(
        { error: 'Nao foi possivel enviar o e-mail de recuperacao.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Se o e-mail estiver cadastrado, o link de recuperacao foi enviado com sucesso.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Ocorreu um erro ao solicitar a recuperacao de senha.' },
      { status: 500 },
    );
  }
}
