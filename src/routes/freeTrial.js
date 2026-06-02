import { Router } from 'express';
import { Resend } from 'resend';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const TEAM_EMAIL = process.env.TEAM_EMAIL || 'hello@mustarddigitals.com';
const FROM_EMAIL = process.env.FROM_EMAIL  || 'noreply@mustarddigitals.com';

// Max 3 submissions per IP per day
const trialLimiter = rateLimit({
  windowMs:        24 * 60 * 60 * 1000,
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many submissions from this IP. Please try again tomorrow.' },
});

router.use(trialLimiter);

router.post('/', async (req, res) => {
  const {
    name, email, businessName, country, serviceType,
    taskDescription, expectedOutput = '', referenceLinks = '', notes = '', agreed,
  } = req.body;

  const errors = [];
  if (!name?.trim())            errors.push('Name is required');
  if (!email?.trim())           errors.push('Email is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email address');
  if (!businessName?.trim())    errors.push('Business name is required');
  if (!country?.trim())         errors.push('Country is required');
  if (!serviceType?.trim())     errors.push('Service type is required');
  if (!taskDescription?.trim()) errors.push('Task description is required');
  if (!agreed)                  errors.push('You must agree before submitting');

  if (errors.length) return res.status(422).json({ success: false, errors });

  // Block duplicate email submissions
  const { data: existing } = await supabaseAdmin
    .from('free_trial_submissions')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .limit(1);

  if (existing?.length) {
    return res.status(409).json({ success: false, error: 'A trial request has already been submitted with this email address.' });
  }

  await supabaseAdmin.from('free_trial_submissions').insert({
    name:             name.trim(),
    email:            email.trim().toLowerCase(),
    business_name:    businessName.trim(),
    country:          country.trim(),
    service_type:     serviceType.trim(),
    task_description: taskDescription.trim(),
    expected_output:  expectedOutput.trim(),
    reference_links:  referenceLinks.trim(),
    notes:            notes.trim(),
  });

  const [teamResult, clientResult] = await Promise.allSettled([
    resend.emails.send({
      from:    FROM_EMAIL,
      to:      TEAM_EMAIL,
      subject: `New Free Trial Request — ${businessName} (${serviceType})`,
      html:    teamEmail({ name, email, businessName, country, serviceType, taskDescription, expectedOutput, referenceLinks, notes }),
    }),
    resend.emails.send({
      from:    FROM_EMAIL,
      to:      email.trim(),
      subject: 'We received your free trial request — MUSTARD Digitals',
      html:    confirmationEmail({ name, serviceType }),
    }),
  ]);

  // Fallback: if team notification failed, try Web3Forms
  if (teamResult.status === 'rejected') {
    const web3Key = process.env.WEB3FORMS_KEY;
    if (web3Key) {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: web3Key,
          subject:    `New Free Trial Request — ${businessName}`,
          name, email, businessName, country, serviceType, taskDescription,
        }),
      }).catch(() => {});
    }
  }

  res.json({ success: true });
});

function teamEmail({ name, email, businessName, country, serviceType, taskDescription, expectedOutput, referenceLinks, notes }) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:#1F1F1F;padding:32px 40px;">
    <div style="font-size:20px;font-weight:900;color:#fff;">MUSTARD <span style="color:#D4A017;">Digitals</span></div>
    <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">New Free Trial Submission</div>
  </div>
  <div style="padding:36px 40px;">
    <h2 style="font-size:18px;font-weight:800;color:#1F1F1F;margin:0 0 24px;">🎯 New Trial Request</h2>
    ${row('Name', name)}
    ${row('Email', `<a href="mailto:${email}" style="color:#D4A017;">${email}</a>`)}
    ${row('Business', businessName)}
    ${row('Country', country)}
    ${row('Service', serviceType)}
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
    ${block('Task Description', taskDescription)}
    ${expectedOutput ? block('Expected Output', expectedOutput) : ''}
    ${referenceLinks ? block('Reference Links', `<a href="${referenceLinks}" style="color:#D4A017;">${referenceLinks}</a>`) : ''}
    ${notes ? block('Additional Notes', notes) : ''}
  </div>
  <div style="background:#fafafa;padding:20px 40px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">
    MUSTARD Digitals · mustarddigitals.com
  </div>
</div>
</body></html>`;
}

function confirmationEmail({ name, serviceType }) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:#1F1F1F;padding:32px 40px;">
    <div style="font-size:20px;font-weight:900;color:#fff;">MUSTARD <span style="color:#D4A017;">Digitals</span></div>
  </div>
  <div style="padding:36px 40px;">
    <h2 style="font-size:20px;font-weight:900;color:#1F1F1F;margin:0 0 12px;">Hey ${name}, we got your request! 🎉</h2>
    <p style="font-size:14px;color:#555;line-height:1.8;margin:0 0 24px;">
      We received your free trial request for <strong>${serviceType}</strong>. Our team will review it shortly.
    </p>
    <div style="background:rgba(212,160,23,0.06);border:1px solid rgba(212,160,23,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:700;color:#1F1F1F;margin-bottom:8px;">📅 Next Step — Book Your Discovery Call</div>
      <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 14px;">
        Your trial task only begins after a 15–20 min discovery call. Book your slot now to lock in your spot.
      </p>
      <a href="https://calendly.com/mustarddigitalsolutions/30min" style="display:inline-block;background:#D4A017;color:#1F1F1F;font-weight:700;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Book Discovery Call →
      </a>
    </div>
    <p style="font-size:12px;color:#999;line-height:1.7;margin:0;">
      Questions? Reply to this email or reach us at <a href="mailto:hello@mustarddigitals.com" style="color:#D4A017;">hello@mustarddigitals.com</a>
    </p>
  </div>
  <div style="background:#fafafa;padding:20px 40px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">
    © 2025 MUSTARD Digitals · mustarddigitals.com
  </div>
</div>
</body></html>`;
}

function row(label, value) {
  return `<div style="display:flex;gap:12px;margin-bottom:10px;font-size:13px;">
    <span style="font-weight:700;color:#1F1F1F;min-width:100px;">${label}</span>
    <span style="color:#555;">${value}</span>
  </div>`;
}

function block(label, value) {
  return `<div style="margin-bottom:16px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:6px;">${label}</div>
    <div style="font-size:13px;color:#333;line-height:1.7;background:#fafafa;border-radius:8px;padding:12px 14px;">${value}</div>
  </div>`;
}

export default router;
