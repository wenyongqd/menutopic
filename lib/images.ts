import { createClient } from "@/lib/supabase";

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
  const supabase = createClient();
  
  const { data: recentImages, error } = await supabase
    .from('image_generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent images:', error);
    return [];
  }

  return recentImages || [];
} 