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
    await supabase.auth.exchangeCodeForSession(code)
    console.log('Session exchanged successfully')
  }

  // 确保重定向路径以 / 开头
  const normalizedRedirectPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`
  const redirectUrl = `${requestUrl.origin}${normalizedRedirectPath}`
  
  console.log('Redirecting to:', redirectUrl)
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(redirectUrl)
} 