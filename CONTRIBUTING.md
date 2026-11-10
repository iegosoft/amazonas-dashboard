# Como contribuir

Este projeto usa **[Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)** para organizar branches e versões.

## Branches

| Branch | Para quê | Sai de | Volta para |
| --- | --- | --- | --- |
| `main` | Código em produção. Cada commit aqui é uma versão publicada e tem tag. | — | — |
| `develop` | Integração do que vai entrar na próxima versão. É a branch padrão do repositório. | — | — |
| `feature/<nome>` | Uma funcionalidade ou melhoria nova. | `develop` | `develop` |
| `bugfix/<nome>` | Correção de bug que ainda não está em produção. | `develop` | `develop` |
| `release/<versão>` | Preparação de uma versão: ajustes finais, número de versão, changelog. | `develop` | `main` e `develop` |
| `hotfix/<versão>` | Correção urgente de algo que já está em produção. | `main` | `main` e `develop` |

Regras:

- **Ninguém faz commit direto em `main` ou `develop`.** Todo trabalho começa numa branch de apoio.
- Nomes em minúsculas, com hífen: `feature/serie-historica`, `bugfix/legenda-mapa`.
- Antes de terminar qualquer branch, `npm test`, `npm run lint` e `npm run build` precisam passar.

## Comandos

O projeto usa a extensão [git-flow AVH](https://github.com/petervanderdoes/gitflow-avh), que já vem com o Git for Windows.

Depois de clonar, configure uma vez:

```bash
git flow init -d
git config gitflow.prefix.versiontag v
```

### Funcionalidade nova

```bash
git flow feature start serie-historica
# ... commits ...
git flow feature publish serie-historica   # opcional: envia para o GitHub e abre PR para develop
git flow feature finish serie-historica    # junta em develop e apaga a branch
git push origin develop
```

`bugfix` funciona igual: `git flow bugfix start <nome>` / `finish`.

### Lançar uma versão

```bash
git flow release start 1.1.0
# atualize "version" no package.json e o CHANGELOG
git flow release finish 1.1.0              # junta em main e develop e cria a tag v1.1.0
git push origin main develop --tags
```

### Correção urgente em produção

```bash
git flow hotfix start 1.1.1
# ... correção ...
git flow hotfix finish 1.1.1
git push origin main develop --tags
```

## Versionamento

Seguimos [SemVer](https://semver.org/lang/pt-BR/) (`MAJOR.MINOR.PATCH`) com tags `vX.Y.Z` em `main`:

- **PATCH** (`1.0.1`): correção de bug, normalmente via `hotfix`.
- **MINOR** (`1.1.0`): funcionalidade nova compatível, via `release`.
- **MAJOR** (`2.0.0`): mudança que quebra algo existente (ex.: formato da URL compartilhável).
