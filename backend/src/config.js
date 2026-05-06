import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;

// 🔥 AQUÍ SE CREA EL CLIENTE REAL
export const supabase = createClient(supabaseUrl, supabaseKey);

export const config = {
  supabase: {
    url: supabaseUrl,
    key: supabaseKey,
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  },
};

export default config;