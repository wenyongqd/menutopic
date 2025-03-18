import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// 使用服务角色密钥以获取管理员权限
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  try {
    console.log('Checkout API called');
    
    // Get current user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('User:', user?.id || 'No user');
    
    if (!user) {
      return new NextResponse('Unauthorized - Please log in', { status: 401 })
    }
    
    let body;
    try {
      body = await req.json()
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new NextResponse('Invalid request body', { status: 400 })
    }
    
    const { packageId } = body
    
    console.log('Package ID:', packageId);
    
    if (!packageId) {
      return new NextResponse('Missing package ID', { status: 400 })
    }
    
    // Get package information using admin client to bypass RLS
    const { data: packageData, error: packageError } = await adminSupabase
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()
      
    console.log('Package data:', packageData);
    console.log('Package error:', packageError);
    
    if (packageError || !packageData) {
      return new NextResponse(`Package not found or inactive: ${packageError?.message || 'Unknown error'}`, { status: 404 })
    }
    
    // Determine the credit amount from either field
    const creditAmount = packageData.credits !== undefined 
      ? packageData.credits 
      : (packageData.credit_amount || 0);
    
    try {
      // Check if Stripe is properly configured
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY is not set');
        // 返回一个模拟的结账 URL 用于测试
        return NextResponse.json({ 
          url: `/credits/success?session_id=test_session&mock=true&package=${packageId}&credits=${creditAmount}`,
          mock: true
        })
      }
      
      // Create Stripe checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: packageData.stripe_price_id,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/purchase`,
        metadata: {
          userId: user.id,
          packageId: packageId,
          credits: creditAmount.toString(),
        },
      })
      
      return NextResponse.json({ url: checkoutSession.url })
    } catch (stripeError: Error | unknown) {
      console.error('Stripe error:', stripeError);
      return new NextResponse(`Stripe error: ${stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'}`, { status: 500 })
    }
  } catch (error: Error | unknown) {
    console.error('[CHECKOUT_CREDITS]', error)
    return new NextResponse(`Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
} 