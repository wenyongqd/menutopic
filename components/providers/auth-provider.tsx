"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null } | undefined>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshData: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  // Add refs to track state and prevent loops
  const isInitialMount = useRef(true)
  const lastPathname = useRef(pathname)
  const isRefreshing = useRef(false)
  const dashboardVisited = useRef(false)
  const authStateChecked = useRef(false)

  // 确保用户配置文件存在
  const ensureUserProfile = async (userId: string) => {
    try {
      console.log('AuthProvider - Ensuring user profile exists for:', userId)
      
      const supabase = createClient()
      
      // 检查用户配置文件是否存在
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle() // 使用 maybeSingle 而不是 single，这样如果没有结果也不会抛出错误
      
      console.log('AuthProvider - User profile check result:', data, error)
      
      // 如果不存在，则创建一个
      if (!data) {
        console.log('AuthProvider - Creating user profile for user:', userId)
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({ id: userId, credits: 0 })
          .select()
        
        if (insertError) {
          console.error('AuthProvider - Error creating user profile:', insertError)
          return
        }
        
        console.log('AuthProvider - Created new user profile:', newProfile)
      }
    } catch (error) {
      console.error('AuthProvider - Failed to ensure user profile exists:', error)
    }
  }

  // 使用 useCallback 包装 getSession 函数，避免不必要的重新创建
  const getSession = useCallback(async () => {
    try {
      if (isRefreshing.current) {
        console.log('AuthProvider - Already refreshing, skipping getSession');
        return;
      }
      
      isRefreshing.current = true;
      
      // 只有在初始加载时才设置 isLoading 为 true
      // 这样可以避免在已经有用户的情况下触发重定向
      if (!user && !session) {
        setIsLoading(true);
      }
      
      console.log('AuthProvider - Getting session')
      
      // 检查本地存储中是否有会话标记
      if (typeof window !== 'undefined') {
        const hasLocalSession = localStorage.getItem('auth_session_established');
        if (hasLocalSession && !session) {
          console.log('AuthProvider - Local session marker found, session might be establishing');
        }
      }
      
      const supabase = createClient()
      const { data: { user: newUser }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('AuthProvider - Error getting user:', error)
        setIsLoading(false)
        isRefreshing.current = false;
        return
      }
      
      console.log('AuthProvider - User:', newUser ? `exists with id ${newUser.id}` : 'null')
      
      // 创建会话对象（为了保持接口兼容）
      const newSession = newUser ? {
        user: newUser,
        access_token: '',
        refresh_token: '',
        expires_in: 0,
        token_type: 'bearer'
      } : null;
      
      // 只有在用户状态真正变化时才更新状态
      // 这样可以避免不必要的状态重置
      if (
        (!user && newUser) || 
        (user && !newUser) || 
        (user?.id !== newUser?.id)
      ) {
        console.log('AuthProvider - User state changed, updating');
        setSession(newSession);
        setUser(newUser);
        
        // 如果找到了用户，确保本地存储标记已设置
        if (newUser && typeof window !== 'undefined') {
          localStorage.setItem('auth_session_established', 'true');
        }
      } else {
        console.log('AuthProvider - User state unchanged, preserving current state');
      }
      
      authStateChecked.current = true;
      
      // 如果用户已登录，确保用户配置文件存在
      if (newUser) {
        await ensureUserProfile(newUser.id)
      }
    } catch (error) {
      console.error('AuthProvider - Unexpected error getting user:', error)
    } finally {
      setIsLoading(false)
      isRefreshing.current = false;
    }
  }, [user, session])

  // Initial setup effect - runs only once
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;
    
    console.log('AuthProvider - Initial setup');
    
    // 初始化时获取会话
    getSession();

    // Set up auth state change listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider - Auth state changed:', event, session ? `for user ${session.user.id}` : 'no session')
        
        // 对于某些事件，我们需要特别小心处理
        if (event === 'SIGNED_IN') {
          console.log('AuthProvider - User signed in, updating state');
          // 登录事件，更新状态
          setIsLoading(true);
          setSession(session);
          setUser(session?.user ?? null);
          authStateChecked.current = true;
          
          // 如果用户已登录，确保用户配置文件存在
          if (session?.user) {
            await ensureUserProfile(session.user.id);
          }
          
          setIsLoading(false);
          
          // Force refresh server components
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthProvider - User signed out, clearing state');
          // 登出事件，清除状态
          setIsLoading(true);
          setSession(null);
          setUser(null);
          authStateChecked.current = true;
          setIsLoading(false);
          
          // Force refresh server components
          router.refresh();
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('AuthProvider - Token refreshed, preserving user state');
          // 令牌刷新事件，只更新会话，不改变用户状态
          setSession(session);
          authStateChecked.current = true;
          
          // Force refresh server components
          router.refresh();
        } else {
          // 其他事件，如 USER_UPDATED，只在状态真正变化时更新
          console.log('AuthProvider - Other auth event, checking if state needs update');
          
          const needsUpdate = 
            (!user && session?.user) || 
            (user && !session) || 
            (user?.id !== session?.user.id);
            
          if (needsUpdate) {
            console.log('AuthProvider - Auth state needs update');
            setIsLoading(true);
            setSession(session);
            setUser(session?.user ?? null);
            authStateChecked.current = true;
            
            // 如果用户已登录，确保用户配置文件存在
            if (session?.user) {
              await ensureUserProfile(session.user.id);
            }
            
            setIsLoading(false);
          } else {
            console.log('AuthProvider - Auth state unchanged, preserving current state');
          }
          
          // Force refresh server components
          router.refresh();
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array to run only once

  // 添加一个刷新数据的函数
  const refreshData = useCallback(() => {
    if (isRefreshing.current) {
      console.log('AuthProvider - Already refreshing, skipping refreshData');
      return;
    }
    
    console.log('AuthProvider - Manually refreshing data');
    
    // 检查是否刚刚登录，如果是，使用特殊处理
    if (typeof window !== 'undefined' && sessionStorage.getItem('just_logged_in')) {
      console.log('AuthProvider - Just logged in state detected, using special refresh flow');
      
      // 标记为正在刷新，但不设置 isLoading
      isRefreshing.current = true;
      
      // 只刷新路由，不重新获取会话
      router.refresh();
      
      // 延迟一段时间后重置刷新标志
      setTimeout(() => {
        isRefreshing.current = false;
        console.log('AuthProvider - Special refresh completed');
      }, 500);
      
      return;
    }
    
    // 对于普通刷新，使用更安全的方法
    // 标记为正在刷新，但不设置 isLoading
    isRefreshing.current = true;
    
    // 保存当前的用户和会话状态，以便在出错时恢复
    const currentUser = user;
    
    console.log('AuthProvider - Current user before refresh:', currentUser?.id || 'null');
    
    // 使用 Promise 包装 getSession 调用，以便更好地处理错误
    new Promise<void>(async (resolve) => {
      try {
        // 直接使用 Supabase 客户端获取会话，而不是调用 getSession
        const { data, error } = await createClient().auth.getUser();
        
        if (error) {
          console.error('AuthProvider - Error refreshing user:', error);
          // 出错时恢复原始状态
          console.log('AuthProvider - Error during refresh, preserving original state');
          resolve();
          return;
        }
        
        const newUser = data.user;
        
        // 创建会话对象（为了保持接口兼容）
        const newSession = newUser ? {
          user: newUser,
          access_token: '',
          refresh_token: '',
          expires_in: 0,
          token_type: 'bearer'
        } : null;
        
        // 只有在会话状态真正变化时才更新状态
        if (
          (!currentUser && newUser) || 
          (currentUser && !newUser) || 
          (currentUser?.id !== newUser?.id)
        ) {
          console.log('AuthProvider - User state changed during refresh, updating');
          setSession(newSession);
          setUser(newUser);
        } else {
          console.log('AuthProvider - User state unchanged during refresh, preserving current state');
          // 确保状态保持一致
          if (currentUser && !user) {
            console.log('AuthProvider - User state was lost, restoring');
            setUser(currentUser);
          }
        }
        
        // 如果有会话但用户状态为 null，修复这种不一致
        if (newUser && !user) {
          console.log('AuthProvider - Inconsistent state detected, fixing user state');
          setUser(newUser);
        }
        
        resolve();
      } catch (error) {
        console.error('AuthProvider - Unexpected error during refresh:', error);
        // 出错时恢复原始状态
        if (currentUser && !user) {
          console.log('AuthProvider - Error during refresh, restoring user state');
          setUser(currentUser);
        }
        resolve();
      }
    }).finally(() => {
      // 刷新路由
      router.refresh();
      
      // 延迟一段时间后重置刷新标志
      setTimeout(() => {
        isRefreshing.current = false;
        console.log('AuthProvider - Refresh completed');
      }, 500);
    });
  }, [router, user, session]);

  // Path change effect - handle navigation to dashboard
  useEffect(() => {
    // Skip if this is the initial mount
    if (isInitialMount.current) return;
    
    // Skip if the path hasn't actually changed
    if (pathname === lastPathname.current) return;
    
    // Update the last pathname
    lastPathname.current = pathname;
    
    console.log('AuthProvider - Path changed to:', pathname);
    
    // Handle dashboard navigation specifically
    if (pathname === '/dashboard' && user && !isLoading && !dashboardVisited.current) {
      console.log('AuthProvider - First dashboard visit detected');
      dashboardVisited.current = true;
      
      // 不要在这里刷新会话，这会导致用户状态被重置
      // 只记录访问状态，不执行任何可能导致状态重置的操作
      console.log('AuthProvider - Dashboard visit recorded, preserving authentication state');
      
      // 如果需要刷新数据，使用一个不会重置用户状态的方法
      if (typeof window !== 'undefined') {
        // 检查是否刚刚登录
        const justLoggedIn = sessionStorage.getItem('just_logged_in');
        if (justLoggedIn) {
          console.log('AuthProvider - Just logged in state detected, preserving session');
          // 不执行任何可能导致状态重置的操作
        }
      }
    } else if (pathname !== '/dashboard') {
      // Reset dashboard visited flag when navigating away
      dashboardVisited.current = false;
    }
  }, [pathname, user, isLoading]);

  // 确保在登录后立即检查会话状态
  useEffect(() => {
    // 如果已经检查过认证状态，则跳过
    if (authStateChecked.current) return;
    
    // 如果正在刷新，则跳过
    if (isRefreshing.current) return;
    
    // 如果页面是 dashboard 或其他需要认证的页面，并且没有用户，则检查会话
    if ((pathname === '/dashboard' || pathname.startsWith('/images/') || pathname.startsWith('/credits/')) && !user && !isLoading) {
      console.log('AuthProvider - Protected page loaded without user, checking session');
      getSession();
    }
  }, [pathname, user, isLoading, getSession]);

  // 添加一个新的 useEffect 钩子，在组件挂载时强制检查会话状态
  useEffect(() => {
    // 如果用户状态为 null 但页面显示的是需要认证的内容，强制检查会话
    const checkSessionOnMount = async () => {
      if (!user && !isLoading && !isRefreshing.current) {
        console.log('AuthProvider - Forcing session check on mount');
        await getSession();
      }
    };
    
    checkSessionOnMount();
    
    // 每隔一段时间检查一次会话状态，确保客户端状态与服务器同步
    const intervalId = setInterval(() => {
      if (!isRefreshing.current && !isLoading) {
        console.log('AuthProvider - Periodic session check');
        getSession();
      }
    }, 60000); // 每分钟检查一次
    
    return () => clearInterval(intervalId);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Signing in with email:', email)
    
    try {
      setIsLoading(true)
      
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      console.log('Sign in successful, user:', data.user?.id)
      
      // 登录成功后，确保用户配置文件存在
      if (data.user) {
        try {
          await ensureUserProfile(data.user.id)
        } catch (profileError) {
          console.error('Error ensuring user profile exists:', profileError)
          // 继续执行，不要因为配置文件错误而阻止登录
        }
      }

      return data
    } catch (error) {
      console.error('Error during sign in process:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    // Get the current URL to extract any redirect parameter
    const currentUrl = new URL(window.location.href);
    const redirectPath = currentUrl.searchParams.get('redirect') || '/dashboard';
    
    try {
      setIsLoading(true)
      
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=${redirectPath}`,
        },
      })

      if (error) {
        throw error
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      
      // 立即清除状态，不等待服务器响应
      setUser(null)
      setSession(null)
      
      // 清除所有会话标记
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('just_logged_in');
        localStorage.removeItem('auth_session_established');
        sessionStorage.removeItem('last_logged_in_user');
        
        // 清除 cookie
        document.cookie = "just_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      
      // 强制刷新路由
      router.refresh()
      
      // 调用Supabase登出API
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error in Supabase signOut:', error)
      }
    } catch (error) {
      console.error('Error signing out:', error)
      // 不使用 toast，直接记录错误
      
      // 即使出错，也确保用户状态被清除
      setUser(null)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    try {
      setIsLoading(true)
      
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/reset-password/update`,
      })

      if (error) {
        throw error
      }
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshData
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 