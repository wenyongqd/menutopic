"use client";

import { User } from "@supabase/supabase-js";
import { Clock, Wand2, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Image as ImageIcon, Plus, ArrowRight, Images } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCredits } from '@/components/providers/credits-provider';

// 仅保留使用的接口定义
interface ImageGeneration {
  id: string;
  prompt: string;
  image_url?: string;
  created_at: string;
  status: string;
  // 其他可能的属性
}

// 用户配置文件接口
interface UserProfile {
  id: string;
  credits?: number;
  credit_amount?: number;
  // 其他可能的属性
}

interface DashboardClientProps {
  user: User;
  profile?: UserProfile;
  recentImages: ImageGeneration[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DashboardClient({ user, profile, recentImages }: DashboardClientProps) {
  const { credits } = useCredits();
  const { user: clientUser, refreshData } = useAuth();
  
  // 在组件挂载时刷新认证状态
  useEffect(() => {
    console.log('DashboardClient - Component mounted, refreshing auth state');
    console.log('DashboardClient - Server user:', user?.id);
    console.log('DashboardClient - Client user:', clientUser?.id || 'null');
    
    // 如果客户端没有用户状态，但服务器有，则刷新认证状态
    if (!clientUser && user) {
      console.log('DashboardClient - Client state out of sync with server, refreshing');
      refreshData();
    }
  }, [user, clientUser, refreshData]);

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      <div className="space-y-2 fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-text-100">
          Welcome to Your Dashboard
        </h1>
        <div className="flex justify-between items-center">
          <p className="text-text-200 text-lg">
            Manage your account and create amazing images
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        <Card className="card overflow-hidden border-l-4 border-l-primary-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-primary-100" />
              Your Credits
            </CardTitle>
            <CardDescription>
              Credits available for generating images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-primary-100">{credits}</p>
          </CardContent>
          <CardFooter className="bg-bg-200 pt-4">
            <Link href="/credits/purchase" className="w-full">
              <Button className="w-full btn-primary">
                <Plus className="mr-2 h-4 w-4" /> Buy More Credits
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="card overflow-hidden border-l-4 border-l-accent-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <ImageIcon className="mr-2 h-5 w-5 text-accent-100" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Generate new images or manage your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/images/generate" className="block">
              <Button className="w-full btn-primary flex items-center justify-center">
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate New Image
              </Button>
            </Link>
            <Link href="/images/gallery" className="block">
              <Button
                variant="outline"
                className="w-full btn-secondary flex items-center justify-center"
              >
                <Images className="mr-2 h-4 w-4" />
                View All Images
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-accent-100" />
            <h2 className="text-2xl font-bold text-text-100">
              Recent Generations
            </h2>
          </div>
          {recentImages.length > 0 && (
            <Link href="/images/gallery">
              <Button variant="ghost" size="sm" className="flex items-center">
                <span>View all</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {recentImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentImages.map((image, index) => (
              <div 
                key={image.id} 
                className="fade-in"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <Card className="card overflow-hidden hover:scale-[1.02] transition-transform">
                  <div className="aspect-square relative bg-bg-200 overflow-hidden">
                    {image.image_url ? (
                      <img
                        src={image.image_url}
                        alt={image.prompt}
                        className="object-cover w-full h-full transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-text-200 bg-bg-100 px-4 py-2 rounded-lg">
                          {image.status === "pending"
                            ? "Processing..."
                            : "No image available"}
                        </p>
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <p className="text-sm line-clamp-2 font-medium">
                      {image.prompt}
                    </p>
                    <p className="text-xs text-text-200 mt-2 flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="card border-dashed border-2 bg-bg-100">
              <CardContent className="p-8 flex flex-col items-center justify-center">
                <div className="bg-bg-200 p-4 rounded-full mb-4">
                  <ImageIcon className="h-8 w-8 text-primary-100" />
                </div>
                <h3 className="text-lg font-medium text-text-100 mb-2">
                  Start Creating Beautiful Menu Images
                </h3>
                <p className="text-center text-text-200 mb-6 max-w-md">
                  Generate stunning, professional food images for your menu items with our AI-powered tool.
                </p>
                <Link href="/images/generate">
                  <Button className="btn-primary">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Your First Image
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-100 flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-accent-100" />
                Sample Generations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    id: "sample1",
                    prompt: "A gourmet burger with melted cheese, fresh lettuce, and tomato on a brioche bun",
                    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop"
                  },
                  {
                    id: "sample2",
                    prompt: "Authentic Italian margherita pizza with fresh basil and mozzarella",
                    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=500&auto=format&fit=crop"
                  },
                  {
                    id: "sample3",
                    prompt: "Chocolate lava cake with vanilla ice cream and fresh berries",
                    imageUrl: "https://images.unsplash.com/photo-1617305855058-336d24456869?q=80&w=500&auto=format&fit=crop"
                  }
                ].map((sample, index) => (
                  <div 
                    key={sample.id} 
                    className="fade-in"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <Card className="card overflow-hidden opacity-90 hover:opacity-100 hover:shadow-md transition-all">
                      <div className="aspect-square relative bg-bg-200 overflow-hidden">
                        <img
                          src={sample.imageUrl}
                          alt={sample.prompt}
                          className="object-cover w-full h-full transition-transform hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 bg-bg-100/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full text-text-200">
                          Sample
                        </div>
                      </div>
                      <CardContent className="pt-4">
                        <p className="text-sm line-clamp-2 font-medium">
                          {sample.prompt}
                        </p>
                        <div className="mt-3">
                          <Link href="/images/generate">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                              Create Similar
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 