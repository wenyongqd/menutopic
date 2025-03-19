"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useCredits } from '@/components/providers/credits-provider'

interface PaymentData {
  success: boolean
  sessionId: string
  purchasedCredits: number
  currentCredits: number
  error: string | null
}

interface SuccessContentProps {
  paymentData: PaymentData
  isMock: boolean
}

export function SuccessContent({ paymentData, isMock }: SuccessContentProps) {
  const router = useRouter()
  const { refreshData } = useAuth()
  const { updateCredits } = useCredits()
  
  useEffect(() => {
    // 更新 credits context
    if (paymentData.success) {
      updateCredits(paymentData.currentCredits)
      refreshData()
    }
  }, [paymentData, updateCredits, refreshData])
  
  // 如果验证失败，显示错误状态
  if (!paymentData.success) {
    return (
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-100 text-center">
            Verification Failed
          </h1>
          <p className="text-text-200 text-lg text-center max-w-lg">
            {paymentData.error || 'We were unable to verify your payment. Please contact support.'}
          </p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }
  
  // 如果验证成功，显示成功状态
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      <div className="flex flex-col items-center justify-center space-y-4 fade-in">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-text-100 text-center">
          Payment Successful!
        </h1>
        <p className="text-text-200 text-lg text-center max-w-lg">
          Thank you for your purchase. Your credits have been added to your account.
        </p>
      </div>
      
      <div style={{ animationDelay: "0.1s" }}>
        <Card className="max-w-md mx-auto fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-primary-100" />
              Purchase Summary
            </CardTitle>
            <CardDescription>Details of your transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-text-200">Credits Added:</span>
              <span className="font-bold">{paymentData.purchasedCredits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-200">Current Credits:</span>
              <span className="font-bold">{paymentData.currentCredits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-200">Transaction ID:</span>
              <span className="font-mono text-sm">{paymentData.sessionId.substring(0, 16)}...</span>
            </div>
            {isMock && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                This is a mock transaction for testing purposes. No actual payment was processed.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center fade-in" style={{ animationDelay: "0.2s" }}>
        <Button 
          className="btn-primary px-8 py-6 text-lg"
          onClick={() => {
            // 设置标记
            sessionStorage.setItem('from_payment', 'true');
            // 使用 window.location.href 导航，确保页面完全刷新
            window.location.href = '/dashboard';
          }}
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
} 