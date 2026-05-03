// payment.service.ts
import { Op, WhereOptions } from "sequelize";
import { sequelize } from "../config/database";
import Payment, { PaymentMethod, PaymentStatus } from "../models/payment.model";
import Entry from "../models/entry.model";
import User from "../models/user.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
  totalAmount: number;
  collectedAmount: number;
}

interface PaginationOptions {
  skip?: number;
  limit?: number;
}

interface PaymentListOptions extends PaginationOptions {
  status?: PaymentStatus;
  method?: PaymentMethod;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPaymentWithTournament(paymentId: number): Promise<Payment> {
  const payment = await Payment.findByPk(paymentId, {
    include: [
      {
        model: Entry,
        include: [{ model: TournamentCategory, include: [{ model: Tournament }] }],
      },
    ],
  });
  if (!payment) throw new Error("Payment not found");
  return payment;
}

async function getEntryWithCategory(entryId: number): Promise<Entry> {
  const entry = await Entry.findByPk(entryId, {
    include: [{ model: TournamentCategory, include: [{ model: Tournament }] }],
  });
  if (!entry) throw new Error("Entry not found");
  return entry;
}

async function getCategoryWithTournament(
  categoryId: number
): Promise<TournamentCategory> {
  const category = await TournamentCategory.findByPk(categoryId, {
    include: [{ model: Tournament }],
  });
  if (!category) throw new Error("Category not found");
  return category;
}

function assertOrganizer(userId: number, tournament: Tournament): void {
  if (tournament.createdBy !== userId) {
    throw new Error("Only the tournament organizer can perform this action");
  }
}

function assertHasEntryFee(category: TournamentCategory): void {
  if (!category.entryFee || category.entryFee <= 0) {
    throw new Error("This category does not require payment");
  }
}

function assertAmountMatchesFee(amount: number, entryFee: number): void {
  if (Math.abs(amount - entryFee) > 0.01) {
    throw new Error(`Payment amount must equal entry fee of ${entryFee}`);
  }
}

// confirmer include — dùng lại nhiều chỗ
const CONFIRMER_INCLUDE = {
  model: User,
  as: "confirmer",
  attributes: ["id", "firstName", "lastName", "email"],
};

// ─── Service ──────────────────────────────────────────────────────────────────

export class PaymentService {
  // ── 1. Tạo payment (bank_transfer hoặc online) ────────────────────────────

  /**
   * Tạo payment record cho entry.
   * Cash không đi qua đây — dùng recordCashPayment thay thế.
   */
  async createPayment(
    entryId: number,
    amount: number,
    method: Exclude<PaymentMethod, "cash">
  ): Promise<Payment> {
    const entry = await getEntryWithCategory(entryId);
    assertHasEntryFee(entry.category!);
    assertAmountMatchesFee(amount, entry.category!.entryFee!);

    const existing = await Payment.findOne({
      where: { entryId, status: { [Op.in]: ["pending", "completed"] } },
    });
    if (existing) throw new Error("A pending or completed payment already exists for this entry");

    return await Payment.create({ entryId, amount, method, status: "pending" });
  }

  // ── 2. Xác nhận thanh toán ────────────────────────────────────────────────

  async confirmPayment(
    paymentId: number,
    organizerId: number,
    options: { proofImageUrl?: string; transactionRef?: string } = {}
  ): Promise<Payment> {
    const payment = await getPaymentWithTournament(paymentId);
    assertOrganizer(organizerId, payment.entry!.category!.tournament!);

    if (payment.status !== "pending") {
      throw new Error("Only pending payments can be confirmed");
    }
    if (payment.method === "bank_transfer" && !options.proofImageUrl) {
      throw new Error("Proof image is required for bank transfer confirmation");
    }
    if (payment.method === "online" && !options.transactionRef) {
      throw new Error("Transaction reference is required for online payment confirmation");
    }
    if (payment.method === "cash") {
      throw new Error("Cash payments are confirmed via recordCashPayment");
    }

    return await payment.update({
      status: "completed",
      confirmedBy: organizerId,
      confirmedAt: new Date(),
      ...(options.proofImageUrl && { proofImageUrl: options.proofImageUrl }),
      ...(options.transactionRef && { transactionRef: options.transactionRef }),
    });
  }

  // ── 3. Từ chối thanh toán ─────────────────────────────────────────────────

  async rejectPayment(paymentId: number, organizerId: number): Promise<Payment> {
    const payment = await getPaymentWithTournament(paymentId);
    assertOrganizer(organizerId, payment.entry!.category!.tournament!);

    if (payment.status !== "pending") {
      throw new Error("Only pending payments can be rejected");
    }

    return await payment.update({ status: "failed" });
  }

  // ── 4. Hoàn tiền ──────────────────────────────────────────────────────────

  async refundPayment(paymentId: number, organizerId: number): Promise<Payment> {
    const payment = await getPaymentWithTournament(paymentId);
    assertOrganizer(organizerId, payment.entry!.category!.tournament!);

    if (payment.status !== "completed") {
      throw new Error("Only completed payments can be refunded");
    }

    return await payment.update({ status: "refunded", refundedAt: new Date() });
  }

  // ── 5. Ghi nhận thanh toán tiền mặt ──────────────────────────────────────

