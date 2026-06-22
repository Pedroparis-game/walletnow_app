# WalletNow Protocol — Roadmap

## Visão Geral
O WalletNow é projetado como um protocolo modular para acelerar a integração do ecossistema Stellar em aplicações web3, fornecendo uma fundação robusta para Passkeys, Transações Gasless e integrações RWA.

## Foundation (v0.2.0-alpha-foundation) — CONCLUÍDA
- Estabelecimento do Blueprint Arquitetural (ADR-000)
- Configuração do Monorepo (pnpm/npm workspaces)
- Isolamento do Core Kernel, Registry e State Machine
- Padronização de tipos e interfaces públicas
- Sistema de Eventos (EventEmitter)
- Correção de dependências circulares

## Hackathon Stellar PULSO (v0.3.0-alpha)
- Implementação do Provider de Stellar SDK
- Desenvolvimento do Plugin de Passkeys (WebAuthn)
- Desenvolvimento do Plugin Gasless (Relayer)
- Demonstração End-to-End no Hackathon

## Beta Release (v0.8.0-beta)
- Estabilização da API Pública
- Cobertura de Testes Unitários > 80%
- Implementação de Storage Criptografado
- Integração de Vault Capabilities

## Produção (v1.0.0)
- Auditoria de Segurança Externa
- Publicação Estável no NPM (`@walletnow/core`, `@walletnow/react`, etc.)
- Suporte completo a Soroban Smart Contracts
- Portal do Desenvolvedor e Guias de Integração Avançados
