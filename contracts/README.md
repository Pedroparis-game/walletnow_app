# Contratos Inteligentes Soroban & Bindings Stellar

**Data de Atualização:** Setembro de 2026  
**Status:** Mapeamento de Tipos `@walletnow/contracts` e Integrações Descentralizadas Ativas  

Esta área documenta os contratos inteligentes Soroban e as interfaces de execução do **WalletNow Protocol**. O protocolo consome e interage tanto com contratos nativos customizados quanto com protocolos abertos do ecossistema Stellar (Soroswap AMM e Defindex Vaults).

---

## 🛠️ Stack Tecnológica

- **Linguagem dos Contratos**: Rust (`wasm32-unknown-unknown`)
- **Framework Smart Contracts**: Soroban SDK v21+
- **Bindings TypeScript**: `@walletnow/contracts` e `@stellar/stellar-sdk`
- **Rede Alvo**: Stellar Testnet → Stellar Mainnet

---

## 📜 Visão dos Contratos e Módulos

| Contrato / Binding | Função na Arquitetura | Status |
|---|---|---|
| **`@walletnow/contracts` (TS)** | Interfaces canônicas, tipos de envelopes e hierarquia de erros (`WalletNowError`) | `PRODUÇÃO` |
| **Soroswap Router Integration** | Roteamento descentralizado de Swaps e agregação de liquidez AMM | `ATIVO / TESTNET` |
| **Defindex Yield Protocol** | Cofres (Vaults) de rentabilidade e cálculo de cotas (*DeFi Shares*) | `ATIVO / TESTNET` |
| **`brw_anchor.rs`** | Smart Contract Soroban para custódia e emissão programável de tokens BRW | `DESENVOLVIMENTO` |
| **`kyc_attestation.rs`** | Hash digest SHA3-256 e atestado on-chain de conformidade e identidade | `DESENVOLVIMENTO` |
| **`gasless_sponsor.rs`** | Automação de patrocínio de trustlines e reservas futuras (CAP-33) | `DESENVOLVIMENTO` |

---

## 💻 Como Desenvolver e Testar Localmente

```bash
# 1. Instalar o Soroban CLI
cargo install --locked soroban-cli

# 2. Configurar a rede Testnet no CLI
soroban network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# 3. Compilar os contratos Soroban em Rust
soroban contract build

# 4. Executar os testes unitários do monorepo de contratos
npm run test
```

---

## 🔗 Referências Oficiais

- [Soroban Smart Contracts Documentation](https://developers.stellar.org/docs/smart-contracts)
- [Soroswap Protocol Documentation](https://soroswap.finance)
- [Defindex Vault Protocol](https://defindex.io)
