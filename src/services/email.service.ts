import nodemailer, { Transporter } from "nodemailer";
import config from "../config/config";
import { AuthErrors } from "../utils/errors.helper";
import { formatDateUTC } from "../utils/date.helper";

// ─── Shared Email Shell ────────────────────────────────────────────────────────
const emailShell = (bodyContent: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>SmashHub</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Sora', Arial, sans-serif;
      background-color: #080f10;
      color: #dce4e4;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    .email-wrapper {
      width: 100%;
      background-color: #080f10;
      padding: 40px 16px;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .email-header {
      text-align: center;
      padding-bottom: 32px;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, rgba(0,242,255,0.12), rgba(87,27,193,0.12));
      border: 1px solid rgba(0,242,255,0.25);
      border-radius: 9999px;
      padding: 10px 22px;
    }

    .logo-icon {
      width: 28px;
      height: 28px;
    }

    .logo-text {
      font-family: 'Sora', Arial, sans-serif;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #e1fdff;
    }

    .logo-text span {
      color: #00f2ff;
    }

    /* ── Card ── */
    .card {
      background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 40px 40px 36px;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,242,255,0.4), transparent);
    }

    /* ── Typography ── */
    .greeting {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #e1fdff;
      margin-bottom: 12px;
    }

    .body-text {
      font-size: 15px;
      font-weight: 400;
      line-height: 1.65;
      color: rgba(220,228,228,0.7);
      margin-bottom: 0;
    }

    /* ── Divider ── */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      margin: 28px 0;
      border: none;
    }

    /* ── OTP Box ── */
    .otp-container {
      background: linear-gradient(135deg, rgba(0,242,255,0.06), rgba(87,27,193,0.08));
      border: 1px solid rgba(0,242,255,0.2);
      border-radius: 12px;
      padding: 28px 24px;
      text-align: center;
      margin: 28px 0;
      position: relative;
    }

    .otp-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(0,242,255,0.7);
      margin-bottom: 14px;
    }

    .otp-code {
      font-size: 44px;
      font-weight: 800;
      letter-spacing: 0.18em;
      color: #00f2ff;
      line-height: 1;
      text-shadow: 0 0 30px rgba(0,242,255,0.35);
      margin-bottom: 16px;
    }

    .otp-timer {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,180,171,0.08);
      border: 1px solid rgba(255,180,171,0.2);
      border-radius: 9999px;
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #ffb4ab;
    }

    /* ── Success Banner ── */
    .success-banner {
      background: linear-gradient(135deg, rgba(0,242,255,0.08), rgba(87,27,193,0.1));
      border: 1px solid rgba(0,242,255,0.2);
      border-left: 3px solid #00f2ff;
      border-radius: 10px;
      padding: 16px 20px;
      margin: 24px 0;
      font-size: 15px;
      font-weight: 600;
      color: #e1fdff;
    }

    /* ── Warning Note ── */
    .warning-note {
      background: rgba(255,180,171,0.05);
      border: 1px solid rgba(255,180,171,0.15);
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 13px;
      color: rgba(220,228,228,0.55);
      line-height: 1.6;
      margin-top: 4px;
    }

    /* ── Chip ── */
    .chip {
      display: inline-block;
      background: linear-gradient(90deg, #00696f, #571bc1);
      border-radius: 9999px;
      padding: 3px 12px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #e1fdff;
      margin-bottom: 20px;
    }

    /* ── Footer ── */
    .email-footer {
      text-align: center;
      padding-top: 28px;
    }

    .footer-links {
      margin-bottom: 14px;
    }

    .footer-links a {
      font-size: 12px;
      color: rgba(185,202,203,0.5);
      text-decoration: none;
      margin: 0 10px;
    }

    .footer-text {
      font-size: 11px;
      color: rgba(185,202,203,0.35);
      line-height: 1.6;
    }

    .footer-brand {
      color: rgba(0,242,255,0.5);
      font-weight: 600;
    }

    /* ── Timestamp ── */
    .timestamp {
      font-size: 12px;
      color: rgba(185,202,203,0.45);
      margin-top: 8px;
    }

    /* ── RESPONSIVE ── */
    @media only screen and (max-width: 480px) {
      .email-wrapper {
        padding: 24px 12px;
      }

      .card {
        padding: 28px 20px 24px;
        border-radius: 12px;
      }

      .greeting {
        font-size: 20px;
      }

      .otp-code {
        font-size: 36px;
        letter-spacing: 0.14em;
      }

      .otp-container {
        padding: 22px 16px;
      }

      .logo-badge {
        padding: 8px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">

      <!-- Header -->
      <div class="email-header">
        <div class="logo-badge">
          <svg class="logo-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="13" stroke="rgba(0,242,255,0.4)" stroke-width="1.5"/>
            <path d="M8 14 L12 10 L16 14 L20 10" stroke="#00f2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 18 L12 14 L16 18 L20 14" stroke="rgba(0,242,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">Smash<span>Hub</span></span>
        </div>
      </div>

      <!-- Main Card -->
      <div class="card">
        ${bodyContent}
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <div class="footer-links">
          <a href="#">Hỗ trợ</a>
          <a href="#">Chính sách</a>
          <a href="#">Huỷ đăng ký</a>
        </div>
        <p class="footer-text">
          © ${new Date().getFullYear()} <span class="footer-brand">SmashHub</span>. Tất cả các quyền được bảo lưu.<br/>
          Email này được gửi tự động, vui lòng không trả lời.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;

// ─── Template: Password Reset OTP ─────────────────────────────────────────────
const passwordResetTemplate = (otp: string, fullName: string) =>
  emailShell(`
    <div class="chip">Bảo mật tài khoản</div>
    <h2 class="greeting">Xin chào, ${fullName} 👋</h2>
    <hr class="divider" />
    <p class="body-text">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản SmashHub của bạn.
      Sử dụng mã OTP bên dưới để tiếp tục.
    </p>

    <div class="otp-container">
      <p class="otp-label">Mã xác thực OTP</p>
      <div class="otp-code">${otp}</div>
      <span class="otp-timer">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        Hết hạn sau 5 phút
      </span>
    </div>

    <div class="warning-note">
      🔒 Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
      Tài khoản của bạn vẫn an toàn.
    </div>
  `);

// ─── Template: Email Verification OTP ────────────────────────────────────────
const emailVerificationTemplate = (otp: string, fullName: string) =>
  emailShell(`
    <div class="chip">Xác thực email</div>
    <h2 class="greeting">Chào mừng, ${fullName}! 🎉</h2>
    <hr class="divider" />
    <p class="body-text">
      Cảm ơn bạn đã đăng ký SmashHub. Chỉ còn một bước nữa — hãy xác thực địa chỉ email
      của bạn bằng mã OTP bên dưới.
    </p>

    <div class="otp-container">
      <p class="otp-label">Mã xác thực email</p>
      <div class="otp-code">${otp}</div>
      <span class="otp-timer">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        Hết hạn sau 5 phút
      </span>
    </div>

    <div class="warning-note">
      Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.
    </div>
  `);

// ─── Template: Password Changed Notification ─────────────────────────────────
const passwordChangedTemplate = (fullName: string, changedAt: string) =>
  emailShell(`
    <div class="chip">Thông báo bảo mật</div>
    <h2 class="greeting">Xin chào, ${fullName}</h2>
    <hr class="divider" />
    <p class="body-text">
      Mật khẩu tài khoản SmashHub của bạn vừa được cập nhật thành công.
    </p>

    <div class="success-banner">
      ✅&nbsp; Mật khẩu đã được thay đổi thành công
    </div>

    <p class="timestamp">🕐 Thời gian thay đổi: ${changedAt}</p>

    <hr class="divider" />

    <div class="warning-note">
      🔒 Nếu bạn không thực hiện thay đổi này, hãy liên hệ ngay với bộ phận hỗ trợ
      của chúng tôi để bảo vệ tài khoản.
    </div>
  `);

// ─── Service ──────────────────────────────────────────────────────────────────
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
    });
  }

  /** Gửi OTP đặt lại mật khẩu */
  async sendPasswordResetOTP(email: string, otp: string, fullName: string): Promise<void> {
    const mailOptions = {
      from: `"${config.email.from.name}" <${config.email.from.email}>`,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu — SmashHub",
      html: passwordResetTemplate(otp, fullName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw AuthErrors.EmailSendError();
    }
  }

  /** Gửi OTP xác thực email */
  async sendEmailVerificationOTP(email: string, otp: string, fullName: string): Promise<void> {
    const mailOptions = {
      from: `"${config.email.from.name}" <${config.email.from.email}>`,
      to: email,
      subject: "Xác thực email — SmashHub",
      html: emailVerificationTemplate(otp, fullName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent successfully to ${email}`);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw AuthErrors.EmailSendError();
    }
  }

  /** Thông báo đổi mật khẩu thành công */
  async sendPasswordChangedNotification(email: string, fullName: string): Promise<void> {
    const changedAt = formatDateUTC(new Date());
    const mailOptions = {
      from: `"${config.email.from.name}" <${config.email.from.email}>`,
      to: email,
      subject: "Mật khẩu đã được thay đổi — SmashHub",
      html: passwordChangedTemplate(fullName, changedAt),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password changed notification sent to ${email}`);
    } catch (error) {
      console.error("Error sending password changed notification:", error);
      // Không throw — đây chỉ là thông báo bổ sung
    }
  }

  /** Kiểm tra kết nối SMTP */
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
