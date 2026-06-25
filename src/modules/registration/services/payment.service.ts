// payment.service.ts
import { Op, WhereOptions } from "sequelize";
import Payment, { PaymentStatus } from "../models/payment.model";
import Entry from "../models/entry.model";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import config from "../../../config/config";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../../utils/errors.helper";
import { identityReadService } from "../../identity/public.read";
import { tournamentReadService } from "../../tournament/public.read";
import type {
  TournamentCategoryRegistrationContext,
  TournamentRegistrationContext,
} from "../../tournament/public.contracts";

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

interface EntryPaymentContext {
  entry: Entry;
  category: TournamentCategoryRegistrationContext;
}

interface PaymentContext extends EntryPaymentContext {
  payment: Payment;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setAssociation(
  instance: { setDataValue?: (key: string, value: unknown) => void },
  key: string,
  value: unknown,
): void {
  if (instance.setDataValue) {
    instance.setDataValue(key, value);
    return;
  }
  (instance as Record<string, unknown>)[key] = value;
}

function asNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

function categoryPayload(
  category: TournamentCategoryRegistrationContext,
  includeTournament: boolean,
): Record<string, unknown> {
  if (includeTournament) return category;
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(category)) {
    if (key !== "tournament") payload[key] = value;
  }
  return payload;
}

function attachEntryToPayment(
  payment: Payment,
  entry: Entry,
  category: TournamentCategoryRegistrationContext,
  includeTournament: boolean,
): Payment {
  setAssociation(entry, "category", categoryPayload(category, includeTournament));
  setAssociation(payment, "entry", entry);
  return payment;
}

async function attachConfirmers(payments: Payment[]): Promise<void> {
  const confirmerIds = payments
    .map((payment) => payment.confirmedBy)
    .filter((id): id is number => id != null);
  const users = await identityReadService.getRegistrationUsersByIds(confirmerIds);
  const userById = new Map(users.map((user) => [user.id, user]));

  for (const payment of payments) {
    setAssociation(
      payment,
      "confirmer",
      payment.confirmedBy ? userById.get(payment.confirmedBy) ?? null : null,
    );
  }
}

async function getPaymentWithTournament(paymentId: number): Promise<PaymentContext> {
  const payment = await Payment.findByPk(paymentId, {
    include: [
      {
        model: Entry,
        as: "entry",
      },
    ],
  });
  if (!payment) throw new NotFoundError("Payment not found");

  const entry = payment.entry;
  if (!entry) throw new Error("Payment entry not found");
  const category = await getCategoryWithTournament(entry.categoryId);
  return { payment, entry, category };
}

async function getEntryWithCategory(entryId: number): Promise<EntryPaymentContext> {
  const entry = await Entry.findByPk(entryId);
  if (!entry) throw new NotFoundError("Entry not found");
  const category = await getCategoryWithTournament(entry.categoryId);
  return { entry, category };
}

