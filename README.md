# Dados publicados do painel

Branch mantida automaticamente: **não edite à mão**.

- `municipios.json`: indicadores dos 62 municípios do Amazonas, já validados (`schemaVersion`, `fetchedAt`, `periods`, `municipios`).
- `malha.json`: malha territorial (GeoJSON) pronta para o mapa.

Cada commit aqui é uma atualização dos dados do IBGE que passou em todas as checagens de `src/lib/validate.ts` (branch `develop`). O histórico desta branch é o histórico das atualizações.

O site baixa estes arquivos antes de cada build (`npm run data:pull`).
