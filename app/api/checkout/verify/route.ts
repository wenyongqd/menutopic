import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// 标记为动态路由
export const dynamic = 'force-dynamic'

// 使用服务角色密钥以获取管理员权限
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(req: Request) {
  try {
    // 使用 URL 对象解析请求 URL
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      return new NextResponse('Missing session ID', { status: 400 })
    }

    // 如果是模拟会话，直接返回成功
    if (sessionId === 'test_session') {
      const mockCredits = parseInt(searchParams.get('credits') || '0')
      return NextResponse.json({ 
        success: true, 
        credits: mockCredits,
        previousCredits: 0,
        totalCredits: mockCredits,
        mock: true
      })
    }
    
    // 检查 Stripe 是否配置
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set');
      return NextResponse.json({ 
        success: false, 
        error: 'Stripe is not configured'
      }, { status: 500 })
    }

    // 从 Stripe 获取会话信息
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment not completed'
      }, { status: 400 })
    }
    
    const userId = stripeSession.metadata?.userId
    const packageId = stripeSession.metadata?.packageId
    const credits = parseInt(stripeSession.metadata?.credits || '0')
    
    if (!userId || !packageId || !credits) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing metadata'
      }, { status: 400 })
    }

    try {
      // 检查交易是否已经处理过
      const { data: existingTransaction } = await supabase
        .from('credit_transactions')
        .select('id, amount')
        .eq('stripe_session_id', sessionId)
        .single()
      
      if (existingTransaction) {
        // 交易已经处理过，获取用户当前积分
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('credits')
          .eq('id', userId)
          .single()

        // 返回正确的积分信息
        return NextResponse.json({ 
          success: true, 
          credits: existingTransaction.amount,
          previousCredits: (profile?.credits || 0) - existingTransaction.amount,
          totalCredits: profile?.credits || 0,
          alreadyProcessed: true
        })
      }
      
      // 更新用户信用点
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        // 如果用户配置文件不存在，创建一个
        if (profileError.code === 'PGRST116') {
          await supabase
            .from('user_profiles')
            .insert({ id: userId, credits })

          // 记录交易
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: userId,
              amount: credits,
              type: 'purchase',
              stripe_session_id: sessionId,
              description: `Purchased ${credits} credits`
            })

          return NextResponse.json({ 
            success: true, 
            credits,
            previousCredits: 0,
            totalCredits: credits,
            userId
          })
        } else {
          throw profileError
        }
      } else {
        // 更新现有配置文件
        const currentCredits = profile.credits || 0
        const newCredits = currentCredits + credits
        
        console.log('Credits update:', {
          userId,
          currentCredits,
          purchasedCredits: credits,
          newTotal: newCredits
        })
        
        await supabase
          .from('user_profiles')
          .update({ credits: newCredits })
          .eq('id', userId)

        // 记录交易
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits,
            type: 'purchase',
            stripe_session_id: sessionId,
            description: `Purchased ${credits} credits`
          })

        return NextResponse.json({ 
          success: true, 
          credits,
          previousCredits: currentCredits,
          totalCredits: newCredits,
          userId
        })
      }
    } catch (stripeError: Error | unknown) {
      console.error('Stripe error:', stripeError)
      return NextResponse.json({ 
        success: false, 
        error: `Stripe error: ${stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'}`
      }, { status: 500 })
    }
  } catch (error: Error | unknown) {
    console.error('[VERIFY_PAYMENT]', error)
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 