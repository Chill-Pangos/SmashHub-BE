import nodemailer, { Transporter } from "nodemailer";
import config from "../config/config";

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
    });
  }

  /**
   * Gửi email OTP để đặt lại mật khẩu
   */
  async sendPasswordResetOTP(email: string, otp: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"${config.email.from.name}" <${config.email.from.email}>`,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu - SmashHub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">Xin chào ${userName}!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản SmashHub của mình.
            </p>
            <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Mã OTP của bạn là:</p>
              <h1 style="color: #007bff; font-size: 36px; letter-spacing: 5px; margin: 10px 0;">
                ${otp}
              </h1>
              <p style="color: #dc3545; margin-top: 10px; font-size: 14px;">
                ⏰ Mã OTP này có hiệu lực trong 10 phút
              </p>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ.
            </p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} SmashHub. Tất cả các quyền được bảo lưu.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new Error("Không thể gửi email. Vui lòng thử lại sau.");
    }
  }

  /**
   * Gửi email OTP để xác thực email
   */
  async sendEmailVerificationOTP(email: string, otp: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"${config.email.from.name}" <${config.email.from.email}>`,
      to: email,
      subject: "Xác thực email - SmashHub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">Chào mừng ${userName} đến với SmashHub! 🎉</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã OTP dưới đây để xác thực địa chỉ email của bạn.
            </p>
            <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="color: #666; margin-bottom: 10px; font-size: 14px;">Mã OTP xác thực của bạn là:</p>
              <h1 style="color: #28a745; font-size: 36px; letter-spacing: 5px; margin: 10px 0;">
                ${otp}
              </h1>
              <p style="color: #dc3545; margin-top: 10px; font-size: 14px;">
                ⏰ Mã OTP này có hiệu lực trong 10 phút
              </p>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.
            </p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} SmashHub. Tất cả các quyền được bảo lưu.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent successfully to ${email}`);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Không thể gửi email. Vui lòng thử lại sau.");
    }
  }

  /**
   * Gửi email thông báo thành công
   */
  async sendPasswordChangedNotification(email: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"${config.email.from.name}" <${config.email.from.email}>`,
      to: email,
      subject: "Mật khẩu đã được thay đổi - SmashHub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">Xin chào ${userName}!</h2>
            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #155724; margin: 0; font-size: 16px;">
                ✅ Mật khẩu của bạn đã được thay đổi thành công!
              </p>
            </div>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Mật khẩu tài khoản SmashHub của bạn vừa được cập nhật lúc ${new Date().toLocaleString("vi-VN")}.
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin-top: 20px;">
              Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với bộ phận hỗ trợ của chúng tôi.
            </p>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} SmashHub. Tất cả các quyền được bảo lưu.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password changed notification sent to ${email}`);
    } catch (error) {
      console.error("Error sending password changed notification:", error);
      // Không throw error vì đây chỉ là thông báo
    }
  }

  /**
   * Kiểm tra kết nối SMTP
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("SMTP connection verified successfully");
      return true;
    } catch (error) {
      console.error("SMTP connection verification failed:", error);
      return false;
    }
  }
}

export default new EmailService();
