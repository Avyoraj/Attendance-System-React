import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xutqesrorqiztfkowdyh.supabase.co';

// New key structure: sb_publishable_... (safe for frontend)
// Falls back to legacy anon key for backward compatibility
const supabasePublishableKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY 
  || process.env.REACT_APP_SUPABASE_ANON_KEY 
  || 'sb_publishable_YOUR_KEY_HERE'; // Replace with your actual key

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export default supabase;
