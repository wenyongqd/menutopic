"use client"

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { AtSign, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { serverLogin } from '@/app/actions'

// 创建一个内部组件来使用 useSearchParams
function LoginPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'
  const { toast } = useToast()
  const router = useRouter()

  // 使用服务器操作进行登录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Attempting to sign in with email:', email)
      
      // 创建表单数据
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('redirectTo', typeof redirectPath === 'string' ? redirectPath : '/dashboard')
      
      // 调用服务器操作
      const result = await serverLogin(formData)
      
      if (!result.success) {
        throw new Error(result.error || '登录失败')
      }
      
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
        variant: 'success',
      })
      
      // 使用 router.push 进行客户端导航
      // 服务器端已经设置了会话 cookie，所以不需要额外的处理
      router.push(result.redirectTo || '/dashboard')
      
    } catch (error: Error | unknown) {
      console.error('Login error:', error)
      toast({
        title: '登录失败',
        description: error instanceof Error ? error.message : '请检查您的邮箱和密码',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-bg-100">
      {/* Left side - Background Image */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-10" />
        <Image
          src="/login-bg.webp"
          alt="Elegant restaurant food photography"
          fill
          className="object-cover scale-105 hover:scale-110 transition-transform duration-10000"
          priority
          quality={90}
        />
        <div className="absolute inset-0 flex flex-col justify-center items-start z-20 p-12">
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h1 className="text-4xl font-bold text-white mb-4">PicMenu</h1>
            <div className="h-1 w-20 bg-primary-100 mb-6 rounded-full"></div>
            <p className="text-xl text-white/90 max-w-md leading-relaxed">
              Create stunning menu images with AI to showcase your culinary creations
            </p>
          </div>
          
          <div className="mt-12 bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 max-w-md animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <p className="text-white/90 italic text-sm mb-4">
            &apos;PicMenu transformed our restaurant&apos;s online presence. The AI-generated images look professional and appetizing!&apos;
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div className="ml-3">
                <p className="text-white font-medium text-sm">John Doe</p>
                <p className="text-white/70 text-xs">Restaurant Owner</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
        <div className="absolute top-10 right-10 w-20 h-20 border-4 border-white/20 rounded-full z-10"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 border-4 border-primary-100/30 rounded-full z-10"></div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-6 bg-gradient-to-b from-bg-100 to-bg-200/50">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 text-center md:hidden">
            <h1 className="text-3xl font-bold text-text-100 mb-2">PicMenu</h1>
            <p className="text-text-200">Sign in to your account</p>
          </div>
          
          <Card className="w-full border-none shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-primary-100" />
                    Email
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-4 pr-4 rounded-lg border-bg-200 focus:border-primary-100 focus:ring-primary-100/20"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary-100" />
                      Password
                    </label>
                    <Link
                      href="/reset-password"
                      className="text-sm text-primary-100 hover:text-primary-200 hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-4 pr-4 rounded-lg border-bg-200 focus:border-primary-100 focus:ring-primary-100/20"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-5 pt-2 pb-6">
                <Button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-primary-100 hover:bg-primary-200 text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    className="text-primary-100 hover:text-primary-200 font-medium hover:underline transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
          
          <div className="mt-8 text-center text-text-200 text-xs">
            <p>© {new Date().getFullYear()} PicMenu. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 主组件使用 Suspense 包裹内部组件
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-bg-100 items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary-100 border-t-transparent animate-spin"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
} 