# Testes de falha

> Preencha **Resultado observado** somente depois de executar cada caso na implantação de produção. Não registre cookies, códigos, tokens, `state`, `nonce` ou `code_challenge`.

## Caso 1 - retorno sem cookie temporário

**Preparação:** iniciar o login em uma janela comum, parar na página do provedor e abrir a autorização em uma janela privativa sem `__Host-oauth-tx`.

**Pedido enviado:** concluir o login na janela privativa e permitir o retorno para `/oauth/callback/{provider}`.

**Resultado esperado:** a rota de retorno recusa a resposta e nenhuma sessão é criada.

**Resultado observado:** PREENCHER APÓS O TESTE.

## Caso 2 - state alterado

**Preparação:** iniciar um novo login e parar na página do provedor antes de fornecer as credenciais.

**Pedido enviado:** alterar um único caractere do parâmetro `state` na barra de endereço e prosseguir, sem salvar a URL modificada.

**Resultado esperado:** a rota de retorno recusa a resposta antes da troca do código.

**Resultado observado:** PREENCHER APÓS O TESTE.

## Caso 3 - reutilização da transação

**Preparação:** concluir um login com sucesso e localizar a requisição de retorno no painel Network.

**Pedido enviado:** usar `Copy URL` e abrir novamente a mesma URL de retorno.

**Resultado esperado:** a repetição falha porque a transação já foi removida.

**Resultado observado:** PREENCHER APÓS O TESTE.

## Caso 4 - sessão expirada

**Preparação:** criar uma sessão de teste e, no console D1, executar `UPDATE sessions SET expires_at = 0;`.

**Pedido enviado:** recarregar a página e consultar `/api/me`.

**Resultado esperado:** `/api/me` responde 401.

**Resultado observado:** PREENCHER APÓS O TESTE.

## Caso 5 - origem inválida na saída

**Preparação:** manter uma sessão válida em `URL_BASE` e abrir outra origem, como `https://example.com`.

**Pedido enviado:** executar `fetch("URL_BASE/oauth/logout", { method: "POST", credentials: "include" });` no console da outra origem.

**Resultado esperado:** a rota recusa a operação e a sessão original permanece válida.

**Resultado observado:** PREENCHER APÓS O TESTE.

## Caso 6 - reutilização do cookie revogado

**Preparação:** em uma sessão exclusiva do laboratório, copiar temporariamente o valor do cookie `__Host-session` apenas para realizar o teste.

**Pedido enviado:** executar logout, restaurar temporariamente o mesmo valor e consultar `/api/me`.

**Resultado esperado:** `/api/me` responde 401 porque a linha da sessão foi removida do D1.

**Resultado observado:** PREENCHER APÓS O TESTE.
