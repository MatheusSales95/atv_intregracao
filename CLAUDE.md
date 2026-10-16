# CLAUDE.md

Trabalho da Fatec: CRUD em JavaScript de pessoas (CPF, nome, data de nascimento) com cálculo da idade, usando TDD. Leia o `README.md` para a visão geral.

## Comandos

- `npm run check` roda formatação, lint e todos os testes. Precisa passar antes de qualquer commit (exceto os commits "red" do TDD, veja abaixo).
- `npm test`, `npm run test:unit`, `npm run test:integration`, `npm run test:coverage`
- `npm run lint` / `npm run lint:fix`
- `npm run format` / `npm run format:check`
- `npm start` sobe em http://localhost:3000

## Regras do projeto

- **TDD sempre.** Qualquer mudança de comportamento começa com um teste que falha. Só depois escreva o código mínimo para passar, e então refatore com os testes verdes.
- Testes com `node:test` e `node:assert/strict`. Não adicione Jest, Mocha ou Supertest.
- Sem dependências de produção. O servidor usa só módulos nativos do Node (`node:http`, `node:fs`).
- `src/dominio/` é puro: nada de HTTP, banco ou `Date` atual escondido. Quem precisa da data recebe por parâmetro (o serviço recebe um `relogio`), para os testes serem determinísticos.
- A idade nunca é armazenada; é calculada na leitura.
- Nomes de código e mensagens em português. Commits no padrão Conventional Commits em português (`feat:`, `test:`, `fix:`, `refactor:`, `chore:`, `build:`, `ci:`, `docs:`).

## Entrega

Quando pedirem para "fazer a entrega" ou "seguir a seção Entrega", execute os passos abaixo em ordem. O código já está pronto e testado: o trabalho aqui é versionar mostrando o ciclo do TDD, abrir o PR e garantir o CI verde. Não reescreva a implementação.

Pergunte ao usuário antes de começar: nome do repositório no GitHub, se será público ou privado, e confirme o nome e e-mail que vão nos commits (`git config user.name` / `user.email`).

### 1. Preparar

1. Confira as ferramentas: `node -v` (22+), `git --version`, `gh auth status`. Se o `gh` não estiver autenticado, peça ao usuário para rodar `gh auth login`. Docker é opcional; se não houver, pule a verificação local da imagem (o CI faz).
2. `npm install` (gera o `package-lock.json`, que o CI precisa).
3. `npm run format` e depois `npm run check`. Se o ESLint apontar algo, corrija sem mudar comportamento e rode de novo até passar.

### 2. Commit inicial na `main`

```bash
git init -b main
git add package.json package-lock.json eslint.config.js .prettierrc.json .prettierignore \
  .editorconfig .gitattributes .gitignore README.md CLAUDE.md
git commit -m "chore: configura projeto com ESLint, Prettier e editorconfig"
gh repo create <NOME> --<public|private> --source=. --remote=origin --push
```

### 3. Branch da funcionalidade e ciclos de TDD

```bash
git switch -c feature/crud-pessoas
```

Para cada linha da tabela, nesta ordem, faça o ciclo red → green:

| # | Teste (red)                        | Implementação (green)                                                             |
| - | ---------------------------------- | --------------------------------------------------------------------------------- |
| 1 | `test/unit/cpf.test.js`            | `src/dominio/cpf.js`                                                              |
| 2 | `test/unit/idade.test.js`          | `src/dominio/idade.js`                                                            |
| 3 | `test/unit/pessoa.test.js`         | `src/dominio/erros.js`, `src/dominio/pessoa.js`                                   |
| 4 | `test/unit/pessoaServico.test.js`  | `src/repositorio/repositorioEmMemoria.js`, `src/servico/pessoaServico.js`         |
| 5 | `test/integration/api.test.js`     | `src/http/app.js`, `src/server.js`, `public/`                                     |

Em cada ciclo:

1. **Red**: tire temporariamente os arquivos da implementação daquele passo do lugar (por exemplo `mv src/dominio/cpf.js /tmp/`), rode só aquele teste (`node --test <arquivo do teste>`) e confirme que **falha**. Mostre ao usuário a saída resumida. Faça o commit só do teste: `test: <o que o teste cobre>`.
2. **Green**: devolva os arquivos ao lugar, rode o mesmo teste e confirme que **passa**. Rode `npm run lint`. Faça o commit da implementação: `feat: <o que foi implementado>`.

Use mensagens específicas, por exemplo `test: validação de CPF pelos dígitos verificadores` e `feat: valida, normaliza e formata CPF`.

### 4. Imagem e CI

1. Se houver Docker: `docker build -t cadastro-pessoas .`, `docker run -d --rm --name cadastro -p 3000:3000 cadastro-pessoas`, `curl -f http://localhost:3000/health`, depois `docker stop cadastro`.
2. `git add Dockerfile .dockerignore && git commit -m "build: imagem Docker da aplicação"`
3. `git add .github && git commit -m "ci: formatação, análise estática, testes e imagem Docker no GitHub Actions"`
4. Confira com `git status` que não sobrou nada fora do controle de versão e que `npm run check` passa.

### 5. Pull request

```bash
git push -u origin feature/crud-pessoas
gh pr create --base main --head feature/crud-pessoas \
  --title "feat: CRUD de pessoas com cálculo de idade" --body-file <arquivo>
```

Monte o corpo a partir de `.github/pull_request_template.md`, preenchendo "O que muda" e marcando no checklist só o que você verificou de fato.

Depois rode `gh pr checks --watch`. Se algum job falhar, corrija na branch com um novo commit (`fix:` ou `ci:`) e espere ficar verde.

**Não faça merge.** Entregue ao usuário o link do PR e o link do repositório, e pergunte se ele quer fazer o merge (o professor pode querer ver o PR aberto).
