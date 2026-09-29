# Testes de Falha

## Caso 1 - Retorno sem cookie temporário

**Preparação:**  
Foi iniciado um fluxo de autenticação com Google em uma janela normal do navegador. A URL de autorização foi copiada e aberta em uma janela anônima, que não possuía o cookie temporário `__Host-oauth-tx`.

**Pedido enviado:**  
Foi concluído o fluxo de autenticação na janela anônima, sem o cookie temporário criado no início da autenticação.

**Resultado esperado:**  
A aplicação deveria recusar o retorno por ausência do cookie `__Host-oauth-tx` e não criar uma sessão autenticada.

**Resultado observado:**  
A aplicação recusou o retorno e nenhuma sessão foi criada.

---

## Caso 2 - State alterado

**Preparação:**  
Foi iniciado um novo fluxo de autenticação e, antes da conclusão do login, um caractere do parâmetro `state` foi alterado.

**Pedido enviado:**  
Foi enviado ao callback um retorno OAuth contendo um valor de `state` diferente daquele originalmente gerado e armazenado pela aplicação.

**Resultado esperado:**  
A aplicação deveria recusar o retorno antes da troca do código de autorização e não criar uma sessão.

**Resultado observado:**  
O retorno com `state` alterado foi recusado e nenhuma nova sessão foi criada.

---

## Caso 3 - Reutilização da transação

**Preparação:**  
Foi realizado um fluxo de autenticação válido. Após a conclusão do login, a URL da requisição de callback foi copiada pelo painel Network das ferramentas de desenvolvimento do navegador.

**Pedido enviado:**  
A mesma URL de callback utilizada anteriormente foi acessada novamente após a conclusão bem-sucedida do fluxo de autenticação.

**Resultado esperado:**  
A aplicação deveria recusar a requisição, pois a transação já havia sido utilizada e removida.

**Resultado observado:**  
A reutilização da transação foi recusada e nenhuma nova sessão foi criada.

---

## Caso 4 - Sessão expirada

**Preparação:**  
Foi criada uma sessão válida. Em seguida, no console do banco D1, o campo `expires_at` das sessões foi alterado para `0`.

**Pedido enviado:**  
Foi realizada uma nova consulta à rota `/api/me` após a expiração forçada da sessão.

**Resultado esperado:**  
A rota `/api/me` deveria responder com HTTP 401, indicando que a sessão não era mais válida.

**Resultado observado:**  
A rota `/api/me` respondeu com HTTP 401 e a sessão deixou de ser reconhecida pela aplicação.

---

## Caso 5 - Origem inválida na saída

**Preparação:**  
Foi mantida uma sessão válida no endereço de produção da aplicação. Em outra aba, foi aberta uma página de origem diferente e realizada uma tentativa de logout a partir dessa origem.

**Pedido enviado:**  
Foi enviado um pedido `POST` para `/oauth/logout` a partir de uma origem diferente de `PUBLIC_BASE_URL`.

**Resultado esperado:**  
A aplicação deveria recusar o logout, pois o cabeçalho `Origin` não correspondia à origem autorizada, mantendo a sessão original ativa.

**Resultado observado:**  
O logout iniciado a partir da origem inválida foi recusado e a sessão original permaneceu válida.

---

## Caso 6 - Reutilização do cookie revogado

**Preparação:**  
Foi criada uma sessão válida e o valor do cookie `__Host-session` foi copiado temporariamente para a realização do teste. Em seguida, foi realizado o logout normalmente.

**Pedido enviado:**  
Após o logout, o valor antigo do cookie foi restaurado no navegador e a rota `/api/me` foi consultada novamente.

**Resultado esperado:**  
A rota `/api/me` deveria responder com HTTP 401, pois a sessão correspondente ao cookie já havia sido removida do banco D1.

**Resultado observado:**  
O cookie antigo não restaurou a sessão e a rota `/api/me` respondeu com HTTP 401.
