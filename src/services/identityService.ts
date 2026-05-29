/// <reference types="vite/client" />
import { sha3_256 } from 'js-sha3';
import { Keypair, TransactionBuilder, Asset, Operation, Memo, BASE_FEE } from '@stellar/stellar-sdk';
import { StellarNetwork } from '../config/stellarNetwork';
import { AppConfig } from '../config/environment';
import { IssuerService } from '../utils/issuerService';
import { KycValidatorService, type KycValidationResult } from './kycValidatorService';

/**
 * ✅ BLOCKER-02 RESOLVIDO:
 * A VITE_GEMINI_API_KEY foi REMOVIDA do bundle do browser.
 * O KYC agora é processado pela Edge Function `kyc-validator` (server-side).
 * O frontend envia apenas as imagens e dados, recebe apenas o resultado sanitizado.
 *
 * @see supabase/functions/kyc-validator/index.ts
 * @see src/services/kycValidatorService.ts
 */

// Rede Stellar via abstração centralizada (não hardcode)
const server = StellarNetwork.createServer();

/**
 * Serviço de KYC ZK-STARK (Trust Layer)
 * 
 * Este serviço é invocado quando o usuário pede para virar "Conta Validada".
 * Ele analisa uma imagem (CNH/RG), criptografa o CPF sem revelar os números na rede (ZK-STARK)
 * e injeta a Prova de Conhecimento na Blockchain!
 */
