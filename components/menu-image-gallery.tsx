"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// 示例菜品图片数据
const menuImages = [
  {
    name: "Spaghetti Carbonara",
    url: "/generated/carbonara.webp",
    description: "Classic Italian pasta with eggs, cheese, pancetta, and black pepper"
  },
  {
    name: "Grilled Salmon",
    url: "/generated/salmon.webp",
    description: "Fresh salmon fillet with herbs and lemon"
  },
  {
    name: "Caesar Salad",
    url: "/generated/caesar.webp",
    description: "Crisp romaine lettuce with Caesar dressing and croutons"
  },
  {
    name: "Margherita Pizza",
    url: "/generated/pizza.webp",
    description: "Traditional pizza with tomatoes, mozzarella, and basil"
  },
  {
    name: "Beef Burger",
    url: "/generated/burger.webp",
    description: "Juicy beef patty with fresh vegetables and special sauce"
  },
  {
    name: "Chocolate Cake",
    url: "/generated/cake.webp",
    description: "Rich chocolate layer cake with ganache"
  }
  // 添加更多菜品...
];

// 复制数组以创建无限滚动效果，增加足够多的图片确保各种屏幕宽度下都能滚动
const duplicatedImages = [...menuImages, ...menuImages, ...menuImages, ...menuImages, ...menuImages];

export function MenuImageGallery() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(-1920);

  // Detect touch device and mobile screen
  useEffect(() => {
    // Check if touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      // 根据屏幕宽度动态设置滚动宽度
      if (width < 480) {
        setScrollWidth(-1200); // 小屏手机
      } else if (width < 768) {
        setScrollWidth(-1600); // 大屏手机
      } else if (width < 1024) {
        setScrollWidth(-1800); // 平板
      } else {
        setScrollWidth(-2000); // 桌面
      }
    };
    
    // Check on initial load
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 设置移动设备的动画持续时间
  const mobileDuration = 60; // 触摸设备的速度稍慢一些
  const desktopDuration = 30;

  return (
    <div className="w-full overflow-hidden py-8 sm:py-12">
      {/* Top row - scrolling left */}
      <div className="relative w-full overflow-hidden mb-4 sm:mb-8 h-[180px] sm:h-[240px] md:h-[300px]">
        {isTouchDevice && (
          <div className="absolute z-30 right-2 top-1/2 transform -translate-y-1/2 bg-white/30 backdrop-blur-sm rounded-full p-2 shadow-md animate-pulse-slow">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-100">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        )}
        <motion.div
          className="flex gap-3 sm:gap-6 absolute left-0 top-0 h-full"
          animate={!isTouchDevice ? {
            x: isHovered ? 0 : [0, scrollWidth],
          } : undefined}
          initial={{ x: 0 }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: isMobile ? mobileDuration : desktopDuration,
              ease: "linear",
            },
          }}
          onHoverStart={() => !isTouchDevice && setIsHovered(true)}
          onHoverEnd={() => !isTouchDevice && setIsHovered(false)}
          drag={isTouchDevice ? "x" : false}
          dragConstraints={{ left: scrollWidth, right: 0 }}
          dragElastic={0.1}
        >
          {duplicatedImages.map((image, index) => (
            <div
              key={`${image.name}-${index}`}
              className="relative flex-none w-[200px] sm:w-[240px] md:w-[280px] h-full group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl z-10" />
              <Image
                src={image.url}
                alt={image.name}
                width={280}
                height={300}
                className="w-full h-full object-cover rounded-xl shadow-lg transform group-hover:scale-[1.02] transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/280x300/e2e8f0/64748b?text=${encodeURIComponent(image.name)}`;
                }}
              />
              <div className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white ${isTouchDevice ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'} md:group-hover:opacity-100 transition-opacity duration-300 z-20`}>
                <h4 className="font-bold text-base sm:text-lg mb-0 sm:mb-1">{image.name}</h4>
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2">{image.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom row - scrolling right */}
      <div className="relative w-full overflow-hidden h-[180px] sm:h-[240px] md:h-[300px]">
        {isTouchDevice && (
          <div className="absolute z-30 left-2 top-1/2 transform -translate-y-1/2 bg-white/30 backdrop-blur-sm rounded-full p-2 shadow-md animate-pulse-slow">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-100 transform rotate-180">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        )}
        <motion.div
          className="flex gap-3 sm:gap-6 absolute left-0 top-0 h-full"
          animate={!isTouchDevice ? {
            x: isHovered ? 0 : [scrollWidth, 0],
          } : undefined}
          initial={{ x: 0 }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: isMobile ? mobileDuration : desktopDuration,
              ease: "linear",
            },
          }}
          onHoverStart={() => !isTouchDevice && setIsHovered(true)}
          onHoverEnd={() => !isTouchDevice && setIsHovered(false)}
          drag={isTouchDevice ? "x" : false}
          dragConstraints={{ left: scrollWidth, right: 0 }}
          dragElastic={0.1}
        >
          {duplicatedImages.reverse().map((image, index) => (
            <div
              key={`${image.name}-${index}`}
              className="relative flex-none w-[200px] sm:w-[240px] md:w-[280px] h-full group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl z-10" />
              <Image
                src={image.url}
                alt={image.name}
                width={280}
                height={300}
                className="w-full h-full object-cover rounded-xl shadow-lg transform group-hover:scale-[1.02] transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/280x300/e2e8f0/64748b?text=${encodeURIComponent(image.name)}`;
                }}
              />
              <div className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white ${isTouchDevice ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'} md:group-hover:opacity-100 transition-opacity duration-300 z-20`}>
                <h4 className="font-bold text-base sm:text-lg mb-0 sm:mb-1">{image.name}</h4>
                <p className="text-xs sm:text-sm text-white/90 line-clamp-2">{image.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
} 