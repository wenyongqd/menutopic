"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, CreditCard, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useCredits } from '@/components/providers/credits-provider'
import { motion } from 'framer-motion'

interface PaymentData {
  success: boolean
  sessionId: string
  purchasedCredits: number
  currentCredits: number
  error: string | null
}

interface SuccessContentProps {
  paymentData: PaymentData
  isMock: boolean
}

export function SuccessContent({ paymentData, isMock }: SuccessContentProps) {
  const router = useRouter()
  const { refreshData } = useAuth()
  const { updateCredits } = useCredits()
  
  useEffect(() => {
    if (paymentData.success) {
      updateCredits(paymentData.currentCredits)
      refreshData()
    }
  }, [paymentData, updateCredits, refreshData])
  
  if (!paymentData.success) {
    return (
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-100 text-center">
            Verification Failed
          </h1>
          <p className="text-text-200 text-lg text-center max-w-lg">
            {paymentData.error || 'We were unable to verify your payment. Please contact support.'}
          </p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </motion.div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center space-y-4"
      >
        <div className="relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2 
            }}
            className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center"
          >
            <CheckCircle className="h-14 w-14 text-green-500" />
          </motion.div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-6 w-6 text-yellow-400" />
          </motion.div>
        </div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold text-text-100 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500"
        >
          Payment Successful!
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-text-200 text-lg text-center max-w-lg"
        >
          Thank you for your purchase. Your credits have been added to your account.
        </motion.p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="max-w-md mx-auto border-2 border-green-100 shadow-lg shadow-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <CreditCard className="mr-2 h-6 w-6 text-green-500" />
              Purchase Summary
            </CardTitle>
            <CardDescription>Details of your transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-between items-center bg-green-50 p-4 rounded-lg"
            >
              <span className="text-text-200 text-lg">Credits Added:</span>
              <motion.span 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className="font-bold text-2xl text-green-600"
              >
                +{paymentData.purchasedCredits}
              </motion.span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex justify-between items-center"
            >
              <span className="text-text-200">Current Credits:</span>
              <span className="font-bold text-xl">{paymentData.currentCredits}</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-between items-center"
            >
              <span className="text-text-200">Transaction ID:</span>
              <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-full">
                {paymentData.sessionId.substring(0, 16)}...
              </span>
            </motion.div>
            {isMock && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800"
              >
                This is a mock transaction for testing purposes. No actual payment was processed.
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex justify-center"
      >
        <Button 
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={() => {
            sessionStorage.setItem('from_payment', 'true');
            window.location.href = '/dashboard';
          }}
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  )
} 