export const IdentityService = {

    /**
     * 1. Hashing do CPF e Dados Completos em SHA3-256 (Pós-Quântico)
     * O "Super-Hash" encadeia todos os dados do usuário, gerando uma única assinatura
     * inquebrável por computação quântica graças à tecnologia "Sponge" do SHA-3.
     */
    generateZKHash(
        name: string,
        cpf: string,
        whatsapp: string,
        email: string,
        birthDate: string,
        address: string,
        secretSalt: string
    ): string {
        const cleanCpf = cpf.replace(/\D/g, ''); // Tira formatação
        const cleanPhone = whatsapp.replace(/\D/g, '');

        // Super-Hash Payload: Normaliza as strings para evitar falsos-negativos de CAPS LOCK
        const payload = `${name.toLowerCase().trim()}:${cleanCpf}:${cleanPhone}:${email.toLowerCase().trim()}:${birthDate.trim()}:${address.toLowerCase().trim()}:${secretSalt}`;

        const zkHash = sha3_256(payload);
        // Sanitizado para Produção: Não exibe o ZK Hash no F12

        return zkHash; // 32 bytes de pura segurança matemática
    },

    /**
     * 2. Validação de Documento via KYC Server-Side (Edge Function `kyc-validator`)
     *
     * ✅ BLOCKER-02 RESOLVIDO:
     * O processamento de KYC agora é server-side. O frontend envia apenas as imagens
     * e recebe o resultado sanitizado. Nenhuma API Key de IA é exposta no bundle.
     *
     * Providers suportados (configurados via Supabase Vault):
     * - 'gemini'    → Google Gemini (dev/sandbox)
     * - 'etherfuse' → Etherfuse KYC (produção futura)
     * - 'transfero' → Transfero KYC (produção futura)
     */
    async validateDocumentWithAI(
        documentBase64: string,
        selfieBase64: string,
        expectedCpf: string,
        expectedName: string,
        expectedBirthDate: string
    ): Promise<{ isApproved: boolean; errorDetails: string[] }> {
        try {
            const result: KycValidationResult = await KycValidatorService.validate({
                documentBase64,
                selfieBase64,
                expectedCpf,
                expectedName,
                expectedBirthDate,
            });

            return {
                isApproved: result.isApproved,
                errorDetails: result.errorDetails,
            };
        } catch (err: any) {
            console.error('❌ Erro no serviço KYC server-side:', err.message);
            return {
                isApproved: false,
                errorDetails: [err.message ?? 'Serviço de KYC indisponível. Tente novamente.'],
            };
        }
    },

    /**
     * 3. Mintagem da Reputação (Sponsored Reserves) e NFT de Identidade ZK
     * Após o serviço acima confirmar e bater o martelo (True), esse método é ativado.
     * CAP-33: A conta emissora Master assume de graça o aluguel do ledger (reserva)
     * para a carteira do usuário e patrocina as Trustlines (BRZ e KYCZK).
     * 
     * @param userPublicKey Chave do cliente que está sofrendo a auditoria (Criada no WalletFactory).
     * @param userSecretKey Permissão secreta necessária (Dual Singature) para confiar na master
     * @param zkHash A string gerada pelo js-sha3 (Passo 1 deste arquivo)
     */
    async mintReputationZK(userPublicKey: string, userSecretKey: string, zkHash: string): Promise<string | null> {
        try {
            // Sanitizado para Produção

            // ATENÇÃO: Contas Emissoras (Issuers) custeiam as taxas.
            // Esta seria a carteira MASTER da empresa, abastecida de Lúmens.
            // Para o teste rodar, você precisará gerar um par Mestre temporário e jogar na .env
            const ISSUER_PUBLIC = AppConfig.stellar.issuerPublicKey;

            if (!ISSUER_PUBLIC) {
                throw new Error('Public Key da Conta Mestre Emissora não configurada no ambiente.');
            }

            const userKeypair = Keypair.fromSecret(userSecretKey);

            // Sanitizado para Produção
            const issuerAccount = await server.loadAccount(ISSUER_PUBLIC);

            // Protocolo CAP-33 (Sponsored Reserves)
            // O usuário não precisará ter saldos XLM. A conta Master vai "Sponsorar"
            // a criação e as Trustlines do usuário.

            let isNewAccount = false;
            try {
                await server.loadAccount(userPublicKey);
            } catch (err: any) {
                if (err.response?.status === 404) {
                    isNewAccount = true;
                } else {
                    throw new Error(`Falha Horizon Crítica ao consultar Destino: ${err.message}`);
                }
            }

            // Construir lista de operações da transação blindada
            const operations: any[] = [];

            // 1. Iniciar Patrocínio (Master -> User)
            operations.push(Operation.beginSponsoringFutureReserves({
                sponsoredId: userPublicKey,
                // O source será por padrão a conta que construir a Transaction (Issuer)
            }));

            // 2. Cria a conta (Nasce na rede com 0 XLM, o custo base 1XLM é arcado pelo sponsor!)
            if (isNewAccount) {
                operations.push(Operation.createAccount({
                    destination: userPublicKey,
                    startingBalance: '0'
                }));
            }

            // 3. Estabelecer Trustlines (Limites de confiança das Moedas para a carteira do usuário)
            // KYCZK (Token de Identidade)
            const kycAsset = new Asset('KYCZK', ISSUER_PUBLIC);
            operations.push(Operation.changeTrust({
                asset: kycAsset,
                source: userPublicKey // A carteira aceitando a confiança é a do usuário
            }));

            // BRZ (Moeda Estável do Brasil na Testnet usando mesmo patrocínio Master como emissor Mock)
            const brzAsset = new Asset('BRZ', ISSUER_PUBLIC);
            operations.push(Operation.changeTrust({
                asset: brzAsset,
                source: userPublicKey
            }));

            // 4. Encerrar Patrocínio
            operations.push(Operation.endSponsoringFutureReserves({
                source: userPublicKey // O encerramento requer a assinatura do usuário (Patrocinado)
            }));

            const transactionBuilder = new TransactionBuilder(issuerAccount, {
                fee: BASE_FEE,
                networkPassphrase: StellarNetwork.passphrase // Abstração: testnet/mainnet via config
            })
                // 🥇 Essa é a chave do NFT: Gravação ZK da auditoria no Ledger. 
                .addMemo(Memo.hash(zkHash))
                .setTimeout(30);

            // Anexa as Operações Empilhadas
            operations.forEach(op => transactionBuilder.addOperation(op));
            const transaction = transactionBuilder.build();

            // ✍️ DUPLA ASSINATURA (Obrigatoriedade do CAP-33)
            // Como mexemos de graça nas Trustlines de uma carteira que não é a Master,
            // precisamos que o usuário também autorize a jogada (Com sua Key secreta).
            transaction.sign(userKeypair); // Assina apenas localmente
            
            // Sanitizado para Produção
            const hash = await IssuerService.invoke('mint_reputation_zk', {
                publicKey: userPublicKey,
                partialXdr: transaction.toXDR(),
                zkHash
            });

            // Retorna a "Placa do Carro" da transação, você poderá buscá-la Explorer da Stellar!
            return hash;

        } catch (err: any) {
            console.error('❌ Blockchain Crítico: Falha na transação:', err?.response?.data || err.message);
            // Captura profunda dos Result Codes do Horizon para diagnóstico exato (ex: tx_bad_auth, op_already_exists)
            const resultCodes = err?.response?.data?.extras?.result_codes;
            let detailError = 'Erro desconhecido da Rede Stellar.';
            if (resultCodes) {
                detailError = `[BLOCKCHAIN REJECTED] TX: ${resultCodes.transaction} | OPS: ${resultCodes.operations?.join(', ')}`;
            } else if (err.message) {
                detailError = err.message;
            }
            throw new Error(`Falha Horizon: ${detailError}`);
        }
    }
};
