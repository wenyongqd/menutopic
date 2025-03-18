"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { serverLogout } from "@/app/actions";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: () => void;
}

export function LogoutButton({ 
  variant = "outline", 
  size = "default",
  className = "",
  onClick
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    // 如果有onClick回调，先执行
    if (onClick) {
      onClick();
    }
    
    setIsLoading(true);
    
    try {
      console.log('LogoutButton - Starting logout process');
      
      // 先使用客户端方法清除本地状态
      await signOut().catch(err => {
        console.error('Client signOut error:', err);
      });
      
      console.log('LogoutButton - Client signOut completed');
      
      // 手动导航到登录页面，而不是等待服务器操作
      // 这样可以避免页面停留在当前页面等待服务器响应
      router.push('/login');
      
      // 设置超时自动重置状态，以防导航失败
      setTimeout(() => {
        if (isLoading) {
          console.log('LogoutButton - Resetting loading state after timeout');
          setIsLoading(false);
        }
      }, 3000);
      
      // 然后非阻塞式地调用服务器操作进行登出
      serverLogout().catch(error => {
        console.error("Error in server logout:", error);
      });
    } catch (error) {
      console.error("LogoutButton - Error logging out:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size as "default" | "sm" | "lg" | null | undefined}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging out...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </>
      )}
    </Button>
  );
} 