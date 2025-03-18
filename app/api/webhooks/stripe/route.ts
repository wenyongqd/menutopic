import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion, // 使用正确的类型
})
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Use service role key for admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature') || ''
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: Error | unknown) {
    console.error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return new NextResponse(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 400 })
  }
  
  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    // Ensure payment was successful
    if (session.payment_status === 'paid') {
      const userId = session.metadata?.userId
      const packageId = session.metadata?.packageId
      const creditsToAdd = parseInt(session.metadata?.credits || '0')
      
      if (!userId || !packageId || !creditsToAdd) {
        console.error('Missing metadata in Stripe session', session.metadata)
        return new NextResponse('Missing metadata', { status: 400 })
      }
      
      try {
        // Begin transaction
        // 1. Add credits to user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*') // Select all fields to check which column exists
          .eq('id', userId)
          .single()
          
        if (profileError) {
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            // Check which column exists in the table by making a test query
            const { data: tableInfo, error: tableError } = await supabase
              .from('user_profiles')
              .select('*')
              .limit(1)
            
            if (tableError) throw tableError;
            
            // Determine which column to use based on the first record
            const firstRecord = tableInfo && tableInfo.length > 0 ? tableInfo[0] : null;
            
            if (firstRecord && 'credit_amount' in firstRecord) {
              // Use credit_amount column
              await supabase
                .from('user_profiles')
                .insert({ id: userId, credit_amount: creditsToAdd })
            } else {
              // Default to credits column
              await supabase
                .from('user_profiles')
                .insert({ id: userId, credits: creditsToAdd })
            }
          } else {
            throw profileError
          }
        } else {
          // Update existing profile
          // Check which column exists in the profile
          if ('credit_amount' in profile) {
            await supabase
              .from('user_profiles')
              .update({ credit_amount: (profile.credit_amount || 0) + creditsToAdd })
              .eq('id', userId)
          } else {
            await supabase
              .from('user_profiles')
              .update({ credits: (profile.credits || 0) + creditsToAdd })
              .eq('id', userId)
          }
        }
        
        // 2. Record transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: creditsToAdd,
            type: 'purchase',
            stripe_session_id: session.id,
            description: `Purchased ${creditsToAdd} credits`
          })
        
        console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`)
      } catch (error) {
        console.error('Error processing payment:', error)
        return new NextResponse('Error processing payment', { status: 500 })
      }
    }
  }
  
  return new NextResponse('Webhook received', { status: 200 })
} 