# Fixtures de revisão por IA

Os arquivos desta pasta são exemplos isolados usados para demonstrar a revisão de código na avaliação. Não são importados nem executados pela aplicação.

O exemplo foi inicialmente enviado com concatenação insegura de SQL para testar a revisão por IA. A versão final usa `prepare(...).bind(...)`, que separa os parâmetros da consulta SQL.
