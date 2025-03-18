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

    cookieStore.set('auth_state_updated', 'true', {
      path: '/',
      maxAge: 60,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  const normalizedRedirectPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`
  const redirectUrl = `${requestUrl.origin}${normalizedRedirectPath}`
  
  console.log('Redirecting to:', redirectUrl)
  
  return NextResponse.redirect(redirectUrl)
} 