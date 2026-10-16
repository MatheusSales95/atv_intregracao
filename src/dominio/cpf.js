const TAMANHO_CPF = 11;
const CARACTERES_PERMITIDOS = /^[\d.\s-]+$/;
const TODOS_DIGITOS_IGUAIS = /^(\d)\1{10}$/;

/** Remove tudo que não for dígito. */
export function normalizarCpf(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

function calcularDigitoVerificador(digitos, pesoInicial) {
  const soma = digitos.reduce((total, digito, indice) => total + digito * (pesoInicial - indice), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/**
 * Valida um CPF pelos dígitos verificadores.
 * Aceita com ou sem máscara (529.982.247-25 ou 52998224725), sempre como texto,
 * porque um número perderia os zeros à esquerda.
 */
export function validarCpf(valor) {
  if (typeof valor !== 'string' || !CARACTERES_PERMITIDOS.test(valor)) return false;

  const cpf = normalizarCpf(valor);
  if (cpf.length !== TAMANHO_CPF || TODOS_DIGITOS_IGUAIS.test(cpf)) return false;

  const digitos = [...cpf].map(Number);
  const primeiro = calcularDigitoVerificador(digitos.slice(0, 9), 10);
  const segundo = calcularDigitoVerificador(digitos.slice(0, 10), 11);

  return primeiro === digitos[9] && segundo === digitos[10];
}

/** Aplica a máscara 000.000.000-00. Valores sem 11 dígitos voltam só com os dígitos. */
export function formatarCpf(valor) {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== TAMANHO_CPF) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
