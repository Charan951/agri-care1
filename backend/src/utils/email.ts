import nodemailer from 'nodemailer';

export const sendCredentialsEmail = async (
  toEmail: string,
  userName: string,
  roleName: string,
  plainPassword: string
): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const roleDisplayName = roleName.replace('_', ' ').toLowerCase();

    const mailOptions = {
      from: `"AgriCare Admin" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'AgriCare Portal - Welcome & Account Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fcfcfc;">
          <h2 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 10px;">Welcome to AgriCare!</h2>
          <p>Dear <strong>${userName}</strong>,</p>
          <p>Your account has been registered on the AgriCare Portal as an <strong>${roleDisplayName}</strong> by the system administrator.</p>
          
          <div style="background-color: #f3f4f6; border-left: 4px solid #15803d; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #1f2937;">Your Account Credentials:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #4b5563; width: 120px;">Role:</td>
                <td style="padding: 4px 0; color: #1f2937; text-transform: uppercase;">${roleName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #4b5563;">Email/Username:</td>
                <td style="padding: 4px 0; color: #1f2937; font-family: monospace;">${toEmail}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #4b5563;">Password:</td>
                <td style="padding: 4px 0; color: #1f2937; font-family: monospace; font-weight: bold;">${plainPassword}</td>
              </tr>
            </table>
          </div>

          <p>Please secure your password and do not share it with anybody. You can sign in to your dashboard here:</p>
          <p style="margin: 25px 0; text-align: center;">
            <a href="http://localhost:5174/login" style="background-color: #15803d; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Login to AgriCare Dashboard</a>
          </p>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This is an automated administrative notification. Please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Credentials email sent to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return false;
  }
};

export const sendOtpEmail = async (
  toEmail: string,
  userName: string,
  otp: string
): Promise<boolean> => {
  console.log(`[AgriCare OTP Request] Attempting to send OTP to ${toEmail}. Code: ${otp}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[SMTP MOCK WARNING] SMTP credentials not set in env. MOCK OTP code for ${toEmail} is: ${otp}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"AgriCare Support" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'AgriCare Portal - Reset Password Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fcfcfc;">
          <h2 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 10px;">Reset Your AgriCare Password</h2>
          <p>Dear <strong>${userName}</strong>,</p>
          <p>We received a request to reset your password. Use the verification OTP code below to proceed with the reset. This code is valid for 15 minutes.</p>
          
          <div style="background-color: #f3f4f6; text-align: center; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px dashed #15803d;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #15803d; font-family: monospace;">${otp}</span>
          </div>

          <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This is an automated security notification. Please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email, falling back to mock logging:', error);
    console.log(`[SMTP FALLBACK] OTP code for ${toEmail} is: ${otp}`);
    return true;
  }
};
