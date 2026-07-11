import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendProfileEmail(to: string, profileName: string, profileCode: string, photoUrl: string | null) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `Profile: ${profileName} (${profileCode})`,
    html: `<p>Please find the profile details for <b>${profileName}</b> (${profileCode}).</p>${photoUrl ? `<img src="${photoUrl}" width="200"/>` : ""}`,
  });
}