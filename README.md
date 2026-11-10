# Amazonas em números

Painel interativo de dados abertos dos **62 municípios do Amazonas**: população, densidade, crescimento, PIB, PIB per capita e perfil produtivo (agropecuária, indústria, serviços e setor público). Tudo vem **ao vivo da API do IBGE**, sem backend próprio.

> Coloque aqui o link do deploy e um print/GIF do mapa.

## O que tem

- **Mapa coroplético próprio** (SVG + `d3-geo`), sem biblioteca de mapas pronta e sem tiles. Classes por quantis, para o mapa não ficar dominado por Manaus.
- **9 indicadores** em 3 grupos, trocáveis com um clique.
- **Ranking** com busca sem acento e ordenação invertida, ligado ao mapa (hover/seleção nos dois sentidos).
- **Comparação** entre dois municípios ou contra a mediana do estado, com gráfico de composição setorial.
- **Estado compartilhável na URL** (`?i=pibPerCapita&m=1301902&c=1302603`).
- **Tema claro/escuro**, navegação por teclado no mapa, `aria-label` em cada município, `prefers-reduced-motion`.
- **Cache de 24 h** no `localStorage`, estados de carregamento e de erro com "tentar de novo".

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · d3-geo / d3-scale / d3-array · Recharts · Vitest

## Rodando

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes (parser do IBGE, derivados, classes, renderização)
npm run build    # produção
```

## Fontes de dados (IBGE)

| Dado | Fonte |
| --- | --- |
| População estimada | Agregado 6579, variável 9324 |
| População e densidade (Censo 2022) | Agregado 4714, variáveis 93 e 614 |
| PIB e valor adicionado por setor | Agregado 5938, variáveis 37, 513, 517, 6575, 525 |
| Municípios e regiões | API de localidades v1 |
| Malha territorial | API de malhas v3 (qualidade mínima) |

PIB per capita = PIB ÷ população do Censo 2022. Crescimento = estimativa mais recente ÷ Censo 2022.

## Estrutura

```
src/
  lib/        ibge.ts (fetch + parsing), indicators.ts, stats.ts, format.ts
  components/ MapView, Ranking, Detail, Kpis
  hooks.ts    dados, tema
```

## Deploy

Site estático: `npm run build` e publique `dist/` na Vercel ou Netlify (framework "Vite").

## Contribuindo

O projeto segue Git Flow (`main` em produção, `develop` para integração). Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE). Os dados exibidos são do IBGE e seguem os termos de uso da fonte.
