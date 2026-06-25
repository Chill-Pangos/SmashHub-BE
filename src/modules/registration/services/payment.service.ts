// payment.service.ts
import { Op, WhereOptions } from "sequelize";
import { sequelize } from "../../../config/database";
import Payment, { PaymentStatus } from "../models/payment.model";
import Entry from "../models/entry.model";
import { User, Role } from "../../identity/public.models";
import { TournamentCategory, Tournament } from "../../tournament/public.models";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import config from "../../../config/config";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../../utils/errors.helper";

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
        as: "entry",
        include: [{
          model: TournamentCategory,
          as: "category",
          include: [{ model: Tournament, as: "tournament" }],
        }],
      },
    ],
  });
  if (!payment) throw new NotFoundError("Payment not found");
  return payment;
}

async function getEntryWithCategory(entryId: number): Promise<Entry> {
  const entry = await Entry.findByPk(entryId, {
    include: [{
      model: TournamentCategory,
      as: "category",
      include: [{ model: Tournament, as: "tournament" }],
    }],
  });
  if (!entry) throw new NotFoundError("Entry not found");
  return entry;
}

async function getCategoryWithTournament(
  categoryId: number
): Promise<TournamentCategory> {
  const category = await TournamentCategory.findByPk(categoryId, {
    include: [{ model: Tournament, as: "tournament" }],
  });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

function assertOrganizer(userId: number, tournament: Tournament): void {
  if (tournament.createdBy !== userId) {
    throw new ForbiddenError("Only the tournament organizer can perform this action");
  }
}

function assertHasEntryFee(category: TournamentCategory): void {
  if (!category.entryFee || category.entryFee <= 0) {
    throw new BadRequestError("This category does not require payment");
  }
}

function assertAmountMatchesFee(amount: number, entryFee: number): void {
  if (Math.abs(amount - entryFee) > 0.01) {
    throw new BadRequestError(`Payment amount must equal entry fee of ${entryFee}`);
  }
}

async function isAdmin(userId: number): Promise<boolean> {
  const count = await User.count({
    where: { id: userId },
    include: [
      {
        model: Role,
        as: "roles",
        where: { name: "admin" },
        required: true,
        through: { attributes: [] },
      },
    ],
  });
  return count > 0;
}

async function assertCanAccessEntryPayment(
  userId: number,
  entry: Entry,
): Promise<void> {
  const isCaptain = entry.captainId === userId;
  const isOrganizer = entry.category?.tournament?.createdBy === userId;
  const admin = await isAdmin(userId);

  if (!isCaptain && !isOrganizer && !admin) {
    throw new ForbiddenError("Only the entry captain, tournament organizer, or admin can access this payment");
  }
}

async function assertCanAccessPayment(
  userId: number,
  payment: Payment,
): Promise<void> {
  const entry = payment.entry;
  if (!entry) throw new Error("Payment entry not found");
  await assertCanAccessEntryPayment(userId, entry);
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
    amount: number,
    userId: number,
  ): Promise<Payment> {
    const entry = await getEntryWithCategory(entryId);
    await assertCanAccessEntryPayment(userId, entry);
    assertHasEntryFee(entry.category!);
    assertAmountMatchesFee(amount, entry.category!.entryFee!);

    const existing = await Payment.findOne({
      where: { entryId, status: { [Op.in]: ["pending", "completed"] } },
    });
    if (existing) throw new ConflictError("A pending or completed payment already exists for this entry");

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
      throw new BadRequestError("Only pending payments can be confirmed");
    }
    if (!payment.proofImageUrl) {
      throw new BadRequestError("Proof image is required for bank transfer confirmation");
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
      throw new BadRequestError("Only pending payments can be rejected");
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
        throw new BadRequestError("Only completed payments can be refunded");
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
    try {
      const payment = await getPaymentWithTournament(paymentId);

      // Chỉ captain của entry hoặc organizer mới được upload
      const isCaptain = payment.entry?.captainId === userId;
      const isOrganizer =
        payment.entry?.category?.tournament?.createdBy === userId;

      if (!isCaptain && !isOrganizer) {
        throw new ForbiddenError("Only the team captain or organizer can upload payment proof");
      }
      if (payment.status !== "pending") {
        throw new BadRequestError("Can only update proof for pending payments");
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
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  // ── 6. Get payment theo ID ────────────────────────────────────────────────

  async getPaymentById(paymentId: number, userId: number): Promise<Payment> {
    const payment = await getPaymentWithTournament(paymentId);
    await assertCanAccessPayment(userId, payment);

    const detailedPayment = await Payment.findByPk(paymentId, {
      include: [
        {
          model: Entry,
          as: "entry",
          include: [{ model: TournamentCategory, as: "category" }],
        },
        CONFIRMER_INCLUDE,
      ],
    });
    if (!detailedPayment) throw new NotFoundError("Payment not found");
    return detailedPayment;
  }

  // ── 7. Get payments theo entry ────────────────────────────────────────────

  async getPaymentsByEntry(
    entryId: number,
    userId: number,
    options: PaymentListOptions = {}
  ): Promise<{ rows: Payment[]; count: number }> {
    const { offset = 0, limit = 10, status } = options;
    const entry = await getEntryWithCategory(entryId);
    await assertCanAccessEntryPayment(userId, entry);

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
          as: "entry",
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
          as: "entry",
          where: { categoryId },
          required: true,
          include: [{ model: TournamentCategory, as: "category" }],
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
        { model: Entry, as: "entry", where: { categoryId }, required: true, attributes: [] },
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
