# Cadastro de pessoas

CRUD em JavaScript (Node.js) de pessoas com **CPF, nome e data de nascimento**, com **cálculo da idade**, desenvolvido com **TDD**.

A idade não é gravada: ela é calculada toda vez que a pessoa é consultada, então está sempre correta (inclusive no dia do aniversário e para quem nasceu em 29/02).

## Como rodar

Requisitos: Node.js 22 ou mais novo. Docker é opcional.

```bash
npm install
npm start          # http://localhost:3000
```

Com Docker:

```bash
docker build -t cadastro-pessoas .
docker run --rm -p 3000:3000 cadastro-pessoas
```

## Scripts

| Comando                    | O que faz                                           |
| -------------------------- | --------------------------------------------------- |
| `npm start`                | Sobe o servidor                                     |
| `npm run dev`              | Sobe o servidor reiniciando a cada alteração        |
| `npm test`                 | Todos os testes                                     |
| `npm run test:unit`        | Só os testes unitários                              |
| `npm run test:integration` | Só os testes de integração (servidor HTTP de verdade) |
| `npm run test:coverage`    | Testes com relatório de cobertura                   |
| `npm run test:watch`       | Testes em modo observação (útil no ciclo do TDD)    |
| `npm run lint`             | Análise estática com ESLint                         |
| `npm run format`           | Formata o código com Prettier                       |
| `npm run format:check`     | Confere a formatação sem alterar nada               |
| `npm run check`            | Formatação + análise estática + testes              |

## API

| Método   | Rota                 | Resposta                                     |
| -------- | -------------------- | -------------------------------------------- |
| `GET`    | `/api/pessoas`       | 200 com a lista (ordem alfabética)           |
| `GET`    | `/api/pessoas/:cpf`  | 200 com a pessoa, ou 404                     |
| `POST`   | `/api/pessoas`       | 201 com a pessoa criada, 400 ou 409          |
| `PUT`    | `/api/pessoas/:cpf`  | 200 com a pessoa atualizada, 400 ou 404      |
| `DELETE` | `/api/pessoas/:cpf`  | 204, ou 404                                  |
| `GET`    | `/health`            | 200 `{ "status": "ok" }`                     |

O CPF pode ir com ou sem máscara. Exemplo:

```bash
curl -X POST http://localhost:3000/api/pessoas \
  -H "Content-Type: application/json" \
  -d '{"cpf":"529.982.247-25","nome":"Maria da Silva","dataNascimento":"1995-04-12"}'
```

```json
{ "cpf": "52998224725", "nome": "Maria da Silva", "dataNascimento": "1995-04-12", "idade": 31 }
```

Dados inválidos voltam com o erro de cada campo:

```json
{ "erro": "Dados inválidos", "detalhes": { "cpf": "CPF inválido", "nome": "Informe o nome" } }
```

## Regras de validação

- **CPF**: obrigatório, 11 dígitos, dígitos verificadores corretos, não pode ter todos os dígitos iguais, único no cadastro e não pode ser alterado depois.
- **Nome**: obrigatório, de 3 a 100 caracteres, só letras (com acento), espaços, hífen e apóstrofo.
- **Data de nascimento**: obrigatória, formato `AAAA-MM-DD`, precisa existir no calendário, a partir de 1900 e não pode estar no futuro.

## Estrutura

```
src/
  dominio/       regras puras, sem dependência de HTTP ou banco
    cpf.js         validação, normalização e máscara do CPF
    idade.js       leitura de datas e cálculo da idade
    pessoa.js      validação dos dados de uma pessoa
    erros.js       erros de validação, não encontrado e conflito
  repositorio/   onde os dados ficam (em memória)
  servico/       regras do cadastro (CPF único, idade na leitura)
  http/          servidor HTTP: rotas, JSON e códigos de status
  server.js      ponto de entrada
public/          tela do cadastro (HTML, CSS e JS puros)
test/
  unit/          testes de cada módulo isolado
  integration/   testes da API subindo o servidor de verdade
```

As pessoas ficam em memória, então somem quando o servidor reinicia. Para usar um banco, basta criar outro repositório com os mesmos métodos (`listar`, `buscar`, `salvar`, `remover`); o serviço não muda.

## Como cada requisito foi atendido

| Requisito                       | Onde                                                                 |
| ------------------------------- | -------------------------------------------------------------------- |
| CRUD com CPF, nome, nascimento  | `src/` e a tela em `public/`                                         |
| Cálculo da idade                | `src/dominio/idade.js`                                               |
| TDD                             | Histórico do Git: cada módulo tem um commit de teste falhando antes da implementação |
| Controle de versão              | Git + GitHub                                                         |
| Pull request                    | Branch `feature/crud-pessoas` → `main`, com template em `.github/`   |
| Análise estática                | ESLint (`eslint.config.js`), rodando no CI                           |
| Formatação                      | Prettier (`.prettierrc.json`) + `.editorconfig`, conferido no CI     |
| Testes unitários                | `test/unit/` com o test runner nativo do Node (`node:test`)          |
| Testes de integração            | `test/integration/` subindo o servidor e fazendo requisições HTTP    |
| Imagem                          | `Dockerfile`, construída e testada no CI e publicada no GHCR         |

Os testes usam o test runner que já vem no Node (`node:test` e `node:assert`), então não precisam de biblioteca extra.
