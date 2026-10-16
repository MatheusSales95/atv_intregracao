const formulario = document.querySelector('#formulario');
const campos = {
  cpf: document.querySelector('#cpf'),
  nome: document.querySelector('#nome'),
  dataNascimento: document.querySelector('#dataNascimento'),
};
const tituloFicha = document.querySelector('#titulo-ficha');
const botaoSalvar = document.querySelector('#botao-salvar');
const botaoCancelar = document.querySelector('#botao-cancelar');
const aviso = document.querySelector('#aviso');
const lista = document.querySelector('#lista');
const vazio = document.querySelector('#vazio');
const contador = document.querySelector('#contador');

let cpfEmEdicao = null;

const formatarCpf = (cpf) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
const formatarData = (iso) => iso.split('-').reverse().join('/');

function hojeIso() {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  return agora.toISOString().slice(0, 10);
}

function mascararCpf(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function mostrarErros(detalhes = {}) {
  for (const [nome, campo] of Object.entries(campos)) {
    const mensagem = detalhes[nome] ?? '';
    document.querySelector(`#erro-${nome}`).textContent = mensagem;
    campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
  }
  const primeiroComErro = Object.keys(campos).find((nome) => detalhes[nome]);
  if (primeiroComErro) campos[primeiroComErro].focus();
}

function sairDaEdicao() {
  cpfEmEdicao = null;
  formulario.reset();
  campos.cpf.readOnly = false;
  tituloFicha.textContent = 'Nova pessoa';
  botaoSalvar.textContent = 'Cadastrar pessoa';
  botaoCancelar.hidden = true;
  mostrarErros();
}

function entrarNaEdicao(pessoa) {
  cpfEmEdicao = pessoa.cpf;
  campos.cpf.value = formatarCpf(pessoa.cpf);
  campos.cpf.readOnly = true;
  campos.nome.value = pessoa.nome;
  campos.dataNascimento.value = pessoa.dataNascimento;
  tituloFicha.textContent = 'Editar pessoa';
  botaoSalvar.textContent = 'Salvar alterações';
  botaoCancelar.hidden = false;
  aviso.textContent = '';
  mostrarErros();
  campos.nome.focus();
}

function criarItem(pessoa) {
  const item = document.createElement('li');
  item.className = 'pessoa';

  const dados = document.createElement('div');
  dados.className = 'pessoa-dados';
  const nome = document.createElement('p');
  nome.className = 'pessoa-nome';
  nome.textContent = pessoa.nome;
  const cpf = document.createElement('p');
  cpf.className = 'pessoa-info';
  cpf.textContent = `CPF ${formatarCpf(pessoa.cpf)}`;
  const nascimento = document.createElement('p');
  nascimento.className = 'pessoa-info';
  nascimento.textContent = `Nasceu em ${formatarData(pessoa.dataNascimento)}`;
  dados.append(nome, cpf, nascimento);

  const idade = document.createElement('p');
  idade.className = 'pessoa-idade';
  const numero = document.createElement('strong');
  numero.textContent = pessoa.idade;
  const unidade = document.createElement('span');
  unidade.textContent = pessoa.idade === 1 ? 'ano' : 'anos';
  idade.append(numero, unidade);

  const botoes = document.createElement('div');
  botoes.className = 'pessoa-botoes';
  const editar = document.createElement('button');
  editar.type = 'button';
  editar.className = 'secundario';
  editar.textContent = 'Editar';
  editar.setAttribute('aria-label', `Editar ${pessoa.nome}`);
  editar.addEventListener('click', () => entrarNaEdicao(pessoa));
  const excluir = document.createElement('button');
  excluir.type = 'button';
  excluir.className = 'perigo';
  excluir.textContent = 'Excluir';
  excluir.setAttribute('aria-label', `Excluir ${pessoa.nome}`);
  excluir.addEventListener('click', () => excluirPessoa(pessoa));
  botoes.append(editar, excluir);

  item.append(dados, idade, botoes);
  return item;
}

function renderizar(pessoas) {
  lista.replaceChildren(...pessoas.map(criarItem));
  vazio.hidden = pessoas.length > 0;
  contador.textContent =
    pessoas.length === 1 ? '1 pessoa cadastrada' : `${pessoas.length} pessoas cadastradas`;
}

async function carregar() {
  try {
    const resposta = await fetch('/api/pessoas');
    if (!resposta.ok) throw new Error();
    renderizar(await resposta.json());
  } catch {
    aviso.textContent = 'Não foi possível carregar a lista. Confira se o servidor está rodando.';
  }
}

async function salvar(evento) {
  evento.preventDefault();
  aviso.textContent = '';
  const dados = {
    cpf: campos.cpf.value,
    nome: campos.nome.value,
    dataNascimento: campos.dataNascimento.value,
  };
  const editando = cpfEmEdicao !== null;
  const resposta = await fetch(editando ? `/api/pessoas/${cpfEmEdicao}` : '/api/pessoas', {
    method: editando ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  const corpo = await resposta.json();

  if (resposta.status === 400) return mostrarErros(corpo.detalhes ?? {});
  if (resposta.status === 409) return mostrarErros({ cpf: corpo.erro });
  if (!resposta.ok) {
    aviso.textContent = corpo.erro ?? 'Não foi possível salvar. Tente de novo.';
    return;
  }

  aviso.textContent = editando
    ? `Alterações salvas: ${corpo.nome}.`
    : `Pessoa cadastrada: ${corpo.nome}, ${corpo.idade} ${corpo.idade === 1 ? 'ano' : 'anos'}.`;
  sairDaEdicao();
  await carregar();
}

async function excluirPessoa(pessoa) {
  if (!confirm(`Excluir ${pessoa.nome} do cadastro?`)) return;
  const resposta = await fetch(`/api/pessoas/${pessoa.cpf}`, { method: 'DELETE' });
  aviso.textContent = resposta.ok ? `Pessoa excluída: ${pessoa.nome}.` : 'Não foi possível excluir.';
  if (cpfEmEdicao === pessoa.cpf) sairDaEdicao();
  await carregar();
}

campos.cpf.addEventListener('input', () => {
  campos.cpf.value = mascararCpf(campos.cpf.value);
});
campos.dataNascimento.max = hojeIso();
formulario.addEventListener('submit', salvar);
botaoCancelar.addEventListener('click', () => {
  sairDaEdicao();
  aviso.textContent = '';
});

carregar();
