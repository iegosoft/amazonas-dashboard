# Amazonas em números

[![CI](https://github.com/iegosoft/amazonas-dashboard/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/iegosoft/amazonas-dashboard/actions/workflows/ci.yml)

Painel interativo de dados abertos dos **62 municípios do Amazonas**: população, densidade, crescimento, PIB, PIB per capita e perfil produtivo (agropecuária, indústria, serviços e setor público). Os dados vêm da **API do IBGE**, são **validados antes de publicar** e servidos pelo próprio site, sem backend: se a API do IBGE cair, o painel continua no ar.

> Coloque aqui o link do deploy e um print/GIF do mapa.

## O que tem

- **Mapa coroplético próprio** (SVG + `d3-geo`), sem biblioteca de mapas pronta e sem tiles. Classes por quantis, para o mapa não ficar dominado por Manaus.
- **9 indicadores** em 3 grupos, trocáveis com um clique.
- **Ranking** com busca sem acento e ordenação invertida, ligado ao mapa (hover/seleção nos dois sentidos).
- **Comparação** entre dois municípios ou contra a mediana do estado, com gráfico de composição setorial.
- **Estado compartilhável na URL** (`?i=pibPerCapita&m=1301902&c=1302603`).
- **Tema claro/escuro**, navegação por teclado no mapa, `aria-label` em cada município, `prefers-reduced-motion`.
- **Dados validados e servidos pelo próprio site**, com estados de carregamento e de erro com "tentar de novo".

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · d3-geo / d3-scale / d3-array · Recharts · Vitest

## Rodando

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes (parser do IBGE, validação, derivados, renderização)
npm run build    # produção
npm run data     # coleta e valida os dados direto do IBGE em public/data/
```

`npm run dev` e `npm run build` baixam antes os dados publicados (`npm run data:pull`). Sem internet, usam o que já estiver em `public/data/`.

## Como os dados chegam ao site

```
IBGE ──npm run data──▶ validação ──▶ branch `data` ──npm run data:pull──▶ public/data/ ──▶ site
```

- `npm run data` coleta e valida; só grava se tudo passar.
- A branch [`data`](../../tree/data) guarda os dados publicados; cada commit nela é uma atualização.
- Antes de `dev`/`build`, `npm run data:pull` baixa da branch `data`, valida de novo e grava em `public/data/`. Se o download falhar, mantém os dados locais; sem dados locais, o build falha (o site nunca é publicado vazio).
- O navegador só lê `/data/municipios.json` e `/data/malha.json`; nunca chama o IBGE.
- **Atualização automática:** toda segunda-feira o workflow [Atualização dos dados](.github/workflows/dados.yml) coleta e valida. Se os dados mudaram, publica na branch `data` e dispara o deploy; se algo falhar, nada é publicado e uma issue com label `dados` é aberta.

## Fontes de dados (IBGE)

| Dado | Fonte |
| --- | --- |
| População estimada | Agregado 6579, variável 9324 |
| População e densidade (Censo 2022) | Agregado 4714, variáveis 93 e 614 |
| PIB e valor adicionado por setor | Agregado 5938, variáveis 37, 513, 517, 6575, 525 |
| Municípios e regiões | API de localidades v1 |
| Malha territorial | API de malhas v3 (qualidade mínima) |

PIB per capita = PIB ÷ população do Censo 2022. Crescimento = estimativa mais recente ÷ Censo 2022.

### Validação

`npm run data` só grava os arquivos se os dados passarem em todas as checagens (`src/lib/validate.ts`); caso contrário, sai com erro e mantém os anteriores:

- formato das respostas do IBGE (variáveis presentes, 62 municípios por série);
- 62 municípios com código `13xxxxx`, cada um com geometria no mapa;
- população, Censo, densidade e PIB presentes e positivos em todos;
- participações setoriais somando 100%;
- população total do estado numa faixa plausível;
- em relação à coleta anterior: nenhum ano volta no tempo, nenhum município muda mais de 20% de população e o PIB do estado não muda mais de 40%.

## Estrutura

```
scripts/      fetch-data.ts (coleta + validação), pull-data.ts (baixa os dados publicados)
src/
  lib/        ibge.ts (fetch + parsing), validate.ts, data.ts (carrega os dados no site), indicators.ts, stats.ts, format.ts
  components/ MapView, Ranking, Detail, Kpis
  hooks.ts    dados, tema
```

## Deploy

Site estático: `npm run build` e publique `dist/` na Vercel ou Netlify (framework "Vite").

## Contribuindo

O projeto segue Git Flow (`main` em produção, `develop` para integração) e Conventional Commits com emoji (`✨ feat(mapa): ...`). Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE). Os dados exibidos são do IBGE e seguem os termos de uso da fonte.
