import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { USER_ACCESS_STATUS } from '@/lib/access-status';
import { isValidCPF, normalizeCPF } from '@/lib/cpf';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

interface RegisterPayload {
  name?: string;
  email?: string;
  password?: string;
  cpf?: string;
}

async function findAuthUserByEmail(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  targetEmail: string,
) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return { user: null, error };

  const user = data.users.find((item) => item.email?.toLowerCase() === targetEmail.toLowerCase()) ?? null;
  return { user, error: null };
}

export async function POST(request: Request) {
  const body = await request.json() as RegisterPayload;
  const name = body.name?.trim() ?? '';
  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password ?? '';
  const cpf = normalizeCPF(body.cpf ?? '');

  if (!name || !email || !password || !cpf) {
    return NextResponse.json(
      { error: 'Preencha nome, e-mail, senha e CPF.' },
      { status: 400 },
    );
  }

  if (!isValidCPF(cpf)) {
    return NextResponse.json(
      { error: 'CPF invalido. Verifique e tente novamente.' },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'A senha deve ter pelo menos 6 caracteres.' },
      { status: 400 },
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const supabaseAuth = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data: pendingUser, error: pendingUserError } = await supabaseAdmin
    .from('users')
    .select('id, status, auth_user_id')
    .eq('cpf', cpf)
    .maybeSingle();

  if (pendingUserError) {
    return NextResponse.json(
      { error: 'Nao foi possivel validar o acesso deste CPF.' },
      { status: 500 },
    );
  }

  if (!pendingUser || pendingUser.status !== USER_ACCESS_STATUS.pending) {
    return NextResponse.json(
      { error: 'Voce nao tem acesso liberado para se cadastrar no sistema. Entre em contato com o suporte.' },
      { status: 403 },
    );
  }

  const { data: signUpData, error: createUserError } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: {
        cpf,
        full_name: name,
      },
    },
  });

  if (createUserError) {
    const message = createUserError.message;

    console.error('[register] signUp error:', message);

    if (message.includes('already been registered') || message.includes('already registered')) {
      const { user: existingAuthUser, error: findAuthUserError } = await findAuthUserByEmail(supabaseAdmin, email);

      if (findAuthUserError) {
        return NextResponse.json(
          { error: 'Nao foi possivel localizar o cadastro existente deste e-mail.' },
          { status: 500 },
        );
      }

      if (existingAuthUser) {
        if (pendingUser.auth_user_id !== existingAuthUser.id) {
          const { error: syncUserError } = await supabaseAdmin
            .from('users')
            .update({
              auth_user_id: existingAuthUser.id,
              email,
              full_name: name,
            })
            .eq('id', pendingUser.id);

          if (syncUserError) {
            return NextResponse.json(
              { error: 'Nao foi possivel atualizar o cadastro pendente deste usuario.' },
              { status: 500 },
            );
          }
        }
      }

      return NextResponse.json(
        { error: 'Este e-mail ja esta cadastrado.' },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: `Nao foi possivel criar o usuario agora. Detalhe: ${message}` },
      { status: 500 },
    );
  }

  const authUserId = signUpData.user?.id;

  const { error: updateUserError } = await supabaseAdmin
    .from('users')
    .update({
      auth_user_id: authUserId ?? null,
      email,
      full_name: name,
      status: USER_ACCESS_STATUS.active,
      registered_at: new Date().toISOString(),
    })
    .eq('id', pendingUser.id);

  if (updateUserError) {
    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }

    return NextResponse.json(
      { error: 'Usuario criado, mas nao foi possivel concluir a vinculacao. Tente novamente.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Conta criada com sucesso.',
  });
}
