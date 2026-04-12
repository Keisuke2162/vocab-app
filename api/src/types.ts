import type { User, SupabaseClient } from "@supabase/supabase-js";

export type AppVariables = {
  user: User;
  userSupabase: SupabaseClient;
};
