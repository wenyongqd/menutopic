import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard'
  
  console.log('Auth callback - Code exists:', !!code, 'Redirect to:', redirectTo)

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // 交换 code 获取会话
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`)
    }
    
    // 设置一个特殊的 cookie 来标记刚刚验证的用户
    cookies().set('just_logged_in', 'true', {
      path: '/',
      maxAge: 60, // 1分钟后过期
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    // 如果用户存在，确保创建用户配置文件
    if (session?.user) {
      try {
        // 检查用户配置文件是否存在
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        // 如果配置文件不存在，创建一个新的
        if (!profile) {
          await supabase
            .from('user_profiles')
            .insert({ id: session.user.id, credits: 0 })
        }
      } catch (error) {
        console.error('Error ensuring user profile exists:', error)
      }
    }
  }

  // 确保重定向路径以 / 开头
  const normalizedRedirectPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`
  const redirectUrl = `${requestUrl.origin}${normalizedRedirectPath}`
  
  console.log('Redirecting to:', redirectUrl)
  
  return NextResponse.redirect(redirectUrl)
} 