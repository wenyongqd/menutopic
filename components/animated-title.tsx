"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedTitleProps {
  title: string
  subtitle?: string
  className?: string
  titleClassName?: string
  subtitleClassName?: string
}

export function AnimatedTitle({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName
}: AnimatedTitleProps) {
  // 将标题拆分为单词，以便逐个添加动画
  const words = title.split(" ")
  
  // 标题动画变体
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  }
  
  // 单词动画变体
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  }

  return (
    <div className={cn("text-center", className)}>
      <motion.div
        className="overflow-hidden"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <h1 className={cn("text-balance font-bold relative", titleClassName)}>
          {words.map((word, index) => {
            // 为"AI"添加特殊样式
            if (word.toLowerCase() === "ai") {
              return (
                <motion.span
                  key={index}
                  className="inline-block mr-2 relative"
                  variants={child}
                >
                  <span className="relative z-10">
                    {word}
                    <motion.span
                      className="absolute -inset-1 bg-primary-100/20 rounded-md -z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        delay: 1.2,
                        duration: 0.5,
                        type: "spring",
                        damping: 8,
                        stiffness: 100,
                      }}
                    />
                  </span>
                </motion.span>
              )
            }
            
            // 为"menu"添加特殊样式
            if (word.toLowerCase() === "menu") {
              return (
                <motion.span
                  key={index}
                  className="inline-block mr-2 relative"
                  variants={child}
                >
                  <span className="relative z-10">
                    {word}
                    <motion.span
                      className="absolute bottom-0 left-0 h-[30%] bg-primary-100/30 rounded-md -z-10"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ 
                        delay: 1.0,
                        duration: 0.6,
                        ease: "easeInOut"
                      }}
                    />
                  </span>
                </motion.span>
              )
            }
            
            // 其他单词正常显示
            return (
              <motion.span
                key={index}
                className="inline-block mr-2"
                variants={child}
              >
                {word}
              </motion.span>
            )
          })}
        </h1>
      </motion.div>
      
      {subtitle && (
        <motion.p
          className={cn("mt-4", subtitleClassName)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.5,
            duration: 0.8,
            type: "spring",
            damping: 12,
            stiffness: 100,
          }}
        >
          {subtitle}
        </motion.p>
      )}
      
      {/* 装饰元素 */}
      <motion.div
        className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-30 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.2, duration: 1 }}
      >
        <div className="absolute top-0 right-[10%] w-24 h-24 bg-primary-100/20 rounded-full blur-xl" />
        <div className="absolute bottom-[20%] left-[15%] w-32 h-32 bg-blue-400/20 rounded-full blur-xl" />
        <div className="absolute top-[30%] left-[5%] w-16 h-16 bg-purple-400/20 rounded-full blur-xl" />
      </motion.div>
    </div>
  )
} 