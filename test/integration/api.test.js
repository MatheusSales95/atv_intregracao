import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { criarApp } from '../../src/http/app.js';
import { criarRepositorioEmMemoria } from '../../src/repositorio/repositorioEmMemoria.js';
import { criarPessoaServico } from '../../src/servico/pessoaServico.js';

const MARIA = { cpf: '529.982.247-25', nome: 'Maria da Silva', dataNascimento: '1995-04-12' };

describe('API /api/pessoas (servidor HTTP real)', () => {
  let servidor;
  let baseUrl;

  beforeEach(async () => {
    const servico = criarPessoaServico({
      repositorio: criarRepositorioEmMemoria(),
      relogio: () => new Date(2026, 9, 16),
    });
    servidor = criarApp({ servico });
    await new Promise((resolve) => servidor.listen(0, resolve)); // porta 0 = qualquer porta livre
    baseUrl = `http://localhost:${servidor.address().port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => servidor.close(resolve));
  });

  const pedir = (caminho, { metodo = 'GET', corpo } = {}) =>
    fetch(`${baseUrl}${caminho}`, {
      method: metodo,
      headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
    });

  it('GET /health responde ok', async () => {
    const resposta = await pedir('/health');
    assert.equal(resposta.status, 200);
    assert.deepEqual(await resposta.json(), { status: 'ok' });
  });

  it('faz o CRUD completo: cadastrar, consultar, listar, atualizar e remover', async () => {
    const criada = await pedir('/api/pessoas', { metodo: 'POST', corpo: MARIA });
    assert.equal(criada.status, 201);
    assert.equal(criada.headers.get('location'), '/api/pessoas/52998224725');
    assert.deepEqual(await criada.json(), {
      cpf: '52998224725',
      nome: 'Maria da Silva',
      dataNascimento: '1995-04-12',
      idade: 31,
    });

    const consultada = await pedir('/api/pessoas/52998224725');
    assert.equal(consultada.status, 200);
    assert.equal((await consultada.json()).idade, 31);

    const lista = await pedir('/api/pessoas');
    assert.equal(lista.status, 200);
    assert.equal((await lista.json()).length, 1);

    const atualizada = await pedir('/api/pessoas/52998224725', {
      metodo: 'PUT',
      corpo: { nome: 'Maria Souza', dataNascimento: '1990-01-01' },
    });
    assert.equal(atualizada.status, 200);
    assert.deepEqual(await atualizada.json(), {
      cpf: '52998224725',
      nome: 'Maria Souza',
      dataNascimento: '1990-01-01',
      idade: 36,
    });

    const removida = await pedir('/api/pessoas/52998224725', { metodo: 'DELETE' });
    assert.equal(removida.status, 204);

    const depois = await pedir('/api/pessoas/52998224725');
    assert.equal(depois.status, 404);
  });

  it('aceita o CPF com máscara no endereço', async () => {
    await pedir('/api/pessoas', { metodo: 'POST', corpo: MARIA });
    const resposta = await pedir('/api/pessoas/529.982.247-25');
    assert.equal(resposta.status, 200);
  });

  it('POST com dados inválidos responde 400 com o erro de cada campo', async () => {
    const resposta = await pedir('/api/pessoas', {
      metodo: 'POST',
      corpo: { cpf: '123', nome: '', dataNascimento: '2030-01-01' },
    });
    assert.equal(resposta.status, 400);
    const corpo = await resposta.json();
    assert.equal(corpo.erro, 'Dados inválidos');
    assert.deepEqual(Object.keys(corpo.detalhes).sort(), ['cpf', 'dataNascimento', 'nome']);
  });

  it('POST com CPF já cadastrado responde 409', async () => {
    await pedir('/api/pessoas', { metodo: 'POST', corpo: MARIA });
    const resposta = await pedir('/api/pessoas', { metodo: 'POST', corpo: MARIA });
    assert.equal(resposta.status, 409);
  });

  it('POST com JSON quebrado responde 400', async () => {
    const resposta = await pedir('/api/pessoas', { metodo: 'POST', corpo: '{"nome": ' });
    assert.equal(resposta.status, 400);
    assert.deepEqual(await resposta.json(), { erro: 'JSON inválido' });
  });

  it('POST sem corpo ou com algo que não é objeto responde 400', async () => {
    assert.equal((await pedir('/api/pessoas', { metodo: 'POST' })).status, 400);
    assert.equal((await pedir('/api/pessoas', { metodo: 'POST', corpo: '[]' })).status, 400);
  });

  it('POST com corpo grande demais responde 413', async () => {
    const resposta = await pedir('/api/pessoas', {
      metodo: 'POST',
      corpo: { ...MARIA, lixo: 'x'.repeat(200 * 1024) },
    });
    assert.equal(resposta.status, 413);
  });

  it('PUT tentando trocar o CPF responde 400', async () => {
    await pedir('/api/pessoas', { metodo: 'POST', corpo: MARIA });
    const resposta = await pedir('/api/pessoas/52998224725', {
      metodo: 'PUT',
      corpo: { ...MARIA, cpf: '111.444.777-35' },
    });
    assert.equal(resposta.status, 400);
  });

  it('PUT e DELETE de CPF inexistente respondem 404', async () => {
    const put = await pedir('/api/pessoas/52998224725', { metodo: 'PUT', corpo: MARIA });
    const del = await pedir('/api/pessoas/52998224725', { metodo: 'DELETE' });
    assert.equal(put.status, 404);
    assert.equal(del.status, 404);
  });

  it('método não suportado responde 405 com os permitidos', async () => {
    const resposta = await pedir('/api/pessoas', { metodo: 'PATCH', corpo: {} });
    assert.equal(resposta.status, 405);
    assert.equal(resposta.headers.get('allow'), 'GET, POST');
  });

  it('CPF mal codificado no endereço responde 400', async () => {
    assert.equal((await pedir('/api/pessoas/%E0%A4%A')).status, 400);
  });

  it('rota desconhecida responde 404', async () => {
    assert.equal((await pedir('/api/nada')).status, 404);
  });

  it('não serve arquivos fora da pasta public', async () => {
    assert.equal((await pedir('/../package.json')).status, 404);
    assert.equal((await pedir('/src/server.js')).status, 404);
  });

  it('serve a página do cadastro em /', async () => {
    const resposta = await pedir('/');
    assert.equal(resposta.status, 200);
    assert.match(resposta.headers.get('content-type'), /text\/html/);
    assert.match(await resposta.text(), /Cadastro de pessoas/);
  });
});
