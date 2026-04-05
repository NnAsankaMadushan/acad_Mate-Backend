const SibApiV3Sdk = require('@getbrevo/brevo');

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

async function sendOtpEmail(email, otp, type) {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    const title = type === 'signup' ? 'Verification Code' : 'Password Reset';
    
    // We are using a friendlier subject line to avoid spam filters
    sendSmtpEmail.subject = `${otp} is your AcadMate ${title}`;
    
    sendSmtpEmail.htmlContent = `
      <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #eee;">
            <h2 style="color: #4a90e2; text-align: center; margin-top: 0;">AcadMate</h2>
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 15px; color: #555;">Use the following code to complete your ${type === 'signup' ? 'registration' : 'password reset'}:</p>
            <div style="text-align: center; margin: 30px 0; background-color: #f4f7fa; padding: 20px; border-radius: 8px;">
              <span style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #2c3e50;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #888; text-align: center;">This code will expire in 10 minutes.</p>
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #bbb;">&copy; ${new Date().getFullYear()} AcadMate Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // IMPORTANT: Replace this email with the one that worked for you yesterday!
    // If 'nnamadushan@gmail.com' doesn't work, ensure it's verified in Brevo.
    sendSmtpEmail.sender = { name: "AcadMate Support", email: "nnamadushan@gmail.com" };
    sendSmtpEmail.to = [{ email: email }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return result;
  } catch (error) {
    const errorDetails = error.response?.body || error.message || error;
    throw error;
  }
}

async function sendPasswordEmail(email, password) {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = 'Your AcadMate Account Password';
    
    sendSmtpEmail.htmlContent = `
      <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #eee;">
            <h2 style="color: #4a90e2; text-align: center; margin-top: 0;">AcadMate</h2>
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 15px; color: #555;">Your account has been created successfully. Here is your password:</p>
            <div style="text-align: center; margin: 30px 0; background-color: #f4f7fa; padding: 20px; border-radius: 8px;">
              <span style="font-size: 24px; font-weight: bold; color: #2c3e50;">${password}</span>
            </div>
            <p style="font-size: 13px; color: #888;">Please use this password to log in and verify your email with the OTP sent separately.</p>
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #bbb;">&copy; ${new Date().getFullYear()} AcadMate Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    sendSmtpEmail.sender = { name: "AcadMate Support", email: "nnamadushan@gmail.com" };
    sendSmtpEmail.to = [{ email: email }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return result;
  } catch (error) {
    const errorDetails = error.response?.body || error.message || error;
    throw error;
  }
}

module.exports = {
  sendOtpEmail,
  sendPasswordEmail,
};
