import { Keypair, TransactionBuilder, Asset, Operation } from '@stellar/stellar-sdk';
import { supabase } from '../lib/supabase';
import { isValidPublicKey, isValidSecretKey } from '../utils/stellarValidation';
import { DeviceVault } from '../security/deviceVault';
import { MnemonicVault } from '../security/mnemonicVault';
import { AppConfig } from '../config/environment';
import { StellarNetwork } from '../config/stellarNetwork';
import { IssuerService } from '../utils/issuerService';
import { generateMnemonic, deriveKeypairFromMnemonic, verifyMnemonicMatchesWallet } from '../utils/bip39Wallet';

/**
 * TODO [SECURITY-CRITICAL — BLOCKER MAINNET]:
 * VITE_STELLAR_ISSUER_SECRET está sendo lida no bundle do frontend.
 * Isso expõe a chave privada do issuer ao browser (inspecionável via DevTools).
 *
 * PLANO DE MIGRAÇÃO:
 * 1. Criar Edge Function `stellar-issuer` no Supabase
 * 2. Mover activateAccount(), provisionWalletForUser() (ativação + trustline) para server-side
 * 3. O frontend passa apenas publicKey + userId, nunca recebe a issuer secret
 * 4. Remover VITE_STELLAR_ISSUER_SECRET do bundle completamente
 *
 * STATUS: Mantido para preservar fluxo atual de testnet. NÃO fazer deploy em mainnet sem resolver.
 */

/**
 * WalletFactory
 * 
 * [PT-BR] Fábrica de carteiras Stellar focada em Abstração de Custódia (UX-Zero).
 * Gerencia criação, Ativação patrocinada (Sponsor/CAP-33) e Setup de Trustlines.
 * Assinatura Bio-criptográfica (Passkeys): Atualmente, a Chave Secreta é isolada no banco local (simulando enclave do dispositivo).
 * Em produção, será resguardada e assinada por biometria criptográfica usando WebCrypto API garantindo total Soberania ao usuário real.
 * 
 * [EN-US] Stellar wallet factory focused on Custodial Abstraction (UX-Zero).
 * Manages creation, sponsored activation (Sponsor/CAP-33), and Trustline setup.
 * Bio-cryptographic Signature (Passkeys): Currently, the Secret Key is isolated locally (simulating a device enclave).
 * In production, it will be safeguarded and signed by cryptography biometrics using WebCrypto API ensuring total Sovereignty for the real user.
 */

const STORAGE_KEY_PREFIX = '@walletnow:secret:';

