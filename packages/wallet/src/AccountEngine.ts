/**
 * @walletnow/wallet — AccountEngine (Stub)
 *
 * Implementação principal do Account Engine.
 * Responsável por buscar o estado on-chain das contas via Horizon.
 */

import type { IAccountEngine, StellarAccountState } from '@walletnow/contracts';
import { NotImplementedError } from '@walletnow/contracts';
import type { IStorage } from '@walletnow/storage';

export class AccountEngine implements IAccountEngine {
  constructor(
    private readonly horizonUrl: string,
    private readonly cache?: IStorage
  ) {}

  async existsOnChain(_publicKey: string): Promise<boolean> {
    throw new NotImplementedError('AccountEngine', 'existsOnChain');
  }

  async getState(_publicKey: string): Promise<StellarAccountState> {
    throw new NotImplementedError('AccountEngine', 'getState');
  }

  async sync(_publicKey: string): Promise<StellarAccountState> {
    throw new NotImplementedError('AccountEngine', 'sync');
  }
}
