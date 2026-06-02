import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email, phone = '', service = '', message, newsletter = false } = req.body;

  const errors = [];
  if (!name?.trim())    errors.push('Name is required');
  if (!email?.trim())   errors.push('Email is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email address');
  if (!message?.trim()) errors.push('Message is required');

  if (errors.length) return res.status(422).json({ success: false, errors });

  await supabaseAdmin.from('contacts').insert({
    name:       name.trim(),
    email:      email.trim(),
    phone:      phone.trim(),
    service:    service.trim(),
    message:    message.trim(),
    newsletter: Boolean(newsletter),
  });

  const web3Key = process.env.WEB3FORMS_KEY;
  await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_key: web3Key, name, email, phone, service, message }),
  }).catch(() => {});

  res.json({ success: true });
});

export default router;
