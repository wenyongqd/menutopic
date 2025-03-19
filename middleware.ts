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
  
  // 检查是否是支付成功页面
  const isSuccessPage = path.startsWith('/credits/success')
  
  // 跳过对静态资源的处理
  if (path.includes('_next') || 
      path.includes('favicon.ico') || 
      path.includes('api') ||
      path.includes('static') ||
      (path.includes('image') && !path.startsWith('/images/generate'))) {
    return NextResponse.next()
  }
  
  // 如果是公开路由，直接允许访问
  if (publicRoutes.includes(path)) {
    console.log(`Middleware - Public route detected: ${path}, skipping auth check`)
    return NextResponse.next()
  }
  
  try {
    // 创建响应对象
    const res = NextResponse.next()
    
    // 检查是否是受保护路由
    const isProtectedRoute = protectedRoutes.some(route => 
      path === route || path.startsWith(`${route}/`)
    )
    
    // 只有在访问受保护路由时才检查认证
    if (isProtectedRoute) {
      // 创建 Supabase 客户端
      const supabase = createMiddlewareClient<Database>({ req, res })
      
      // 尝试获取用户
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Middleware - Error getting user:', error)
      }
      
      const isAuthenticated = !!user
      
      // 添加调试日志
      console.log(`Middleware - Protected path: ${path}, Authenticated: ${isAuthenticated}`)
      
      if (!isAuthenticated) {
        console.log(`Middleware - Unauthenticated user accessing protected route: ${path}, redirecting to login`)
        
        // 检查是否有认证相关的 cookie
        const hasAuthCookie = req.cookies.getAll().some(cookie => 
          cookie.name.includes('sb-') || 
          cookie.name.includes('supabase.auth')
        )
        
        // 如果是支付成功页面且有认证cookie，给予更多时间等待会话建立
        if (isSuccessPage && hasAuthCookie) {
          console.log('Middleware - Payment success page, allowing temporary access')
          // 设置一个临时cookie来标记支付成功状态
          res.cookies.set('payment_success', 'true', {
            httpOnly: true,
            maxAge: 300, // 5分钟
            path: '/',
          })
          return res
        }
        
        // 如果有认证 cookie 但没有会话，可能是会话正在建立中
        if (hasAuthCookie) {
          console.log('Middleware - Auth cookies found but no session, session might be establishing')
          
          // 检查是否有特殊的 just_logged_in cookie
          const justLoggedIn = req.cookies.get('just_logged_in')
          
          if (justLoggedIn) {
            console.log('Middleware - Just logged in cookie found, allowing access')
            return res
          }
          
          // 返回临时重定向到当前URL
          return NextResponse.redirect(req.url, { status: 302 })
        }
        
        // 重定向到登录页面
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('redirect', path)
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // 其他情况，允许访问
    console.log(`Middleware - Default case, allowing access to: ${path}`)
    return res
  } catch (error) {
    console.error('Middleware error:', error)
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