# WalletNow Protocol — Roadmap Oficial

**Data de Atualização:** Setembro de 2026  
**Versão Corrente:** `v0.4.5-candidate`  

## Visão Geral
O **WalletNow** é o Sistema Operacional Financeiro (*Financial OS*) para a rede Stellar. Ele provê infraestrutura de abstração total para desenvolvedores e empresas: onboarding biométrico com Passkeys (WebAuthn), patrocínio nativo de taxas e reservas (Gasless), liquidação instantânea via Pix, integração com Ativos do Mundo Real (RWA) e suporte aos padrões oficiais da Stellar (SEPs 01, 10 e 24).

---

## 🏁 Marco 1: Foundation Baseline (`v0.2.0-alpha-foundation`) — ✅ CONCLUÍDO
- [x] Estabelecimento do Blueprint Arquitetural (ADR-000) e Clean Architecture.
- [x] Configuração da estrutura de Monorepo com NPM Workspaces e compilação modular.
- [x] Isolamento do Core Kernel, Registry de Plugins e State Machine de ciclo de vida.
- [x] Barramento de eventos assíncrono tipado (`EventEmitter`).
- [x] Resolução de todas as dependências circulares e padronização em ESM strict mode.

## 🏁 Marco 2: Abstração de Onboarding & Gasless (`v0.3.0-alpha`) — ✅ CONCLUÍDO
- [x] Implementação do Provider oficial da Stellar Network.
- [x] Desenvolvimento do motor de Passkeys (WebAuthn) sem necessidade de memorizar sementes mnemônicas.
- [x] Gasless Sponsorship Engine: patrocínio automático de taxas de criação de conta e reservas de trustlines via CAP-33.
- [x] Conciliação instantânea Pix-to-Stablecoin integrada ao fluxo de carteira.
- [x] Demonstração End-to-End da experiência Web2 com liquidação na Stellar.

## 🏁 Marco 3: SEPs, TestnetKit & Auditoria de Segurança (`v0.4.0-alpha`) — ✅ CONCLUÍDO
- [x] **Stellar SEPs Integration**:
  - Clientes transparentes para SEP-01 (`stellar.toml`), SEP-10 (WebAuth) e SEP-24 (Interactive Deposit/Withdraw).
- [x] **TestnetKit Developer Sandbox**:
  - Sandbox interativa em `/docs/testnet-kit` com geração de carteira em 1 clique, Faucet automatizado e monitor de latência.
  - Pools de liquidez AMM descentralizadas com algoritmo de produto constante ($X \times Y = K$).
- [x] **Módulo de NFT (`@walletnow/nft`)** e cotas de rendimento proporcional em Vaults DeFi (Defindex).
- [x] **Auditoria Adversarial v2.0**:
  - Remediações completas de segurança: Row Level Security (RLS) no Supabase, hashes SHA3-256 para LGPD e sanitização de logs.
- [x] **AI Agent Workspace Skills**:
  - Configuração do assistente e skills em `.agents/skills/walletnow`.

## 🚀 Marco 4: Follow-On InstaAward & Hackathon 2026 (`v0.4.5-candidate`) — ⚡ ATIVO (Setembro/2026)
- [x] Formalização da proposta de Follow-On Grant no programa InstaAwards (`INSTAWARD_WALLETNOW.md`).
- [x] Consolidação do Pitch de 5 minutos e Quality Gates atualizados em `HACKATHON_READINESS.md`.
- [x] Enriquecimento do código-fonte com TSDoc/JSDoc detalhado nos 13 pacotes do monorepo e serviços de frontend.
- [x] Suporte multilíngue completo (PT/EN) no Developer Portal (`src/i18n/docsTranslations.ts`).
- [ ] Validação de novos tutoriais de integração de builders da comunidade Stellar.

## 🔮 Marco 5: Produção & Distribuição Global (`v1.0.0-GA`)
- [ ] Publicação das versões finais no registro público do NPM (`@walletnow/sdk` e sub-pacotes).
- [ ] Deploy de contratos inteligentes Soroban compilados e verificados para automação de colateral.
- [ ] Infraestrutura de nós RPC privados de alta performance para a Mainnet da Stellar.
- [ ] Integração expandida de Ativos do Mundo Real (RWA) regulados multi-jurisdição.
