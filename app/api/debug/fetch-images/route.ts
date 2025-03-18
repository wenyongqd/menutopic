import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // 获取当前用户
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 })
    }
    
    // 解析请求体
    const body = await req.json()
    const { userId } = body
    
    // 验证请求的userId与当前登录用户是否匹配
    if (userId !== session.user.id) {
      return NextResponse.json({ 
        success: false, 
        message: 'You can only fetch your own images' 
      }, { status: 403 })
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
    )
    
    // 使用管理员权限获取图片数据
    const { data: images, error } = await supabaseAdmin
      .from('image_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching images with admin client:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch images',
        error: error.message
      }, { status: 500 })
    }
    
    // 检查是否找到图片
    if (!images || images.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No images found',
        images: []
      })
    }
    
    // 返回找到的图片
    return NextResponse.json({ 
      success: true,
      message: `Found ${images.length} images`,
      images
    })
  } catch (error) {
    console.error('Fetch images error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: String(error)
    }, { status: 500 })
  }
} 