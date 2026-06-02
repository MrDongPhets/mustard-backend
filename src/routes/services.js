import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (_, res) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch services' });

  res.json({ data: data ?? [], total: data?.length ?? 0 });
});

export default router;
