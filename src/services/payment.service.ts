import { Op, WhereOptions, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import Payment from "../models/payment.model";
import Entry from "../models/entry.model";
import User from "../models/user.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getEntryWithCategory(entryId: number): Promise<Entry> {
  const entry = await Entry.findByPk(entryId, {
    include: [{ model: TournamentCategory }],
  });
  if (!entry) throw new Error("Entry not found");
  return entry;
}

async function assertAdminOrOrganizer(
  userId: number,
  tournament: Tournament,
): Promise<void> {
  if (tournament.createdBy !== userId) {
    throw new Error("Only admin or tournament organizer can perform this action");
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PaymentService {
  /**
   * 1. Tạo payment record cho entry
   * Chỉ tạo được khi category có entryFee > 0
   */
  async createPayment(
    entryId: number,
    amount: number,
    method: "cash" | "bank_transfer" | "online",
  ): Promise<Payment> {
    const entry = await getEntryWithCategory(entryId);

    if (!entry.category?.entryFee || entry.category.entryFee <= 0) {
      throw new Error("This entry category does not require payment");
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      where: { entryId, status: { [Op.in]: ["pending", "completed"] } },
    });
    if (existingPayment) {
      throw new Error("Payment already exists for this entry");
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }
    if (Math.abs(amount - entry.category.entryFee) > 0.01) {
      throw new Error(`Payment amount must equal entry fee of ${entry.category.entryFee}`);
    }

    const payment = await Payment.create({
      entryId,
      amount,
      method,
      status: "pending",
    });

    return payment;
  }

  /**
   * 2. Xác nhận thanh toán (organizer approve)
   * Set status = completed, confirmedBy, confirmedAt
   */
  async confirmPayment(
    paymentId: number,
    organizerId: number,
    proofImageUrl?: string,
    transactionRef?: string,
  ): Promise<Payment> {
    const payment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: Entry,
          include: [{ model: TournamentCategory, include: [{ model: Tournament }] }],
        },
      ],
    });
    if (!payment) throw new Error("Payment not found");

    const tournament = payment.entry?.category?.tournament;
    if (!tournament) throw new Error("Tournament not found");

    await assertAdminOrOrganizer(organizerId, tournament);

    if (payment.status !== "pending") {
      throw new Error("Only pending payments can be confirmed");
    }

    // Validate method-specific requirements
    if (payment.method === "bank_transfer") {
      if (!proofImageUrl) {
        throw new Error("Proof image URL is required for bank transfer confirmations");
      }
    }

    if (payment.method === "online") {
      if (!transactionRef) {
        throw new Error("Transaction reference is required for online payment confirmations");
      }
    }

    return await payment.update({
      status: "completed",
      confirmedBy: organizerId,
      confirmedAt: new Date(),
      proofImageUrl: proofImageUrl ?? payment.proofImageUrl,
      transactionRef: transactionRef ?? payment.transactionRef,
    });
  }

  /**
   * 3. Từ chối thanh toán (organizer reject)
   * Set status = failed
   */
  async rejectPayment(paymentId: number, organizerId: number): Promise<Payment> {
    const payment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: Entry,
          include: [{ model: TournamentCategory, include: [{ model: Tournament }] }],
        },
      ],
    });
    if (!payment) throw new Error("Payment not found");

    const tournament = payment.entry?.category?.tournament;
    if (!tournament) throw new Error("Tournament not found");

    await assertAdminOrOrganizer(organizerId, tournament);

    if (payment.status !== "pending") {
      throw new Error("Only pending payments can be rejected");
    }

    return await payment.update({
      status: "failed",
    });
  }

  /**
   * 4. Hoàn tiền (refund)
   * Set status = refunded, refundedAt
   */
  async refundPayment(paymentId: number, organizerId: number): Promise<Payment> {
    const payment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: Entry,
          include: [{ model: TournamentCategory, include: [{ model: Tournament }] }],
        },
      ],
    });
    if (!payment) throw new Error("Payment not found");

    const tournament = payment.entry?.category?.tournament;
    if (!tournament) throw new Error("Tournament not found");

    await assertAdminOrOrganizer(organizerId, tournament);

    if (payment.status !== "completed") {
      throw new Error("Only completed payments can be refunded");
    }

    return await payment.update({
      status: "refunded",
      refundedAt: new Date(),
    });
  }

  /**
   * 5. Lấy payment theo ID
   */
  async getPaymentById(paymentId: number): Promise<Payment> {
    const payment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: Entry,
          include: [{ model: TournamentCategory }],
        },
        {
          model: User,
          as: "confirmer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });
    if (!payment) throw new Error("Payment not found");
    return payment;
  }

  /**
   * 6. Lấy danh sách payments của một entry
   */
  async getPaymentsByEntry(
    entryId: number,
    options: {
      skip?: number;
      limit?: number;
      status?: "pending" | "completed" | "failed" | "refunded";
    } = {},
  ): Promise<{ rows: Payment[]; count: number }> {
    const { skip = 0, limit = 10, status } = options;

    const where: WhereOptions = { entryId };
    if (status) {
      where.status = status;
    }

    return await Payment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "confirmer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  /**
   * 7. Lấy danh sách payments theo category (admin/organizer view)
   */
  async getPaymentsByCategory(
    categoryId: number,
    userId: number,
    options: {
      skip?: number;
      limit?: number;
      status?: "pending" | "completed" | "failed" | "refunded";
      method?: "cash" | "bank_transfer" | "online";
    } = {},
  ): Promise<{ rows: Payment[]; count: number }> {
    const { skip = 0, limit = 10, status, method } = options;

    // Get category with tournament to check permission
    const category = await TournamentCategory.findByPk(categoryId, {
      include: [{ model: Tournament }],
    });
    if (!category) throw new Error("Category not found");

    await assertAdminOrOrganizer(userId, category.tournament!);

    const where: WhereOptions = {};
    if (status) {
      where.status = status;
    }
    if (method) {
      where.method = method;
    }

    return await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Entry,
          where: { categoryId },
          required: true,
          attributes: ["id", "name", "captainId"],
        },
        {
          model: User,
          as: "confirmer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      offset: skip,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  /**
   * 8. Get payment stats by category (admin/organizer)
   */
  async getPaymentStats(categoryId: number, userId: number): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
    totalAmount: number;
    collectedAmount: number;
  }> {
    // Get category with tournament to check permission
    const category = await TournamentCategory.findByPk(categoryId, {
      include: [{ model: Tournament }],
    });
    if (!category) throw new Error("Category not found");

    await assertAdminOrOrganizer(userId, category.tournament!);

    const payments = await Payment.findAll({
      include: [
        {
          model: Entry,
          where: { categoryId },
          required: true,
          attributes: ["id"],
        },
      ],
    });

    const stats = {
      total: payments.length,
      completed: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
      totalAmount: 0,
      collectedAmount: 0,
    };

    payments.forEach((payment) => {
      if (payment.status === "completed") {
        stats.completed += 1;
        stats.collectedAmount += Number(payment.amount);
      } else if (payment.status === "pending") {
        stats.pending += 1;
      } else if (payment.status === "failed") {
        stats.failed += 1;
      } else if (payment.status === "refunded") {
        stats.refunded += 1;
      }

      stats.totalAmount += Number(payment.amount);
    });

    return stats;
  }

  /**
   * 9. Manual payment for cash method
   * Captain/organizer report cash payment received
   */
  async recordCashPayment(
    entryId: number,
    organizerId: number,
    amount: number,
  ): Promise<Payment> {
    const entry = await getEntryWithCategory(entryId);

    if (!entry.category?.entryFee || entry.category.entryFee <= 0) {
      throw new Error("This entry category does not require payment");
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({
      where: { entryId, method: "cash" },
    });
    if (existingPayment) {
      throw new Error("Cash payment already recorded for this entry");
    }

    // Create and immediately confirm
    const payment = await Payment.create({
      entryId,
      amount,
      method: "cash",
      status: "completed",
      confirmedBy: organizerId,
      confirmedAt: new Date(),
    });

    return payment;
  }

  /**
   * 10. Simulate online payment (webhook would do this in real scenario)
   */
  async recordOnlinePayment(
    entryId: number,
    amount: number,
    transactionRef: string,
  ): Promise<Payment> {
    const entry = await getEntryWithCategory(entryId);

    if (!entry.category?.entryFee || entry.category.entryFee <= 0) {
      throw new Error("This entry category does not require payment");
    }

    // Check if transaction already processed
    const existingPayment = await Payment.findOne({
      where: { transactionRef, status: "completed" },
    });
    if (existingPayment) {
      throw new Error("This transaction has already been processed");
    }

    // Create payment
    const payment = await Payment.create({
      entryId,
      amount,
      method: "online",
      status: "completed",
      transactionRef,
      confirmedAt: new Date(),
    });

    return payment;
  }

  /**
   * 11. Lấy pending payments cần xác nhận (for admin dashboard)
   */
  async getPendingPayments(
    options: {
      skip?: number;
      limit?: number;
      method?: "cash" | "bank_transfer" | "online";
    } = {},
  ): Promise<{ rows: Payment[]; count: number }> {
    const { skip = 0, limit = 10, method } = options;

    const where: WhereOptions = { status: "pending" };
    if (method) {
      where.method = method;
    }

    return await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Entry,
          include: [{ model: TournamentCategory }],
        },
      ],
      offset: skip,
      limit,
      order: [["createdAt", "ASC"]],
      distinct: true,
    });
  }

  /**
   * 12. Update payment with proof image (for bank_transfer)
   */
  async updatePaymentProof(
    paymentId: number,
    proofImageUrl: string,
  ): Promise<Payment> {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw new Error("Payment not found");

    if (payment.status !== "pending") {
      throw new Error("Can only update proof for pending payments");
    }

    if (payment.method !== "bank_transfer") {
      throw new Error("Proof image is only applicable for bank transfer payments");
    }

    return await payment.update({ proofImageUrl });
  }
}

export default new PaymentService();
