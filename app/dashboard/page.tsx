import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { getServerUserProfile, getServerUserCredits, getServerUserRecentImages } from "@/app/actions";
import { DashboardClient } from "./client";

// 服务器组件，用于获取数据
export default async function DashboardPage() {
  // 获取用户信息
  const userProfile = await getServerUserProfile();
  
  // 如果用户未登录，重定向到登录页面
  if (!userProfile) {
    redirect('/login?redirect=/dashboard');
  }
  
  // 获取用户积分
  const credits = await getServerUserCredits();
  
  // 获取用户最近的图片生成
  const recentImages = await getServerUserRecentImages(5);
  
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient 
        user={userProfile.user}
        profile={userProfile.profile}
        credits={credits || 0}
        recentImages={recentImages || []}
      />
    </Suspense>
  );
}

// 骨架屏组件
function DashboardSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      <div className="space-y-2">
        <div className="h-10 w-3/4 bg-bg-200 rounded-lg animate-pulse"></div>
        <div className="h-6 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card overflow-hidden border-l-4 border-l-bg-200">
          <CardHeader className="pb-2">
            <div className="h-6 w-1/3 bg-bg-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-2/3 bg-bg-200 rounded-lg animate-pulse mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-12 w-1/4 bg-bg-200 rounded-lg animate-pulse"></div>
          </CardContent>
          <CardFooter className="bg-bg-200 pt-4">
            <div className="h-10 w-full bg-bg-200 rounded-lg animate-pulse"></div>
          </CardFooter>
        </Card>

        <Card className="card overflow-hidden border-l-4 border-l-bg-200">
          <CardHeader className="pb-2">
            <div className="h-6 w-1/3 bg-bg-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-2/3 bg-bg-200 rounded-lg animate-pulse mt-2"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 w-full bg-bg-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-full bg-bg-200 rounded-lg animate-pulse"></div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <div className="h-6 w-1/4 bg-bg-200 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="card overflow-hidden">
              <div className="aspect-square bg-bg-200 animate-pulse"></div>
              <CardContent className="pt-4">
                <div className="h-4 w-full bg-bg-200 rounded-lg animate-pulse"></div>
                <div className="h-3 w-1/3 bg-bg-200 rounded-lg animate-pulse mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
