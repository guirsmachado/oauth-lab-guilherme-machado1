# Avaliação: GitHub Actions com IA

Repositório: https://github.com/guirsmachado/oauth-lab-guilherme-machado1

> **Importante:** este arquivo é um relatório de entrega a completar com evidências reais. Não marque como concluído nem invente links de execuções. Os testes dependentes de segredos, configurações e implantação precisam ser realizados no GitHub/Cloudflare.

## Tarefa 1 — CI a cada commit (2,5 pontos)

Workflow: [ci.yml](.github/workflows/ci.yml)

- [ ] Execução verde: COLOCAR_LINK_DA_EXECUCAO_VERDE
- [ ] Execução vermelha proposital e linha de log: COLOCAR_LINK_DA_EXECUCAO_VERMELHA_E_ERRO
- [ ] Execução verde após corrigir: COLOCAR_LINK_DA_EXECUCAO_CORRIGIDA

A migração é testada primeiro em SQLite local porque isso permite detectar erros de sintaxe e incompatibilidades básicas antes de alterar o banco D1 remoto, sem arriscar os dados de produção. O teste local não substitui uma validação específica do ambiente D1.

## Tarefa 2 — Proteger a main com o CI (1,5 ponto)

Workflow: status check **verificar**

- [ ] PR bloqueado pelo status check verificar: COLOCAR_LINK_DO_PR_BLOQUEADO
- [ ] PR liberado após correção: COLOCAR_LINK_DO_PR_LIBERADO
- [ ] Saída do push direto recusado: REGISTRAR_AQUI

Configuração necessária: criar uma regra para main que exija pull request e o status check verificar. A regra é uma configuração do GitHub e não é ativada apenas pela existência do workflow.

## Tarefa 3 — Revisão de PR por IA (3,5 pontos)

Workflow: [revisao-ia.yml](.github/workflows/revisao-ia.yml)

- [ ] PR com SQL vulnerável e comentário da IA: COLOCAR_LINK_DO_PR
- [ ] Comentário da IA após corrigir para prepare(...).bind(...): COLOCAR_LINK_DO_PR_ATUALIZADO
- [ ] Log do teste sem a permissão pull-requests: write: COLOCAR_LINK_DA_EXECUCAO_COM_ERRO
- [ ] Evidência após restaurar a permissão: COLOCAR_LINK_DA_EXECUCAO

Crítica à IA (preencher após observar a resposta real):  
**Afirmação incorreta ou irrelevante:** PREENCHER COM UMA AFIRMACAO REAL.  
**Por que está errada/irrelevante:** EXPLICAR COM BASE NO CÓDIGO E NO RESULTADO OBSERVADO.

## Tarefa 4 — Migrações D1 depois do merge (1,5 ponto)

Workflow: [migrar.yml](.github/workflows/migrar.yml)

- [ ] Merge com alteração em migrations/ e execução do workflow: COLOCAR_LINK_DA_EXECUCAO
- [ ] Saída real de PRAGMA table_info(...) ou consulta equivalente que confirme a mudança: COLOCAR_EVIDENCIA
- [ ] Merge sem alteração em migrations/ e evidência de que o workflow não rodou: COLOCAR_EVIDENCIA

Configuração necessária: definir a variável de repositório D1_DATABASE_NAME com o nome real do banco D1, além dos segredos CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID e COPILOT_PAT. O token Cloudflare precisa ter permissão de edição do D1.

## Perguntas

### 1. Por que o CI roda duas vezes quando há um push numa ramificação com PR aberto? Qual execução conta para a main?

O workflow tem dois gatilhos: push e pull_request. Por isso, o push pode iniciar uma execução para o commit da ramificação e outra para o evento do PR; para liberar o merge, a regra de proteção considera o status check exigido no contexto do PR/commit de merge, conforme a configuração da regra.

### 2. Por que um PR de fork não consegue usar secrets.COPILOT_PAT? Qual ataque isso impede?

Por segurança, o GitHub não disponibiliza normalmente os segredos do repositório de destino para workflows de pull_request originados de forks. Isso reduz o risco de código malicioso enviado por alguém de fora usar o token para consumir recursos ou agir com as permissões da conta proprietária.

### 3. Por que declarar permissions em vez de usar as permissões padrão do GITHUB_TOKEN?

Declarar permissões explicitamente aplica o princípio do menor privilégio e deixa claro que o workflow só precisa ler o conteúdo e, na revisão por IA, escrever comentários nos PRs. Isso evita depender de permissões padrão que podem variar conforme as configurações do repositório ou da organização.

### 4. A revisão da IA pode substituir o status check da Tarefa 2?

Não. A revisão da IA produz comentários e pode errar ou deixar passar problemas; ela não é uma validação determinística. O status check verificar deve continuar sendo obrigatório na regra da main, enquanto a revisão por IA serve como apoio para análise humana.

## Configuração necessária no GitHub

Em **Settings → Secrets and variables → Actions**, cadastrar:
- Secret COPILOT_PAT (token com Copilot Requests, conforme a avaliação).
- Secret CLOUDFLARE_API_TOKEN (permissão D1 Edit).
- Secret CLOUDFLARE_ACCOUNT_ID.
- Variable D1_DATABASE_NAME (nome real do banco D1).

Em **Settings → Actions → General**, confirmar que GitHub Actions está habilitado.

Em **Settings → Rules → Rulesets** ou **Settings → Branches**, configurar proteção de main, exigir pull request e exigir o status check verificar.

## Observações de segurança

Nunca commitar Client Secrets, tokens, cookies, códigos de autorização, valores de state, nonce, code_verifier ou code_challenge. Não usar segredos reais nos testes de falha nem imprimir valores sensíveis nos logs.
