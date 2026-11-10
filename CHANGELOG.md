# Changelog

Mudanças relevantes de cada versão. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem [SemVer](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-11-10

Base confiável: dados validados antes de publicar, atualizados automaticamente e site que não depende do IBGE no ar.

### Adicionado
- Coleta e validação dos dados do IBGE fora do navegador (`npm run data`), com checagens de formato da API, integridade dos 62 municípios e comparação com a coleta anterior. Dados inválidos nunca são gravados. (#5)
- Atualização automática semanal: publica na branch `data` e dispara o deploy quando há dados novos; abre uma issue de alerta quando falha. (#7)
- Proxy em São Paulo (`api/ibge.ts`) para a coleta automática, porque o IBGE recusa conexões de fora do Brasil. (#20)
- Data de atualização, fonte (com link para o SIDRA) e ano de referência de cada indicador, com aviso quando um número combina anos diferentes. (#8)
- Error Boundary: falha em um bloco (mapa, detalhes, ranking) não derruba a página. (#9)
- CI no GitHub Actions: lint, testes e build em todo push e PR. (#4)

### Alterado
- O site lê os dados validados servidos por ele mesmo, em vez de chamar a API do IBGE no navegador. (#6)
- Comparação deixa explícito quando usa a mediana dos municípios e quando usa o estado inteiro; micro e mesorregião aparecem nomeadas. (#2)

### Corrigido
- Mapa aparecia como um retângulo (sentido dos polígonos da malha do IBGE).
- Perfil econômico vazio: o IBGE publica o PIB total antes da divisão por setor; agora usa o último ano disponível.
- "Tentar de novo" não limpava o cache. (#1)
- Seletor de comparação cortava o texto.

### Removido
- Arquivos que sobraram do template do Vite. (#3)

[0.2.0]: https://github.com/iegosoft/amazonas-dashboard/releases/tag/v0.2.0
