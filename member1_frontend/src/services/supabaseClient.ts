import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jzdrpxsyuyuxkabpgfwr.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Z2PmIQ6XiTe01Xijp_zyQA_C1nxJdKo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
