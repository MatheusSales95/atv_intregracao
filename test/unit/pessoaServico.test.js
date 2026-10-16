import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { ErroConflito, ErroNaoEncontrado, ErroValidacao } from '../../src/dominio/erros.js';
import { criarRepositorioEmMemoria } from '../../src/repositorio/repositorioEmMemoria.js';
import { criarPessoaServico } from '../../src/servico/pessoaServico.js';

const MARIA = { cpf: '529.982.247-25', nome: 'Maria da Silva', dataNascimento: '1995-04-12' };
const ANA = { cpf: '111.444.777-35', nome: 'Ana Souza', dataNascimento: '2000-10-17' };

describe('pessoaServico', () => {
  let agora;
  let servico;

  beforeEach(() => {
    agora = new Date(2026, 9, 16);
    servico = criarPessoaServico({ repositorio: criarRepositorioEmMemoria(), relogio: () => agora });
  });

  describe('cadastrar', () => {
    it('salva a pessoa e devolve com a idade calculada', async () => {
      const pessoa = await servico.cadastrar(MARIA);
      assert.deepEqual(pessoa, {
        cpf: '52998224725',
        nome: 'Maria da Silva',
        dataNascimento: '1995-04-12',
        idade: 31,
      });
    });

    it('não aceita CPF repetido, mesmo escrito de outro jeito', async () => {
      await servico.cadastrar(MARIA);
      await assert.rejects(servico.cadastrar({ ...ANA, cpf: '52998224725' }), ErroConflito);
    });

    it('não salva nada quando os dados são inválidos', async () => {
      await assert.rejects(servico.cadastrar({ ...MARIA, cpf: '123' }), ErroValidacao);
      assert.deepEqual(await servico.listar(), []);
    });
  });

  describe('listar', () => {
    it('começa vazio', async () => {
      assert.deepEqual(await servico.listar(), []);
    });

    it('lista em ordem alfabética com a idade de cada um', async () => {
      await servico.cadastrar(MARIA);
      await servico.cadastrar(ANA);
      const lista = await servico.listar();
      assert.deepEqual(
        lista.map(({ nome, idade }) => ({ nome, idade })),
        [
          { nome: 'Ana Souza', idade: 25 },
          { nome: 'Maria da Silva', idade: 31 },
        ],
      );
    });
  });

  describe('buscar', () => {
    it('encontra pelo CPF com ou sem máscara', async () => {
      await servico.cadastrar(MARIA);
      assert.equal((await servico.buscar('52998224725')).nome, 'Maria da Silva');
      assert.equal((await servico.buscar('529.982.247-25')).nome, 'Maria da Silva');
    });

    it('avisa quando o CPF não está cadastrado', async () => {
      await assert.rejects(servico.buscar('52998224725'), ErroNaoEncontrado);
    });
  });

  describe('atualizar', () => {
    it('troca nome e data de nascimento e recalcula a idade', async () => {
      await servico.cadastrar(MARIA);
      const atualizada = await servico.atualizar('52998224725', {
        nome: 'Maria Souza',
        dataNascimento: '1990-01-01',
      });
      assert.equal(atualizada.nome, 'Maria Souza');
      assert.equal(atualizada.idade, 36);
      assert.equal((await servico.buscar('52998224725')).nome, 'Maria Souza');
    });

    it('aceita o mesmo CPF no corpo, inclusive com máscara', async () => {
      await servico.cadastrar(MARIA);
      const atualizada = await servico.atualizar('52998224725', { ...MARIA, nome: 'Maria Souza' });
      assert.equal(atualizada.nome, 'Maria Souza');
    });

    it('não deixa trocar o CPF', async () => {
      await servico.cadastrar(MARIA);
      await assert.rejects(servico.atualizar('52998224725', { ...MARIA, cpf: ANA.cpf }), (erro) => {
        assert.ok(erro instanceof ErroValidacao);
        assert.equal(erro.detalhes.cpf, 'O CPF não pode ser alterado');
        return true;
      });
    });

    it('valida os novos dados', async () => {
      await servico.cadastrar(MARIA);
      await assert.rejects(servico.atualizar('52998224725', { nome: '', dataNascimento: '' }), ErroValidacao);
      assert.equal((await servico.buscar('52998224725')).nome, 'Maria da Silva');
    });

    it('avisa quando o CPF não está cadastrado', async () => {
      await assert.rejects(servico.atualizar('52998224725', MARIA), ErroNaoEncontrado);
    });
  });

  describe('remover', () => {
    it('apaga a pessoa', async () => {
      await servico.cadastrar(MARIA);
      await servico.remover('529.982.247-25');
      await assert.rejects(servico.buscar('52998224725'), ErroNaoEncontrado);
    });

    it('avisa quando o CPF não está cadastrado', async () => {
      await assert.rejects(servico.remover('52998224725'), ErroNaoEncontrado);
    });
  });

  it('a idade acompanha o calendário sem precisar editar o cadastro', async () => {
    await servico.cadastrar(ANA); // faz aniversário em 17/10
    assert.equal((await servico.buscar(ANA.cpf)).idade, 25);

    agora = new Date(2026, 9, 17);
    assert.equal((await servico.buscar(ANA.cpf)).idade, 26);
  });
});
