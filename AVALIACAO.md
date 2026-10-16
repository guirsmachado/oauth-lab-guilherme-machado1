# Avaliação: GitHub Actions com IA

Repositório: https://github.com/guirsmachado/oauth-lab-guilherme-machado1

Este relatório registra apenas evidências observadas. Os itens que dependem de uma resposta real da IA, de proteção testada no PR ou de acesso ao Cloudflare D1 continuam pendentes.

## Tarefa 1 — CI a cada commit (2,5 pontos)

Workflow: [ci.yml](.github/workflows/ci.yml)

- [x] Execução verde: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/actions/runs/38914425656
- [x] Execução vermelha proposital: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/actions/runs/38914393803 — o passo temporário executou `exit 1`; depois ele foi removido.
- [x] Execução verde após remover a falha temporária: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/actions/runs/38914425656
- [x] Outra execução verde observada: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/actions/runs/38916844881

A migração é testada primeiro em SQLite local porque isso permite detectar erros de sintaxe e incompatibilidades básicas antes de alterar o banco D1 remoto, sem arriscar os dados de produção. O teste local não substitui uma validação específica do ambiente D1.

Observação: o CI foi aprimorado depois da execução 38916844881 para ampliar a busca por possíveis segredos. A versão mais recente do workflow ainda precisa de uma execução verde confirmada.

## Tarefa 2 — Proteger a main com o CI (1,5 ponto)

Workflow: status check **verificar**

- [x] Regra de proteção da `main` configurada pelo usuário para exigir PR e status check `verificar`.
- [ ] Evidência de PR bloqueado pelo status check: pendente.
- [ ] Evidência do mesmo PR liberado depois da correção: pendente.
- [ ] Saída de tentativa de push direto recusado: pendente; não foi executado para evitar tentar alterar diretamente a branch principal.

A existência do workflow não ativa a proteção por si só; a regra de branch é uma configuração separada do GitHub.

## Tarefa 3 — Revisão de PR por IA (3,5 pontos)

Workflow: [revisao-ia.yml](.github/workflows/revisao-ia.yml)

- [ ] Comentário da IA identificando a consulta SQL vulnerável: pendente. Execução observada: https://github.com/guirsmachado/oauth-lab-guilherme-machado1/actions/runs/38916844994 — a etapa `actions/ai-inference@v3` falhou com `Copilot CLI exited with code 1`, então nenhum comentário foi publicado.
- [ ] Novo comentário da IA após corrigir a consulta para `prepare(...).bind(...)`: pendente.
- [ ] Log de falha sem `pull-requests: write`: pendente.
- [ ] Evidência após restaurar a permissão: pendente.
- [ ] Crítica baseada em uma resposta real da IA: pendente, pois ainda não houve resposta publicada para avaliar.

O secret `COPILOT_PAT` está presente no ambiente do workflow (a etapa de verificação passou), mas a execução de Copilot CLI falhou. O workflow foi atualizado para `actions/ai-inference@v3`, e a permissão `copilot-requests: write` foi adicionada; ainda é necessário confirmar uma execução bem-sucedida após essas alterações.

A fixture de teste está na pasta `tests/fixtures/` e foi corrigida para usar parâmetros vinculados. Ela não é importada nem executada pela aplicação.

## Tarefa 4 — Migrações D1 depois do merge (1,5 ponto)

Workflow: [migrar.yml](.github/workflows/migrar.yml)

- [ ] Execução após merge com alteração em `migrations/`: pendente.
- [ ] Saída real de `PRAGMA table_info(sessions)` confirmando `last_seen_at`: pendente.
- [ ] Evidência de que um merge sem alteração em `migrations/` não dispara o workflow: pendente.
- [ ] Resumo de IA no `$GITHUB_STEP_SUMMARY`: pendente.

O PR ainda não foi integrado à `main`. Não foi executada migração remota, pois isso alteraria o banco D1 real e ainda falta confirmar a configuração final do banco e validar o workflow de IA.

Configuração necessária em **Settings → Secrets and variables → Actions**:
- Secret `CLOUDFLARE_API_TOKEN` com permissão D1 Edit.
- Secret `CLOUDFLARE_ACCOUNT_ID`.
- Variable `D1_DATABASE_NAME` com o nome exato do banco.
- Variable `D1_DATABASE_ID` com o ID do banco.
- Secret `COPILOT_PAT` com permissão Copilot Requests, válido e autorizado para usar o Copilot CLI.

## Perguntas

### 1. Por que o CI roda duas vezes quando há um push numa ramificação com PR aberto? Qual execução conta para a main?

O workflow tem dois gatilhos: `push` e `pull_request`. Por isso, o push pode iniciar uma execução para a ramificação e outra para o evento do PR; a regra de proteção considera o status check exigido no contexto do commit/PR que será integrado.

### 2. Por que um PR de fork não consegue usar `secrets.COPILOT_PAT`? Qual ataque isso impede?

Por segurança, os workflows de `pull_request` originados de forks normalmente não recebem os segredos do repositório de destino. Isso impede que código não confiável de um colaborador externo use o token do proprietário para consumir recursos ou realizar ações privilegiadas.

### 3. Por que declarar `permissions` em vez de usar as permissões padrão do `GITHUB_TOKEN`?

Declarar permissões explicitamente aplica o princípio do menor privilégio e documenta o acesso que cada workflow precisa. Isso reduz o risco de conceder permissões desnecessárias e evita depender de configurações padrão que podem variar.

### 4. A revisão da IA pode substituir o status check da Tarefa 2?

Não. A revisão da IA é auxiliar e pode errar ou deixar passar problemas; não é uma validação determinística. O status check `verificar` deve continuar obrigatório na proteção da `main`, enquanto a revisão da IA apoia a análise humana.

## Observações de segurança

Nunca versionar Client Secrets, tokens, cookies, códigos de autorização, valores de `state`, `nonce`, `code_verifier` ou `code_challenge`. Nunca imprimir valores sensíveis nos logs.
