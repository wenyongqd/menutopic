"use client";

import { useState, useRef, useEffect } from "react";
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
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { signOut } = useAuth();
  const router = useRouter();

  // 清理timeouts
  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    // 如果有onClick回调，先执行
    if (onClick) {
      onClick();
    }
    
    setIsLoading(true);
    
    // 设置强制超时，确保无论如何按钮都会恢复状态
    logoutTimeoutRef.current = setTimeout(() => {
      console.log('LogoutButton - Force resetting loading state after timeout');
      setIsLoading(false);
    }, 3000);
    
    try {
      console.log('LogoutButton - Starting logout process');
      
      // 先非阻塞式地调用服务器操作进行登出
      serverLogout().catch(error => {
        console.error("Error in server logout:", error);
      });
      
      // 导航到登录页面
      router.push('/login');
      
      // 直接执行客户端登出，清除状态
      try {
        await signOut();
        console.log('LogoutButton - Client signOut completed');
      } catch (err) {
        console.error('Client signOut error:', err);
      }
    } catch (error) {
      console.error("LogoutButton - Error logging out:", error);
      setIsLoading(false);
      
      // 出错时清除超时
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
      }
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