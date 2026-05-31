export function welcomeEmail(name: string): { subject: string; html: string } {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "Welcome to FormLayer",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,0.06);overflow:hidden;">
    <!-- Header -->
    <div style="padding:32px 40px 24px;border-bottom:1px solid rgba(0,0,0,0.06);">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#7F77DD;"></div>
        <span style="font-size:15px;font-weight:600;color:#0a0a0a;letter-spacing:-0.02em;">FormLayer</span>
      </div>
    </div>
    <!-- Body -->
    <div style="padding:32px 40px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#0a0a0a;letter-spacing:-0.02em;">
        Welcome, ${firstName}.
      </h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280;">
        You're now on FormLayer — the AI-powered operating system for supplement formulation, compliance, and manufacturer handoff.
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;">
        Here's how to get started:
      </p>
      <!-- Steps -->
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <div style="width:24px;height:24px;border-radius:50%;background:#0a0a0a;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div>
          <div>
            <p style="margin:0;font-size:13px;font-weight:600;color:#0a0a0a;">Build your first formulation</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Tell the AI your health goal and product type. It drafts an evidence-backed stack in seconds.</p>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <div style="width:24px;height:24px;border-radius:50%;background:#0a0a0a;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div>
          <div>
            <p style="margin:0;font-size:13px;font-weight:600;color:#0a0a0a;">Run the compliance checker</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Get a 0–100 FDA compliance score with specific claim fixes before anything goes to a manufacturer.</p>
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <div style="width:24px;height:24px;border-radius:50%;background:#0a0a0a;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div>
          <div>
            <p style="margin:0;font-size:13px;font-weight:600;color:#0a0a0a;">Export your dossier</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Generate a print-ready PDF spec sheet or a public share link for your manufacturer or client.</p>
          </div>
        </div>
      </div>
      <!-- CTA -->
      <a href="https://formlayer.co/dashboard/formulations/new" style="display:inline-block;background:#0a0a0a;color:#fff;font-size:13px;font-weight:500;text-decoration:none;padding:12px 24px;border-radius:10px;">
        Start your first formulation →
      </a>
    </div>
    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid rgba(0,0,0,0.06);background:#f9fafb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        You're receiving this because you signed up at formlayer.co.
        Questions? Reply to this email or contact <a href="mailto:support@formlayer.co" style="color:#7F77DD;">support@formlayer.co</a>.
      </p>
    </div>
  </div>
</body>
</html>`,
  };
}
