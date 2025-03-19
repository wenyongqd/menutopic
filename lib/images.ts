import { createClient } from "@/lib/supabase";

export interface ImageGeneration {
  id: string;
  created_at: string;
  prompt: string;
  image_url: string;
  status: string;
  source?: string;
  menu_parsings?: {
    id: string;
    item_count: number;
  } | null;
}

export async function getRecentImages(userId: string): Promise<ImageGeneration[]> {
  const supabase = createClient();
  
  const { data: recentImages } = await supabase
    .from('image_generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return recentImages || [];
} 