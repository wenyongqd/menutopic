import { Suspense } from "react";
import { getServerUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./client";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const userProfile = await getServerUserProfile();

  if (!userProfile) {
    console.log("[DASHBOARD] User not found, redirecting to login");
    redirect("/login");
  }

  console.log("[DASHBOARD] User profile loaded:", userProfile.user.id);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient user={userProfile.user} />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 h-64 animate-pulse">
              <div className="w-full h-40 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
