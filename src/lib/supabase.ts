import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://psyzfnepaqtzlxjdulva.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzeXpmbmVwYXF0emx4amR1bHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODg4MDcsImV4cCI6MjA5MTc2NDgwN30.KIMJqwCe1JQB182HqQ4oy297y-GlNZrxiFW_NvnbxqE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
