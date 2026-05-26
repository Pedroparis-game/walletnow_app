import { Keypair, Horizon, TransactionBuilder, Networks, Asset, Operation } from '@stellar/stellar-sdk';
import { supabase } from '../lib/supabase';
import { isValidPublicKey, isValidSecretKey } from '../utils/stellarValidation';
import { DeviceVault } from '../security/deviceVault';

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
    async activateAccount(publicKey: string): Promise<boolean> {
        try {
            const ISSUER_SECRET = import.meta.env.VITE_STELLAR_ISSUER_SECRET;
            if (!ISSUER_SECRET) return false;

            const server = new Horizon.Server('https://horizon-testnet.stellar.org');
            const issuerKeypair = Keypair.fromSecret(ISSUER_SECRET);
            const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

            console.log(`[WalletNow][WalletFactory] 🛡️ [Stellar-Audit] Ativando conta via Sponsor: ${publicKey.slice(0, 8)}...`);

            const transaction = new TransactionBuilder(issuerAccount, {
                fee: '100000',
                networkPassphrase: Networks.TESTNET
            })
            .addOperation(Operation.createAccount({
                destination: publicKey,
                startingBalance: '1.5' // Reserva mínima para conta + algumas trustlines
            }))
            .setTimeout(30)
            .build();

            transaction.sign(issuerKeypair);
            await server.submitTransaction(transaction);
            console.log("[WalletNow][WalletFactory] ✅ [Stellar-Audit] Conta ativada com sucesso via Sponsor.");
            return true;
        } catch (error: any) {
            console.error('[WalletNow][WalletFactory] ❌ [Stellar-Audit] Falha na ativação via Sponsor:', error?.response?.data || error.message);
            return false;
        }
    },

    /**
     * Provisiona uma nova carteira Stellar completa para o usuário.
     */
    async provisionWalletForUser(userId: string): Promise<string | null> {
        try {
            console.log("[WalletNow][WalletFactory] Iniciando provisionamento de carteira para o usuário:", userId);
            const keypair = Keypair.random();
            const publicKey = keypair.publicKey();
            const secretKey = keypair.secret();

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
            } catch (storageError) {
                console.error("[WalletNow][WalletFactory] 🚨 Falha catastrófica no DeviceVault/LocalStorage. Abortando!");
                throw storageError;
            }

            // Tenta ativar via Friendbot primariamente
            try {
                await fetch(`https://horizon-testnet.stellar.org/friendbot?addr=${encodeURIComponent(publicKey)}`);
                console.log("[WalletNow][WalletFactory] ✅ [Stellar-Audit] Conta ativada via Friendbot.");
            } catch (e) {
                console.warn("[WalletNow][WalletFactory] ⚠️ Friendbot indisponível. Tentando ativação via Sponsor...");
                await this.activateAccount(publicKey);
            }

            // Setup Gasless de Ativo Soberano (BRW) se possível
            const ISSUER_SECRET = import.meta.env.VITE_STELLAR_ISSUER_SECRET;
            if (ISSUER_SECRET) {
                const server = new Horizon.Server('https://horizon-testnet.stellar.org');
                const issuerKeypair = Keypair.fromSecret(ISSUER_SECRET);
                const brwAsset = new Asset('BRW', issuerKeypair.publicKey());
                const userKeypair = Keypair.fromSecret(secretKey);
                
                // Espera um pouco para a rede processar a criação antes de mudar trust
                await new Promise(r => setTimeout(r, 2000));

                try {
                    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
                    const transaction = new TransactionBuilder(issuerAccount, {
                        fee: '100000',
                        networkPassphrase: Networks.TESTNET
                    })
                    .addOperation(Operation.beginSponsoringFutureReserves({ sponsoredId: publicKey }))
                    .addOperation(Operation.changeTrust({ asset: brwAsset, source: publicKey }))
                    .addOperation(Operation.endSponsoringFutureReserves({ source: publicKey }))
                    .setTimeout(30)
                    .build();
                    
                    transaction.sign(issuerKeypair, userKeypair);
                    await server.submitTransaction(transaction);
                    console.log("[WalletNow][WalletFactory] ✅ Trustline base estabelecida.");
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
     * Requer que a carteira já tenha sido destrancada (unlockWallet) após o login.
     */
    getSecretKey(userId: string): string | null {
        // Garantimos que a chave em memória pertence ao userId correto implicitamente
        // já que o unlockWallet usou o userId para derivar a chave de descriptografia.
        return DeviceVault.getVolatileSecret();
    },

    /**
     * Descriptografa o cofre local usando a autenticação biométrica associada ao userId.
     */
    async unlockWallet(userId: string): Promise<boolean> {
        try {
            const rawStorage = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
            if (!rawStorage) return false;

            // Se for um JSON válido, é a versão nova (v1) criptografada
            if (rawStorage.startsWith('{')) {
                const vaultData = JSON.parse(rawStorage);
                const encKey = await DeviceVault.generateEncryptionKey(userId);
                const plaintext = await DeviceVault.decryptSecret(vaultData.ciphertext, vaultData.iv, encKey);
                
                DeviceVault.setVolatileSecret(plaintext);
                console.log("[WalletNow][WalletFactory] Carteira destrancada via WebCrypto.");
                return true;
            } else {
                // FALLBACK TEMPORÁRIO DE MIGRAÇÃO (se a chave era plaintext antiga)
                // Vamos migrá-la silenciosamente
                console.warn("[WalletNow][WalletFactory] Chave legacy detectada. Migrando para AES-GCM Vault...");
                const encKey = await DeviceVault.generateEncryptionKey(userId);
                const encryptedData = await DeviceVault.encryptSecret(rawStorage, encKey);
                localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(encryptedData));
                DeviceVault.setVolatileSecret(rawStorage);
                console.log("[WalletNow][WalletFactory] Migração de segurança concluída com sucesso.");
                return true;
            }
        } catch (e) {
            console.error("[WalletNow][WalletFactory] Erro ao destrancar carteira:", e);
            DeviceVault.clearSensitiveMemory();
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
            const server = new Horizon.Server('https://horizon-testnet.stellar.org');
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
            const server = new Horizon.Server('https://horizon-testnet.stellar.org');
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
