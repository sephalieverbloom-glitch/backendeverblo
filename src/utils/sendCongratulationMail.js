import { sendMail } from "./sendMail.js";

export const sendCongratulationMail = async (email, fullName) => {
  const subject = "Welcome to Harekrishna!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #d97706; text-align: center;">Welcome to Harekrishna</h2>
      <p>Dear ${fullName},</p>
      <p>Your account has been successfully created. We are excited to have you on board!</p>
      <p>Explore our premium divine collection of agarbatti, puja oils, and spiritual essentials.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">© ${new Date().getFullYear()} Harekrishna. All rights reserved.</p>
    </div>
  `;
  return await sendMail(email, subject, html);
};
