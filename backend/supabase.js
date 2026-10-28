const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase environment variables are missing. Database requests will fail until backend/.env is configured.");
}

const supabase = createClient(
  process.env.SUPABASE_URL || "https://example.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "missing-service-role-key",
  { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
);

module.exports = supabase;
