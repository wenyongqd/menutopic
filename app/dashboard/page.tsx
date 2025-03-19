import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerUserProfile } from "@/app/actions";
import { DashboardClient } from "./client";
import { getRecentImages } from "@/lib/images";

export default async function DashboardPage() {
  // 获取用户信息
  const userProfile = await getServerUserProfile();
  
  // 如果用户未登录，重定向到登录页面
  if (!userProfile) {
    redirect('/login?redirect=/dashboard');
  }
  
  // 获取最近生成的图片
  const recentImages = await getRecentImages(userProfile.user.id);
  
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient 
        user={userProfile.user}
        profile={userProfile.profile}
        recentImages={recentImages}
      />
    </Suspense>
  );
}

// 骨架屏组件
function DashboardSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 用户信息卡片骨架 */}
        <div className="col-span-2">
          <div className="h-40 bg-bg-200 rounded-lg animate-pulse"></div>
        </div>
        {/* 快速操作卡片骨架 */}
        <div>
          <div className="h-40 bg-bg-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-10 w-1/3 bg-bg-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-bg-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
