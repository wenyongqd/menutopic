import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

// 创建服务器端组件使用的Supabase客户端
export const createClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// 获取服务器端的用户资料
export async function getServerUserProfile() {
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

// 获取服务器端的用户积分
export async function getServerUserCredits() {
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