  /**
   * Organizer ghi nhận tiền mặt — tạo và confirm ngay trong 1 bước.
   */
  async recordCashPayment(
    entryId: number,
    organizerId: number,
    amount: number
  ): Promise<Payment> {
    const entry = await getEntryWithCategory(entryId);
    assertHasEntryFee(entry.category!);
    assertAmountMatchesFee(amount, entry.category!.entryFee!);
    assertOrganizer(organizerId, entry.category!.tournament!);

    const existing = await Payment.findOne({
      where: { entryId, method: "cash" },
    });
    if (existing) throw new Error("Cash payment already recorded for this entry");

    return await Payment.create({
      entryId,
      amount,
      method: "cash",
      status: "completed",
      confirmedBy: organizerId,
      confirmedAt: new Date(),
    });
  }

  // ── 6. Ghi nhận thanh toán online (webhook) ───────────────────────────────

  /**
   * Gọi từ webhook của Stripe/VNPay khi thanh toán thành công.
   */
  async recordOnlinePayment(
    entryId: number,
    amount: number,
    transactionRef: string
  ): Promise<Payment> {
    const entry = await getEntryWithCategory(entryId);
    assertHasEntryFee(entry.category!);

    const existing = await Payment.findOne({
      where: { transactionRef, status: "completed" },
    });
    if (existing) throw new Error("This transaction has already been processed");

    return await Payment.create({
      entryId,
      amount,
      method: "online",
      status: "completed",
      transactionRef,
      confirmedAt: new Date(),
    });
  }

  // ── 7. Upload minh chứng chuyển khoản ────────────────────────────────────

  async uploadPaymentProof(
    paymentId: number,
    userId: number,
    proofImageUrl: string
  ): Promise<Payment> {
    const payment = await getPaymentWithTournament(paymentId);

    // Chỉ captain của entry hoặc organizer mới được upload
    const isCaptain = payment.entry?.captainId === userId;
    const isOrganizer =
      payment.entry?.category?.tournament?.createdBy === userId;

    if (!isCaptain && !isOrganizer) {
      throw new Error("Only the team captain or organizer can upload payment proof");
    }
    if (payment.method !== "bank_transfer") {
      throw new Error("Proof image is only applicable for bank transfer payments");
    }
    if (payment.status !== "pending") {
      throw new Error("Can only update proof for pending payments");
    }

    return await payment.update({ proofImageUrl });
  }

  // ── 8. Get payment theo ID ────────────────────────────────────────────────

  async getPaymentById(paymentId: number): Promise<Payment> {
    const payment = await Payment.findByPk(paymentId, {
      include: [
        { model: Entry, include: [{ model: TournamentCategory }] },
        CONFIRMER_INCLUDE,
      ],
    });
    if (!payment) throw new Error("Payment not found");
    return payment;
  }

  // ── 9. Get payments theo entry ────────────────────────────────────────────

  async getPaymentsByEntry(
    entryId: number,
    options: PaymentListOptions = {}
  ): Promise<{ rows: Payment[]; count: number }> {
    const { skip = 0, limit = 10, status } = options;

    const where: WhereOptions = { entryId };
    if (status) where.status = status;

    return await Payment.findAndCountAll({
      where,
      include: [CONFIRMER_INCLUDE],
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  // ── 10. Get payments theo category ───────────────────────────────────────

  async getPaymentsByCategory(
    categoryId: number,
    organizerId: number,
    options: PaymentListOptions = {}
  ): Promise<{ rows: Payment[]; count: number }> {
    const { skip = 0, limit = 10, status, method } = options;

    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament!);

    const where: WhereOptions = {};
    if (status) where.status = status;
    if (method) where.method = method;

    return await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Entry,
          where: { categoryId },
          required: true,
          attributes: ["id", "captainId"],
        },
        CONFIRMER_INCLUDE,
      ],
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  // ── 11. Get pending payments ──────────────────────────────────────────────

  async getPendingPayments(
    organizerId: number,
    categoryId: number,
    options: PaginationOptions & { method?: PaymentMethod } = {}
  ): Promise<{ rows: Payment[]; count: number }> {
    const { skip = 0, limit = 10, method } = options;

    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament!);

    const where: WhereOptions = { status: "pending" };
    if (method) where.method = method;

    return await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Entry,
          where: { categoryId },
          required: true,
          include: [{ model: TournamentCategory }],
        },
      ],
      offset: skip,
      limit,
      order: [["createdAt", "ASC"]], // cũ nhất trước để xử lý theo thứ tự
      distinct: true,
    });
  }

  // ── 12. Get payment stats theo category ──────────────────────────────────

  async getPaymentStats(
    categoryId: number,
    organizerId: number
  ): Promise<PaymentStats> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament!);

    const payments = await Payment.findAll({
      include: [
        { model: Entry, where: { categoryId }, required: true, attributes: [] },
      ],
      attributes: ["status", "amount"],
    });

    return payments.reduce<PaymentStats>(
      (acc, p) => {
        const amount = Number(p.amount);
        acc.total += 1;
        acc.totalAmount += amount;
        acc[p.status] += 1;
        if (p.status === "completed") acc.collectedAmount += amount;
        return acc;
      },
      {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        refunded: 0,
        totalAmount: 0,
        collectedAmount: 0,
      }
    );
  }
}

export default new PaymentService();