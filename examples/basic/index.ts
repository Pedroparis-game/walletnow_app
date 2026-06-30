/**
 * WalletNow OS — Exemplo Básico de Integração
 *
 * Demonstra como um builder usa o @walletnow/sdk
 * para criar uma identity, conectar uma wallet Stellar,
 * registrar providers e escutar eventos.
 *
 * Para rodar:
 *   npm install @walletnow/sdk
 *   npx tsx examples/basic/index.ts
 */

// Importação única — todo o WalletNow OS em um pacote
import { WalletNowOS } from '../../packages/sdk/src/index.js';

// ─── 1. Instanciar o OS ───────────────────────────────────────────────────────

const os = new WalletNowOS();

// ─── 2. Escutar eventos ANTES do boot ─────────────────────────────────────────

os.events.on('os.ready', ({ version }) => {
  console.log(`\n✅ WalletNow OS v${version} está pronto!\n`);
});

os.events.on('identity.created', ({ identityId, method }) => {
  console.log(`🪪 Identity criada: ${identityId} (método: ${method})`);
});

os.events.on('wallet.created', ({ walletId, publicKey, network }) => {
  console.log(`👛 Wallet criada na rede '${network}': ${publicKey}`);
  console.log(`   Wallet ID: ${walletId}`);
});

os.events.on('provider.registered', ({ id, name, capabilities }) => {
  console.log(`🔌 Provider registrado: ${name} (${id})`);
  console.log(`   Capabilities: ${capabilities.join(', ')}`);
});

os.events.on('swap.started', ({ assetIn, assetOut, amount, publicKey }) => {
  console.log(`🔄 Swap iniciado: ${amount} ${assetIn} → ${assetOut}`);
  console.log(`   Conta: ${publicKey}`);
});

// ─── 3. Registrar Providers (antes do boot é permitido) ───────────────────────

// Exemplo: como seria registrar o Soroswap quando o provider estiver implementado
// await os.register(new SoroswapProvider());
// await os.register(new DefindexProvider());
// await os.register(new EtherfuseProvider());

console.log(`📦 Providers registrados antes do boot: ${os.providers.size}`);

// ─── 4. Inicializar o OS ──────────────────────────────────────────────────────

await os.boot({
  network: 'testnet',
  debug: true,
});

// ─── 5. Usar os Engines ───────────────────────────────────────────────────────

console.log(`\n📊 Estado atual do OS: ${os.state}`);
console.log(`🌐 Rede ativa: ${os.network}`);
console.log(`📦 Providers registrados: ${os.providers.size}`);

// ─── 6. Listar providers por capability (quando registrados) ─────────────────

const swapProviders = os.providers.getByCapability('swap');
console.log(`\n🔄 Providers de Swap disponíveis: ${swapProviders.length}`);

const yieldProviders = os.providers.getByCapability('yield');
console.log(`📈 Providers de Yield disponíveis: ${yieldProviders.length}`);

// ─── 7. Shutdown ──────────────────────────────────────────────────────────────

await os.shutdown();
console.log(`\n⛔ WalletNow OS encerrado. Estado: ${os.state}`);
