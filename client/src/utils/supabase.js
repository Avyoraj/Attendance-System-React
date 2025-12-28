import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xutqesrorqiztfkowdyh.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dHFlc3JvcnFpenRma293ZHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MTU5NzksImV4cCI6MjA4MjI5MTk3OX0.PTrKWtH8fgGzZmgRH6q1xkKzwbIPrjJR4tdeAo2qzNc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
