import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { DashboardClient } from "./client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

// 服务器组件，用于获取数据
export default async function Dashboard() {
  const supabase = createClient();

  // Get the user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get the user's profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get recent images
  const { data: recentImages } = await supabase
    .from('image_generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient
        user={user}
        profile={profile || undefined}
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
