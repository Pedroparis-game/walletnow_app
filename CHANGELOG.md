# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0-alpha-foundation] - 2026-06-22

### Added
- Documentação `ROADMAP.md`, `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`.
- `CHANGELOG.md` no formato Keep a Changelog.
- Configuração de `npm workspaces` na raiz.
- Arquivos base `tsup.config.ts` e `tsconfig.json` para todos os pacotes do protocolo.

### Changed
- Refatoração estrutural completa para remover dependências circulares.
- O contexto foi isolado em `core/src/public/context/index.ts`.
- Padronizados os imports/exports públicos usando ESM strict mode (`type: module`).

### Removed
- Códigos mortos, TODOs sem escopo e arquivos vazios do repositório.

## [0.1.0] - 2026-06-15
### Added
- Blueprint Arquitetural (ADR-000).
- Estruturas base do WalletNow Protocol.
- Definições da State Machine do Kernel e tipos Core.
