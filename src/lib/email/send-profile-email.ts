import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendProfileEmail(to: string, profileName: string, profileCode: string, photoUrl: string | null) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `A Compatible Match: ${profileName} (${profileCode})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background: #2b1b4e; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Sangam Vivah</h2>
          <p style="margin: 4px 0 0; opacity: 0.8;">A New Match For You</p>
        </div>
        <div style="padding: 20px;">
          ${photoUrl ? `<img src="${photoUrl}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 6px;" />` : ""}
          <h3 style="margin-top: 16px;">${profileName}</h3>
          <p style="color: #666;">Profile ID: ${profileCode}</p>
          <p>Please contact your relationship manager for more details about this profile.</p>
        </div>
        <div style="background: #f5f5f5; padding: 12px; text-align: center; font-size: 12px; color: #999;">
          Sangam Vivah &middot; This email was sent on your behalf by our Service team.
        </div>
      </div>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}
