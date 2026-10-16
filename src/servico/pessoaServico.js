import { normalizarCpf } from '../dominio/cpf.js';
import { ErroConflito, ErroNaoEncontrado, ErroValidacao } from '../dominio/erros.js';
import { calcularIdade } from '../dominio/idade.js';
import { validarPessoa } from '../dominio/pessoa.js';

/**
 * Regras de negócio do cadastro.
 * A idade nunca é guardada: é calculada a cada leitura, então está sempre atualizada.
 * @param {{ repositorio: object, relogio?: () => Date }} dependencias
 */
export function criarPessoaServico({ repositorio, relogio = () => new Date() }) {
  const comIdade = (pessoa) => ({
    ...pessoa,
    idade: calcularIdade(pessoa.dataNascimento, relogio()),
  });

  async function buscarOuFalhar(cpf) {
    const pessoa = await repositorio.buscar(normalizarCpf(cpf));
    if (!pessoa) throw new ErroNaoEncontrado();
    return pessoa;
  }

  return {
    async listar() {
      const pessoas = await repositorio.listar();
      return pessoas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(comIdade);
    },

    async buscar(cpf) {
      return comIdade(await buscarOuFalhar(cpf));
    },

    async cadastrar(dados) {
      const pessoa = validarPessoa(dados, relogio());
      if (await repositorio.buscar(pessoa.cpf)) throw new ErroConflito();
      return comIdade(await repositorio.salvar(pessoa));
    },

    async atualizar(cpf, dados) {
      const existente = await buscarOuFalhar(cpf);
      const cpfInformado = dados?.cpf;
      if (cpfInformado !== undefined && normalizarCpf(cpfInformado) !== existente.cpf) {
        throw new ErroValidacao({ cpf: 'O CPF não pode ser alterado' });
      }
      const pessoa = validarPessoa({ ...dados, cpf: existente.cpf }, relogio());
      return comIdade(await repositorio.salvar(pessoa));
    },

    async remover(cpf) {
      const removida = await repositorio.remover(normalizarCpf(cpf));
      if (!removida) throw new ErroNaoEncontrado();
    },
  };
}
