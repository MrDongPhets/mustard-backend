import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch testimonials' });

  const testimonials = limit && limit > 0 ? (data ?? []).slice(0, limit) : (data ?? []);

  res.json({ data: testimonials, total: testimonials.length });
});

export default router;
