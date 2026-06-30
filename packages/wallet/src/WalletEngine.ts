/**
 * @walletnow/wallet — WalletEngine (Stub)
 *
 * Implementação principal do Wallet Engine.
 * Responsável por gerenciar Wallets Stellar (Self-custody ou Watch-only).
 */

import type {
  IWalletEngine,
  IWalletAdapter,
  StellarWallet,
  WalletId,
  CreateWalletParams,
  ImportWalletParams,
  IdentityId,
} from '@walletnow/contracts';
import { NotImplementedError } from '@walletnow/contracts';
import type { ISecureStorage } from '@walletnow/storage';
import type { IIdentityEngine } from '@walletnow/contracts';

export class WalletEngine implements IWalletEngine {
  private _active: StellarWallet | null = null;
  private _adapters = new Map<string, IWalletAdapter>();

  constructor(
    private readonly secureStorage: ISecureStorage,
    private readonly identity: IIdentityEngine
  ) {}

  get active(): StellarWallet | null {
    return this._active;
  }

  get publicKey(): string | null {
    return this._active?.publicKey ?? null;
  }

  use(adapter: IWalletAdapter): void {
    this._adapters.set(adapter.custodyType, adapter);
  }

  async create(_params: CreateWalletParams): Promise<StellarWallet> {
    throw new NotImplementedError('WalletEngine', 'create');
  }

  async import(_params: ImportWalletParams): Promise<StellarWallet> {
    throw new NotImplementedError('WalletEngine', 'import');
  }

  async list(_identityId: IdentityId): Promise<StellarWallet[]> {
    throw new NotImplementedError('WalletEngine', 'list');
  }

  async get(_walletId: WalletId): Promise<StellarWallet | null> {
    throw new NotImplementedError('WalletEngine', 'get');
  }

  async setActive(_walletId: WalletId): Promise<StellarWallet> {
    throw new NotImplementedError('WalletEngine', 'setActive');
  }

  async remove(_walletId: WalletId): Promise<void> {
    throw new NotImplementedError('WalletEngine', 'remove');
  }

  async signTransaction(_xdr: string): Promise<string> {
    throw new NotImplementedError('WalletEngine', 'signTransaction');
  }
}
