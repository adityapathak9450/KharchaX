const wrap = (inner) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VaultX</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0f172a;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f172a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:linear-gradient(180deg,#1e1b4b 0%,#0f172a 100%);border-radius:16px;border:1px solid #312e81;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px 28px;">
                <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;color:#a5b4fc;text-transform:uppercase;">VaultX</div>
                <div style="height:12px;"></div>
                ${inner}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px 28px;">
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">This message was sent by VaultX. If you did not request it, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

export function verificationEmail(otp, name) {
  const safeName = name ? String(name).slice(0, 80) : 'there'
  const inner = `
    <h1 style="margin:0;font-size:22px;line-height:1.3;color:#f8fafc;">Verify your email</h1>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#cbd5e1;">Hi ${safeName}, use this one-time code to verify your VaultX account. It expires in <strong style="color:#e2e8f0;">15 minutes</strong>.</p>
    <div style="margin:24px 0;text-align:center;">
      <div style="display:inline-block;padding:16px 28px;border-radius:12px;background-color:#312e81;border:1px solid #4f46e5;">
        <span style="font-size:28px;font-weight:700;letter-spacing:0.35em;color:#eef2ff;">${otp}</span>
      </div>
    </div>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">For your security, never share this code with anyone.</p>
  `
  return wrap(inner)
}

export function passwordResetEmail(resetLink, name) {
  const safeName = name ? String(name).slice(0, 80) : 'there'
  const inner = `
    <h1 style="margin:0;font-size:22px;line-height:1.3;color:#f8fafc;">Reset your password</h1>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#cbd5e1;">Hi ${safeName}, we received a request to reset your VaultX password. Click the button below within <strong style="color:#e2e8f0;">1 hour</strong>.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="${resetLink}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:linear-gradient(90deg,#6366f1,#7c3aed);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;border:1px solid #4f46e5;">Reset password</a>
    </div>
    <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;word-break:break-all;">If the button does not work, paste this link into your browser:<br /><span style="color:#a5b4fc;">${resetLink}</span></p>
  `
  return wrap(inner)
}
