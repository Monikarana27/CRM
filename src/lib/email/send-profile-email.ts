import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Uploaded photos are stored as relative paths ("/uploads/xyz.jpg"), which
// only resolve on the live site. Email clients fetch images directly and
// have no concept of a "current page" to resolve a relative path against,
// so every image src in an email must be a full absolute URL.
function toAbsoluteUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export type MatchedProfileForEmail = {
  name: string;
  profileCode: string;
  photoUrl: string | null;
  age: number | null;
  height: string | null;
  city: string | null;
  religionName: string | null;
  casteName: string | null;
  profession: string | null;
  highestQualification: string | null;
};

export type EmailSender = {
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
};

function pill(text: string) {
  return `<span style="display: inline-block; background: #f3effa; color: #5b3a8e; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; margin: 0 6px 6px 0;">${text}</span>`;
}

function profileCardHtml(p: MatchedProfileForEmail) {
  const photo = toAbsoluteUrl(p.photoUrl);
  const headline = [p.age ? `${p.age} yrs` : null, p.height, p.city]
    .filter(Boolean)
    .join(" &nbsp;&bull;&nbsp; ");

  const pills = [p.religionName, p.casteName, p.profession, p.highestQualification]
    .filter((v): v is string => !!v)
    .map(pill)
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <tr>
        <td style="width: 110px; vertical-align: top; background: #f7f5fb;">
          ${
            photo
              ? `<img src="${photo}" width="110" height="130" style="display: block; object-fit: cover; width: 110px; height: 130px;" alt="${p.name}" />`
              : `<div style="width: 110px; height: 130px; display: flex; align-items: center; justify-content: center; color: #b8a9d1; font-size: 32px; font-weight: 700; background: #ece5f6;">${p.name.charAt(0).toUpperCase()}</div>`
          }
        </td>
        <td style="padding: 16px; vertical-align: top;">
          <p style="margin: 0 0 2px; font-size: 16px; font-weight: 700; color: #2b1b4e;">${p.name}</p>
          <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.03em; color: #999; text-transform: uppercase;">Profile ID: ${p.profileCode}</p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #444;">${headline}</p>
          <div>${pills}</div>
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
    from: `"Sangam Vivah" <${process.env.SMTP_USER}>`,
    to,
    subject: `${count} New Match${count === 1 ? "" : "es"} Curated For You — Sangam Vivah`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #2b1b4e, #4a2f7a); color: white; padding: 28px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.02em;">Sangam Vivah</h1>
          <p style="margin: 6px 0 0; opacity: 0.85; font-size: 13px;">${count} New Match${count === 1 ? "" : "es"} Curated For You</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #333; margin: 0 0 4px;">Dear ${clientName || "Client"},</p>
          <p style="font-size: 14px; color: #333; margin: 0 0 20px;">
            Based on your preferences, our team has handpicked ${count === 1 ? "this profile" : `these ${count} profiles`} for you to review:
          </p>
          ${profiles.map(profileCardHtml).join("")}
          <p style="font-size: 13px; color: #666; margin: 20px 0 0;">
            If any of these feel like a good fit, reply to this email or reach out directly and we'll help take the next step.
          </p>
          ${signatureHtml(sender)}
        </div>
        <div style="background: #f7f5fb; padding: 14px; text-align: center; font-size: 11px; color: #999;">
          Sangam Vivah &middot; This email was sent on behalf of our Service team
        </div>
      </div>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendProfileEmail(to: string, profileName: string, profileCode: string, photoUrl: string | null) {
  const photo = toAbsoluteUrl(photoUrl);
  const info = await transporter.sendMail({
    from: `"Sangam Vivah" <${process.env.SMTP_USER}>`,
    to,
    subject: `A Compatible Match: ${profileName} (${profileCode})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
        <div style="background: #2b1b4e; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Sangam Vivah</h2>
          <p style="margin: 4px 0 0; opacity: 0.8;">A New Match For You</p>
        </div>
        <div style="padding: 20px;">
          ${photo ? `<img src="${photo}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 6px;" />` : ""}
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