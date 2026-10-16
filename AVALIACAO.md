# Avaliação: GitHub Actions com IA

Repositório: https://github.com/guirsmachado/oauth-lab-guilherme-machado1  
Pull Request de entrega: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/pull/1

Este relatório distingue evidências já observadas de testes que ainda dependem de configuração externa. Não foram incluídos valores de tokens ou segredos.

## Tarefa 1 — CI a cada commit (2,5 pontos)

Workflow: [ci.yml](.github/workflows/ci.yml)

- [x] Execução verde: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/actions/runs/38914425656
- [x] Execução vermelha proposital: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/actions/runs/38914393803 — foi usada uma falha temporária para demonstrar o CI vermelho; depois a falha foi removida.
- [x] Execução verde posterior: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/actions/runs/38916844881
- [x] O workflow verifica padrões de segredos, aplica todas as migrações SQL em SQLite local e valida arquivos HTML com HTMLHint.
- [ ] Confirmar execução verde da versão mais recente do CI depois das últimas mudanças.

A migração é testada primeiro em SQLite local para detectar erros de sintaxe antes de alterar o D1 remoto, reduzindo o risco para os dados. SQLite local, porém, não substitui o teste final no ambiente D1.

## Tarefa 2 — Proteger a main com o CI (1,5 ponto)

Status check exigido: **verificar**

- [x] A regra de proteção da branch `main` foi configurada para exigir PR e status check `verificar`.
- [ ] Evidência de PR bloqueado por CI vermelho e liberado após correção: pendente.
- [ ] Evidência de tentativa de push direto recusado: pendente.

A regra de branch é separada do workflow. Não foi tentado um push direto na `main`, para evitar uma alteração não intencional na branch principal.

## Tarefa 3 — Revisão de PR por IA (3,5 pontos)

Workflow: [revisao-ia.yml](.github/workflows/revisao-ia.yml)

- [x] Foi publicado um comentário automatizado de análise de segurança no PR: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/pull/1#issuecomment-6217885911
- [x] A análise apontou um risco real de segurança: enviar diff não confiável a um agente com ferramentas e token com permissão de escrita no fallback.
- [x] O workflow foi atualizado para remover o fallback inseguro que executava Copilot CLI com credenciais de escrita e simplificar o uso de `actions/ai-inference@v1`.
- [ ] Confirmar uma execução verde da versão atual e comentário publicado após a atualização.
- [ ] Registrar dois comentários de revisão (antes e depois da correção de SQL vulnerável).
- [ ] Demonstrar e registrar erro de permissão ao remover temporariamente `pull-requests: write`; depois restaurar.
- [ ] Documentar uma afirmação errada ou irrelevante de uma resposta real da IA.

O secret `COPILOT_PAT` foi detectado como presente pelo workflow anterior, mas houve falha do Copilot CLI com código 1. Isso pode decorrer de autenticação, elegibilidade/plano Copilot, permissões ou compatibilidade da CLI; o log disponível não identifica a causa exata. A versão atual deve ser testada antes de considerar a tarefa concluída.

A fixture em `tests/fixtures/` é isolada da aplicação e usa `prepare(...).bind(...)` para ilustrar a forma parametrizada de executar SQL.

## Tarefa 4 — Migrações D1 depois do merge (1,5 ponto)

Workflow: [migrar.yml](.github/workflows/migrar.yml)

- [x] O gatilho está limitado a pushes na `main` que alterem `migrations/**`.
- [x] O workflow está preparado para executar `wrangler d1 migrations apply --remote` e publicar um resumo no `GITHUB_STEP_SUMMARY`.
- [ ] Configurar e confirmar os segredos e variáveis do Cloudflare.
- [ ] Executar após merge de uma alteração em `migrations/` e guardar o link do run.
- [ ] Confirmar no D1 a coluna `sessions.last_seen_at`.
- [ ] Demonstrar que um merge sem alterações em `migrations/` não dispara o workflow.

Configuração necessária em **Settings → Secrets and variables → Actions**:
- Secret `CLOUDFLARE_API_TOKEN`, com permissão D1 Edit.
- Secret `CLOUDFLARE_ACCOUNT_ID`.
- Variable `D1_DATABASE_NAME`, com o nome exato do banco D1.
- Variable `D1_DATABASE_ID`, com o ID do banco D1.
- Secret `COPILOT_PAT`, com permissão Copilot Requests e acesso válido ao Copilot.

Não foi aplicada nenhuma migração remota nesta etapa porque os dados de configuração do D1 ainda precisam ser confirmados e a aplicação remota altera o banco real.

## Perguntas

### 1. Por que o CI roda duas vezes quando há um push numa ramificação com PR aberto? Qual execução conta para a main?

O workflow tem os gatilhos `push` e `pull_request`, então o mesmo commit pode gerar uma execução para o push e outra para o PR. A proteção da `main` verifica o status check exigido no contexto do PR/commit que será integrado.

### 2. Por que um PR de fork não consegue usar `secrets.COPILOT_PAT`? Qual ataque isso impede?

Workflows disparados por `pull_request` de forks normalmente não recebem os segredos do repositório de destino. Isso impede que código não confiável de terceiros roube ou use tokens do proprietário para consumir recursos ou realizar ações privilegiadas.

### 3. Por que declarar `permissions` em vez de usar as permissões padrão do `GITHUB_TOKEN`?

Declarar permissões explicitamente aplica o princípio do menor privilégio e documenta o acesso necessário ao workflow. Isso reduz o impacto de uma eventual exploração e evita conceder permissões desnecessárias.

### 4. A revisão da IA pode substituir o status check da Tarefa 2?

Não. A IA pode interpretar incorretamente o código ou deixar passar falhas, como qualquer ferramenta probabilística. O status check determinístico deve continuar obrigatório; a revisão por IA é complementar e precisa de avaliação humana.

## Observações de segurança

Nunca versionar client secrets, tokens, cookies, códigos de autorização, valores de `state`, `nonce`, `code_verifier` ou `code_challenge`. Não imprimir valores sensíveis nos logs. O diff de um PR deve ser tratado como conteúdo não confiável, e um agente que o analisa não deve receber credenciais de escrita desnecessárias.
