import nodemailer from "nodemailer";

function maskEnvVar(v: string | undefined) {
  if (!v) return "(not set)";
  if (v.length <= 4) return "***";
  return `${v.slice(0, 2)}***${v.slice(-2)} (length ${v.length})`;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export type MatchedProfileForEmail = {
  name: string;
  profileCode: string;
  photoUrl: string | null;
  age: number | null;
  city: string | null;
  religionName: string | null;
  casteName: string | null;
  profession: string | null;
};

export type EmailSender = {
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
};

function profileCardHtml(p: MatchedProfileForEmail) {
  const details = [
    p.age ? `${p.age} yrs` : null,
    p.city,
    p.religionName,
    p.casteName,
    p.profession,
  ].filter(Boolean).join(" &middot; ");

  return `
    <table role="presentation" width="100%" style="margin-bottom: 14px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <tr>
        ${p.photoUrl ? `
        <td style="width: 100px; vertical-align: top;">
          <img src="${p.photoUrl}" width="100" height="120" style="display: block; object-fit: cover; width: 100px; height: 120px;" />
        </td>` : ""}
        <td style="padding: 14px; vertical-align: top;">
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #2b1b4e;">${p.name}</p>
          <p style="margin: 0 0 6px; font-size: 12px; color: #999;">Profile ID: ${p.profileCode}</p>
          <p style="margin: 0; font-size: 13px; color: #555;">${details}</p>
        </td>
      </tr>
    </table>
  `;
}

function signatureHtml(sender: EmailSender) {
  return `
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 14px; color: #333;">Warm regards,</p>
      <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #2b1b4e;">${sender.name}</p>
      ${sender.role ? `<p style="margin: 0; font-size: 12px; color: #777;">${sender.role}</p>` : ""}
      <p style="margin: 6px 0 0; font-size: 12px; color: #777;">Sangam Vivah</p>
      ${sender.email ? `<p style="margin: 0; font-size: 12px; color: #777;">${sender.email}</p>` : ""}
      ${sender.phone ? `<p style="margin: 0; font-size: 12px; color: #777;">${sender.phone}</p>` : ""}
    </div>
  `;
}

export async function sendMatchedProfilesEmail(
  to: string,
  clientName: string,
  profiles: MatchedProfileForEmail[],
  sender: EmailSender
) {
  const count = profiles.length;
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `${count} Matching Profile${count === 1 ? "" : "s"} For You — Sangam Vivah`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background: #2b1b4e; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Sangam Vivah</h2>
          <p style="margin: 4px 0 0; opacity: 0.8;">Handpicked Matches For You</p>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 14px; color: #333;">Dear ${clientName || "Client"},</p>
          <p style="font-size: 14px; color: #333;">
            We are pleased to share ${count} profile${count === 1 ? "" : "s"} that ${count === 1 ? "matches" : "match"} your preferences:
          </p>
          ${profiles.map(profileCardHtml).join("")}
          <p style="font-size: 13px; color: #666;">Please contact us for more details about any of these profiles.</p>
          ${signatureHtml(sender)}
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

export async function sendProfileEmail(to: string, profileName: string, profileCode: string, photoUrl: string | null) {
  // TEMP DIAGNOSTIC — remove once SMTP auth is confirmed working.
  // Logs shape/length only, never the real password, to Netlify's function logs.
  console.log("[SMTP DEBUG] host:", process.env.SMTP_HOST, "port:", process.env.SMTP_PORT);
  console.log("[SMTP DEBUG] user:", maskEnvVar(process.env.SMTP_USER));
  console.log("[SMTP DEBUG] pass:", maskEnvVar(process.env.SMTP_PASS));

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