import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
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
    
    // 解析请求体
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('[ADMIN_IMAGES_LIST] JSON parse error:', parseError);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid request format' 
      }, { status: 400 });
    }
    
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing userId' 
      }, { status: 400 });
    }
    
    // 验证请求的 userId 是否与当前用户匹配
    if (userId !== session.user.id) {
      // 这里可以添加额外的权限检查，例如检查用户是否为管理员
      // 但在这个例子中，我们只允许用户查看自己的图片
      return NextResponse.json({ 
        success: false, 
        message: 'You can only view your own images' 
      }, { status: 403 });
    }
    
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
    
    // 使用 admin 客户端获取图片列表
    const { data, error } = await supabaseAdmin
      .from('image_generations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[ADMIN_IMAGES_LIST] Error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch images',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      data
    });
  } catch (error) {
    console.error('[ADMIN_IMAGES_LIST] Unhandled error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 