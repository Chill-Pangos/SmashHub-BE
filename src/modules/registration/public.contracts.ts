import type { PaymentStatus } from "./models/payment.model";

export interface RegistrationEntrySummary {
  id: number;
  categoryId: number;
  captainId: number | null;
  name: string;
  isAcceptingMembers: boolean;
  requiredMemberCount: number | null;
  currentMemberCount: number;
  isConfirmed: boolean;
  confirmedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RegistrationEntryMemberSummary {
  id: number;
  entryId: number;
  userId: number;
  eloAtEntry: number;
  createdAt?: Date;
  updatedAt?: Date;
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

export interface CompetitionEntrySummary extends RegistrationEntrySummary {}

export interface CompetitionEntryMemberSummary extends RegistrationEntryMemberSummary {
  entry?: CompetitionEntrySummary;
}

export interface CompetitionEntryWithMembers extends CompetitionEntrySummary {
  members: CompetitionEntryMemberSummary[];
}
