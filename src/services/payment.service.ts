// payment.service.ts
import { Op, WhereOptions } from "sequelize";
import { sequelize } from "../config/database";
import Payment, { PaymentStatus } from "../models/payment.model";
import Entry from "../models/entry.model";
import User from "../models/user.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import config from "../config/config";

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
  offset?: number;
  limit?: number;
}

interface PaymentListOptions extends PaginationOptions {
  status?: PaymentStatus;
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

async function savePaymentImage(file: Express.Multer.File): Promise<string> {
  const outputFilename = `${path.basename(file.filename, path.extname(file.filename))}.webp`;
  const outputPath = path.join(config.upload.paymentDir, outputFilename);

  await fs.mkdir(config.upload.paymentDir, { recursive: true });

  try {
    await sharp(file.path)
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(outputPath);
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }

  return `${config.upload.paymentUrlPath}/${outputFilename}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PaymentService {
  // ── 1. Tạo payment chuyển khoản ──────────────────────────────────────────

  /**
   * Tạo payment chuyển khoản cho entry.
   */
  async createPayment(
    entryId: number,
    amount: number
  ): Promise<Payment> {
    const entry = await getEntryWithCategory(entryId);
    assertHasEntryFee(entry.category!);
    assertAmountMatchesFee(amount, entry.category!.entryFee!);

    const existing = await Payment.findOne({
      where: { entryId, status: { [Op.in]: ["pending", "completed"] } },
    });
    if (existing) throw new Error("A pending or completed payment already exists for this entry");

    return await Payment.create({ entryId, amount, status: "pending" });
  }

  // ── 2. Xác nhận thanh toán ────────────────────────────────────────────────

  async confirmPayment(
    paymentId: number,
    organizerId: number
  ): Promise<Payment> {
    const payment = await getPaymentWithTournament(paymentId);
    assertOrganizer(organizerId, payment.entry!.category!.tournament!);

    if (payment.status !== "pending") {
      throw new Error("Only pending payments can be confirmed");
    }
    if (!payment.proofImageUrl) {
      throw new Error("Proof image is required for bank transfer confirmation");
    }

    return await payment.update({
      status: "completed",
      confirmedBy: organizerId,
      confirmedAt: new Date(),
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

  async refundPayment(
    paymentId: number,
    organizerId: number,
    file: Express.Multer.File
  ): Promise<Payment> {
    try {
      const payment = await getPaymentWithTournament(paymentId);
      assertOrganizer(organizerId, payment.entry!.category!.tournament!);

      if (payment.status !== "completed") {
        throw new Error("Only completed payments can be refunded");
      }

      const refundProofImageUrl = await savePaymentImage(file);

      return await payment.update({
        status: "refunded",
        refundedAt: new Date(),
        refundProofImageUrl,
      });
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  // ── 5. Upload minh chứng chuyển khoản ────────────────────────────────────

  async uploadPaymentProof(
    paymentId: number,
    userId: number,
    file: Express.Multer.File
  ): Promise<Payment> {
    const payment = await getPaymentWithTournament(paymentId);

    // Chỉ captain của entry hoặc organizer mới được upload
    const isCaptain = payment.entry?.captainId === userId;
    const isOrganizer =
      payment.entry?.category?.tournament?.createdBy === userId;

    if (!isCaptain && !isOrganizer) {
      await fs.unlink(file.path).catch(() => {});
      throw new Error("Only the team captain or organizer can upload payment proof");
    }
    if (payment.status !== "pending") {
      await fs.unlink(file.path).catch(() => {});
      throw new Error("Can only update proof for pending payments");
    }

    const oldProofImageUrl = payment.proofImageUrl;
    const proofImageUrl = await savePaymentImage(file);
    const updated = await payment.update({ proofImageUrl });

    if (oldProofImageUrl) {
      const oldPath = path.join(
        config.upload.paymentDir,
        path.basename(oldProofImageUrl)
      );
      await fs.unlink(oldPath).catch(() => {});
    }

    return updated;
  }

  // ── 6. Get payment theo ID ────────────────────────────────────────────────

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

  // ── 7. Get payments theo entry ────────────────────────────────────────────

  async getPaymentsByEntry(
    entryId: number,
    options: PaymentListOptions = {}
  ): Promise<{ rows: Payment[]; count: number }> {
    const { offset = 0, limit = 10, status } = options;

    const where: WhereOptions = { entryId };
    if (status) where.status = status;

    return await Payment.findAndCountAll({
      where,
      include: [CONFIRMER_INCLUDE],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  // ── 8. Get payments theo category ───────────────────────────────────────

  async getPaymentsByCategory(
    categoryId: number,
    organizerId: number,
    options: PaymentListOptions = {}
  ): Promise<{ rows: Payment[]; count: number }> {
    const { offset = 0, limit = 10, status } = options;

    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament!);

    const where: WhereOptions = {};
    if (status) where.status = status;

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
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
  }

  // ── 9. Get pending payments ──────────────────────────────────────────────

  async getPendingPayments(
    organizerId: number,
    categoryId: number,
    options: PaginationOptions = {}
  ): Promise<{ rows: Payment[]; count: number }> {
    const { offset = 0, limit = 10 } = options;

    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament!);

    const where: WhereOptions = { status: "pending" };

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
      offset,
      limit,
      order: [["createdAt", "ASC"]], // cũ nhất trước để xử lý theo thứ tự
      distinct: true,
    });
  }

  // ── 10. Get payment stats theo category ──────────────────────────────────

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
