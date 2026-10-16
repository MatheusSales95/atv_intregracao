import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { ErroConflito, ErroNaoEncontrado, ErroValidacao } from '../dominio/erros.js';

const LIMITE_CORPO_BYTES = 100 * 1024;
const ROTA_PESSOA = /^\/api\/pessoas\/([^/]+)$/;
const PASTA_PUBLICA = new URL('../../public/', import.meta.url);

// Lista fechada de arquivos estáticos: evita servir qualquer caminho pedido (path traversal).
const ARQUIVOS_ESTATICOS = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
};

class ErroRequisicao extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

function enviarJson(res, status, corpo, cabecalhos = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...cabecalhos });
  res.end(JSON.stringify(corpo));
}

function enviarSemConteudo(res) {
  res.writeHead(204);
  res.end();
}

async function enviarArquivo(res, [arquivo, tipo]) {
  const conteudo = await readFile(new URL(arquivo, PASTA_PUBLICA));
  res.writeHead(200, { 'Content-Type': tipo });
  res.end(conteudo);
}

async function lerCorpoJson(req) {
  const partes = [];
  let tamanho = 0;
  // Lê o corpo até o fim mesmo se passar do limite (só descarta o excesso):
  // interromper a leitura no meio derruba a conexão antes de a resposta 413 chegar.
  for await (const parte of req) {
    tamanho += parte.length;
    if (tamanho <= LIMITE_CORPO_BYTES) partes.push(parte);
  }
  if (tamanho > LIMITE_CORPO_BYTES) throw new ErroRequisicao(413, 'Corpo da requisição muito grande');

  const texto = Buffer.concat(partes).toString('utf8').trim();
  if (!texto) throw new ErroRequisicao(400, 'Envie os dados da pessoa em JSON');

  let corpo;
  try {
    corpo = JSON.parse(texto);
  } catch {
    throw new ErroRequisicao(400, 'JSON inválido');
  }
  if (corpo === null || typeof corpo !== 'object' || Array.isArray(corpo)) {
    throw new ErroRequisicao(400, 'O corpo deve ser um objeto JSON');
  }
  return corpo;
}

function metodoNaoPermitido(res, permitidos) {
  enviarJson(res, 405, { erro: 'Método não permitido' }, { Allow: permitidos });
}

async function tratarColecao(req, res, servico) {
  if (req.method === 'GET') return enviarJson(res, 200, await servico.listar());
  if (req.method === 'POST') {
    const pessoa = await servico.cadastrar(await lerCorpoJson(req));
    return enviarJson(res, 201, pessoa, { Location: `/api/pessoas/${pessoa.cpf}` });
  }
  return metodoNaoPermitido(res, 'GET, POST');
}

async function tratarItem(req, res, servico, cpf) {
  if (req.method === 'GET') return enviarJson(res, 200, await servico.buscar(cpf));
  if (req.method === 'PUT') {
    return enviarJson(res, 200, await servico.atualizar(cpf, await lerCorpoJson(req)));
  }
  if (req.method === 'DELETE') {
    await servico.remover(cpf);
    return enviarSemConteudo(res);
  }
  return metodoNaoPermitido(res, 'GET, PUT, DELETE');
}

async function rotear(req, res, servico) {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname === '/health' && req.method === 'GET') return enviarJson(res, 200, { status: 'ok' });
  if (pathname === '/api/pessoas') return tratarColecao(req, res, servico);

  const rotaPessoa = ROTA_PESSOA.exec(pathname);
  if (rotaPessoa) return tratarItem(req, res, servico, decodeURIComponent(rotaPessoa[1]));

  const estatico = ARQUIVOS_ESTATICOS[pathname];
  if (estatico && req.method === 'GET') return enviarArquivo(res, estatico);

  return enviarJson(res, 404, { erro: 'Rota não encontrada' });
}

function tratarErro(res, erro) {
  if (erro instanceof ErroValidacao) {
    return enviarJson(res, 400, { erro: erro.message, detalhes: erro.detalhes });
  }
  if (erro instanceof ErroNaoEncontrado) return enviarJson(res, 404, { erro: erro.message });
  if (erro instanceof ErroConflito) return enviarJson(res, 409, { erro: erro.message });
  if (erro instanceof ErroRequisicao) return enviarJson(res, erro.status, { erro: erro.message });
  if (erro instanceof URIError) return enviarJson(res, 400, { erro: 'Endereço inválido' });

  console.error(erro);
  return enviarJson(res, 500, { erro: 'Erro interno do servidor' });
}

/** Cria o servidor HTTP. Recebe o serviço pronto para facilitar os testes de integração. */
export function criarApp({ servico }) {
  return createServer(async (req, res) => {
    try {
      await rotear(req, res, servico);
    } catch (erro) {
      tratarErro(res, erro);
    }
  });
}
