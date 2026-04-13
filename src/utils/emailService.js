const nodemailer = require("nodemailer");

/**
 * Tạo mã OTP 6 chữ số ngẫu nhiên
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Tạo Gmail transporter
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
};

/**
 * Gửi email OTP xác nhận tài khoản
 * @param {string} toEmail - Email người nhận
 * @param {string} fullname - Họ tên người dùng
 * @param {string} otp - Mã OTP 6 chữ số
 */
const sendOTPEmail = async (toEmail, fullname, otp) => {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
        from: `"KSL App" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: "Xác nhận tài khoản KSL - Mã OTP của bạn",
        html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Xác nhận tài khoản KSL</title>
        </head>
        <body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 0;">
                <tr>
                    <td align="center">
                        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:20px;overflow:hidden;border:1px solid #2d2d5f;">
                            <!-- Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:36px 40px;text-align:center;">
                                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">KSL</h1>
                                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Kiet's Sign Language</p>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:40px 40px 30px;">
                                    <p style="margin:0 0 8px;color:#a0aec0;font-size:14px;">Xin chào,</p>
                                    <h2 style="margin:0 0 20px;color:#e2e8f0;font-size:20px;font-weight:600;">${fullname} 👋</h2>

                                    <p style="margin:0 0 24px;color:#a0aec0;font-size:15px;line-height:1.7;">
                                        Cảm ơn bạn đã đăng ký tài khoản <strong style="color:#667eea;">KSL App</strong>.<br/>
                                        Sử dụng mã OTP bên dưới để xác nhận địa chỉ email và kích hoạt tài khoản của bạn.
                                    </p>

                                    <!-- OTP Box -->
                                    <div style="text-align:center;margin:30px 0;">
                                        <div style="display:inline-block;background:linear-gradient(135deg,#667eea22,#764ba222);border:2px solid #667eea;border-radius:16px;padding:24px 40px;">
                                            <p style="margin:0 0 6px;color:#a0aec0;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Mã xác nhận</p>
                                            <span style="font-size:42px;font-weight:800;letter-spacing:10px;color:#ffffff;font-family:'Courier New',monospace;">${otp}</span>
                                        </div>
                                    </div>

                                    <!-- Warning -->
                                    <div style="background:#1e1e3a;border-left:4px solid #f6ad55;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                                        <p style="margin:0;color:#f6ad55;font-size:13px;">
                                            ⏱ Mã OTP có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
                                        </p>
                                    </div>

                                    <p style="margin:0;color:#718096;font-size:13px;line-height:1.7;">
                                        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding:20px 40px 30px;border-top:1px solid #2d2d5f;text-align:center;">
                                    <p style="margin:0;color:#4a5568;font-size:12px;">
                                        © 2026 KSL App. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `,
    });

    return info;
};

module.exports = { generateOTP, sendOTPEmail };