export const WalletFactory = {
    /**
     * Provisiona uma nova carteira Stellar completa para o usuário.
     * 1. Gera par de chaves ED25519.
     * 2. Vincula Public Key ao perfil no Supabase.
     * 3. Salva Secret Key localmente.
     * 4. Ativa conta via Friendbot (Testnet).
     * 5. Estabelece Trustline BRW patrocidada (CAP-33).
     * 
     * @param userId ID do usuário no Supabase.
     * @returns Public Key gerada.
     */
    /**
     * Tenta ativar a conta do usuário usando o Issuer como Sponsor (Emergência).
     * Envia 1.5 XLM para cobrir o reserve balance e trustlines.
     */
    /**
     * Ativa a conta do usuário via Issuer como Sponsor (mainnet) ou Friendbot (testnet).
     * Implementa retry com backoff exponencial (3 tentativas: 1s, 2s, 4s).
     */
    async activateAccount(publicKey: string): Promise<boolean> {
        const maxAttempts = 3;
        const baseDelay = 1000; // 1 segundo

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`[WalletNow][WalletFactory] 🛡️ Ativando conta via Sponsor (tentativa ${attempt}/${maxAttempts}): ${publicKey.slice(0, 8)}...`);
                await IssuerService.invoke('fund_wallet', { publicKey });
                console.log('[WalletNow][WalletFactory] ✅ Conta ativada com sucesso via Sponsor Edge Function.');
                return true;
            } catch (error: any) {
                const isLastAttempt = attempt === maxAttempts;
                if (isLastAttempt) {
                    console.error('[WalletNow][WalletFactory] ❌ Falha na ativação após 3 tentativas:', error.message);
                    return false;
                }
                const delay = baseDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s
                console.warn(`[WalletNow][WalletFactory] ⚠️ Tentativa ${attempt} falhou. Aguardando ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
        return false;
    },

    /**
     * Provisiona uma nova carteira Stellar completa para o usuário.
     *
     * FLUXO BIP39 (wallets novas):
     * 1. Gera mnemonic de 12 palavras via @scure/bip39 (128 bits de entropia, WebCrypto)
     * 2. Deriva keypair ED25519 via SLIP-0010 / SEP-0005 (path m/44'/148'/0')
     * 3. Valida chaves antes de persistir qualquer dado
     * 4. Salva Public Key no Supabase
     * 5. Criptografa Secret Key no DeviceVault (AES-GCM)
     * 6. Criptografa mnemonic no MnemonicVault (AES-GCM, separado)
     * 7. Marca versão como 'bip39' no localStorage
     *
     * Wallets legadas (criadas antes desta versão) não são afetadas.
     */
    async provisionWalletForUser(userId: string): Promise<string | null> {
        try {
            console.log("[WalletNow][WalletFactory] Iniciando provisionamento BIP39 para o usuário:", userId);

            // --- ETAPA 1: Gerar keypair via BIP39/SLIP-0010 (determinístico e recuperável) ---
            const mnemonic = generateMnemonic();
            const derived = deriveKeypairFromMnemonic(mnemonic);
            const publicKey = derived.publicKey;
            const secretKey = derived.secretKey;

            // Validação de segurança (Hard Validation) ANTES de persistir qualquer coisa
            if (!isValidPublicKey(publicKey) || !isValidSecretKey(secretKey)) {
                console.error("[WalletNow][WalletFactory] 🚨 Chaves geradas corrompidas ou inválidas. Abortando provisionamento.");
                throw new Error("Chaves Stellar corrompidas.");
            }

            // Salva apenas a Chave Pública no Banco (Referência)
            const { error: dbError } = await supabase
                .from('profiles')
                .update({ stellar_address: publicKey })
                .eq('id', userId);

            if (dbError) {
                console.error("[WalletNow][WalletFactory] ❌ Falha de rede ao persistir Public Key no banco:", dbError);
                throw new Error(`DB Sync Fail: ${dbError.message}`);
            }

            // Salva a Chave Secreta localmente de forma CRIPTOGRAFADA (WebCrypto)
            try {
                const encKey = await DeviceVault.generateEncryptionKey(userId);
                const encryptedData = await DeviceVault.encryptSecret(secretKey, encKey);
                
                localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(encryptedData));
                
                // Popula a RAM volátil para evitar relogar imediatamente no onboarding
                DeviceVault.setVolatileSecret(secretKey);

                console.log("[WalletNow][WalletFactory] Secret Key encriptada (AES-GCM) e armazenada com segurança localmente.");

                // --- ETAPA BIP39: Salvar mnemonic criptografada no MnemonicVault ---
                // A mnemonic é criptografada separadamente com a mesma chave PBKDF2
                // Nunca é enviada ao servidor nem armazenada em plaintext
                await MnemonicVault.saveMnemonic(mnemonic, userId);
                console.log("[WalletNow][WalletFactory] ✅ Mnemonic BIP39 criptografada e salva no MnemonicVault.");
            } catch (storageError) {
                console.error("[WalletNow][WalletFactory] 🚨 Falha catastrófica no DeviceVault/LocalStorage. Abortando!");
                throw storageError;
            }


            // Ativação de conta: Friendbot (testnet) ou Sponsor (mainnet / fallback)
            // StellarNetwork.getFriendbotUrl() retorna null em mainnet — nunca chama Friendbot em produção
            const friendbotUrl = StellarNetwork.getFriendbotUrl(publicKey);
            if (friendbotUrl) {
                try {
                    await fetch(friendbotUrl);
                    console.log("[WalletNow][WalletFactory] ✅ [Stellar-Audit] Conta ativada via Friendbot (testnet).");
                } catch (e) {
                    console.warn("[WalletNow][WalletFactory] ⚠️ Friendbot indisponível. Tentando ativação via Sponsor...");
                    await this.activateAccount(publicKey);
                }
            } else {
                // MAINNET: Friendbot não existe. Sponsor é obrigatório.
                // TODO [MAINNET-BLOCKER]: Mover ativação via Sponsor para Edge Function server-side
                console.log("[WalletNow][WalletFactory] 🛡️ [Stellar-Audit] Ativando conta via Treasury Sponsor (mainnet).");
                await this.activateAccount(publicKey);
            }

            // Setup Gasless de Trustline inicial
            // TODO [MAINNET]: BRW é token interno de testnet. Em mainnet, configurar trustlines
            // para USDC (Circle) e BRZ (Transfero) usando issuers reais via StellarNetwork.assets
            const ISSUER_PUBLIC = AppConfig.stellar.issuerPublicKey;
            if (ISSUER_PUBLIC) {
                const server = StellarNetwork.createServer();
                // Em mainnet, usar assets reais (USDC, BRZ) — não o BRW de testnet
                const brwAsset = new Asset('BRW', ISSUER_PUBLIC);
                const userKeypair = Keypair.fromSecret(secretKey);
                
                // Espera um pouco para a rede processar a criação antes de mudar trust
                await new Promise(r => setTimeout(r, 2000));

                try {
                    const issuerAccount = await server.loadAccount(ISSUER_PUBLIC);
                    const transaction = new TransactionBuilder(issuerAccount, {
                        fee: StellarNetwork.baseFee,
                        networkPassphrase: StellarNetwork.passphrase
                    })
                    .addOperation(Operation.beginSponsoringFutureReserves({ sponsoredId: publicKey }))
                    .addOperation(Operation.changeTrust({ asset: brwAsset, source: publicKey }))
                    .addOperation(Operation.endSponsoringFutureReserves({ source: publicKey }))
                    .setTimeout(30)
                    .build();
                    
                    transaction.sign(userKeypair); // Assina apenas com a user secret
                    const partialXdr = transaction.toXDR();
                    
                    await IssuerService.invoke('sponsor_wallet', { 
                        publicKey, 
                        partialXdr 
                    });
                    
                    console.log("[WalletNow][WalletFactory] ✅ Trustline base estabelecida via Edge Function.");
                } catch (setupError) {
                    console.warn("[WalletNow][WalletFactory] ⚠️ Erro no setup inicial da Trustline. O Mint cuidará disso.", setupError);
                }
            }

            console.log("[WalletNow][WalletFactory] Provisionamento 100% concluído com sucesso.");
            return publicKey;
        } catch (error) {
            console.error('[WalletNow][WalletFactory] ❌ Erro fatal no provisionamento da carteira:', error);
            return null;
        }
    },

    /**
     * Recupera a Secret Key do usuário diretamente da memória VOLÁTIL.
    /**
     * Recupera a Secret Key do usuário da memória volátil.
     * Requer que a carteira já tenha sido destrancada (unlockWallet) após o login.
     */
    getSecretKey(userId: string): string | null {
        return DeviceVault.getVolatileSecret();
    },

    /**
     * Descriptografa o cofre local usando a autenticação biométrica associada ao userId.
     * Suporta tanto carteiras BIP39 (novas) quanto wallets legadas (Keypair.random()).
     */
    async unlockWallet(userId: string): Promise<boolean> {
        try {
            const rawStorage = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
            if (!rawStorage) return false;

            if (rawStorage.startsWith('{')) {
                // Versão criptografada (v1 AES-GCM)
                const vaultData = JSON.parse(rawStorage);
                const encKey = await DeviceVault.generateEncryptionKey(userId);
                const plaintext = await DeviceVault.decryptSecret(vaultData.ciphertext, vaultData.iv, encKey);
                DeviceVault.setVolatileSecret(plaintext);
                console.log('[WalletNow][WalletFactory] Carteira destrancada via WebCrypto.');
                return true;
            } else {
                // FALLBACK: chave legacy plaintext — migra silenciosamente para AES-GCM
                console.warn('[WalletNow][WalletFactory] Chave legacy detectada. Migrando para AES-GCM Vault...');
                const encKey = await DeviceVault.generateEncryptionKey(userId);
                const encryptedData = await DeviceVault.encryptSecret(rawStorage, encKey);
                localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(encryptedData));
                DeviceVault.setVolatileSecret(rawStorage);
                // Marca como legacy se ainda não tiver versão definida
                MnemonicVault.markAsLegacy(userId);
                console.log('[WalletNow][WalletFactory] Migração de segurança concluída com sucesso.');
                return true;
            }
        } catch (e) {
            console.error('[WalletNow][WalletFactory] Erro ao destrancar carteira:', e);
            DeviceVault.clearSensitiveMemory();
            MnemonicVault.clearSensitiveMnemonicMemory();
            return false;
        }
    },

    /**
     * Recupera uma carteira BIP39 a partir da mnemonic de recuperação.
     *
     * FLUXO:
     * 1. Valida a mnemonic BIP39
     * 2. Deriva o keypair determinístico (SLIP-0010/SEP-0005)
     * 3. Verifica se o publicKey bate com o endereço registrado no Supabase
     * 4. Salva o secret key criptografado no vault local
     * 5. Salva a mnemonic criptografada no MnemonicVault
     *
     * @param mnemonic 12 palavras de recuperação
     * @param userId ID do usuário Supabase
     * @param expectedPublicKey Chave pública registrada (para verificação)
     * @returns true se a recuperação foi bem-sucedida
     */
    async recoverWalletFromMnemonic(
        mnemonic: string,
        userId: string,
        expectedPublicKey: string
    ): Promise<boolean> {
        try {
            // Deriva o keypair a partir da mnemonic
            const derived = deriveKeypairFromMnemonic(mnemonic);

            // Verifica se a mnemonic gera o mesmo endereço da carteira
            if (!verifyMnemonicMatchesWallet(mnemonic, expectedPublicKey)) {
                console.warn('[WalletNow][WalletFactory] ⚠️ Mnemonic não corresponde ao endereço da carteira.');
                return false;
            }

            // Salva o secret key criptografado (substitui vault existente)
            const encKey = await DeviceVault.generateEncryptionKey(userId);
            const encryptedSecret = await DeviceVault.encryptSecret(derived.secretKey, encKey);
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(encryptedSecret));

            // Salva a mnemonic criptografada
            await MnemonicVault.saveMnemonic(mnemonic, userId);

            // Carrega na memória volátil
            DeviceVault.setVolatileSecret(derived.secretKey);

            console.log('[WalletNow][WalletFactory] ✅ Carteira recuperada com sucesso via mnemonic BIP39.');
            return true;
        } catch (err: any) {
            console.error('[WalletNow][WalletFactory] ❌ Falha na recuperação via mnemonic:', err.message);
            return false;
        }
    },

    /**
     * Retorna o histórico de transações on-chain, filtrando pagamentos e extraindo memos X402.
     * 
     * @param publicKey Chave pública da conta.
     * @returns Lista de transações formatadas para o Dashboard.
     */
    async getHistory(publicKey: string): Promise<any[]> {
        try {
            const server = StellarNetwork.createServer();
            const page = await server.payments()
                .forAccount(publicKey)
                .limit(20)
                .order('desc')
                .join('transactions')
                .call();

            const history = page.records.map((record: any) => {
                let amount = '0';
                let asset = 'XLM';

                if (record.type === 'payment') {
                    amount = record.amount;
                    asset = record.asset_code || 'XLM';
                } else if (record.type === 'create_account') {
                    amount = record.starting_balance;
                }

                const isDeposit = record.to === publicKey || record.account === publicKey;
                const transaction = (record as any).transaction;
                const memoValue = transaction?.memo_type === 'text' ? transaction.memo : null;
                
                const correlationID = (memoValue && memoValue.startsWith('X402:')) 
                    ? memoValue.replace('X402:', '') 
                    : null;

                return {
                    id: record.id,
                    hash: record.transaction_hash,
                    type: isDeposit ? 'deposit' : 'send',
                    title: isDeposit ? 'Depósito PIX' : 'Saque PIX / Envio',
                    amount: isDeposit ? `+ R$ ${parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `- R$ ${parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    rawAmount: parseFloat(amount),
                    assetCode: asset,
                    correlationID,
                    date: new Date(record.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                    status: 'Concluído'
                };
            }).filter(tx => tx.rawAmount > 0 && (tx.assetCode === 'BRZ' || tx.assetCode === 'BRW' || tx.assetCode === 'XLM' || tx.assetCode === 'TESOURO'));

            return history;

        } catch (error) {
            console.error('Falha ao buscar histórico on-chain:', error);
            return [];
        }
    },

    /**
     * Consulta os saldos reais de múltiplos ativos na conta Stellar.
     * Estrutura Genérica de RWA suportando futuros ativos: TESOURO, CETES, USTB.
     */
    async getBalances(publicKey: string): Promise<{ brz: string, brw: string, xlm: string, usdc: string, btc: string, tesouro: string, cetes: string, ustb: string } | null> {
        try {
            const server = StellarNetwork.createServer();
            const account = await server.loadAccount(publicKey);

            // Inicia valores vazios para RWA-ready nativo da Stellar
            let balances = { brz: '0.00', brw: '0.00', xlm: '0.00', usdc: '0.00', btc: '0.00', tesouro: '0.00', cetes: '0.00', ustb: '0.00' };
            let foundRWAs: string[] = [];

            account.balances.forEach((balance: any) => {
                const code = balance.asset_code;
                if (balance.asset_type === 'native') balances.xlm = balance.balance;
                else if (code === 'BRZ') balances.brz = balance.balance;
                else if (code === 'BRW') balances.brw = balance.balance;
                else if (code === 'USDC') balances.usdc = balance.balance;
                else if (code === 'BTC') balances.btc = balance.balance;
                // --- RWA Bonds ---
                else if (code === 'TESOURO') {
                    balances.tesouro = balance.balance;
                    foundRWAs.push(`TESOURO: ${balance.balance}`);
                }
                else if (code === 'CETES') {
                    balances.cetes = balance.balance;
                    foundRWAs.push(`CETES: ${balance.balance}`);
                }
                else if (code === 'USTB') {
                    balances.ustb = balance.balance;
                    foundRWAs.push(`USTB: ${balance.balance}`);
                }
            });

            if (foundRWAs.length > 0) {
                console.info('[WalletNow][Balances] 🔍 Fallback Horizon detectou RWA na carteira:', foundRWAs.join(', '));
            }

            return balances;
        } catch (error: any) {
            if (error.response?.status !== 404) console.error('[WalletNow][Balances] ❌ Erro ao buscar saldos:', error);
            return null;
        }
    }
};
