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

## Mensagens de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/) com um emoji na frente (no estilo [Gitmoji](https://gitmoji.dev/)):

```
<emoji> <tipo>(<escopo>): <descrição>

[corpo opcional: o porquê da mudança]

[rodapé opcional: BREAKING CHANGE, Closes #12]
```

Exemplos:

```
✨ feat(mapa): adiciona zoom por microrregião
🐛 fix(ibge): usa o último ano com valor adicionado divulgado
📝 docs(readme): adiciona print do painel
🔖 chore(release): v1.0.0
```

### Tipos

| Emoji | Tipo | Quando usar |
| --- | --- | --- |
| ✨ | `feat` | Funcionalidade nova para quem usa o painel |
| 🐛 | `fix` | Correção de bug |
| 🚑️ | `fix` | Correção urgente em produção (dentro de `hotfix/`) |
| 💄 | `style` | Visual: cores, espaçamento, tipografia, layout |
| ♻️ | `refactor` | Mudança de código que não altera comportamento |
| ⚡️ | `perf` | Melhoria de desempenho |
| ✅ | `test` | Testes novos ou ajustados |
| 📝 | `docs` | Documentação (README, CONTRIBUTING, comentários) |
| 📦️ | `build` | Build, dependências, configuração do Vite/TypeScript |
| 👷 | `ci` | Integração contínua (GitHub Actions) |
| 🔧 | `chore` | Manutenção e configuração que não entram nos outros tipos |
| 🔥 | `chore` | Remoção de código ou arquivos |
| 🔖 | `chore` | Commit de versão (`chore(release): vX.Y.Z`) |
| ⏪️ | `revert` | Desfaz um commit anterior |
| 💥 | `<tipo>!` | Mudança que quebra compatibilidade (junto com `BREAKING CHANGE:` no rodapé) |

### Escopos

`mapa`, `ranking`, `detalhe`, `kpis`, `ibge`, `indicadores`, `ui`, `tema`, `deps`, `readme`, `release`. O escopo é opcional quando a mudança é geral.

### Regras

- Descrição em português, no imperativo, com letra minúscula e sem ponto final: "adiciona", não "adicionado" nem "Adicionei".
- Linha de título com até 72 caracteres.
- Um commit por mudança lógica. Se precisa de "e" na descrição, provavelmente são dois commits.
- O corpo explica **por que**, não **o que** (o diff já mostra o quê).

Para ver o modelo ao escrever o commit no editor, rode uma vez:

```bash
git config commit.template .gitmessage
```
