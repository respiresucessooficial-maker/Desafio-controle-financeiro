export function normalizeCPF(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function formatCPF(value: string) {
  return normalizeCPF(value)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function isValidCPF(cpf: string) {
  const digits = normalizeCPF(cpf);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number.parseInt(digits[i], 10) * (10 - i);

  let check = (sum * 10) % 11;
  if (check === 10 || check === 11) check = 0;
  if (check !== Number.parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number.parseInt(digits[i], 10) * (11 - i);

  check = (sum * 10) % 11;
  if (check === 10 || check === 11) check = 0;

  return check === Number.parseInt(digits[10], 10);
}
