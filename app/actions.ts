'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createActionClient, createServerClient, createAdminClient } from '@/app/lib/supabase-server'

// 服务器端登录操作
export async function serverLogin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo')?.toString() || '/dashboard'

  try {
    const supabase = await createActionClient()
    
    if (!supabase) {
      return { success: false, error: 'Failed to create Supabase client' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // 确保用户配置文件存在
    if (data.user) {
      try {
        // 检查用户配置文件是否存在
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) {
          console.error('Error checking user profile:', profileError)
        }

        // 如果不存在，则创建一个
        if (!profile) {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({ id: data.user.id, credits: 0 })

          if (insertError) {
            console.error('Error creating user profile:', insertError)
          }
        }
      } catch (profileError) {
        console.error('Error ensuring user profile exists:', profileError)
      }
    }

    // 设置一个特殊的 cookie 来帮助中间件识别刚刚登录的用户
    cookies().set('just_logged_in', 'true', {
      path: '/',
      maxAge: 60, // 1分钟
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return { success: true, redirectTo }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// 服务器端注册操作
export async function serverSignUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string || '/dashboard'

  try {
    const supabase = await createActionClient()
    
    if (!supabase) {
      return { success: false, error: 'Failed to create Supabase client' }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?redirect_to=${redirectTo}`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { 
      success: true, 
      message: '注册成功！请检查您的邮箱以验证您的账户。',
      emailConfirmation: !data.session // 如果没有会话，说明需要邮箱确认
    }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// 服务器端登出操作
export async function serverLogout() {
  try {
    const supabase = await createActionClient()
    
    if (!supabase) {
      console.error('Failed to create Supabase client')
      redirect('/login')
      return
    }
    
    await supabase.auth.signOut()
    
    // 清除特殊的 cookie
    cookies().delete('just_logged_in')
  } catch (error) {
    console.error('Logout error:', error)
  }
  
  // 无论成功还是失败，都重定向到登录页面
  redirect('/login')
}

// 服务器端获取用户信息
export async function getServerUserProfile() {
  const supabase = await createServerClient()
  const { data, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !data.session?.user) {
    console.error('Error getting session:', sessionError)
    return null
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return { user: data.session.user, profile }
}

// 服务器端获取用户积分
export async function getServerUserCredits() {
  const supabase = await createServerClient()
  const { data, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !data.session?.user) {
    console.error('Error getting session:', sessionError)
    return null
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('credits')
    .eq('id', data.session.user.id)
    .single()

  if (error) {
    console.error('Error fetching user credits:', error)
    return null
  }

  return profile.credits
}

// 服务器端获取用户最近的图片生成
export async function getServerUserRecentImages(limit = 5) {
  // 获取用户会话
  const supabase = await createServerClient()
  const { data, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !data.session?.user) {
    console.error('Error getting session:', sessionError)
    return []
  }

  // 使用管理员客户端获取图片数据，绕过RLS
  try {
    const supabaseAdmin = await createAdminClient()
    const { data: images, error } = await supabaseAdmin
      .from('image_generations')
      .select('*')
      .eq('user_id', data.session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user images:', error)
      return []
    }

    return images
  } catch (error) {
    console.error('Error with admin client:', error)
    return []
  }
} 