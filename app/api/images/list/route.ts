import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// 标记为动态路由
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 获取URL查询参数
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    
    // 获取当前用户
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 创建具有 service_role 权限的客户端，绕过 RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // 构建查询
    let query = supabaseAdmin
      .from('image_generations')
      .select('*, menu_parsings(id, item_count)')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    // 如果指定了来源，添加筛选条件
    if (source) {
      query = query.eq('source', source);
    }
    
    // 执行查询
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('[IMAGES_LIST] Error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch images',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      images: data
    });
  } catch (error) {
    console.error('[IMAGES_LIST] Unhandled error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 