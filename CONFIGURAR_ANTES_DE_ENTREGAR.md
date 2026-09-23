# Configurar antes de entregar

Este repositório contém a implementação das Pages Functions e os arquivos de entrega exigidos pelo roteiro. As partes que dependem das suas contas e da implantação real não podem ser preenchidas com dados inventados.

## 1. GitHub

- mantenha `main` como branch de produção;
- deixe `public/` e `functions/` como pastas irmãs na raiz;
- não adicione `package.json`, `package-lock.json`, `node_modules` nem `wrangler.jsonc`;
- não versione nenhum Client Secret.

## 2. Cloudflare Pages

Configure:

- Framework preset: `None`
- Build command: vazio
- Build output directory: `public`
- Root directory: vazio

Depois confirme `URL_BASE/api/health` retornando HTTP 200.

## 3. D1

Crie `oauth-sessions-EQUIPE` e execute:

```sql
CREATE TABLE oauth_transactions (
  id_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'github')),
  state_hash TEXT NOT NULL,
  nonce TEXT,
  code_verifier TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX oauth_transactions_expiry
  ON oauth_transactions (expires_at);

CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX sessions_expiry
  ON sessions (expires_at);
```

Binding obrigatório: `DB`.

## 4. Google

Cliente OAuth: `Web application`.

Redirect URI: `URL_BASE/oauth/callback/google`

Escopos solicitados pelo código: `openid email profile`.

## 5. GitHub

OAuth App:

- Homepage URL: `URL_BASE`
- Authorization callback URL: `URL_BASE/oauth/callback/github`
- Device Flow: desativado

## 6. Variables and Secrets no Cloudflare Pages

Texto simples:

- `PUBLIC_BASE_URL` = URL pages.dev de produção, sem barra final
- `GOOGLE_CLIENT_ID`
- `GITHUB_CLIENT_ID`

Criptografados:

- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_SECRET`

Faça nova implantação depois de salvar binding, variáveis e segredos.

## 7. Evidências em `public/entrega1`

A pasta deve terminar com exatamente estes oito arquivos:

1. `01-pages-configuracao.pdf` - substituir o modelo por captura(s) saneada(s) mostrando nome do projeto, branch `main` e opções de construção, sem identificadores privados.
2. `02-google-retorno.txt` - trocar `SUBSTITUIR_URL_BASE` pela URL real.
3. `03-github-retorno.txt` - trocar `SUBSTITUIR_URL_BASE` pela URL real.
4. `04-d1-esquema.txt` - conferir no console D1 e manter somente nomes e tipos retornados pela consulta `sqlite_schema`.
5. `05-inicio-login-google.pdf` - substituir o modelo por cabeçalhos saneados do início do login; ocultar cookie, `state` e `code_challenge`.
6. `06-inicio-login-github.pdf` - substituir o modelo por cabeçalhos saneados do início do login; ocultar cookie, `state` e `code_challenge` e confirmar ausência de `nonce` e escopos proibidos.
7. `07-testes-falha.md` - preencher os seis resultados observados após executar os casos.
8. `08-aceitacao.md` - marcar apenas o que foi confirmado e assinar a dupla.

## 8. Segurança

Nunca inclua nos arquivos ou capturas: Client Secret, token, cookie, código de autorização, `state`, `nonce`, `code_verifier` ou `code_challenge` não saneado.
