export class ErroValidacao extends Error {
  /** @param {Record<string, string>} detalhes mensagem de erro por campo */
  constructor(detalhes) {
    super('Dados inválidos');
    this.name = 'ErroValidacao';
    this.detalhes = detalhes;
  }
}

export class ErroNaoEncontrado extends Error {
  constructor(mensagem = 'Pessoa não encontrada') {
    super(mensagem);
    this.name = 'ErroNaoEncontrado';
  }
}

export class ErroConflito extends Error {
  constructor(mensagem = 'Já existe uma pessoa com este CPF') {
    super(mensagem);
    this.name = 'ErroConflito';
  }
}
