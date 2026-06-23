# WalletNow - Known Issues & Mainnet Blockers

Este documento rastreia os débitos técnicos intencionais e as pendências arquiteturais identificadas durante a fase de MVP (Hackathon Edition). **Nenhum destes itens deve ser resolvido antes da conclusão do hackathon**, pois representam otimizações e requisitos exclusivos para a Mainnet.

## 🚨 Security Critical (Mainnet Blockers)

Estes itens bloqueiam o lançamento na Mainnet e exigem refatoração antes da V1.0.

1. **`walletFactory.ts` & `paymentService.ts`**: Uso de `IssuerService`/Sponsor (atualmente focado na Testnet). Na Mainnet, a delegação de taxas (Fee Bump) via CAP-33 exigirá uma infraestrutura dedicada de *Fee Sponsorship* com limites de rate (ex: limite diário de XLM por usuário).
2. **`environment.ts`**: A chave `VITE_GEMINI_API_KEY` (usada em contextos de demonstração/IA) deve ser estritamente migrada para uma rotina server-side (Edge Functions).
3. **`environment.ts`**: Remover o suporte à flag `?demo=true` no carregamento da aplicação em produção.

## 🏗️ Infraestrutura & Performance (Mainnet)

1. **`stellarNetwork.ts`**: Avaliar e contratar nós RPC / Horizon privados (via SDF SDK, Blockdaemon ou equivalentes) para reduzir o *rate limit* associado aos endpoints públicos gratuitos.
2. **`stellarNetwork.ts`**: O cálculo de *fees* atualmente é estático/basilar. Requer implementação de estimativa dinâmica chamando o endpoint `/fee_stats` do Horizon.
3. **`transferoService.ts`**: Finalizar e testar exaustivamente o fluxo de Cash-out (*Burn* de BRZ OnChain → Saque PIX no BACEN via parceiros regulados).
4. **`stellarNetwork.ts`**: O *issuer* do TESOURO (Etherfuse) deve ser dinamicamente resolvido na Mainnet, consultando o contrato/oráculo correspondente via `EtherfuseV2ApiService`.

## 👁️ Observabilidade e Logs

Migrações pendentes em `productionLogger.ts` para acompanhamento de saúde da plataforma em larga escala:
1. **Integração Sentry**: Adicionar `Sentry.captureException` e `captureMessage` para capturar e agregar erros do frontend automaticamente.
2. **Sistema de Alertas**: Disparar webhook (Slack/PagerDuty/Email) ao detectar `log.fatal()`.
3. **Audit Trails**: Gravar eventos de segurança e uso de capabilities no `audit_logs` do Supabase via Edge Functions.

---
*Gerado durante a Sprint RC1 (Hackathon Stabilization)*
