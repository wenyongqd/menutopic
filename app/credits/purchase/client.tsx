"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { User } from '@supabase/supabase-js'
import { CreditCard, Package, ShoppingCart, Sparkles, Shield, ArrowRight, Check, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useCredits } from '@/components/providers/credits-provider'

interface CreditPackage {
  id: string
  name: string
  credit_amount?: number
  credits?: number
  price_in_cents: number
  stripe_price_id: string
}

interface PurchaseClientProps {
  user: User;
  initialPackages: CreditPackage[];
}

export function PurchaseClient({ user, initialPackages }: PurchaseClientProps) {
  const { credits } = useCredits();
  const [packages, setPackages] = useState<CreditPackage[]>(initialPackages || [])
  const [isLoading, setIsLoading] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchPackages() {
      if (initialPackages && initialPackages.length > 0) {
        // 如果已经有初始数据，就使用它
        console.log('Using initial packages:', initialPackages);
        
        const sortedPackages = [...initialPackages].sort((a, b) => {
          const aValue = a.credits !== undefined ? a.credits : (a.credit_amount || 0);
          const bValue = b.credits !== undefined ? b.credits : (b.credit_amount || 0);
          return aValue - bValue;
        });
        
        setPackages(sortedPackages);
        
        // 如果有套餐，默认选择第二个（或者第一个，如果只有一个）
        const defaultIndex = Math.min(1, sortedPackages.length - 1);
        setSelectedPackage(sortedPackages[defaultIndex].id);
        return;
      }
      
      setIsLoading(true);
      try {
        // 使用新的 API 端点获取活跃的信用包
        const response = await fetch('/api/credit-packages');
        if (!response.ok) {
          throw new Error('Failed to fetch packages from API');
        }
        const apiData = await response.json();
        const data = apiData.packages || [];
        
        console.log('Fetched active packages from API:', data);
        
        const sortedPackages = [...(data || [])].sort((a, b) => {
          const aValue = a.credits !== undefined ? a.credits : (a.credit_amount || 0);
          const bValue = b.credits !== undefined ? b.credits : (b.credit_amount || 0);
          return aValue - bValue;
        });
        
        console.log('Sorted packages:', sortedPackages);
        
        // 确保 packages 数组被正确设置
        if (sortedPackages.length > 0) {
          setPackages(sortedPackages);
          
          // 如果有套餐，默认选择第二个（或者第一个，如果只有一个）
          const defaultIndex = Math.min(1, sortedPackages.length - 1);
          setSelectedPackage(sortedPackages[defaultIndex].id);
          console.log('Selected package ID:', sortedPackages[defaultIndex].id);
        } else {
          console.log('No packages available');
          // 确保设置空数组，而不是 undefined
          setPackages([]);
          setSelectedPackage(null);
        }
      } catch (error) {
        console.error('Error fetching packages:', error)
        // 确保在错误情况下也设置空数组
        setPackages([]);
        setSelectedPackage(null);
        toast({
          title: 'Loading failed',
          description: 'Unable to load credit packages. Please refresh the page.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPackages()
  }, [toast, initialPackages])

  // 确保在组件挂载后有一个默认选中的套餐
  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      const defaultIndex = Math.min(1, packages.length - 1);
      setSelectedPackage(packages[defaultIndex].id);
    }
  }, [packages, selectedPackage]);

  const handleSelectPackage = (packageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Selecting package:", packageId);
    setSelectedPackage(packageId);
  };

  const handlePurchase = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!selectedPackage) {
      toast({
        title: 'Please select a package',
        variant: 'destructive',
      })
      return
    }
    
    setIsPurchasing(true)
    try {
      const response = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage }),
      })
      
      if (!response.ok) throw new Error('Failed to create checkout session')
      
      const { url } = await response.json()
      
      // Redirect to Stripe checkout page
      window.location.href = url
    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: 'Purchase failed',
        description: 'Please try again later',
        variant: 'destructive',
      })
      setIsPurchasing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
        {/* Skeleton for header */}
        <div className="space-y-2">
          <div className="h-10 w-3/4 bg-bg-200 rounded-lg animate-pulse"></div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="h-6 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-48 bg-bg-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton for packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`relative ${i === 2 ? 'scale-105 md:scale-110 z-10' : ''}`}>
              <Card className="card overflow-hidden">
                {i === 2 && (
                  <div className="h-6 bg-bg-200 animate-pulse"></div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-1/3 bg-bg-200 rounded-lg animate-pulse"></div>
                    {i === 2 && (
                      <div className="h-6 w-6 rounded-full bg-bg-200 animate-pulse"></div>
                    )}
                  </div>
                  <div className="h-4 w-1/2 bg-bg-200 rounded-lg animate-pulse mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
                  <div className="h-6 w-1/3 bg-bg-200 rounded-lg animate-pulse mt-2"></div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-bg-200 animate-pulse mr-2"></div>
                      <div className="h-4 w-3/4 bg-bg-200 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-bg-200 animate-pulse mr-2"></div>
                      <div className="h-4 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Skeleton for checkout button */}
        <div className="flex justify-center">
          <div className="h-14 w-48 bg-bg-200 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Skeleton for secure payments section */}
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="h-6 w-1/4 bg-bg-200 rounded-lg animate-pulse"></div>
          </div>
          
          <Card className="card border-dashed border-2 bg-bg-100">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-bg-200 animate-pulse mb-4"></div>
                    <div className="h-5 w-1/2 bg-bg-200 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-4 w-3/4 bg-bg-200 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If no packages are available yet, show placeholder packages
  const displayPackages = packages.length > 0 ? packages : [
    { id: 'basic', name: 'Basic', credit_amount: 10, price_in_cents: 599, stripe_price_id: '' },
    { id: 'standard', name: 'Standard', credit_amount: 50, price_in_cents: 2499, stripe_price_id: '' },
    { id: 'premium', name: 'Premium', credit_amount: 100, price_in_cents: 3999, stripe_price_id: '' },
  ]

  // Get the most popular package (middle one or second one)
  const popularIndex = Math.min(1, displayPackages.length - 1);
  const isPopular = (index: number) => index === popularIndex;

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      <div className="space-y-2 fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-text-100">
          Purchase Credits
        </h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-text-200 text-lg">
            Select a credit package that suits your needs and start creating amazing images
          </p>
          <div className="flex items-center bg-bg-100 rounded-lg px-4 py-2 border border-bg-200">
            <Wallet className="h-5 w-5 text-primary-100 mr-2" />
            <span className="text-text-100">Current Credits: </span>
            <span className="font-bold text-primary-100 ml-2">{credits}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 fade-in" style={{ animationDelay: "0.1s" }}>
        {displayPackages.map((pkg, index) => {
          const creditAmount = pkg.credits !== undefined ? pkg.credits : pkg.credit_amount;
          const popular = isPopular(index);
          const isSelected = selectedPackage === pkg.id;
          
          return (
            <div 
              key={pkg.id}
              className="relative"
              onClick={(e) => handleSelectPackage(pkg.id, e)}
            >
              <Card 
                className={`card overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                  isSelected 
                    ? 'ring-2 ring-primary-100 shadow-md' 
                    : 'hover:scale-[1.02]'
                } ${
                  popular ? 'scale-105 md:scale-110 z-10' : ''
                }`}
              >
                {popular && (
                  <div className="bg-primary-100 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 text-center">
                    Most Popular
                  </div>
                )}
                <CardHeader className={`pb-2 ${popular ? 'bg-bg-100' : ''}`}>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      {index === 0 ? (
                        <Package className="mr-2 h-5 w-5 text-accent-100" />
                      ) : index === 1 ? (
                        <Sparkles className="mr-2 h-5 w-5 text-primary-100" />
                      ) : (
                        <Shield className="mr-2 h-5 w-5 text-accent-100" />
                      )}
                      {pkg.name}
                    </CardTitle>
                    {isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <CardDescription className="flex items-center">
                    <CreditCard className="mr-1 h-4 w-4 text-text-200" />
                    {creditAmount} Credits
                  </CardDescription>
                </CardHeader>
                <CardContent className={`flex-grow ${popular ? 'pt-4' : 'pt-2'}`}>
                  <div className="flex items-baseline">
                    <p className="text-4xl font-bold text-primary-100">
                      ${(pkg.price_in_cents / 100).toFixed(2)}
                    </p>
                    <span className="text-text-200 ml-2">one-time</span>
                  </div>
                  <p className="text-sm text-text-200 mt-2 flex items-center">
                    <span className="inline-block bg-bg-200 rounded-full px-2 py-1">
                      ${((pkg.price_in_cents / 100) / (creditAmount || 1)).toFixed(2)} per credit
                    </span>
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="text-sm flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                        <ArrowRight className="h-3 w-3 text-primary-100" />
                      </div>
                      <span>Generate {Math.floor((creditAmount || 0) / 5)} images</span>
                    </div>
                    <div className="text-sm flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                        <ArrowRight className="h-3 w-3 text-primary-100" />
                      </div>
                      <span>Credits never expire</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div 
                className="absolute inset-0 cursor-pointer" 
                onClick={(e) => handleSelectPackage(pkg.id, e)}
                aria-label={`Select ${pkg.name} package`}
              />
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center fade-in" style={{ animationDelay: "0.2s" }}>
        <Button 
          onClick={handlePurchase}
          disabled={isPurchasing /* 临时移除其他禁用条件: || packages.length === 0 || !selectedPackage */}
          className="btn-primary px-8 py-6 text-lg"
          size="lg"
        >
          {isPurchasing ? (
            <>
              <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Proceed to Checkout
            </>
          )}
        </Button>
      </div>
      
      {packages.length === 0 && (
        <div className="mt-8 p-6 bg-bg-100 border border-bg-200 rounded-lg fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center text-accent-100 mb-4">
            <Shield className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-medium">Demo Mode</h3>
          </div>
          <p className="text-text-200 mb-4">
            These are placeholder packages. Actual purchases are not available until the admin configures the packages in the database.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center">
              <ArrowRight className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      )}
      
      <div className="space-y-4 fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-accent-100" />
          <h2 className="text-2xl font-bold text-text-100">
            Secure Payments
          </h2>
        </div>
        
        <Card className="card border-dashed border-2 bg-bg-100">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary-100/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary-100" />
                </div>
                <h3 className="font-medium mb-2">Secure Transactions</h3>
                <p className="text-sm text-text-200">All payments are processed securely through Stripe</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary-100/10 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-primary-100" />
                </div>
                <h3 className="font-medium mb-2">Instant Credit</h3>
                <p className="text-sm text-text-200">Credits are added to your account immediately after payment</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary-100/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary-100" />
                </div>
                <h3 className="font-medium mb-2">Premium Quality</h3>
                <p className="text-sm text-text-200">Generate high-quality AI images with your credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 