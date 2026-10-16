const FORMATO_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Lê uma data no formato AAAA-MM-DD e confere se ela existe no calendário
 * (2023-02-30 não existe; 2024-02-29 existe).
 * @returns {{ ano: number, mes: number, dia: number } | null}
 */
export function interpretarData(texto) {
  if (typeof texto !== 'string') return null;

  const partes = FORMATO_ISO.exec(texto);
  if (!partes) return null;

  const [ano, mes, dia] = partes.slice(1).map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const existe =
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;

  return existe ? { ano, mes, dia } : null;
}

/** Negativo se a < b, zero se iguais, positivo se a > b. */
export function compararDatas(a, b) {
  return a.ano - b.ano || a.mes - b.mes || a.dia - b.dia;
}

/** Converte um Date no dia do calendário local. */
export function diaDoCalendario(data) {
  return { ano: data.getFullYear(), mes: data.getMonth() + 1, dia: data.getDate() };
}

/**
 * Idade em anos completos na data de referência.
 * Quem nasceu em 29/02 completa ano em 01/03 nos anos não bissextos.
 */
export function calcularIdade(dataNascimento, referencia = new Date()) {
  const nascimento = interpretarData(dataNascimento);
  if (!nascimento) throw new TypeError(`Data de nascimento inválida: ${dataNascimento}`);

  const hoje = diaDoCalendario(referencia);
  if (compararDatas(nascimento, hoje) > 0) {
    throw new RangeError('A data de nascimento não pode estar no futuro');
  }

  const aniversarioAindaNaoChegou =
    hoje.mes < nascimento.mes || (hoje.mes === nascimento.mes && hoje.dia < nascimento.dia);

  return hoje.ano - nascimento.ano - (aniversarioAindaNaoChegou ? 1 : 0);
}
