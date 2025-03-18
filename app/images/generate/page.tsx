import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerUserProfile, getServerUserCredits } from "@/app/actions";
import { GenerateClient } from "./client";
export default async function GenerateImagePage() {
  // 获取用户信息
  const userProfile = await getServerUserProfile();
  
  // 如果用户未登录，重定向到登录页面
  if (!userProfile) {
    redirect('/login?redirect=/images/generate');
  }
  
  // 获取用户积分
  const credits = await getServerUserCredits();
  
  return (
    <Suspense fallback={<GeneratePageSkeleton />}>
      <GenerateClient 
        user={userProfile.user}
        initialCredits={credits || 0}
      />
    </Suspense>
  );
}

// 骨架屏组件
function GeneratePageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      <div className="flex flex-col items-center justify-between relative overflow-hidden py-12 px-4 rounded-2xl">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-bg-200 to-bg-300 animate-pulse"></div>
        <div className="z-10 space-y-6 w-full">
          <div className="h-10 w-3/4 mx-auto bg-bg-200 rounded-lg animate-pulse"></div>
          <div className="h-6 w-1/2 mx-auto bg-bg-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-10 w-1/3 bg-bg-200 rounded-lg animate-pulse"></div>
        <div className="flex space-x-4">
          <div className="h-12 w-24 bg-bg-200 rounded-lg animate-pulse"></div>
          <div className="h-12 w-24 bg-bg-200 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="min-h-[400px] bg-bg-200 rounded-lg animate-pulse"></div>
          <div className="h-10 w-full bg-bg-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
