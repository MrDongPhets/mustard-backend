import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(url, anonKey);
export const supabaseAdmin = createClient(url, serviceKey);
