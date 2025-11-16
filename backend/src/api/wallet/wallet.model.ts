export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: 'active' | 'suspended' | 'closed';
  created_at: Date;
  updated_at: Date;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference?: string;
  external_reference?: string;
  mtn_reference_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BlockchainWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  public_key: string;
  encrypted_private_key: string;
  wallet_type: 'user' | 'company' | 'agent' | 'system';
  currency: string;
  balance: number;
  status: 'active' | 'suspended' | 'closed';
  created_at: Date;
  updated_at: Date;
}

export interface BlockchainTransaction {
  id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  transaction_type: 'transfer' | 'deposit' | 'withdrawal' | 'payment' | 'refund';
  currency: string;
  hash: string;
  block_number: number;
  gas_fee: number;
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: any;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}