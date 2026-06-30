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

  async create(_params: CreateIdentityParams): Promise<IdentityAuthResult> {
    throw new NotImplementedError('IdentityEngine', 'create');
  }

  async authenticate(_identityId: string): Promise<IdentityAuthResult> {
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
    throw new NotImplementedError('IdentityEngine', 'logout');
  }

  async sign(_payload: Uint8Array): Promise<Uint8Array> {
    throw new NotImplementedError('IdentityEngine', 'sign');
  }
}
