import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/supabase'

// 受保护的路由，需要登录才能访问
const protectedRoutes = [
  '/dashboard',
  '/credits',
  '/images/generate',
  '/profile',
]

// 公开路由，不需要登录也可以访问
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/landing',
]

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  // 跳过对静态资源的处理
  if (path.includes('_next') || 
      path.includes('favicon.ico') || 
      path.includes('api') ||
      path.includes('static') ||
      (path.includes('image') && !path.startsWith('/images/generate'))) {
    return NextResponse.next()
  }
  
  // 完全跳过对公开页面的处理，除了首页
  if (publicRoutes.includes(path) && path !== '/') {
    console.log(`Middleware - Public route detected: ${path}, skipping auth check`)
    return NextResponse.next()
  }
  
  try {
    // 创建响应对象
    const res = NextResponse.next()
    
    // 创建 Supabase 客户端
    const supabase = createMiddlewareClient<Database>({ req, res })
    
    // 尝试刷新会话 - 这会自动处理令牌刷新
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware - Error refreshing session:', error)
    }
    
    const isAuthenticated = !!session
    
    // 添加调试日志
    console.log(`Middleware - Path: ${path}, Authenticated: ${isAuthenticated}`)
    
    // 如果是首页且用户已登录，重定向到 dashboard
    if (path === '/' && isAuthenticated) {
      console.log('Middleware - Redirecting authenticated user from homepage to dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // 如果是首页且用户未登录，允许访问
    if (path === '/' && !isAuthenticated) {
      console.log('Middleware - Unauthenticated user accessing homepage, allowing')
      return res
    }
    
    // 如果是受保护路由且用户未登录，重定向到登录页面
    const isProtectedRoute = protectedRoutes.some(route => 
      path === route || path.startsWith(`${route}/`)
    )
    
    if (!isAuthenticated && isProtectedRoute) {
      console.log(`Middleware - Unauthenticated user accessing protected route: ${path}, redirecting to login`)
      
      // 检查是否有认证相关的 cookie，这可能表明会话正在建立中
      const hasAuthCookie = req.cookies.getAll().some(cookie => 
        cookie.name.includes('sb-') || 
        cookie.name.includes('supabase.auth')
      )
      
      // 如果有认证 cookie 但没有会话，可能是会话正在建立中
      // 在这种情况下，我们使用临时重定向，这样浏览器会在刷新时重试
      if (hasAuthCookie) {
        console.log('Middleware - Auth cookies found but no session, session might be establishing')
        
        // 检查是否有特殊的 just_logged_in cookie
        const justLoggedIn = req.cookies.get('just_logged_in')
        
        if (justLoggedIn) {
          console.log('Middleware - Just logged in cookie found, allowing access')
          return res
        }
        
        // 返回临时重定向到当前URL，这会导致浏览器重试
        // 使用状态码302而不是307，因为302更适合临时重定向
        return NextResponse.redirect(req.url, { status: 302 })
      }
      
      // 如果没有认证 cookie，重定向到登录页面
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }
    
    // 其他情况，允许访问
    console.log(`Middleware - Default case, allowing access to: ${path}`)
    return res
  } catch (error) {
    console.error('Middleware - Unexpected error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - API routes
     * - Static files
     * - Image files
     * - Font files
     * - Favicon
     * - Auth-related endpoints
     */
    '/((?!api|_next/static|_next/image|fonts|favicon.ico|auth).*)'
    // Add specific matchers for important routes
    ,'/images/generate'
    ,'/'  // Explicitly include the root path
  ],
} 