import { createClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createClient> | null = null;

function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL in environment");
  if (!supabaseServiceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment");

  cachedClient ??= createClient(supabaseUrl, supabaseServiceRoleKey);
  return cachedClient;
}

export const supabaseServer = new Proxy({} as any, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseServerClient(), prop, receiver);
  },
});
