"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';
import Image from 'next/image';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGeneration } from "@/lib/images";

export default function GalleryPage() {
  const [images, setImages] = useState<ImageGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchImages() {
      if (!user) return;

      try {
        console.log('Fetching images...');
        
        // 构建API URL，添加筛选参数
        let apiUrl = '/api/images/list';
        if (activeFilter !== "all") {
          apiUrl += `?source=${activeFilter}`;
        }
        
        // 使用 API 端点获取图片
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const apiData = await response.json();
        console.log('API data:', apiData);
        
        if (apiData.images && apiData.images.length > 0) {
          setImages(apiData.images);
        } else {
          setImages([]);
        }
      } catch (error) {
        console.error('Failed to fetch images:', error);
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchImages();
  }, [user, activeFilter]);

  // Helper function to get the proper image URL
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/placeholder-image.png'; // Fallback image
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('data:')) {
      return imageUrl;
    } else if (imageUrl === 'failed_to_upload') {
      return '/placeholder-image.png'; // Fallback for failed uploads
    } else {
      // Assume it's a base64 string without the prefix
      return `data:image/png;base64,${imageUrl}`;
    }
  };

  // 处理下载图片
  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      // 创建一个下载链接
      const link = document.createElement('a');
      
      // 处理图像 URL
      const url = getImageUrl(imageUrl);
      
      // 如果是http链接，需要先获取图片数据
      if (url.startsWith('http')) {
        // 显示加载中提示
        toast({
          title: 'Preparing image for download...',
        });
        
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          link.href = URL.createObjectURL(blob);
        } catch (error) {
          console.error('Error fetching image for download:', error);
          toast({
            title: 'Download failed',
            description: 'Failed to download image',
            variant: 'destructive',
          });
          return;
        }
      } else {
        link.href = url;
      }
      
      // 设置文件名
      const fileName = prompt 
        ? `${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.png`
        : `image-${Date.now()}.png`;
      link.download = fileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download successful',
        description: 'Image downloaded successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download image',
        variant: 'destructive',
      });
    }
  };

  // 处理分享图片
  // const handleShare = async (imageUrl: string, prompt: string) => {
  //   try {
  //     const url = getImageUrl(imageUrl);
      
  //     // 检查是否支持网页分享API
  //     if (navigator.share) {
  //       // 如果是http链接，直接分享链接
  //       if (url.startsWith('http')) {
  //         await navigator.share({
  //           title: prompt || 'Generated Image',
  //           text: `Check out this AI generated image${prompt ? ` of ${prompt}` : ''}!`,
  //           url: url
  //         });
  //         toast({
  //           title: 'Share successful',
  //           description: 'Image shared successfully',
  //           variant: 'success',
  //         });
  //       } else {
  //         // 如果是base64或其他格式，需要先转换为blob
  //         const response = await fetch(url);
  //         const blob = await response.blob();
  //         const file = new File([blob], `image-${Date.now()}.png`, { type: 'image/png' });
          
  //         await navigator.share({
  //           title: prompt || 'Generated Image',
  //           text: `Check out this AI generated image${prompt ? ` of ${prompt}` : ''}!`,
  //           files: [file]
  //         });
  //         toast({
  //           title: 'Share successful',
  //           description: 'Image shared successfully',
  //           variant: 'success',
  //         });
  //       }
  //     } else {
  //       // 如果不支持分享API，复制链接到剪贴板
  //       if (url.startsWith('http')) {
  //         await navigator.clipboard.writeText(url);
  //         toast({
  //           title: 'URL copied',
  //           description: 'Image URL copied to clipboard',
  //           variant: 'success',
  //         });
  //       } else {
  //         toast({
  //           title: 'Share failed',
  //           description: 'Sharing not supported on this device',
  //           variant: 'destructive',
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Share error:', error);
  //     toast({
  //       title: 'Share failed',
  //       description: 'Failed to share image',
  //       variant: 'destructive',
  //     });
  //   }
  // };

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Your Generated Images</h1>
        </div>
        <Button
          onClick={() => router.push('/images/generate')}
          className="bg-primary-100 hover:bg-primary-200 text-white"
        >
          Generate New Image
        </Button>
      </div>
      
      {/* 添加筛选选项卡 */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <TabsList variant="pills" className="grid w-full grid-cols-3 mb-6 bg-bg-200">
          <TabsTrigger variant="pills" value="all" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>All Images</span>
          </TabsTrigger>
          <TabsTrigger variant="pills" value="prompt_generation" className="flex items-center gap-2">
            <span>From Prompts</span>
          </TabsTrigger>
          <TabsTrigger variant="pills" value="menu_parsing" className="flex items-center gap-2">
            <span>From Menus</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-8">
          
          {/* 骨架屏图片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-bg-300">
                <CardHeader className="pb-2 border-b border-bg-200">
                  <div className="h-5 w-2/3 bg-bg-200 rounded-lg animate-pulse"></div>
                </CardHeader>
                <div className="aspect-video bg-bg-200 animate-pulse" />
                <CardContent className="p-4 bg-bg-100 space-y-2">
                  <div className="h-4 w-full bg-bg-200 rounded-lg animate-pulse" />
                  <div className="h-3 w-1/3 bg-bg-200 rounded-lg animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 骨架屏分页 */}
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-10 bg-bg-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-bg-100 rounded-lg border border-bg-300 p-8">
          <p className="mb-4 text-text-200">
            {activeFilter === "all" 
              ? "You haven't generated any images yet or there was an issue loading them."
              : activeFilter === "prompt_generation"
                ? "You haven't generated any images from prompts yet."
                : "You haven't generated any images from menu parsing yet."}
          </p>
          <Button 
            onClick={() => router.push('/images/generate')}
            className="bg-primary-100 hover:bg-primary-200 text-white"
          >
            Generate Your First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden border-bg-300 hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-2 border-b border-bg-200">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-text-100 line-clamp-1">{image.prompt}</p>
                  {image.source === "menu_parsing" && (
                    <span className="text-xs px-2 py-1 bg-accent-100/10 text-accent-100 rounded-full">
                      Menu
                    </span>
                  )}
                </div>
              </CardHeader>
              <div className="relative aspect-video group">
                <Image
                  src={getImageUrl(image.image_url)}
                  alt={image.prompt || "Generated image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={(e) => {
                    console.error(`Error loading image ${image.id}:`, e);
                    // Fallback to placeholder on error
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }}
                />
                <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    className="absolute right-2 bg-bg-100 bg-opacity-80 p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-100"
                    onClick={() => handleDownload(image.image_url, image.prompt)}
                    title="Download image"
                  >
                    <Download className="h-4 w-4 text-primary-100" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 bg-bg-100">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-text-200">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                  {image.menu_parsings && (
                    <p className="text-xs text-text-200">
                      Part of menu with {image.menu_parsings.item_count} items
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 