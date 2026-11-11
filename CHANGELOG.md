# Changelog

Mudanças relevantes de cada versão. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem [SemVer](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-11-11

Primeira versão estável: painel no ar, dados do IBGE atualizados toda semana e link pronto para divulgar.

### Adicionado
- Prévia do link ao compartilhar no WhatsApp, LinkedIn e X: título, descrição e imagem com o mapa dos 62 municípios. (#15)

## [0.4.0] - 2026-11-11

Painel redesenhado: uma página que guia quem chega, com gráficos que dão a conclusão de cara.

### Adicionado
- Abertura com busca de município, sugestões e passo a passo de uso; página dividida em capítulos numerados, com menu que acompanha a rolagem.
- Capítulo "Onde vivem as pessoas e onde está a riqueza": título com a conclusão, barras comparando população e PIB (maior município, 4 seguintes e demais), lista dos municípios com as duas fatias (10 maiores ou os 62) e rosquinhas por mesorregião.
- Gráfico de dispersão tamanho × PIB per capita, com filtro por mesorregião.
- Perfil setorial dos 62 municípios: uma coluna por setor, com o valor escrito e a média do estado marcada; ordenável por setor.
- README com tour pelo painel e prints. (#15)

### Alterado
- Nova identidade visual: tipografia Inter Tight + Inter, ícones próprios, favicon e cores dos setores validadas para daltonismo nos temas claro e escuro. (#12)
- A página ocupa até 1600 px de largura.
- Gráficos pesados só carregam quando chegam perto da tela.

### Removido
- Recharts e d3-hierarchy: os gráficos agora são SVG/HTML próprios. O gráfico de detalhe caiu de ~355 kB para ~7 kB. (#14)

## [0.3.0] - 2026-11-10

Transparência: de onde vem e como é calculado cada número, e os dados nas mãos de quem usa o painel.

### Adicionado
- Seção "Sobre os dados": fórmula de cada indicador com tabelas e variáveis do IBGE, ano de referência, fontes com link, como os dados chegam ao site, quando cada dado muda, limitações e licenças. Cada indicador do painel tem um link "Como é calculado" para o trecho correspondente. (#10)
- Download em CSV do ranking atual e da tabela completa dos 62 municípios, no formato do Excel em português. (#11)
- Botão "Compartilhar": menu nativo no celular, cópia do link no computador. (#11)

### Corrigido
- Links com âncora (ex.: `#sobre-pibPerCapita`) abriam no topo da página.

## [0.2.1] - 2026-11-10

### Corrigido
- Deploy disparado logo após uma atualização de dados publicava os dados antigos, por causa do cache de 5 minutos do raw.githubusercontent.com. O build agora baixa os dados pelo commit exato da branch `data`.

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

[1.0.0]: https://github.com/iegosoft/amazonas-dashboard/releases/tag/v1.0.0
[0.4.0]: https://github.com/iegosoft/amazonas-dashboard/releases/tag/v0.4.0
[0.3.0]: https://github.com/iegosoft/amazonas-dashboard/releases/tag/v0.3.0
[0.2.1]: https://github.com/iegosoft/amazonas-dashboard/releases/tag/v0.2.1
[0.2.0]: https://github.com/iegosoft/amazonas-dashboard/releases/tag/v0.2.0
