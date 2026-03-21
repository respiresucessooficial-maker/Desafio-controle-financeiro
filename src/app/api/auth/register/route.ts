import { NextResponse } from 'next/server';
import { USER_ACCESS_STATUS } from '@/lib/access-status';
import { isValidCPF, normalizeCPF } from '@/lib/cpf';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

interface RegisterPayload {
  name?: string;
  email?: string;
  password?: string;
  cpf?: string;
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

  const { data: pendingUser, error: pendingUserError } = await supabaseAdmin
    .from('users')
    .select('id, status')
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
      { error: 'Voce nao tem acesso liberado para se cadastrar no sistema.' },
      { status: 403 },
    );
  }

  const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      cpf,
      full_name: name,
    },
  });

  if (createUserError) {
    const message = createUserError.message;

    if (message.includes('already been registered') || message.includes('already registered')) {
      return NextResponse.json(
        { error: 'Este e-mail ja esta cadastrado.' },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: 'Nao foi possivel criar o usuario agora.' },
      { status: 500 },
    );
  }

  const authUserId = createdUser.user?.id;
  if (!authUserId) {
    return NextResponse.json(
      { error: 'Nao foi possivel obter o identificador do usuario criado.' },
      { status: 500 },
    );
  }

  const { error: updateUserError } = await supabaseAdmin
    .from('users')
    .update({
      auth_user_id: authUserId,
      email,
      full_name: name,
      status: USER_ACCESS_STATUS.active,
      registered_at: new Date().toISOString(),
    })
    .eq('id', pendingUser.id);

  if (updateUserError) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId);

    return NextResponse.json(
      { error: 'Usuario criado, mas nao foi possivel concluir a vinculacao. Tente novamente.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Conta criada com sucesso. Agora voce ja pode entrar no sistema.',
  });
}
