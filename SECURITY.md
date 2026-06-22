# Política de Segurança do WalletNow

A segurança é o pilar fundamental de qualquer protocolo financeiro.

## Versões Suportadas

| Versão | Suportada |
| ------ | --------- |
| > 1.0.0| Sim       |
| 0.x.x  | Não (Alpha/Beta) |

*Atualmente estamos na fase Alpha (0.2.x). Não utilize em produção com fundos reais.*

## Reportando Vulnerabilidades
Se você descobrir uma vulnerabilidade de segurança, **NÃO** abra uma issue pública.

Por favor, envie um e-mail para `security@walletnow.app` (fictício para o template) detalhando a falha, os passos para reproduzir e uma prova de conceito (PoC). Nós responderemos em até 48 horas.

## Princípios de Segurança
1. O Core NUNCA armazena chaves privadas em memória global estática.
2. Todo Storage é assumido como inseguro a menos que validado via Criptografia (Enclave/WebAuthn).
3. Entradas externas para as APIs são estritamente validadas.
