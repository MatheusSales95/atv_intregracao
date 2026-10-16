/**
 * Repositório que guarda as pessoas em memória (some ao reiniciar o servidor).
 * Os métodos são assíncronos para que trocar por um banco de dados não mude o serviço.
 */
export function criarRepositorioEmMemoria() {
  const pessoas = new Map();
  const copiar = (pessoa) => ({ ...pessoa });

  return {
    async listar() {
      return [...pessoas.values()].map(copiar);
    },
    async buscar(cpf) {
      const pessoa = pessoas.get(cpf);
      return pessoa ? copiar(pessoa) : null;
    },
    async salvar(pessoa) {
      pessoas.set(pessoa.cpf, copiar(pessoa));
      return copiar(pessoa);
    },
    async remover(cpf) {
      return pessoas.delete(cpf);
    },
  };
}
