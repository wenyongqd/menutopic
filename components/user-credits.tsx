"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { CreditCard, Plus, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function UserCredits() {
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const { user } = useAuth()
  const pathname = usePathname();
  const router = useRouter();
  const isCreditsPage = pathname.startsWith("/credits");

  // 添加重试逻辑
  const fetchCredits = async (retryCount = 0) => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    try {
      console.log('UserCredits - Fetching credits for user:', user.id);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (error) throw error
      
      const userCredits = data?.credits !== undefined ? data.credits : (data?.credit_amount || 0);
      console.log('UserCredits - Credits fetched:', userCredits);
      setCredits(userCredits)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch credits', error)
      // 如果失败且还有重试次数，则等待后重试
      if (retryCount < 3) {
        setTimeout(() => {
          fetchCredits(retryCount + 1)
        }, 1000 * (retryCount + 1)) // 逐步增加重试间隔
      } else {
        setIsLoading(false)
      }
    }
  }

  // 当用户状态变化时重新获取积分
  useEffect(() => {
    if (user) {
      fetchCredits()
    }
  }, [user])
  
  useEffect(() => {
    fetchCredits()
    
    // Set up real-time subscription for credit changes
    if (user) {
      const supabase = createClient();
      const channel = supabase
        .channel('profile-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          // 添加动画效果
          setIsUpdating(true)
          setTimeout(() => {
            // Check which field exists in the payload
            const newCredits = payload.new.credits !== undefined 
              ? payload.new.credits 
              : (payload.new.credit_amount || 0);
            setCredits(newCredits)
            setIsUpdating(false)
          }, 300)
        })
        .subscribe()
        
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])
  
  const handleBuyCredits = () => {
    // 设置导航状态
    setIsNavigating(true)
    
    // 使用 Next.js 路由导航，而不是直接修改 window.location.href
    try {
      router.push('/credits/purchase')
      
      // 由于 Next.js 的 router.push 不返回 Promise，我们使用 setTimeout 来模拟导航完成
      setTimeout(() => {
        // 如果用户仍在当前页面，重置导航状态
        if (pathname !== '/credits/purchase') {
          setIsNavigating(false)
        }
      }, 1000)
    } catch (error: unknown) {
      console.error('Navigation error:', error)
      setIsNavigating(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-sm text-text-200 animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading credits...</span>
      </div>
    )
  }
  
  if (!user || credits === null) {
    return null
  }
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 bg-bg-200 text-text-100 px-3 py-1.5 rounded-full transition-all ${isUpdating ? 'scale-110' : ''}`}>
              <CreditCard className="h-3.5 w-3.5 text-primary-100" />
              <span className={`font-medium text-sm transition-all ${isUpdating ? 'text-primary-100' : ''}`}>
                {credits}
              </span>
              <span className="text-xs text-text-200">credits</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Your available credits for generating images</p>
          </TooltipContent>
        </Tooltip>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleBuyCredits}
          disabled={isNavigating}
          className={`flex items-center gap-1 hover:bg-bg-200 text-text-200 hover:text-primary-100 transition-colors ${
            isCreditsPage ? "bg-primary-100/10 text-primary-100" : ""
          }`}
        >
          {isNavigating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span className="text-sm">Buy</span>
            </>
          )}
        </Button>
      </div>
    </TooltipProvider>
  )
} 