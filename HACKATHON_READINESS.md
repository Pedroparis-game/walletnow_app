# HACKATHON READINESS & DEMO SCRIPT

Este documento formaliza a prontidão do WalletNow para o PULSO Hackathon e propõe um script de demonstração meticulosamente cronometrado (5 minutos) focado no impacto.

## Status da Release Candidate (RC1)

| Gate | Status | Detalhe |
|---|---|---|
| 1. TypeScript | ✅ Passou | `tsc --noEmit` executado com 0 erros. |
| 2. Build | ✅ Passou | `vite build` gerando bundle estável no monorepo. |
| 3. Lint | ✅ Passou | Análise sintática limpa. |
| 4. Testes Críticos | ✅ Passou | Suíte Unitária do `IntegrationEngine` implementada. |
| 5-10. Manuais & Docs | ✅ Passou | Códigos legados movidos p/ `legacy/`, logs limpos. |
| 11. Rollback Seguro | ✅ Passou | Commit checkpoint estabelecido. |
| 12. Zero Regressão | ✅ Passou | Build verificado após cada intervenção estrutural. |

---

## 🎬 Script de Demonstração (Pitch - 5 Minutos)

O objetivo desta demonstração **não é** mostrar código, mas mostrar o **resultado da abstração**. Faça com que os jurados sintam que estão usando um app tradicional de Web2, até o momento em que você revela a infraestrutura Stellar por trás.

### `00:00 - 00:30` | O Problema do Builder
- **Ação**: Apresente a dor central de construir na Web3.
- **Fala**: *"Cada dia gasto configurando onboarding, chaves e abstração de gas é um dia a menos focado no produto real. O padrão do mercado traz atrito massivo para o usuário. Hoje, mostraremos como eliminamos essa dor usando a Stellar."*

### `00:30 - 01:00` | WalletNow (Onboarding Instantâneo)
- **Ação**: Demonstre a criação de carteira via Passkey e Pix.
- **Fala**: *"Apresentamos a WalletNow. Ao fazer login biométrico, geramos uma carteira instantânea, não-custodial, vinculada ao dispositivo. O depósito inicial é via Pix, caindo como Stablecoins via smart contracts, e sem exigir que o usuário pague Gas. Cero atrito."*

### `01:00 - 01:40` | Portfolio (A Visão Consolidada)
- **Ação**: Navegue para a página "Home / Portfolio". Mostre a agregação dos saldos.
- **Fala**: *"Aqui o usuário visualiza todo o seu patrimônio. Mais do que exibir saldo, o WalletNow atua como um Financial OS. A engine abstrai os tokens, pools e RWA de diferentes protocolos Stellar numa única visão nativa."*

### `01:40 - 02:20` | Opportunity Engine
- **Ação**: Role a tela para a seção de Oportunidades ou acesse a respectiva funcionalidade.
- **Fala**: *"Nosso Opportunity Engine varre o ecossistema e recomenda investimentos adequados baseados nos ativos que o usuário já possui. Fallbacks inteligentes garantem que a tela nunca fique vazia, mantendo a sensação de app moderno e vivo."*

### `02:20 - 03:00` | Swap 
- **Ação**: Acesse o menu e simule a conversão (ex: XLM para USDC ou BRZ).
- **Fala**: *"As trocas (Swaps) são profundamente integradas ao Aggregator Soroswap. Mas repare: o usuário não se preocupa com rotas ou trustlines. A WalletNow cria a infraestrutura, gerencia e patrocina as taxas. Tudo invisível."*

### `03:00 - 03:40` | Yield
- **Ação**: Abra a área de Yield/DeFi.
- **Fala**: *"Na nossa seção DeFi, utilizamos a integração modular com a Defindex para expor cofres de rentabilidade (Vaults) on-chain de forma extremamente acessível. Um clique para alocar capital."*

### `03:40 - 04:20` | RWA (Real World Assets)
- **Ação**: Apresente a aba de Investimentos RWA.
- **Fala**: *"E o mais importante para inclusão financeira: Ativos do Mundo Real. Demonstramos aqui Tesouro Nacional tokenizado usando a infraestrutura do Etherfuse, liquidez diária e segurança criptográfica, pagando com Pix."*

### `04:20 - 05:00` | Arquitetura & Encerramento
- **Ação**: Exiba (se houver slide ou diagramas breves) a modularidade.
- **Fala**: *"Isso só é possível porque o WalletNow é uma 'Abstraction Layer'. Nossa arquitetura usa um `IntegrationEngine` dinâmico e manifestos de plugins (Capabilities). Construímos isso como um bem público (Open Core) para a Stellar. Nosso modelo comercial proverá SLAs e infraestrutura. WalletNow: Faça aplicações Stellar parecerem apps modernos."*

---
> 💡 **Dica de Palco**: Deixe o app rodando sem recarregar e tenha dados em cache. O impacto da interface fluida conta tanto quanto os componentes de backend.
