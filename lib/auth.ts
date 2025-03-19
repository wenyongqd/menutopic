import { createClient } from "@/lib/supabase";

export async function getServerUserProfile() {
  const supabase = createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  return { user };
} 