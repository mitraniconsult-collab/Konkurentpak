import { createClient } from "@supabase/supabase-js";

export type AdminRole = "admin" | "editor";

export async function authorizeAdmin(request: Request): Promise<{ id: string; role: AdminRole } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const authorization = request.headers.get("authorization") ?? "";
  if (!url || !key || !authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  if (!token || token.length > 8192) return null;

  // Never trust a client-supplied role or editable user_metadata.
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) return null;
  const role = data.user.app_metadata?.role;
  if (role !== "admin" && role !== "editor") return null;
  return { id: data.user.id, role };
}
