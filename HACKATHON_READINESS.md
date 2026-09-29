# HACKATHON READINESS & DEMO SCRIPT 2026 — WALLETNOW PROTOCOL

Este documento formaliza a prontidão técnica e estratégica do **WalletNow Protocol** para o novo ciclo de Hackathon e Demonstrações Institucionais do ecossistema Stellar (Stellar Community Fund / Meridian / Hackathons Globais).

**Data de Atualização:** 29 de Setembro de 2026  
**Versão Atual:** `v0.4.5-candidate`  
**Deploy Ativo:** [https://nsdbr.com/walletnow/](https://nsdbr.com/walletnow/)  
**Sandbox do Desenvolvedor (TestnetKit):** [https://nsdbr.com/walletnow/docs/testnet-kit](https://nsdbr.com/walletnow/docs/testnet-kit)  

---

## 🚦 Status dos Gates de Prontidão (Quality Gates)

| Gate | Status | Detalhe da Validação |
|---|---|---|
| **1. TypeScript Rigoroso** | ✅ Passou | `tsc --noEmit` executado com 0 erros no workspace inteiro. |
| **2. Bundler & Monorepo Build** | ✅ Passou | `turbo run build && vite build` gerando bundle otimizado com suporte a chunks dinâmicos. |
| **3. Lint & Análise Sintática** | ✅ Passou | Código estritamente formatado com ESLint e regras de Clean Code (DRY / SOLID). |
| **4. Testes Automatizados** | ✅ Passou | 53 testes passando no Vitest, cobrindo fluxos de onboarding, criptografia AES-GCM e integrações com âncoras. |
| **5. Stellar SEPs Integration** | ✅ Passou | Suporte invisível e testado para SEP-01 (stellar.toml), SEP-10 (WebAuth) e SEP-24 (Interactive Deposit/Withdraw). |
| **6. TestnetKit Sandbox** | ✅ Passou | Ferramenta interativa de sandbox pronta com 1-Click Faucet, Pools AMM $X \times Y = K$ e monitor de latência. |
| **7. Auditoria de Segurança v2.0** | ✅ Passou | Remediações da Auditoria Adversarial v2.0 aplicadas: RLS no Supabase, SHA3-256 commitments e sanitização de logs. |
| **8. Zero Regressão Funcional** | ✅ Passou | Build e execução de fluxos vitais validados em cada milestone. |

---

## 🎬 Script de Demonstração (Pitch de Alto Impacto - 5 Minutos)

O objetivo desta apresentação é demonstrar a **Abstração Total** e a **Experiência do Desenvolvedor (DX)**. A banca avaliadora deve vivenciar a facilidade de um aplicativo Web2 moderno, sendo surpreendida pela robustez da infraestrutura Stellar operando de forma invisível.

### `00:00 - 00:30` | 1. O Abismo de Conversão da Web3
- **Ação**: Apresente o problema real do mercado (slides ou introdução direta).
- **Fala**: *"Hoje, mais de 95% dos usuários desistem da Web3 por causa do atrito: seed phrases, compra prévia de gas tokens voláteis e interfaces intimidadoras. No Brasil e na América Latina, onde o Pix domina o cotidiano, nenhum usuário aceita esperar minutos ou pagar taxas em moeda estrangeira. A WalletNow resolve isso: somos a camada de abstração total para a rede Stellar."*

### `00:30 - 01:10` | 2. Onboarding Biométrico e Gasless Instantâneo
- **Ação**: Demonstre ao vivo a criação de carteira via Passkey (TouchID / FaceID ou biometria Windows Hello).
- **Fala**: *"Com apenas um toque biométrico via Passkeys (WebAuthn), uma carteira descentralizada não-custodial é gerada localmente no dispositivo do usuário. Sem senhas, sem seed phrases para anotar em papel. E reparem: o usuário não tem nenhum centavo de XLM, mas a WalletNow patrocina a criação da conta e das trustlines via fee-bump transactions na Stellar. Atrito zero."*

### `01:10 - 01:50` | 3. Financial OS: Pix, RWA e Portfolio Unificado
- **Ação**: Navegue pelo Dashboard e pela aba RWA (Etherfuse).
- **Fala**: *"Uma vez dentro, o WalletNow se comporta como um Financial OS. O usuário pode fazer um Pix e receber Stablecoins ou Ativos do Mundo Real (como Tesouro Nacional tokenizado via Etherfuse) em menos de 3 segundos diretamente em autocustódia. Tudo consolidado em um painel responsivo com sincronização em tempo real via websockets."*

### `01:50 - 02:40` | 4. DeFi Integrado: Swaps AMM e Vaults de Rentabilidade
- **Ação**: Mostre a tela de Swap e a seção de Yield.
- **Fala**: *"Para movimentar capital, integramos o agregador de liquidez Soroswap e cofres descentralizados via Defindex. O usuário troca ativos com proteção de slippage e aloca em vaults de rendimento on-chain com apenas um clique. A infraestrutura de trustlines e roteamento é 100% invisível para quem usa."*

### `02:40 - 03:40` | 5. TestnetKit: O Playground Definitivo para Builders Stellar
- **Ação**: Acesse o **TestnetKit** (`/docs/testnet-kit`). Crie uma carteira efêmera, aperte o botão "Solicitar Faucet", execute um swap na pool AMM constante ($X \times Y = K$) e mostre a transação na Testnet no Stellar.expert.
- **Fala**: *"Mas a WalletNow não é apenas para o usuário final — é uma plataforma para construtores. Desenvolvemos o TestnetKit: uma sandbox completa onde qualquer desenvolvedor pode criar uma carteira descartável em um clique, receber fundos do Friendbot, simular pools de liquidez AMM, medir latência de rede e testar interações on-chain em tempo real, com hashes verificáveis no Stellar.expert."*

### `03:40 - 04:20` | 6. Âncoras Stellar e Padrões SEPs (SEP-01, SEP-10 e SEP-24)
- **Ação**: Destaque a aba de Âncoras ou a documentação do SEP-24 no TestnetKit.
- **Fala**: *"Abstraímos os padrões oficiais da Stellar. Implementamos clientes transparentes para SEP-01 (stellar.toml), autenticação WebAuth via SEP-10 e fluxos interativos de depósito e saque via SEP-24. Qualquer âncora do ecossistema Stellar pode se plugar ao nosso ecossistema com esforço mínimo de engenharia."*

### `04:20 - 05:00` | 7. SDK Modular (`@walletnow/sdk`) & Conclusão
- **Ação**: Mostre a estrutura monorepo do SDK e a documentação interativa em `/docs`.
- **Fala**: *"Toda essa inteligência está encapsulada em 13 pacotes modulares no nosso SDK (`@walletnow/sdk`). Construímos isso como um bem público (Open Core) com suporte a AI Agent Skills e contratos Soroban. A WalletNow é a ponte que transforma a tecnologia revolucionária da Stellar em produtos que qualquer pessoa sabe usar. Obrigado!"*

---

## 💡 Dicas de Sucesso para a Apresentação
1. **Mantenha abas pré-carregadas**: Tenha a Landing Page, o Dashboard e o TestnetKit abertos em guias dedicadas.
2. **Tenha uma carteira de teste com saldo**: Demonstre a velocidade da interface sem depender de atrasos externos de rede.
3. **Evite jargões técnicos para a banca não-técnica**: Destaque primeiro os benefícios do negócio (redução do abandono de 95% para quase zero) e, em seguida, revele o motor tecnológico Stellar.
