import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { SuccessContent } from './success-content'

async function getPaymentData(sessionId: string) {
  try {
    // 验证支付会话
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/verify?session_id=${sessionId}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to verify payment')
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Verification failed')
    }

    return {
      success: true,
      sessionId,
      purchasedCredits: data.credits,
      previousCredits: data.previousCredits,
      currentCredits: data.totalCredits,
      error: null
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return {
      success: false,
      sessionId,
      purchasedCredits: 0,
      previousCredits: 0,
      currentCredits: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default async function SuccessPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const sessionId = searchParams.session_id as string
  const isMock = searchParams.mock === 'true'

  if (!sessionId && !isMock) {
    redirect('/credits/purchase')
  }

  const paymentData = isMock
    ? {
        success: true,
        sessionId: 'mock',
        purchasedCredits: parseInt(searchParams.credits as string || '0'),
        previousCredits: parseInt(searchParams.credits as string || '0'),
        currentCredits: parseInt(searchParams.credits as string || '0'),
        error: null
      }
    : await getPaymentData(sessionId)

  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary-100 border-t-transparent animate-spin"></div>
          <h2 className="text-2xl font-bold text-text-100">Loading...</h2>
        </div>
      </div>
    }>
      <SuccessContent 
        paymentData={paymentData}
        isMock={isMock}
      />
    </Suspense>
  )
}
