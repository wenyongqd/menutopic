'use server'

import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';

// 为服务器组件创建Supabase客户端
export async function createServerClient() {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
}

// 创建服务器操作客户端
export async function createActionClient() {
  return createServerActionClient<Database>({ cookies });
}

// 创建管理员客户端，绕过RLS
export async function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// 服务器端获取用户会话
export async function getServerSession() {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

// 服务器端获取用户
export async function getServerUser() {
  const session = await getServerSession();
  return session?.user || null;
}

// 服务器端检查用户是否已认证
export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session;
} 