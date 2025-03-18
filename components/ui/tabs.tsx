"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "default" | "pills" | "underline" | "gradient"
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "inline-flex h-10 items-center justify-center rounded-lg bg-bg-200 p-1 text-text-200",
    pills: "inline-flex h-11 items-center justify-center space-x-1 rounded-full bg-bg-200/50 p-1 text-text-200",
    underline: "inline-flex h-10 items-center justify-center space-x-4 border-b border-bg-300 text-text-200",
    gradient: "inline-flex h-12 items-center justify-center space-x-1 rounded-xl bg-gradient-to-r from-bg-200/80 to-bg-200/40 backdrop-blur-sm p-1.5 text-text-200 shadow-sm"
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "pills" | "underline" | "gradient"
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary-100",
    pills: "relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary-100",
    underline: "relative inline-flex items-center justify-center whitespace-nowrap border-b-2 border-transparent px-2 py-2 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary-100 data-[state=active]:text-primary-100",
    gradient: "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary-100"
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {props.children}
      {(variant === "default" || variant === "pills" || variant === "gradient") && (
        <TabsActiveIndicator variant={variant} />
      )}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

interface TabsActiveIndicatorProps {
  variant: "default" | "pills" | "underline" | "gradient"
}

const TabsActiveIndicator = ({ variant }: TabsActiveIndicatorProps) => {
  const indicatorStyles = {
    default: "absolute inset-0 z-[-1] rounded-md bg-white shadow-sm",
    pills: "absolute inset-0 z-[-1] rounded-full bg-white shadow-sm",
    underline: "",
    gradient: "absolute inset-0 z-[-1] rounded-lg bg-gradient-to-r from-white to-white/90 shadow-md"
  }

  return (
    <motion.div
      className={cn(indicatorStyles[variant])}
      layoutId={`tab-indicator-${variant}`}
      layout
      transition={{
        type: "spring",
        bounce: 0.2,
        duration: 0.6
      }}
    />
  )
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  >
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      {props.children}
    </motion.div>
  </TabsPrimitive.Content>
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent } 