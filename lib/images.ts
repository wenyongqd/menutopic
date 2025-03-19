import { createClient } from "@/lib/supabase";

interface MenuParsing {
  id: string;
  item_count: number;
}

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
  menu_parsings?: MenuParsing | null;
}

export async function getRecentImages(userId: string): Promise<ImageGeneration[]> {
  const supabase = createClient();
  
  const { data: recentImages, error } = await supabase
    .from('image_generations')
    .select('*, menu_parsings(id, item_count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent images:', error);
    return [];
  }

  return recentImages || [];
} 