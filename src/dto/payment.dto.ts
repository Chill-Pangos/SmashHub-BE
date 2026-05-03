// Payment DTOs
export interface CreatePaymentDto {
  entryId: number;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'online';
  proofImageUrl?: string;
  transactionRef?: string;
}

export interface UpdatePaymentDto {
  amount?: number;
  method?: 'cash' | 'bank_transfer' | 'online';
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  proofImageUrl?: string;
  transactionRef?: string;
}

export interface ConfirmPaymentDto {
  status: 'completed' | 'failed' | 'refunded';
  proofImageUrl?: string;
  transactionRef?: string;
}

export interface PaymentResponseDto {
  id: number;
  entryId: number;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'online';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  proofImageUrl?: string;
  confirmedBy?: number;
  confirmedAt?: Date;
  transactionRef?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
