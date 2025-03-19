import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })
  const isSuccessPage = request.nextUrl.pathname.startsWith('/credits/success')
  
  try {
    // 检查是否是受保护的路由
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/credits') ||
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/images/generate') ||
      request.nextUrl.pathname.startsWith('/profile')
    
    if (isProtectedRoute) {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // 调试日志
      console.log('Auth check:', {
        path: request.nextUrl.pathname,
        hasSession: !!session,
        error: error?.message
      })
      
      if (!session) {
        // 检查是否有认证 cookie
        const hasCookies = request.cookies.has('sb-access-token') || 
          request.cookies.has('sb-refresh-token')
        
        // 如果是支付成功页面且有认证 cookie，给予临时访问权限
        if (isSuccessPage && hasCookies) {
          console.log('Allowing temporary access to success page')
          const tempResponse = NextResponse.next()
          tempResponse.cookies.set('payment_success', 'true', {
            maxAge: 300, // 5分钟
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
          })
          return tempResponse
        }
        
        // 如果有认证 cookie 但没有会话，可能是会话刚刚过期
        if (hasCookies) {
          const justLoggedIn = request.cookies.has('just_logged_in')
          if (justLoggedIn) {
            // 给予短暂的宽限期
            return NextResponse.next()
          }
        }
        
        // 否则重定向到登录页面
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // 在发生错误时，允许请求继续，但记录错误
    return response
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