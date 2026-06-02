import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (_, res) => {
  const [hero, about, services, workSteps, portfolio, testimonials] = await Promise.all([
    supabase.from('hero_section').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1),
    supabase.from('about_section').select('*').eq('is_active', true).order('updated_at', { ascending: false }).limit(1),
    supabase.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true }),
    supabase.from('work_steps').select('*').eq('is_active', true).order('step_order', { ascending: true }),
    supabase.from('portfolio_items').select('*').eq('is_active', true).order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(6),
    supabase.from('testimonials').select('*').eq('is_active', true).order('display_order', { ascending: true }),
  ]);

  res.json({
    hero:         hero.data?.[0]        ?? null,
    about:        about.data?.[0]       ?? null,
    services:     services.data         ?? [],
    work_steps:   workSteps.data        ?? [],
    portfolio:    portfolio.data        ?? [],
    testimonials: testimonials.data     ?? [],
  });
});

export default router;
