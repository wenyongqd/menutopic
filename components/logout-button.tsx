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
      // 先使用客户端方法清除本地状态
      await signOut();
      
      // 然后调用服务器操作进行登出
      // 注意：由于已经在客户端清除了状态，这里可能不需要等待服务器操作完成
      serverLogout().catch(error => {
        console.error("Error in server logout:", error);
      });
      
      // 手动导航到登录页面
      router.push('/login');
    } catch (error) {
      console.error("Error logging out:", error);
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