const { Keypair, Asset, Networks, Horizon, TransactionBuilder, Operation, LiquidityPoolAsset } = require('@stellar/stellar-sdk');

async function main() {
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const pair = Keypair.random();
    
    await fetch(`https://friendbot.stellar.org?addr=${pair.publicKey()}`);
    const account = await server.loadAccount(pair.publicKey());
    
    const assetA = Asset.native();
    const assetB = new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    
    let txBuilder = new TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: Networks.TESTNET
    });
    
    txBuilder.addOperation(Operation.changeTrust({ asset: assetB }));
    
    const amountXLM = "10.0";
    const amountUSDC = "0.2";
    
    txBuilder.addOperation(Operation.pathPaymentStrictReceive({
        sendAsset: assetA,
        sendMax: '10.5',
        destination: pair.publicKey(),
        destAsset: assetB,
        destAmount: amountUSDC,
        path: []
    }));
    
    const lpAsset = new LiquidityPoolAsset(assetA, assetB, 30);
    txBuilder.addOperation(Operation.changeTrust({ asset: lpAsset }));
    
    txBuilder.addOperation(Operation.liquidityPoolDeposit({
        liquidityPoolId: '4cd1f6defba237eecbc5fefe259f89ebc4b5edd49116beb5536c4034fc48d63f',
        maxAmountA: amountXLM,
        maxAmountB: amountUSDC,
        minPrice: '0.0001', 
        maxPrice: '1000.0', 
    }));
    
    const tx = txBuilder.setTimeout(30).build();
    tx.sign(pair);
    
    try {
        const res = await server.submitTransaction(tx);
        console.log("SUCCESS:", res.hash);
    } catch (e) {
        console.log("FAIL:", e.response ? JSON.stringify(e.response.data.extras) : e.message);
    }
}
main();
