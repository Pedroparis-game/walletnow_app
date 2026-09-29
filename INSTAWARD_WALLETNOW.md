# INSTAWARDS SOW — WALLETNOW (FOLLOW-ON GRANT)

**[en]**
## 1. Project & Team Information
**Project Name:** WalletNow Protocol & SDK — The Financial Operating System for Stellar.  
**Team:** NSD Team (Solo Developer / Architect).  
**Primary Contacts:**  
- Douglas Alexandre (Founder / Core Developer) [nsd.douglas@gmail.com].  

**Ambassador Chapter:** Rio de Janeiro.  
**Application Type:** Follow-On InstaAward (Expansion, Developer Tooling & SDK Stabilization).  
**Submission Date:** 29/09/2026.  
**Live Production URL:** [https://nsdbr.com/walletnow/](https://nsdbr.com/walletnow/)  
**Interactive Developer Portal:** [https://nsdbr.com/walletnow/docs](https://nsdbr.com/walletnow/docs)  
**Public Repository:** [https://github.com/nsdBRoficial/walletnow_app](https://github.com/nsdBRoficial/walletnow_app)  

---

## 2. Executive Summary & Context of the Follow-On Request

In our initial InstaAward grant, WalletNow successfully delivered and validated its core MVP: zero-gas biometric onboarding via Passkeys (WebAuthn), sponsored Stellar reserve management, and instant Pix fiat-to-stablecoin settlement.

Following the success of that first phase, we have significantly expanded the protocol's architecture into a **full-fledged Financial Operating System (WalletNow OS)** and an open developer ecosystem for Stellar builders. 

This **Follow-On InstaAward** request focuses exclusively on the major milestones that have been engineered and are now ready, which were **not** part of the original MVP grant:
1. **Interactive Developer Portal & Documentation Engine** (`/docs`): Full multilingual (EN/PT) interactive documentation with live sandbox components, architecture blueprints, and AI agent integration guides.
2. **Decoupled Modular SDK (`@walletnow/sdk`)**: A monorepo architecture featuring 13 independent packages (`@walletnow/core`, `@walletnow/crypto`, `@walletnow/contracts`, `@walletnow/identity`, `@walletnow/onboarding`, `@walletnow/providers`, `@walletnow/nft`, `@walletnow/storage`, etc.), eliminating circular dependencies and isolating the core blockchain logic.
3. **TestnetKit (Live Sandbox Infrastructure)**: A developer playground featuring one-click ephemeral wallet creation, an automated testnet faucet, constant-product AMM liquidity pools ($X \times Y = K$), real-time latency diagnostics, and live SEP-01, SEP-10, and SEP-24 test anchor integration.
4. **Adversarial Security Audit v2.0 & Hardening**: Complete security refactoring, zero-regression test harness (Vitest + strict TypeScript), SHA3-256 cryptographic commitments for user privacy (LGPD/GDPR), and Supabase enterprise RLS policies.

---

## 3. Comparative Matrix: Initial Grant vs. Follow-On Material

| Feature / Dimension | Initial InstaAward (Delivered) | Follow-On Scope (New Material Ready) |
|---|---|---|
| **Scope Type** | Consumer MVP Application | Modular Open-Source Protocol & Developer SDK |
| **Architecture** | Single-app monolithic scaffolding | 13-Package Monorepo with strict clean architecture |
| **Documentation** | Basic README and deployment notes | Interactive Developer Portal (`/docs`), i18n, runnable examples |
| **Testing Sandbox** | Manual testnet operations | **TestnetKit**: Automated 1-Click Faucet, AMM DEX & Latency Suite |
| **Stellar SEPs** | Basic asset trustlines | Invisible client abstraction for **SEP-01**, **SEP-10**, and **SEP-24** |
| **DeFi & RWA** | Static asset display | Soroswap AMM integration, Defindex Yield Vaults, and Etherfuse RWA |
| **Security Status** | Initial prototype | Remediated through Adversarial Security Audit v2.0 |
| **AI Integration** | None | Native Workspace Skills (`.agents/skills/walletnow`) and Agent prompt kit |

---

## 4. Scope of Work & Deliverables for Follow-On

The requested Follow-On support will fund the stabilization, documentation completion, and official public package distribution:

1. **Deliverable 1 — SDK Stabilization & Multi-Target NPM Distribution**:
   - Finalize build pipelines (`tsup`, ESM/CJS dual export, strict `.d.ts` type declarations) for `@walletnow/sdk` and its sub-packages.
   - Comprehensive test suite expansion (>80% unit test coverage across `@walletnow/core`, `@walletnow/crypto`, and `@walletnow/identity`).
2. **Deliverable 2 — TestnetKit Developer Tooling Expansion**:
   - Public release and enhancement of the interactive sandbox at `/docs/testnet-kit`.
   - Native simulation tools for Stellar builders to test SEP-24 interactive deposits and anchor transactions in a zero-risk sandbox.
3. **Deliverable 3 — Developer Portal & OSS Integration Guides**:
   - Interactive SDK Playground with code snippets for React, Next.js, and Node.js.
   - In-depth documentation of Soroban smart contract bindings and Soroswap liquidity aggregation.
4. **Deliverable 4 — Production Hardening & Security Audit Documentation**:
   - Maintenance of zero-regression CI/CD workflows.
   - Public documentation of security controls, cryptographic key derivation, and rate-limiting safeguards.

---

## 5. Execution Plan & Timeline (30 Days)

- **Week 1 (SDK Finalization & Packaging)**:
  - Harmonize TSDoc across all 13 packages.
  - Finalize `@walletnow/sdk` exports and automated type checking.
  - Package integrity validation via automated CI test workflows.
- **Week 2 (TestnetKit Sandbox & SEP Tooling)**:
  - Polish the interactive TestnetKit UI (`src/pages/docs/pages/TestnetKit.tsx`).
  - Implement expanded SEP-24 interactive anchor mock flows and transaction latency telemetries.
- **Week 3 (Developer Documentation & Guides)**:
  - Expand the interactive documentation at `/docs` with step-by-step guides for Passkeys, Gasless sponsorship, and AMM swaps.
  - Complete the Portuguese and English localization tables (`src/i18n/docsTranslations.ts`).
- **Week 4 (Public Community Release & Verification)**:
  - Deploy the updated portal and TestnetKit to production.
  - Publish public npm package candidates and verify real-world dApp onboarding in example projects (`examples/basic/`).
  - Submit the final verification report to the Stellar Community Fund / InstaAward committee.

---

## 6. Verifiable Evidence of Completion

- **Evidence 1 (Repository & Code Quality)**: Clean monorepo build passing `tsc --noEmit` and Vitest test suites with extensive TSDoc annotations.
- **Evidence 2 (Live Sandbox Demo)**: Functional TestnetKit accessible at [https://nsdbr.com/walletnow/docs/testnet-kit](https://nsdbr.com/walletnow/docs/testnet-kit) with working Stellar Testnet transactions, AMM swaps, and real-time explorer links.
- **Evidence 3 (Developer Portal)**: Fully operational documentation system covering SDK installation, quickstarts, and architectural principles.
- **Evidence 4 (On-Chain Proof)**: Verified testnet transaction hashes showing automated account creation, sponsored trustlines, and SEP-24 deposit simulations on [Stellar.expert](https://stellar.expert).

---

## 7. Budget & Rationale

**Requested Amount:** $5,000 USD (Follow-On Grant).  
**Rationale:** Dedicated engineering hours for open-source developer tooling, maintenance of the TestnetKit sandbox, stabilization of the 13 monorepo packages for npm release, and technical documentation creation for the global Stellar developer community.  
**Commitment:** 100% focused delivery within 30 days, backed by a proven track record of execution from our initial grant.
