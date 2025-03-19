import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// 标记为动态路由
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    // 创建 Supabase 客户端
    const supabase = createClient();

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 构建查询
    let query = supabase
      .from('image_generations')
      .select('*, menu_parsings(id, item_count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 如果指定了来源，添加筛选条件
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    // 执行查询
    const { data: images, error } = await query;

    if (error) {
      console.error('Error fetching images:', error);
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    return NextResponse.json({ images: images || [] });
  } catch (error) {
    console.error('Error in image list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 