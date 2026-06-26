import type { PaymentStatus } from "./models/payment.model";

export interface RegistrationEntrySummary {
  id: number;
  categoryId: number;
  captainId: number | null;
  name: string;
  requiredMemberCount: number | null;
  currentMemberCount: number;
  isConfirmed: boolean;
}

export interface RegistrationEntryMemberSummary {
  id: number;
  entryId: number;
  userId: number;
  eloAtEntry: number;
}

export interface RegistrationEntryWithMembers extends RegistrationEntrySummary {
  members: RegistrationEntryMemberSummary[];
}

export interface RegistrationPaymentSummary {
  id: number;
  entryId: number;
  status: PaymentStatus;
  amount: number | string;
}
