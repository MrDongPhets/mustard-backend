import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const id = req.query.id?.trim();

  if (!id) return res.status(400).json({ error: 'Missing required parameter: id' });

  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('id', id)
    .eq('is_active', true);

  if (error) return res.status(500).json({ error: 'Failed to fetch portfolio item' });
  if (!data?.length) return res.status(404).json({ error: 'Portfolio item not found' });

  const item = { ...data[0] };

  let galleryImages = [];
  if (item.gallery_images) {
    try {
      const parsed = JSON.parse(item.gallery_images);
      galleryImages = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      galleryImages = item.gallery_images.split('\n').map(s => s.trim()).filter(Boolean);
    }
  }

  item.gallery_images    = galleryImages;
  item.tools_list        = item.tools_used  ? item.tools_used.split(',').map(s => s.trim()).filter(Boolean)  : [];
  item.deliverables_list = item.deliverables ? item.deliverables.split(',').map(s => s.trim()).filter(Boolean) : [];

  const { data: allItems } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  const related = (allItems ?? [])
    .filter(r => r.id !== id && r.category === item.category)
    .slice(0, 3);

  res.json({ data: item, related });
});

export default router;
