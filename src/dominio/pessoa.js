import { normalizarCpf, validarCpf } from './cpf.js';
import { ErroValidacao } from './erros.js';
import { compararDatas, diaDoCalendario, interpretarData } from './idade.js';

export const NOME_MINIMO = 3;
export const NOME_MAXIMO = 100;
export const ANO_MINIMO = 1900;

const SOMENTE_LETRAS = /^[\p{L}\p{M}' -]+$/u;

function limparNome(nome) {
  return typeof nome === 'string' ? nome.trim().replace(/\s+/g, ' ') : '';
}

function erroDoCpf(cpf) {
  if (cpf === undefined || cpf === null || cpf === '') return 'Informe o CPF';
  if (!validarCpf(cpf)) return 'CPF inválido';
  return null;
}

function erroDoNome(nome) {
  if (!nome) return 'Informe o nome';
  if (nome.length < NOME_MINIMO) return `O nome precisa ter pelo menos ${NOME_MINIMO} letras`;
  if (nome.length > NOME_MAXIMO) return `O nome pode ter no máximo ${NOME_MAXIMO} caracteres`;
  if (!SOMENTE_LETRAS.test(nome)) return 'O nome deve ter apenas letras, espaços, hífen ou apóstrofo';
  return null;
}

function erroDaDataNascimento(dataNascimento, referencia) {
  if (!dataNascimento) return 'Informe a data de nascimento';

  const data = interpretarData(dataNascimento);
  if (!data) return 'Use uma data válida no formato AAAA-MM-DD';
  if (data.ano < ANO_MINIMO) return `A data de nascimento deve ser a partir de ${ANO_MINIMO}`;
  if (compararDatas(data, diaDoCalendario(referencia)) > 0) {
    return 'A data de nascimento não pode estar no futuro';
  }
  return null;
}

/**
 * Valida os dados de uma pessoa e devolve a versão normalizada.
 * Junta os erros de todos os campos de uma vez para a tela mostrar tudo junto.
 * @throws {ErroValidacao}
 */
export function validarPessoa(dados, referencia = new Date()) {
  const { cpf, nome, dataNascimento } = dados ?? {};
  const nomeLimpo = limparNome(nome);

  const erros = Object.fromEntries(
    Object.entries({
      cpf: erroDoCpf(cpf),
      nome: erroDoNome(nomeLimpo),
      dataNascimento: erroDaDataNascimento(dataNascimento, referencia),
    }).filter(([, mensagem]) => mensagem !== null),
  );

  if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);

  return { cpf: normalizarCpf(cpf), nome: nomeLimpo, dataNascimento };
}
