"use client"

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { AtSign, Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'

// 创建一个内部组件来使用 useSearchParams
function RegisterPageContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match',
        variant: 'destructive',
      })
      return
    }
    
    setIsLoading(true)

    try {
      await signUp(email, password)
      toast({
        title: 'Registration successful',
        description: 'Please check your email to confirm your account. You will be able to login after confirming your email.',
        variant: 'success',
      })
      router.push('/login')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again later';
      toast({
        title: 'Registration failed',
        description: errorMessage,
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
          src="/register-bg.webp"
          alt="AI-generated gourmet food menu"
          fill
          className="object-cover scale-105 hover:scale-110 transition-transform duration-10000"
          priority
          quality={90}
        />
        <div className="absolute inset-0 flex flex-col justify-center items-start z-20 p-12">
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h1 className="text-4xl font-bold text-white mb-4">PicMenu</h1>
            <div className="h-1 w-20 bg-accent-100 mb-6 rounded-full"></div>
            <p className="text-xl text-white/90 max-w-md leading-relaxed">
              Join today and transform your menu with beautiful AI-generated food images
            </p>
          </div>
          
          <div className="mt-12 space-y-4 max-w-md animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="bg-accent-100/20 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-accent-100" />
              </div>
              <p className="text-white/90 text-sm">
                Professional quality food images in seconds
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="bg-accent-100/20 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-accent-100" />
              </div>
              <p className="text-white/90 text-sm">
                Customize styles to match your brand identity
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="bg-accent-100/20 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-accent-100" />
              </div>
              <p className="text-white/90 text-sm">
                Easy to use with no design skills required
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
        <div className="absolute top-10 right-10 w-20 h-20 border-4 border-white/20 rounded-full z-10"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 border-4 border-accent-100/30 rounded-full z-10"></div>
      </div>
      
      {/* Right side - Registration Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-6 bg-gradient-to-b from-bg-100 to-bg-200/50">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 text-center md:hidden">
            <h1 className="text-3xl font-bold text-text-100 mb-2">PicMenu</h1>
            <p className="text-text-200">Create your account</p>
          </div>
          
          <Card className="w-full border-none shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
              <CardDescription className="text-center">
                Sign up to start creating stunning menu images
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-accent-100" />
                    Email
                  </label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-4 pr-4 rounded-lg border-bg-200 focus:border-accent-100 focus:ring-accent-100/20"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-accent-100" />
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-4 pr-4 rounded-lg border-bg-200 focus:border-accent-100 focus:ring-accent-100/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent-100" />
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pl-4 pr-4 rounded-lg border-bg-200 focus:border-accent-100 focus:ring-accent-100/20"
                    required
                  />
                </div>
                
                <div className="pt-2">
                  <p className="text-xs text-text-200">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="text-accent-100 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-accent-100 hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-5 pt-2 pb-6">
                <Button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-accent-100 hover:bg-accent-200 text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
                <div className="text-center text-sm">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-accent-100 hover:text-accent-200 font-medium hover:underline transition-colors"
                  >
                    Sign In
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
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-bg-100 items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary-100 border-t-transparent animate-spin"></div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
} 