import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase. Revisa tu archivo .env')
}

// Crear cliente único
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,    // Renovar token automáticamente
    persistSession: true,      // Guardar sesión en localStorage
    detectSessionInUrl: true   // Manejar redirect de OAuth
  }
})