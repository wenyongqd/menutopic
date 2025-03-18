"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MdRestaurantMenu } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { UserCredits } from "@/components/user-credits";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Home, Image, CreditCard } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isLandingPage = pathname === "/landing";
  const isDashboard = pathname === "/dashboard";
  const isGeneratePage = pathname === "/images/generate";
  const isCreditsPage = pathname.startsWith("/credits");
  
  const { user, refreshData } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // 检测滚动以更改 header 样式
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 在受保护页面上检查认证状态
  useEffect(() => {
    const isProtectedPage = pathname === '/dashboard' || 
                           pathname.startsWith('/images/') || 
                           pathname.startsWith('/credits/');
    
    if (isProtectedPage && !authChecked) {
      console.log('Header - Protected page detected, refreshing auth state');
      refreshData();
      setAuthChecked(true);
    }
  }, [pathname, authChecked, refreshData]);

  // 当路径变化时重置authChecked状态
  useEffect(() => {
    setAuthChecked(false);
  }, [pathname]);

  // 调试用：记录用户状态变化
  useEffect(() => {
    console.log('Header - User state changed:', user ? `User ${user.id} logged in` : 'No user');
  }, [user]);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-bg-100/95 backdrop-blur-md shadow-sm" 
          : "bg-bg-100 border-b border-bg-300"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-7xl py-3">
        <div className="flex items-center justify-between">
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="flex items-center space-x-2 group"
            onClick={(e) => {
              // 如果用户已登出，确保导航到首页
              if (!user) {
                e.preventDefault();
                console.log('Header - User is logged out, navigating to homepage');
                window.location.href = '/';
              }
            }}
          >
            <div className="relative overflow-hidden rounded-lg p-1">
              <MdRestaurantMenu className="h-8 w-8 text-primary-100 transition-transform group-hover:scale-110" />
              <span className="absolute inset-0 rounded-lg bg-primary-100/10 scale-0 transition-transform group-hover:scale-100"></span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-100 to-primary-300 bg-clip-text text-transparent">
              MenuMuse
            </span>
          </Link>
          
          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-200 hover:text-primary-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
          
          {isLandingPage ? (
            <div className="hidden md:flex items-center">
              <nav className="flex gap-6 mr-6">
                {["Features", "Testimonials", "How It Works", "FAQ"].map((item) => (
                  <Link 
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
                    className="text-sm font-medium text-text-200 hover:text-primary-100 relative group"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-100 transition-all group-hover:w-full"></span>
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-4">
                <Link href="/" className="text-sm font-medium text-text-200 hover:text-primary-100 hover:underline underline-offset-4">
                  Try Now
                </Link>
                <Link 
                  href="/" 
                  className="inline-flex items-center justify-center rounded-md bg-primary-100 text-white hover:bg-primary-200 h-10 py-2 px-4 text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                  Get Started
                </Link>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <UserCredits />
                  <div className="flex items-center gap-2">
                    <Link href="/dashboard">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`flex items-center gap-1 ${
                          isDashboard 
                            ? "bg-primary-100/10 text-primary-100" 
                            : "hover:bg-bg-200"
                        }`}
                      >
                        <Home className={`h-4 w-4 ${isDashboard ? "text-primary-100" : ""}`} />
                        <span>Dashboard</span>
                      </Button>
                    </Link>
                    <Link href="/images/generate">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`flex items-center gap-1 ${
                          isGeneratePage 
                            ? "bg-primary-100/10 text-primary-100" 
                            : "hover:bg-bg-200"
                        }`}
                      >
                        <Image className={`h-4 w-4 ${isGeneratePage ? "text-primary-100" : ""}`} />
                        <span>Generate</span>
                      </Button>
                    </Link>
                    <LogoutButton 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-bg-200 text-text-200"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover:bg-bg-200"
                    onClick={() => {
                      console.log('Header - Sign In button clicked, refreshing auth state before navigation');
                      refreshData(); // 尝试刷新认证状态
                      if (!user) {
                        router.push('/login');
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-primary-100 hover:bg-primary-200"
                    onClick={() => {
                      router.push('/register');
                    }}
                  >
                    Sign Up
                  </Button>
                  <a
                    className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-bg-300 bg-bg-100 px-4 py-2 text-sm text-text-200 shadow-sm transition-all hover:bg-bg-200 hover:shadow"
                    href="https://github.com/Nutlope/picmenu"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGithub className="h-5 w-5" />
                    <p>Star on GitHub</p>
                  </a>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-bg-300 animate-fadeIn">
            {isLandingPage ? (
              <div className="flex flex-col space-y-4">
                {["Features", "Testimonials", "How It Works", "FAQ"].map((item) => (
                  <Link 
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
                    className="text-sm font-medium text-text-200 hover:text-primary-100 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
                <div className="pt-2 flex flex-col space-y-2">
                  <Link 
                    href="/" 
                    className="w-full inline-flex items-center justify-center rounded-md bg-primary-100 text-white hover:bg-primary-200 h-10 py-2 px-4 text-sm font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {user ? (
                  <>
                    <div className="py-2">
                      <UserCredits />
                    </div>
                    <Link 
                      href="/dashboard" 
                      className={`flex items-center space-x-2 py-2 ${
                        isDashboard 
                          ? "text-primary-100" 
                          : "text-text-200 hover:text-primary-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Home className={`h-5 w-5 ${isDashboard ? "text-primary-100" : ""}`} />
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      href="/images/generate" 
                      className={`flex items-center space-x-2 py-2 ${
                        isGeneratePage 
                          ? "text-primary-100" 
                          : "text-text-200 hover:text-primary-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Image className={`h-5 w-5 ${isGeneratePage ? "text-primary-100" : ""}`} />
                      <span>Generate Images</span>
                    </Link>
                    <Link 
                      href="/credits/purchase" 
                      className={`flex items-center space-x-2 py-2 ${
                        isCreditsPage 
                          ? "text-primary-100" 
                          : "text-text-200 hover:text-primary-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <CreditCard className={`h-5 w-5 ${isCreditsPage ? "text-primary-100" : ""}`} />
                      <span>Buy Credits</span>
                    </Link>
                    <div className="py-2">
                      <LogoutButton 
                        variant="ghost"
                        className="text-text-200 hover:text-primary-100 w-full justify-start"
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="flex items-center justify-start space-x-2 text-text-200 hover:text-primary-100 py-2"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        refreshData();
                        router.push('/login');
                      }}
                    >
                      <User className="h-5 w-5" />
                      <span>Sign In</span>
                    </Button>
                    <Button
                      className="w-full inline-flex items-center justify-center rounded-md bg-primary-100 text-white hover:bg-primary-200 h-10 py-2 px-4 text-sm font-medium transition-colors"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        router.push('/register');
                      }}
                    >
                      Sign Up
                    </Button>
                    <a
                      className="flex items-center justify-center space-x-2 rounded-full border border-bg-300 bg-bg-100 px-4 py-2 text-sm text-text-200 hover:bg-bg-200"
                      href="https://github.com/Nutlope/picmenu"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FaGithub className="h-5 w-5" />
                      <p>Star on GitHub</p>
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
