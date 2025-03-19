"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase'

// 创建一个内部组件来使用 useSearchParams
function SuccessPageContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { refreshData, user } = useAuth()
  
  const sessionId = searchParams.get('session_id')
  const isMock = searchParams.get('mock') === 'true'
  
  useEffect(() => {
    if (!sessionId) {
      router.push('/credits/purchase')
      return
    }
    
    async function verifyPayment() {
      try {
        // 如果是模拟模式，直接显示成功
        if (isMock) {
          const mockCredits = parseInt(searchParams.get('credits') || '0')
          setCredits(mockCredits)
          setIsVerified(true)
          setIsLoading(false)
          return
        }
        
        // 否则，验证支付
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`)
        
        if (!response.ok) {
          // 如果是认证错误且重试次数小于3，等待一秒后重试
          if (response.status === 401 && retryCount < 3) {
            console.log(`Retry attempt ${retryCount + 1} for session verification`)
            setRetryCount(prev => prev + 1)
            await new Promise(resolve => setTimeout(resolve, 1000))
            return verifyPayment()
          }
          throw new Error('Failed to verify payment')
        }
        
        const data = await response.json()
        console.log('Verification response:', data)
        
        if (data.success) {
          setCredits(data.credits || 0)
          setIsVerified(true)
          
          // 如果当前没有用户会话，尝试恢复
          if (!user) {
            try {
              const supabase = createClient()
              await supabase.auth.refreshSession()
              // 刷新认证状态
              refreshData()
            } catch (authError) {
              console.error('Error restoring session:', authError)
              // 继续处理，因为支付已经完成
            }
          } else {
            // 即使有用户会话，也刷新一次数据以确保状态同步
            refreshData()
          }
          
          // 获取最新的用户配置文件数据
          try {
            const supabase = createClient()
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('credits')
              .eq('id', user?.id)
              .single()
              
            console.log('Current user credits:', {
              userId: user?.id,
              sessionId,
              purchasedCredits: data.credits,
              profileCredits: profile?.credits
            })
          } catch (error) {
            console.error('Error fetching updated profile:', error)
          }
        } else {
          throw new Error(data.error || 'Verification failed')
        }
      } catch (error) {
        console.error('Verification error:', error)
        toast({
          title: 'Verification failed',
          description: 'Unable to verify your payment. Please contact support.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    verifyPayment()
  }, [sessionId, router, toast, isMock, searchParams, retryCount, refreshData, user])
  
  // 如果正在加载且尚未验证，显示加载状态
  if (isLoading && !isVerified) {
    return (
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary-100 border-t-transparent animate-spin"></div>
          <h2 className="text-2xl font-bold text-text-100">Verifying your payment...</h2>
          <p className="text-text-200">Please wait while we confirm your purchase.</p>
        </div>
      </div>
    )
  }
  
  // 如果验证失败但不再加载，显示错误状态
  if (!isVerified && !isLoading) {
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
            We were unable to verify your payment. Please contact support.
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
              <span className="font-bold">{credits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-200">Transaction ID:</span>
              <span className="font-mono text-sm">{sessionId?.substring(0, 16)}...</span>
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

// 主组件使用 Suspense 包裹内部组件
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary-100 border-t-transparent animate-spin"></div>
          <h2 className="text-2xl font-bold text-text-100">Loading...</h2>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
} 