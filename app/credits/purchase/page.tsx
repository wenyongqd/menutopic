import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerUserProfile } from '@/app/actions'
import { PurchaseClient } from './client'
import { createClient } from '@/lib/supabase-server'

export default async function PurchaseCreditsPage() {
  // 获取用户信息
  const userProfile = await getServerUserProfile();
  
  // 如果用户未登录，重定向到登录页面
  if (!userProfile) {
    redirect('/login?redirect=/credits/purchase');
  }

  // 从服务器获取套餐信息
  const supabase = createClient();
  const { data: packagesData, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching packages from server:', error);
  }

  const initialPackages = packagesData || [];
  console.log('Server fetched packages:', initialPackages.length);
  
  return (
    <Suspense fallback={<PurchaseSkeleton />}>
      <PurchaseClient 
        user={userProfile.user}
        initialPackages={initialPackages}
      />
    </Suspense>
  );
}

// 骨架屏组件
function PurchaseSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      {/* Skeleton for header */}
      <div className="space-y-2">
        <div className="h-10 w-3/4 bg-bg-200 rounded-lg animate-pulse"></div>
        <div className="h-6 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Skeleton for packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`relative ${i === 2 ? 'scale-105 md:scale-110 z-10' : ''}`}>
            <div className="card overflow-hidden rounded-lg bg-bg-100 border border-bg-200">
              {i === 2 && (
                <div className="h-6 bg-bg-200 animate-pulse"></div>
              )}
              <div className="p-4 pb-2 border-b border-bg-200">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-1/3 bg-bg-200 rounded-lg animate-pulse"></div>
                  {i === 2 && (
                    <div className="h-6 w-6 rounded-full bg-bg-200 animate-pulse"></div>
                  )}
                </div>
                <div className="h-4 w-1/2 bg-bg-200 rounded-lg animate-pulse mt-2"></div>
              </div>
              <div className="p-4">
                <div className="h-10 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
                <div className="h-6 w-1/3 bg-bg-200 rounded-lg animate-pulse mt-2"></div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-bg-200 animate-pulse mr-2"></div>
                    <div className="h-4 w-3/4 bg-bg-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-bg-200 animate-pulse mr-2"></div>
                    <div className="h-4 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Skeleton for checkout button */}
      <div className="flex justify-center">
        <div className="h-14 w-48 bg-bg-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
} 