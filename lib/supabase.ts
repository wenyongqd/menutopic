import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

// 创建客户端组件使用的Supabase客户端
export const createClient = () => {
  return createClientComponentClient<Database>()
}

// 获取当前用户
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 获取当前会话
export async function getCurrentSession() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = user ? { user } : null
  return session
}

// 检查用户是否已认证（客户端版本）
export async function isClientAuthenticated() {
  const session = await getCurrentSession()
  return !!session
}

// 获取用户资料
export async function getUserProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return { user, profile: data }
}

// 获取用户积分
export async function getUserCredits() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('credits')
    .eq('id', user.id)
    .single()
    
  if (error) {
    console.error('Error fetching user credits:', error)
    return null
  }
  
  return data.credits
}

// 获取用户最近的图片生成
export async function getUserRecentImages(limit = 5) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('image_generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error) {
    console.error('Error fetching user images:', error)
    return []
  }
  
  return data
} 