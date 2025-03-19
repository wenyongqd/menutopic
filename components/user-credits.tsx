"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getUserCredits } from '@/lib/supabase'
import { useAuth } from '@/components/providers/auth-provider'
import { useCredits } from '@/components/providers/credits-provider'
import { Button } from '@/components/ui/button'
import { CreditCard, Plus, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface UserCreditsProps {
  initialCredits?: number;
}

export function UserCredits({ initialCredits }: UserCreditsProps) {
  const { credits, setCredits } = useCredits();
  const [lastValidCredits, setLastValidCredits] = useState<number | null>(initialCredits ?? null)
  const [isLoading, setIsLoading] = useState(initialCredits === undefined)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const { user } = useAuth()
  const pathname = usePathname();
  const router = useRouter();
  const isCreditsPage = pathname.startsWith("/credits");
  // 检查是否在受保护路径上（dashboard, images, credits）
  const isProtectedPath = pathname === '/dashboard' || 
                          pathname.startsWith('/images/') || 
                          pathname.startsWith('/credits/');

  // Improved fetchCredits function with better debugging
  const fetchCredits = async (retryCount = 0) => {
    if (!user && !isProtectedPath) {
      console.log('UserCredits - No user found and not on protected path, skipping credits fetch');
      setIsLoading(false)
      return
    }
    
    try {
      console.log('UserCredits - Fetching credits for user:', user?.id || 'unknown (protected path)');
      
      // 如果没有用户但在保护路径上，等待更长时间让认证完成
      if (!user && isProtectedPath) {
        console.log('UserCredits - Waiting for auth to complete before fetching credits');
        await new Promise(r => setTimeout(r, 2000)); // 等待2秒让认证完成
        
        // 如果等待后仍然没有用户，且还有重试次数，则继续重试
        if (!user && retryCount < 2) { // 减少重试次数到2次
          console.log(`UserCredits - Still no user after waiting (attempt ${retryCount + 1}/2), trying again`);
          setTimeout(() => {
            fetchCredits(retryCount + 1)
          }, 2000); // 增加重试间隔到2秒
          return;
        }
        
        if (!user) {
          console.log('UserCredits - Max retries reached or auth timeout, keeping last valid credits');
          setIsLoading(false);
          return;
        }
      }
      
      // 确保user存在
      if (!user) {
        console.log('UserCredits - No user object available for fetching');
        setIsLoading(false);
        return;
      }
      
      // 使用 getUserCredits 获取积分
      const userCredits = await getUserCredits();
      console.log('UserCredits - Credits fetched:', userCredits);
      
      // 如果 userCredits 为 null，尝试重试
      if (userCredits === null && retryCount < 2) { // 减少重试次数到2次
        console.log(`UserCredits - Null credits returned, retrying (${retryCount + 1}/2)`);
        setTimeout(() => {
          fetchCredits(retryCount + 1)
        }, 2000);
        return;
      }
      
      // 只在获取到有效值时更新
      if (userCredits !== null) {
        setCredits(userCredits);
        setLastValidCredits(userCredits);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('UserCredits - Failed to fetch credits:', error)
      // If failed and still have retry attempts, wait and retry
      if (retryCount < 2) { // 减少重试次数到2次
        console.log(`UserCredits - Retrying fetch (${retryCount + 1}/2) in 2000ms`);
        setTimeout(() => {
          fetchCredits(retryCount + 1)
        }, 2000) // 增加重试间隔到2秒
      } else {
        console.log('UserCredits - Max retries reached, keeping last valid credits');
        setIsLoading(false)
      }
    }
  }

  // Call fetchCredits when user changes, but only if initialCredits is not provided
  useEffect(() => {
    console.log('UserCredits - User state changed, user:', user?.id, 'initialCredits:', initialCredits);
    if (initialCredits !== undefined) {
      console.log('UserCredits - Using provided initialCredits:', initialCredits);
      setCredits(initialCredits);
      setLastValidCredits(initialCredits);
      setIsLoading(false);
      return;
    }
    
    // 添加延迟，等待认证完成
    const timer = setTimeout(() => {
      if (user || isProtectedPath) {
        fetchCredits()
      } else {
        setIsLoading(false)
      }
    }, 1000); // 等待1秒再开始获取积分
    
    return () => clearTimeout(timer);
  }, [user, isProtectedPath, initialCredits, setCredits])
  
  // Set up real-time listener for credit changes
  useEffect(() => {
    console.log('UserCredits - Setting up realtime subscription');
    
    // Always attempt to fetch on initial mount
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
          console.log('UserCredits - Profile update received:', payload);
          // Add animation effect
          setIsUpdating(true)
          setTimeout(() => {
            const newCredits = payload.new.credits || lastValidCredits || 0;
            setCredits(newCredits)
            setLastValidCredits(newCredits)
            setIsUpdating(false)
          }, 300)
        })
        .subscribe()
        
      return () => {
        console.log('UserCredits - Cleaning up realtime subscription');
        supabase.removeChannel(channel)
      }
    }
  }, [user, setCredits])
  
  const handleBuyCredits = () => {
    // Set navigation state
    setIsNavigating(true)
    
    // Use Next.js router for navigation
    try {
      router.push('/credits/purchase')
      
      // Since Next.js router.push doesn't return a Promise, use setTimeout to simulate navigation completion
      setTimeout(() => {
        // Reset navigation state if user is still on current page
        if (pathname !== '/credits/purchase') {
          setIsNavigating(false)
        }
      }, 1000)
    } catch (error: unknown) {
      console.error('Navigation error:', error)
      setIsNavigating(false)
    }
  }
  
  // 在保护路径上即使在加载状态下也显示临时UI
  if (isLoading) {
    // 如果在受保护路径上，显示临时的加载UI
    if (isProtectedPath) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-bg-200 text-text-100 px-3 py-1.5 rounded-full">
            <CreditCard className="h-3.5 w-3.5 text-primary-100" />
            <span className="font-medium text-sm">
              <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
            </span>
            <span className="text-xs text-text-200">credits</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={true}
            className="flex items-center gap-1 text-text-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-sm">Buy</span>
          </Button>
        </div>
      )
    }
    
    // 否则默认加载状态
    return (
      <div className="flex items-center gap-1 text-sm text-text-200 animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading credits...</span>
      </div>
    )
  }
  
  // 如果用户不存在且不在受保护路径上，不显示任何内容
  if (!user && !isProtectedPath) {
    return null
  }
  
  // 在显示积分时，优先使用context中的credits
  const displayCredits = credits !== null ? credits : (lastValidCredits !== null ? lastValidCredits : 0);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 bg-bg-200 text-text-100 px-3 py-1.5 rounded-full transition-all ${isUpdating ? 'scale-110' : ''}`}>
              <CreditCard className="h-3.5 w-3.5 text-primary-100" />
              <span className={`font-medium text-sm transition-all ${isUpdating ? 'text-primary-100' : ''}`}>
                {displayCredits}
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
          className={`flex rounded-lg items-center gap-1 hover:bg-bg-200 text-text-200 hover:text-primary-100 transition-colors ${
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