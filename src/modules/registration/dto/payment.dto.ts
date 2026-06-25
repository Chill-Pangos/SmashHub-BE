// Payment DTOs
export interface CreatePaymentDto {
  entryId: number;
  amount: number;
}

export interface UpdatePaymentDto {
  amount?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  proofImageUrl?: string;
  refundProofImageUrl?: string;
}

export interface ConfirmPaymentDto {}

export interface PaymentResponseDto {
  id: number;
  entryId: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  proofImageUrl?: string;
  confirmedBy?: number;
  confirmedAt?: Date;
  refundedAt?: Date;
  refundProofImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
