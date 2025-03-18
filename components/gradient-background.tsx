"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface GradientBackgroundProps {
  className?: string
}

export function GradientBackground({ className }: GradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let animationFrameId: number
    let hue = 0
    
    // 设置canvas尺寸为父元素尺寸
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
      }
    }
    
    // 初始化尺寸
    resizeCanvas()
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeCanvas)
    
    // 绘制渐变背景
    const render = () => {
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 创建渐变
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      
      // 添加渐变色
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.3)`)
      gradient.addColorStop(0.5, `hsla(${hue + 60}, 80%, 60%, 0.2)`)
      gradient.addColorStop(1, `hsla(${hue + 120}, 80%, 60%, 0.1)`)
      
      // 填充渐变
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 更新色相
      hue = (hue + 0.2) % 360
      
      // 循环动画
      animationFrameId = requestAnimationFrame(render)
    }
    
    // 开始动画
    render()
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])
  
  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full -z-10"
      />
    </motion.div>
  )
} 