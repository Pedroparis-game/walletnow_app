# Arquitetura do Protocolo WalletNow

O WalletNow segue princípios rigorosos de modularidade e separação de preocupações, conforme documentado no `ADR-000`. 

## 1. Core Kernel (`@walletnow/core`)
O Kernel é o motor principal. Ele não possui dependências de bibliotecas de blockchain (como `stellar-sdk`).
- **State Machine**: Controla o ciclo de vida (BOOTING, READY, ERROR, DESTROYED).
- **Context API**: Encapsula todo o estado compartilhado (`WalletNowContext`), evitando acoplamento global.
- **Plugin Registry**: Registra, inicializa e gerencia o ciclo de vida dos plugins.
- **EventEmitter**: Barramento de comunicação assíncrona entre módulos.

## 2. Injeção de Dependência (Providers)
Todas as operações de I/O, Criptografia e Acesso de Rede são injetadas através de `Providers` implementados no pacote `@walletnow/providers` (ou customizados pelo dApp).
- `IStorageProvider`: Persistência local (ex: LocalStorage, IndexedDB).
- `IAuthProvider`: Gerenciamento de sessão e autenticação.
- `IChainProvider` e `IRPCProvider`: Abstração de chamadas à blockchain Stellar.

## 3. Capabilities & Plugins
Funcionalidades como *Gasless Transactions* ou *Passkeys* não fazem parte do Kernel. Elas são implementadas como **Plugins** que injetam **Capabilities** no sistema.
- Um plugin se registra na fase de `BOOTING`.
- Ele declara as `Capabilities` que suporta (ex: `SignerCapability`).
- Os dApps consomem as operações chamando `walletNow.capabilities.get(...)`.

## 4. Fluxo de Dados (CQRS-Like)
As operações executadas pelos plugins retornam instâncias de `ExecutionContext`, isolando o estado da operação (pendente, sucesso, falha) e permitindo rollbacks ou subscrição aos estados da transação.
