"use client";

import { useState } from 'react';
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

// 复制数组以创建无限滚动效果
const duplicatedImages = [...menuImages, ...menuImages, ...menuImages];

export function MenuImageGallery() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="w-full overflow-hidden py-12">
      {/* Top row - scrolling left */}
      <div className="relative w-full overflow-hidden mb-8 h-[300px]">
        <motion.div
          className="flex gap-6 absolute left-0 top-0 h-full"
          animate={{
            x: isHovered ? 0 : [0, -1920],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {duplicatedImages.map((image, index) => (
            <div
              key={`${image.name}-${index}`}
              className="relative flex-none w-[280px] h-full group"
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
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <h4 className="font-bold text-lg mb-1">{image.name}</h4>
                <p className="text-sm text-white/90">{image.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom row - scrolling right */}
      <div className="relative w-full overflow-hidden h-[300px]">
        <motion.div
          className="flex gap-6 absolute left-0 top-0 h-full"
          animate={{
            x: isHovered ? 0 : [-1920, 0],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          {duplicatedImages.reverse().map((image, index) => (
            <div
              key={`${image.name}-${index}`}
              className="relative flex-none w-[280px] h-full group"
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
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <h4 className="font-bold text-lg mb-1">{image.name}</h4>
                <p className="text-sm text-white/90">{image.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
} 