import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const category = req.query.category?.trim() ?? 'all';

  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch portfolio items' });

  const categories = [...new Set(data.map(i => i.category).filter(Boolean))].sort();

  const filtered = category !== 'all' && category !== ''
    ? data.filter(i => i.category?.toLowerCase() === category.toLowerCase())
    : data;

  res.json({ data: filtered, categories, total: filtered.length });
});

export default router;
