import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ErroValidacao } from '../../src/dominio/erros.js';
import { validarPessoa } from '../../src/dominio/pessoa.js';

const HOJE = new Date(2026, 9, 16);
const valida = { cpf: '529.982.247-25', nome: 'Maria da Silva', dataNascimento: '1995-04-12' };

/** Roda a validação esperando falha e devolve os erros por campo. */
function errosDe(dados) {
  try {
    validarPessoa(dados, HOJE);
  } catch (erro) {
    assert.ok(erro instanceof ErroValidacao, 'deveria lançar ErroValidacao');
    return erro.detalhes;
  }
  assert.fail('a validação deveria ter falhado');
}

describe('validarPessoa', () => {
  it('devolve os dados normalizados quando tudo está certo', () => {
    assert.deepEqual(validarPessoa(valida, HOJE), {
      cpf: '52998224725',
      nome: 'Maria da Silva',
      dataNascimento: '1995-04-12',
    });
  });

  it('remove espaços extras do nome', () => {
    const pessoa = validarPessoa({ ...valida, nome: '  Maria   da  Silva ' }, HOJE);
    assert.equal(pessoa.nome, 'Maria da Silva');
  });

  it('aceita nomes com acento, hífen e apóstrofo', () => {
    const nome = "João D'Ávila Souza-Lima";
    assert.equal(validarPessoa({ ...valida, nome }, HOJE).nome, nome);
  });

  it('ignora campos que não fazem parte do cadastro', () => {
    const pessoa = validarPessoa({ ...valida, admin: true, idade: 99 }, HOJE);
    assert.deepEqual(Object.keys(pessoa).sort(), ['cpf', 'dataNascimento', 'nome']);
  });

  it('junta os erros de todos os campos de uma vez', () => {
    assert.deepEqual(Object.keys(errosDe({})).sort(), ['cpf', 'dataNascimento', 'nome']);
  });

  it('trata dados ausentes como formulário vazio', () => {
    assert.deepEqual(Object.keys(errosDe(null)).sort(), ['cpf', 'dataNascimento', 'nome']);
  });

  describe('cpf', () => {
    it('é obrigatório', () => {
      assert.equal(errosDe({ ...valida, cpf: '' }).cpf, 'Informe o CPF');
    });

    it('precisa ser válido', () => {
      assert.equal(errosDe({ ...valida, cpf: '111.111.111-11' }).cpf, 'CPF inválido');
    });
  });

  describe('nome', () => {
    it('é obrigatório', () => {
      assert.equal(errosDe({ ...valida, nome: '   ' }).nome, 'Informe o nome');
    });

    it('precisa ter pelo menos 3 letras', () => {
      assert.match(errosDe({ ...valida, nome: 'Jo' }).nome, /pelo menos 3/);
    });

    it('pode ter no máximo 100 caracteres', () => {
      assert.match(errosDe({ ...valida, nome: 'a'.repeat(101) }).nome, /no máximo 100/);
    });

    it('aceita exatamente 100 caracteres', () => {
      assert.equal(validarPessoa({ ...valida, nome: 'a'.repeat(100) }, HOJE).nome.length, 100);
    });

    it('não aceita números ou símbolos', () => {
      assert.match(errosDe({ ...valida, nome: 'Maria 2' }).nome, /apenas letras/);
      assert.match(errosDe({ ...valida, nome: '<script>' }).nome, /apenas letras/);
    });

    it('precisa ser texto', () => {
      assert.equal(errosDe({ ...valida, nome: 12345 }).nome, 'Informe o nome');
    });
  });

  describe('dataNascimento', () => {
    it('é obrigatória', () => {
      assert.equal(errosDe({ ...valida, dataNascimento: '' }).dataNascimento, 'Informe a data de nascimento');
    });

    it('precisa existir no calendário', () => {
      assert.match(errosDe({ ...valida, dataNascimento: '2001-02-29' }).dataNascimento, /data válida/);
    });

    it('precisa estar no formato AAAA-MM-DD', () => {
      assert.match(errosDe({ ...valida, dataNascimento: '12/04/1995' }).dataNascimento, /AAAA-MM-DD/);
    });

    it('não pode estar no futuro', () => {
      assert.match(errosDe({ ...valida, dataNascimento: '2026-10-17' }).dataNascimento, /futuro/);
    });

    it('pode ser hoje', () => {
      assert.equal(validarPessoa({ ...valida, dataNascimento: '2026-10-16' }, HOJE).dataNascimento, '2026-10-16');
    });

    it('não pode ser anterior a 1900', () => {
      assert.match(errosDe({ ...valida, dataNascimento: '1899-12-31' }).dataNascimento, /1900/);
    });
  });
});
