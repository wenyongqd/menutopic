"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface HighlightedTextProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function HighlightedText({ 
  children, 
  className,
  delay = 0 
}: HighlightedTextProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      {/* 文本内容 */}
      <span className="relative z-10">{children}</span>
      
      {/* 高亮背景 */}
      <motion.span
        className="absolute bottom-0 left-0 w-full h-[30%] bg-primary-100/30 rounded-md -z-0"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{
          delay: delay,
          duration: 0.6,
          ease: "easeInOut"
        }}
      />
    </span>
  )
} 