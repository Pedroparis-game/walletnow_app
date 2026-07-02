import type {
  IIdentityEngine,
  IWalletEngine,
  IAccountEngine,
  Identity,
  IdentitySession,
  IdentityAuthResult,
  CreateIdentityParams,
  StellarWallet,
  StellarAccountState,
} from '@walletnow/contracts';

export class PlaygroundIdentityEngine implements IIdentityEngine {
  private _identities = new Map<string, Identity>();
  private _session: IdentitySession | null = null;
  private _counter = 0;

  get status(): IIdentityEngine['status'] { return this._session ? 'authenticated' : 'unauthenticated'; }
  get session(): IdentitySession | null { return this._session; }
  get publicKey(): string | null { return this._session?.publicKey ?? null; }

  use() {}

  async create(params: CreateIdentityParams): Promise<IdentityAuthResult> {
    const id = `play-identity-${++this._counter}`;
    const publicKey = `GPLAY${id.toUpperCase().replace(/-/g, '').slice(0, 50)}`;
    const identity: Identity = {
      id,
      authMethod: params.method,
      label: 'label' in params ? params.label : undefined,
      createdAt: Date.now(),
      lastAuthAt: Date.now(),
      isActive: true,
    };
    this._identities.set(id, identity);
    this._session = { identityId: id, publicKey, network: 'testnet', startedAt: Date.now(), expiresAt: null, method: params.method };
    return { identity, session: this._session, publicKey, authenticatedAt: Date.now() };
  }

  async authenticate(identityId: string): Promise<IdentityAuthResult> {
    const identity = this._identities.get(identityId);
    if (!identity) throw new Error('Not found');
    const publicKey = `GPLAY${identityId.toUpperCase().replace(/-/g, '').slice(0, 50)}`;
    this._session = { identityId, publicKey, network: 'testnet', startedAt: Date.now(), expiresAt: null, method: identity.authMethod };
    return { identity, session: this._session, publicKey, authenticatedAt: Date.now() };
  }

  async list(): Promise<Identity[]> { return Array.from(this._identities.values()); }
  async get(id: string): Promise<Identity | null> { return this._identities.get(id) ?? null; }
  async setActive(id: string): Promise<Identity> { return this._identities.get(id)!; }
  async remove(id: string): Promise<void> { this._identities.delete(id); }
  async lock(): Promise<void> { this._session = null; }
  async unlock(id: string): Promise<IdentityAuthResult> { return this.authenticate(id); }
  async logout(): Promise<void> { this._session = null; }
  async sign(payload: Uint8Array): Promise<Uint8Array> { return payload; }
}

export class PlaygroundWalletEngine implements IWalletEngine {
  private _wallets = new Map<string, StellarWallet>();
  private _counter = 0;

  get active(): StellarWallet | null { return Array.from(this._wallets.values()).find(w => w.isActive) ?? null; }
  get publicKey(): string | null { return this.active?.publicKey ?? null; }

  use() {}

  async create(params: any): Promise<StellarWallet> {
    const id = `play-wallet-${++this._counter}`;
    const publicKey = `GWALLET${id.toUpperCase().replace(/-/g, '').slice(0, 50)}`;
    const wallet: StellarWallet = {
      id,
      identityId: params.identityId,
      publicKey,
      network: params.network ?? 'testnet',
      custodyType: params.custodyType,
      label: params.label,
      createdAt: Date.now(),
      isActive: true,
    };
    this._wallets.set(id, wallet);
    return wallet;
  }

  async import(): Promise<StellarWallet> { throw new Error('not implemented'); }
  async list(id: string): Promise<StellarWallet[]> { return Array.from(this._wallets.values()).filter(w => w.identityId === id); }
  async get(id: string): Promise<StellarWallet | null> { return this._wallets.get(id) ?? null; }
  async setActive(id: string): Promise<StellarWallet> { return this._wallets.get(id)!; }
  async remove(id: string): Promise<void> { this._wallets.delete(id); }
  async signTransaction(xdr: string): Promise<string> { return `signed:${xdr}`; }
}

export class PlaygroundAccountEngine implements IAccountEngine {
  async existsOnChain(): Promise<boolean> { return false; }
  async getState(publicKey: string): Promise<StellarAccountState> {
    return {
      publicKey,
      exists: false,
      xlmBalance: '0',
      sequenceNumber: '0',
      subentryCount: 0,
      balances: [],
      signers: [],
      lastSyncAt: Date.now(),
    };
  }
  async sync(publicKey: string): Promise<StellarAccountState> { return this.getState(publicKey); }
}

export class PlaygroundGasStation {
  async hasQuota(): Promise<boolean> { return true; }
  async sponsorAccountCreation(publicKey: string): Promise<string> { return `play_tx_acc_${publicKey.slice(0, 8)}`; }
  async sponsorTrustlines(publicKey: string, assets: string[]): Promise<any> {
    return { txHash: `play_tx_trust_${publicKey.slice(0, 8)}`, configured: assets, failed: [] };
  }
}

export class PlaygroundTestnetFaucet {
  async activateAccount(publicKey: string): Promise<any> { return { txHash: `play_friendbot_${publicKey.slice(0, 8)}` }; }
  async fundTestTokens(publicKey: string, asset: string): Promise<any> { return { txHash: `play_fund_${asset}_${publicKey.slice(0, 8)}`, amount: '100' }; }
}

export class PlaygroundSessionPort {
  async createToken(userId: string, publicKey: string): Promise<string> { return `play_sess_${userId}_${publicKey.slice(0,8)}`; }
}

export class PlaygroundAnalyticsPort {
  async track(): Promise<void> {}
}
