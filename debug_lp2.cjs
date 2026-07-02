const { Keypair, Asset, Networks, Horizon, TransactionBuilder, Operation, LiquidityPoolAsset } = require('@stellar/stellar-sdk');

async function main() {
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const pair = Keypair.random();
    await fetch(`https://friendbot.stellar.org?addr=${pair.publicKey()}`);
    let account = await server.loadAccount(pair.publicKey());
    
    const assetA = Asset.native();
    const assetB = new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    
    let txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: Networks.TESTNET });
    txBuilder.addOperation(Operation.changeTrust({ asset: assetB }));
    const lpAsset = new LiquidityPoolAsset(assetA, assetB, 30);
    txBuilder.addOperation(Operation.changeTrust({ asset: lpAsset }));
    let tx = txBuilder.setTimeout(30).build();
    tx.sign(pair);
    await server.submitTransaction(tx);
    
    account = await server.loadAccount(pair.publicKey());
    
    const pool = await server.liquidityPools().liquidityPoolId('4cd1f6defba237eecbc5fefe259f89ebc4b5edd49116beb5536c4034fc48d63f').call();
    const reserveXLM = parseFloat(pool.reserves.find(r => r.asset === 'native').amount);
    const reserveUSDC = parseFloat(pool.reserves.find(r => r.asset.includes('USDC')).amount);
    
    const amountXLM = "0.001";
    const reqUSDC = (0.001 * (reserveUSDC / reserveXLM)).toFixed(7);
    
    const diff = (parseFloat(reqUSDC) * 1.005).toFixed(7); // buffer applied!
    const ratio = 0.001 / parseFloat(reqUSDC);
    const maxXLMSell = (parseFloat(diff) * ratio * 1.2).toFixed(7);
    
    console.log(`reqUSDC: ${reqUSDC}, diff (buyAmount): ${diff}, maxXLMSell: ${maxXLMSell}`);
    
    txBuilder = new TransactionBuilder(account, { fee: '100000', networkPassphrase: Networks.TESTNET });
    txBuilder.addOperation(Operation.pathPaymentStrictReceive({
        sendAsset: assetA,
        sendMax: maxXLMSell,
        destination: pair.publicKey(),
        destAsset: assetB,
        destAmount: diff,
        path: []
    }));
    
    txBuilder.addOperation(Operation.liquidityPoolDeposit({
        liquidityPoolId: '4cd1f6defba237eecbc5fefe259f89ebc4b5edd49116beb5536c4034fc48d63f',
        maxAmountA: amountXLM,
        maxAmountB: reqUSDC,
        minPrice: '0.0001', 
        maxPrice: '1000.0', 
    }));
    
    tx = txBuilder.setTimeout(30).build();
    tx.sign(pair);
    
    try {
        const res = await server.submitTransaction(tx);
        console.log("SUCCESS:", res.hash);
    } catch (e) {
        let err = e.response ? JSON.stringify(e.response.data.extras) : e.message;
        console.log("FAIL:", err);
    }
}
main();