async function getCategoryWithTournament(
  categoryId: number
): Promise<TournamentCategoryRegistrationContext> {
  const category = await tournamentReadService.getCategoryPaymentContext(categoryId);
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

function assertOrganizer(userId: number, tournament: TournamentRegistrationContext): void {
  if (tournament.createdBy !== userId) {
    throw new ForbiddenError("Only the tournament organizer can perform this action");
  }
}

function assertHasEntryFee(category: TournamentCategoryRegistrationContext): void {
  if (asNumber(category.entryFee) <= 0) {
    throw new BadRequestError("This category does not require payment");
  }
}

function assertAmountMatchesFee(amount: number, entryFee: number): void {
  if (Math.abs(amount - entryFee) > 0.01) {
    throw new BadRequestError(`Payment amount must equal entry fee of ${entryFee}`);
  }
}

async function isAdmin(userId: number): Promise<boolean> {
  return identityReadService.isAdmin(userId);
}

async function assertCanAccessEntryPayment(
  userId: number,
  context: EntryPaymentContext,
): Promise<void> {
  const { entry, category } = context;
  const isCaptain = entry.captainId === userId;
  const isOrganizer = category.tournament.createdBy === userId;
  const admin = await isAdmin(userId);

  if (!isCaptain && !isOrganizer && !admin) {
    throw new ForbiddenError("Only the entry captain, tournament organizer, or admin can access this payment");
  }
}

async function assertCanAccessPayment(
  userId: number,
  context: PaymentContext,
): Promise<void> {
  await assertCanAccessEntryPayment(userId, context);
}

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
    const context = await getEntryWithCategory(entryId);
    await assertCanAccessEntryPayment(userId, context);
    assertHasEntryFee(context.category);
    assertAmountMatchesFee(amount, asNumber(context.category.entryFee));

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
    const context = await getPaymentWithTournament(paymentId);
    const { payment, entry, category } = context;
    assertOrganizer(organizerId, category.tournament);

    if (payment.status !== "pending") {
      throw new BadRequestError("Only pending payments can be confirmed");
    }
    if (!payment.proofImageUrl) {
      throw new BadRequestError("Proof image is required for bank transfer confirmation");
    }

    const updated = await payment.update({
      status: "completed",
      confirmedBy: organizerId,
      confirmedAt: new Date(),
    });
    return attachEntryToPayment(updated, entry, category, true);
  }

  // ── 3. Từ chối thanh toán ─────────────────────────────────────────────────

  async rejectPayment(paymentId: number, organizerId: number): Promise<Payment> {
    const context = await getPaymentWithTournament(paymentId);
    const { payment, entry, category } = context;
    assertOrganizer(organizerId, category.tournament);

    if (payment.status !== "pending") {
      throw new BadRequestError("Only pending payments can be rejected");
    }

    const updated = await payment.update({ status: "failed" });
    return attachEntryToPayment(updated, entry, category, true);
  }

  // ── 4. Hoàn tiền ──────────────────────────────────────────────────────────

  async refundPayment(
    paymentId: number,
    organizerId: number,
    file: Express.Multer.File
  ): Promise<Payment> {
    try {
      const context = await getPaymentWithTournament(paymentId);
      const { payment, entry, category } = context;
      assertOrganizer(organizerId, category.tournament);

      if (payment.status !== "completed") {
        throw new BadRequestError("Only completed payments can be refunded");
      }

      const refundProofImageUrl = await savePaymentImage(file);

      const updated = await payment.update({
        status: "refunded",
        refundedAt: new Date(),
        refundProofImageUrl,
      });
      return attachEntryToPayment(updated, entry, category, true);
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
      const context = await getPaymentWithTournament(paymentId);
      const { payment, entry, category } = context;

      // Chỉ captain của entry hoặc organizer mới được upload
      const isCaptain = entry.captainId === userId;
      const isOrganizer = category.tournament.createdBy === userId;

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

      return attachEntryToPayment(updated, entry, category, true);
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  // ── 6. Get payment theo ID ────────────────────────────────────────────────

  async getPaymentById(paymentId: number, userId: number): Promise<Payment> {
    const context = await getPaymentWithTournament(paymentId);
    await assertCanAccessPayment(userId, context);
    await attachConfirmers([context.payment]);
    return attachEntryToPayment(context.payment, context.entry, context.category, false);
  }

  // ── 7. Get payments theo entry ────────────────────────────────────────────

  async getPaymentsByEntry(
    entryId: number,
    userId: number,
    options: PaymentListOptions = {}
  ): Promise<{ rows: Payment[]; count: number }> {
    const { offset = 0, limit = 10, status } = options;
    const context = await getEntryWithCategory(entryId);
    await assertCanAccessEntryPayment(userId, context);

    const where: WhereOptions = { entryId };
    if (status) where.status = status;

    const result = await Payment.findAndCountAll({
      where,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
    await attachConfirmers(result.rows);
    return result;
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

    const result = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Entry,
          as: "entry",
          where: { categoryId },
          required: true,
          attributes: ["id", "captainId"],
        },
      ],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
    await attachConfirmers(result.rows);
    return result;
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

    const result = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Entry,
          as: "entry",
          where: { categoryId },
          required: true,
        },
      ],
      offset,
      limit,
      order: [["createdAt", "ASC"]], // cũ nhất trước để xử lý theo thứ tự
      distinct: true,
    });
    for (const payment of result.rows) {
      if (payment.entry) {
        attachEntryToPayment(payment, payment.entry, category, false);
      }
    }
    return result;
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
