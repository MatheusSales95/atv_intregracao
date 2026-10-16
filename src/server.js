import { criarApp } from './http/app.js';
import { criarRepositorioEmMemoria } from './repositorio/repositorioEmMemoria.js';
import { criarPessoaServico } from './servico/pessoaServico.js';

const PORTA = Number(process.env.PORT) || 3000;

const servico = criarPessoaServico({ repositorio: criarRepositorioEmMemoria() });
const app = criarApp({ servico });

app.listen(PORTA, () => {
  console.log(`Cadastro de pessoas rodando em http://localhost:${PORTA}`);
});

// Encerra direitinho quando o Docker (ou o Ctrl+C) pede para parar.
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => app.close(() => process.exit(0)));
}
