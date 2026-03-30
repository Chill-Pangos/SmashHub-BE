import { Request, Response } from "express";
import paymentService from "../services/payment.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PaymentController {
  private getAuthenticatedUserId(req: AuthRequest, res: Response): number | null {
    if (req.userId == null) {
      res.status(401).json({ message: "Unauthorized" });
      return null;
    }
    return req.userId;
  }

  /**
   * 1. Create payment for entry
   */
  async createPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, res);
      if (userId == null) return;

      const { entryId, amount, method } = req.body;

      const payment = await paymentService.createPayment(entryId, amount, method);
      res.status(201).json({
        success: true,
        data: payment,
        message: "Payment created successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 2. Confirm payment (organizer)
   */
  async confirmPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, res);
      if (organizerId == null) return;

      const paymentId = Number(req.params.paymentId);
      const { proofImageUrl, transactionRef } = req.body;

      const payment = await paymentService.confirmPayment(
        paymentId,
        organizerId,
        { proofImageUrl, transactionRef }
      );
      res.status(200).json({
        success: true,
        data: payment,
        message: "Payment confirmed successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 3. Reject payment (organizer)
   */
  async rejectPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, res);
      if (organizerId == null) return;

      const paymentId = Number(req.params.paymentId);

      const payment = await paymentService.rejectPayment(paymentId, organizerId);
      res.status(200).json({
        success: true,
        data: payment,
        message: "Payment rejected successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 4. Refund payment (organizer)
   */
  async refundPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, res);
      if (organizerId == null) return;

      const paymentId = Number(req.params.paymentId);

      const payment = await paymentService.refundPayment(paymentId, organizerId);
      res.status(200).json({
        success: true,
        data: payment,
        message: "Payment refunded successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 5. Get payment by ID
   */
  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const paymentId = Number(req.params.paymentId);

      const payment = await paymentService.getPaymentById(paymentId);
      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 6. Get payments by entry
   */
  async getPaymentsByEntry(req: Request, res: Response): Promise<void> {
    try {
      const entryId = Number(req.params.entryId);
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | undefined;

      const options: {
        skip: number;
        limit: number;
        status?: "pending" | "completed" | "failed" | "refunded";
      } = {
        skip,
        limit,
      };

      if (status) {
        options.status = status;
      }

      const result = await paymentService.getPaymentsByEntry(entryId, options);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 7. Get payments by category (admin/organizer)
   */
  async getPaymentsByCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, res);
      if (userId == null) return;

      const categoryId = Number(req.params.categoryId);
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | undefined;
      const method = req.query.method as
        | "cash"
        | "bank_transfer"
        | "online"
        | undefined;

      const options: {
        skip: number;
        limit: number;
        status?: "pending" | "completed" | "failed" | "refunded";
        method?: "cash" | "bank_transfer" | "online";
      } = {
        skip,
        limit,
      };

      if (status) {
        options.status = status;
      }

      if (method) {
        options.method = method;
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 8. Get payment stats for category (admin/organizer)
   */
  async getPaymentStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, res);
      if (userId == null) return;

      const categoryId = Number(req.params.categoryId);

      const stats = await paymentService.getPaymentStats(categoryId, userId);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 9. Record cash payment
   */
  async recordCashPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, res);
      if (organizerId == null) return;

      const { entryId, amount } = req.body;

      const payment = await paymentService.recordCashPayment(
        entryId,
        organizerId,
        amount
      );
      res.status(201).json({
        success: true,
        data: payment,
        message: "Cash payment recorded successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 10. Record online payment (simulate webhook)
   */
  async recordOnlinePayment(req: Request, res: Response): Promise<void> {
    try {
      const { entryId, amount, transactionRef } = req.body;

      const payment = await paymentService.recordOnlinePayment(
        entryId,
        amount,
        transactionRef
      );
      res.status(201).json({
        success: true,
        data: payment,
        message: "Online payment recorded successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 11. Get pending payments by category
   */
  async getPendingPayments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizerId = this.getAuthenticatedUserId(req, res);
      if (organizerId == null) return;

      const categoryId = Number(req.params.categoryId);
      const skip = Number(req.query.skip) || 0;
      const limit = Number(req.query.limit) || 10;
      const method = req.query.method as
        | "cash"
        | "bank_transfer"
        | "online"
        | undefined;

      const options: {
        skip: number;
        limit: number;
        method?: "cash" | "bank_transfer" | "online";
      } = {
        skip,
        limit,
      };

      if (method) {
        options.method = method;
      }

      const result = await paymentService.getPendingPayments(
        organizerId,
        categoryId,
        options
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * 12. Upload payment proof image
   */
  async uploadPaymentProof(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req, res);
      if (userId == null) return;

      const paymentId = Number(req.params.paymentId);
      const { proofImageUrl } = req.body;

      const payment = await paymentService.uploadPaymentProof(
        paymentId,
        userId,
        proofImageUrl
      );
      res.status(200).json({
        success: true,
        data: payment,
        message: "Payment proof uploaded successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new PaymentController();
