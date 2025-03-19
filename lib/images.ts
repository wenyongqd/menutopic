import { createClient } from "@/lib/supabase";
import { createClient as createAdminClient } from '@supabase/supabase-js';

export interface ImageGeneration {
  id: string;
  created_at: string;
  user_id: string;
  prompt: string;
  image_url: string;
  credits_used: number;
  status: string;
  source: string;
  menu_parsing_id?: string;
}

export async function getRecentImages(userId: string): Promise<ImageGeneration[]> {
  // Create admin client to bypass RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    const { data: recentImages, error } = await supabaseAdmin
      .from('image_generations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')  // Only get completed images
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent images:', error);
      return [];
    }

    return recentImages || [];
  } catch (error) {
    console.error('Error in getRecentImages:', error);
    return [];
  }
} 