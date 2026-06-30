import { Response, NextFunction } from "express";
import paymentService from "../services/payment.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { UnauthorizedError } from "../utils/errors.helper";
import { parseEnumQuery, parsePagination, parsePositiveInt } from "../utils/request.helper";
import { paymentProofUpload } from "../config/multer";

const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;

export class PaymentController {
  private getAuthenticatedUserId(req: AuthRequest, next: NextFunction): number | null {
    if (req.userId == null) {
      next(new UnauthorizedError("Unauthorized"));
      return null;
    }
    return req.userId;
  }

  /**
   * 1. Create payment for entry
   */
  async createPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;

      const { entryId, amount } = req.body;

      const payment = await paymentService.createPayment(
        parsePositiveInt(entryId, "entryId"),
        amount,
        userId,
      );
      res.status(201).json({
        success: true,
        data: payment,
        message: "Payment created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Confirm payment (organizer)
   */
  async confirmPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const paymentId = parsePositiveInt(req.params.paymentId, "paymentId");

      const payment = await paymentService.confirmPayment(
        paymentId,
        organizerId
      );
      res.status(200).json({
        success: true,
        data: payment,
        message: "Payment confirmed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Reject payment (organizer)
   */
  async rejectPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const paymentId = parsePositiveInt(req.params.paymentId, "paymentId");

      const payment = await paymentService.rejectPayment(paymentId, organizerId);
      res.status(200).json({
        success: true,
        data: payment,
        message: "Payment rejected successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. Refund payment (organizer)
   */
  refundPayment = [
    paymentProofUpload.single("refundProof"),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const organizerId = this.getAuthenticatedUserId(req, next);
        if (organizerId == null) return;

        const paymentId = parsePositiveInt(req.params.paymentId, "paymentId");
        if (!req.file) {
          res.status(400).json({ success: false, message: "No file uploaded" });
          return;
        }

        const payment = await paymentService.refundPayment(paymentId, organizerId, req.file);
        res.status(200).json({
          success: true,
          refundProofImageUrl: payment.refundProofImageUrl,
          data: payment,
          message: "Payment refunded successfully",
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * 5. Get payment by ID
   */
  async getPaymentById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;

      const paymentId = parsePositiveInt(req.params.paymentId, "paymentId");

      const payment = await paymentService.getPaymentById(paymentId, userId);
      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. Get payments by entry
   */
  async getPaymentsByEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;

      const entryId = parsePositiveInt(req.params.entryId, "entryId");
      const { offset, limit } = parsePagination(req.query);
      const status = parseEnumQuery(req.query.status, "status", PAYMENT_STATUSES);

      const options: {
        offset: number;
        limit: number;
        status?: "pending" | "completed" | "failed" | "refunded";
      } = {
        offset,
        limit,
      };

      if (status) {
        options.status = status;
      }

      const result = await paymentService.getPaymentsByEntry(entryId, userId, options);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 7. Get payments by category (admin/organizer)
   */
  async getPaymentsByCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;

      const categoryId = parsePositiveInt(req.params.categoryId, "categoryId");
      const { offset, limit } = parsePagination(req.query);
      const status = parseEnumQuery(req.query.status, "status", PAYMENT_STATUSES);

      const options: {
        offset: number;
        limit: number;
        status?: "pending" | "completed" | "failed" | "refunded";
      } = {
        offset,
        limit,
      };

      if (status) {
        options.status = status;
      }

      const result = await paymentService.getPaymentsByCategory(
        categoryId,
        userId,
        options
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 8. Get payment stats for category (admin/organizer)
   */
  async getPaymentStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, next);
      if (userId == null) return;

      const categoryId = parsePositiveInt(req.params.categoryId, "categoryId");

      const stats = await paymentService.getPaymentStats(categoryId, userId);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 9. Get pending payments by category
   */
  async getPendingPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, next);
      if (organizerId == null) return;

      const categoryId = parsePositiveInt(req.params.categoryId, "categoryId");
      const { offset, limit } = parsePagination(req.query);

      const options: {
        offset: number;
        limit: number;
      } = {
        offset,
        limit,
      };

      const result = await paymentService.getPendingPayments(
        organizerId,
        categoryId,
        options
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 10. Upload payment proof image
   */
  uploadPaymentProof = [
    paymentProofUpload.single("proof"),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const userId = this.getAuthenticatedUserId(req, next);
        if (userId == null) return;

        const paymentId = parsePositiveInt(req.params.paymentId, "paymentId");
        if (!req.file) {
          res.status(400).json({ success: false, message: "No file uploaded" });
          return;
        }

        const payment = await paymentService.uploadPaymentProof(
          paymentId,
          userId,
          req.file
        );
        res.status(200).json({
          success: true,
          proofImageUrl: payment.proofImageUrl,
          data: payment,
          message: "Payment proof uploaded successfully",
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}

export default new PaymentController();
