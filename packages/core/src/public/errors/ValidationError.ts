import { WalletNowError } from './WalletNowError.js';
export class ValidationError extends WalletNowError {
  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(code, message, context);
    this.name = 'ValidationError';
  }
}
