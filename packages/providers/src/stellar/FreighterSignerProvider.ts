import type { ISignerProvider } from '@walletnow/core';
import type { SignParams, SignatureResult } from '@walletnow/core';
import { getAddress, requestAccess, signTransaction, isConnected } from '@stellar/freighter-api';

/**
 * Freighter Signer Provider (ISignerProvider)
 * Adota a mesma interface de assinaturas, porém chama a extensão Freighter.
 */
export class FreighterSignerProvider implements ISignerProvider {
  
  async getPublicKey(): Promise<string> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Freighter extension is not installed or disconnected.');
    }
    const response = await getAddress();
    if (response.error) {
      const access = await requestAccess();
      if (access.error) throw new Error(access.error);
      return access.address;
    }
    return response.address;
  }

  async sign(params: SignParams): Promise<SignatureResult> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Freighter extension is not installed.');
    }

    if (!params.payloadXdr || !params.networkPassphrase) {
      throw new Error('payloadXdr and networkPassphrase are required for Freighter signing.');
    }

    // A API do Freighter requer a rede explícita
    const network = params.networkPassphrase.includes('Public Global') ? 'PUBLIC' : 'TESTNET';
    
    try {
      // Retorna a transação assinada em XDR
      const signedXdrResponse = await signTransaction(params.payloadXdr, {
        networkPassphrase: params.networkPassphrase,
      });
      
      if (typeof signedXdrResponse === 'object' && 'error' in signedXdrResponse && signedXdrResponse.error) {
        throw new Error(signedXdrResponse.error);
      }

      let finalXdr: string;
      if (typeof signedXdrResponse === 'string') {
        finalXdr = signedXdrResponse;
      } else {
        finalXdr = (signedXdrResponse as any).signedTxXdr;
      }

      return {
        // Freighter não expõe apenas a assinatura raw, expõe o XDR
        signature: new Uint8Array([]), 
        publicKey: await this.getPublicKey(),
        signerType: 'external',
        signedAt: Date.now(),
        signedPayloadXdr: finalXdr,
      };
    } catch (e) {
      throw new Error(`Freighter signing failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    // Tenta acessar a extensão do Freighter.
    // O SDK deles já lida com checagem de ambiente, mas envolvemos em try/catch por precaução SSR.
    try {
      const result = await isConnected();
      return result.isConnected;
    } catch {
      return false;
    }
  }
}
