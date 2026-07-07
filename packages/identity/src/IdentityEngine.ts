/**
 * @walletnow/identity — IdentityEngine (Stub)
 *
 * Implementação principal do Identity Engine.
 * Responsável por orquestrar os AuthAdapters e gerenciar a sessão ativa.
 */

import type {
  IIdentityEngine,
  IAuthAdapter,
  Identity,
  IdentityId,
  IdentitySession,
  IdentityAuthResult,
  CreateIdentityParams,
} from '@walletnow/contracts';
import { NotImplementedError } from '@walletnow/contracts';
import type { ISecureStorage } from '@walletnow/storage';
import type { IStellarSigner } from '@walletnow/crypto';

export class IdentityEngine implements IIdentityEngine {
  private _status: IIdentityEngine['status'] = 'unauthenticated';
  private _session: IdentitySession | null = null;
  private _adapters = new Map<string, IAuthAdapter>();
  
  constructor(
    private readonly secureStorage: ISecureStorage,
    private readonly signerFactory?: () => IStellarSigner
  ) {}

  get status(): IIdentityEngine['status'] {
    return this._status;
  }

  get session(): IdentitySession | null {
    return this._session;
  }

  get publicKey(): string | null {
    return this._session?.publicKey ?? null;
  }

  use(adapter: IAuthAdapter): void {
    this._adapters.set(adapter.method, adapter);
  }

  async create(params: CreateIdentityParams): Promise<IdentityAuthResult> {
    const adapter = this._adapters.get(params.method);
    if (!adapter) {
      throw new Error(`[IdentityEngine] No adapter registered for auth method: ${params.method}`);
    }

    this._status = 'authenticating';
    try {
      const result = await adapter.create(params);
      
      this._session = result.session;
      this._status = 'authenticated';
      
      // Store in secure storage
      const encoder = new TextEncoder();
      await this.secureStorage.set(`identity:${result.identity.id}`, encoder.encode(JSON.stringify(result.identity)));
      await this.secureStorage.set('active_session', encoder.encode(JSON.stringify(result.session)));
      
      return result;
    } catch (error) {
      this._status = 'unauthenticated';
      throw error;
    }
  }

  async authenticate(identityId: string): Promise<IdentityAuthResult> {
    throw new NotImplementedError('IdentityEngine', 'authenticate');
  }

  async list(): Promise<Identity[]> {
    throw new NotImplementedError('IdentityEngine', 'list');
  }

  async get(_identityId: string): Promise<Identity | null> {
    throw new NotImplementedError('IdentityEngine', 'get');
  }

  async setActive(_identityId: string): Promise<Identity> {
    throw new NotImplementedError('IdentityEngine', 'setActive');
  }

  async remove(_identityId: string): Promise<void> {
    throw new NotImplementedError('IdentityEngine', 'remove');
  }

  async lock(): Promise<void> {
    throw new NotImplementedError('IdentityEngine', 'lock');
  }

  async unlock(_identityId: string): Promise<IdentityAuthResult> {
    throw new NotImplementedError('IdentityEngine', 'unlock');
  }

  async logout(): Promise<void> {
    this._session = null;
    this._status = 'unauthenticated';
    await this.secureStorage.remove('active_session');
  }

  async sign(payload: Uint8Array): Promise<Uint8Array> {
    if (!this._session) {
      throw new Error('[IdentityEngine] Cannot sign: no active session.');
    }
    
    const adapter = this._adapters.get(this._session.method);
    if (!adapter) {
      throw new Error(`[IdentityEngine] Cannot sign: no adapter found for session method ${this._session.method}`);
    }
    
    return await adapter.sign(this._session.identityId, payload);
  }
}
