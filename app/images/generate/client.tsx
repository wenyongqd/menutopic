"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import * as Bytescale from "@bytescale/sdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuGrid } from "@/components/menu-grid";
import { PhotoIcon } from "@heroicons/react/20/solid";
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  Image as ImageIcon,
  Sparkles,
  CreditCard,
  Wand2,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  Palette,
  Camera,
  RefreshCw,
} from "lucide-react";
import { GradientBackground } from "@/components/gradient-background";
import { motion } from "framer-motion";
import { MenuItem } from "./types";
import Dropzone from "react-dropzone";
import { AnimatedTitle } from "@/components/animated-title";
import { useCredits } from '@/components/providers/credits-provider';

interface GenerateClientProps {
  user: User;
  initialCredits: number;
}

export function GenerateClient({ user, initialCredits }: GenerateClientProps) {
  const { credits, updateCredits } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { refreshData } = useAuth();

  // 菜单上传功能的状态
  const [activeTab, setActiveTab] = useState("prompt");
  const [menuUrl, setMenuUrl] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<
    "initial" | "uploading" | "parsing" | "created" | "generating"
  >("initial");
  const [parsedMenu, setParsedMenu] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [jsZipLoaded, setJsZipLoaded] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // 初始化 Bytescale 上传管理器
  const uploadManager = new Bytescale.UploadManager({
    apiKey: process.env.NEXT_PUBLIC_BYTESCALE_API_KEY || "free",
  });

  // 两种不同的积分消费
  const CREDITS_FOR_MENU = 10; // Credits required for menu processing
  const CREDITS_PER_IMAGE = 1;  // Credits required for single image generation

  // 页面加载时刷新数据
  useEffect(() => {
    // 手动刷新数据，确保认证状态和用户数据是最新的
    refreshData();
  }, [refreshData]);

  // 预加载JSZip库
  useEffect(() => {
    const preloadJSZip = async () => {
      try {
        await import("jszip");
        setJsZipLoaded(true);
      } catch (error) {
        console.error("Failed to preload JSZip:", error);
      }
    };

    preloadJSZip();
  }, []);

  // 从服务器获取的初始credit已经可用，无需再次获取
  useEffect(() => {
    console.log("GenerateClient - Initialized with credits:", initialCredits);
  }, [initialCredits]);
  
  // 检查是否有需要在页面加载后显示的图像URL
  useEffect(() => {
    const savedImageUrl = window.sessionStorage.getItem("image_to_show_after_reload");
    if (savedImageUrl) {
      console.log("Found saved image URL to display after reload");
      // 清除保存的URL，避免重复加载
      window.sessionStorage.removeItem("image_to_show_after_reload");
      
      // 设置图像显示
      setGeneratedImage(savedImageUrl);
      setIsGenerating(false);
      
      // 显示提示
      toast({
        title: "图像已恢复",
        description: "通过页面刷新恢复了生成的图像",
        variant: "success",
      });
    }
  }, [toast]);

  // 处理菜单文件上传
  const handleFileChange = async (file: File) => {
    if (!file) {
      console.error("No file provided to handleFileChange");
      toast({
        title: "Upload failed",
        description: "No file was selected",
        variant: "destructive",
      });
      return;
    }

    if (!hasEnoughCredits) {
      toast({
        title: "Insufficient credits",
        description: `Please purchase more credits to process a menu. You need ${CREDITS_FOR_MENU} credits.`,
        variant: "destructive",
      });
      return;
    }

    console.log(
      "File selected:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type
    );

    // 设置上传状态
    setIsUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setStatus("uploading");
    setMenuUrl(objectUrl);

    try {
      console.log("Starting upload to Bytescale...");
      // 使用Bytescale上传文件
      const { fileUrl } = await uploadManager.upload({
        data: file,
        mime: file.type,
        originalFileName: file.name,
      });

      console.log("Upload successful, file URL:", fileUrl);
      setMenuUrl(fileUrl);
      setStatus("parsing");

      try {
        console.log("Sending request to parseMenu API...");
        const res = await fetch("/api/parseMenu", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            menuUrl: fileUrl,
          }),
        });

        console.log("parseMenu API response status:", res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Server error response:", errorText);
          throw new Error(
            `Server responded with status: ${res.status}. Details: ${errorText}`
          );
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON response but got ${contentType}`);
        }

        const json = await res.json();
        console.log("parseMenu API response:", json);

        // 更新状态和菜单数据
        setParsedMenu(json.menu);
        setStatus("created"); // 确保在数据设置后更新状态
        setIsUploading(false); // 重置上传状态

        // 立即更新本地积分显示
        const newCredits = credits - CREDITS_FOR_MENU;
        updateCredits(newCredits);

        // Fetch updated credits from the database
        try {
          if (user) {
            const { data: updatedProfile, error } = await createClient()
              .from("user_profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (error) {
              console.error("Failed to fetch updated credits:", error);
            } else {
              const updatedCredits =
                updatedProfile?.credits !== undefined
                  ? updatedProfile.credits
                  : updatedProfile?.credit_amount || 0;
              // 只有当数据库中的积分与本地计算的不一致时才更新
              if (updatedCredits !== newCredits) {
                updateCredits(updatedCredits);
              }
            }
          }
        } catch (creditFetchError) {
          console.error("Error fetching updated credits:", creditFetchError);
        }

        // 清除已选择的文件
        setSelectedFile(null);

        toast({
          title: "Menu processed successfully",
          description: `${CREDITS_FOR_MENU} credits have been deducted from your account`,
          variant: "success",
        });
      } catch (parseError: unknown) {
        console.error("Parse menu error:", parseError);
        setStatus("initial");
        setIsUploading(false);
        toast({
          title: "Failed to parse menu",
          description:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
          variant: "destructive",
        });
      }
    } catch (uploadError: unknown) {
      console.error("Upload error:", uploadError);
      setStatus("initial");
      setIsUploading(false);
      toast({
        title: "Failed to upload image",
        description:
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError),
        variant: "destructive",
      });
    } finally {
      // 清理临时对象URL
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  // 处理示例菜单图片
  const handleSampleImage = async () => {
    if (!hasEnoughCreditsForGenerate) {
      toast({
        title: "Insufficient credits",
        description: "Please purchase more credits to generate images",
        variant: "destructive",
      });
      return;
    }

    // 设置上传状态
    setIsUploading(true);

    // 这里可以使用一个示例菜单图片URL
    const sampleMenuUrl =
      "https://upcdn.io/FW25bBB/raw/uploads/2023/05/05/italian-menu-sample-n2Ru.jpeg";

    setStatus("parsing");
    setMenuUrl(sampleMenuUrl);

    try {
      console.log("Sending sample menu to parseMenu API...");
      const res = await fetch("/api/parseMenu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuUrl: sampleMenuUrl,
        }),
      });

      console.log("parseMenu API response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error response:", errorText);
        throw new Error(
          `Server responded with status: ${res.status}. Details: ${errorText}`
        );
      }

      const json = await res.json();
      console.log("parseMenu API response:", json);

      // 立即更新本地积分显示
      const newCredits = credits - CREDITS_FOR_MENU;
      updateCredits(newCredits);

      // Fetch updated credits from the database
      try {
        if (user) {
          const { data: updatedProfile, error } = await createClient()
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Failed to fetch updated credits:", error);
          } else {
            const updatedCredits =
              updatedProfile?.credits !== undefined
                ? updatedProfile.credits
                : updatedProfile?.credit_amount || 0;
            // 只有当数据库中的积分与本地计算的不一致时才更新
            if (updatedCredits !== newCredits) {
              updateCredits(updatedCredits);
            }
          }
        }
      } catch (creditFetchError) {
        console.error("Error fetching updated credits:", creditFetchError);
      }

      setStatus("created");
      setParsedMenu(json.menu);

      // 清除已选择的文件
      setSelectedFile(null);

      toast({
        title: "Sample menu processed successfully",
        description: `${CREDITS_FOR_MENU} credits have been deducted from your account`,
        variant: "success",
      });
    } catch (error: unknown) {
      console.error("Sample menu error:", error);
      setStatus("initial");
      toast({
        title: "Failed to process sample menu",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      // 重置上传状态
      setIsUploading(false);
    }
  };

  // 下载所有图片
  const handleDownloadAll = () => {
    if (!parsedMenu.length || isDownloading) return;

    setIsDownloading(true);

    // 预先导入JSZip库
    import("jszip")
      .then(async ({ default: JSZip }) => {
        try {
          const zip = new JSZip();

          // 添加所有有效的图片到zip
          for (const item of parsedMenu) {
            if (item.menuImage && item.menuImage.b64_json) {
              try {
                // 将base64转换为二进制
                const binary = atob(item.menuImage.b64_json);
                const array = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                  array[i] = binary.charCodeAt(i);
                }

                // 添加到zip
                const fileName = `${item.name.replace(/\s+/g, "_")}.png`;
                zip.file(fileName, array);
              } catch (itemError) {
                console.error(`Error processing item ${item.name}:`, itemError);
                // 继续处理其他项目
              }
            }
          }

          // 生成并下载zip
          const content = await zip.generateAsync({ type: "blob" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(content);
          link.download = "menu_images.zip";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (zipError) {
          console.error("Error creating zip file:", zipError);
          toast({
            title: "Download failed",
            description: "Failed to create zip file. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setIsDownloading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load JSZip:", err);
        toast({
          title: "Download failed",
          description:
            "Failed to load compression library. Please try again later.",
          variant: "destructive",
        });
        setIsDownloading(false);
      });
  };

  // 处理图像生成
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    if (credits < CREDITS_PER_IMAGE) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${CREDITS_PER_IMAGE} credits to generate an image. Please purchase more credits.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        const img = new window.Image();
        img.onload = async () => {
          try {
            const newCredits = credits - CREDITS_PER_IMAGE;
            
            setIsGenerating(false);
            setGeneratedImage(data.imageUrl);
            setShowConfirmation(true);
            updateCredits(newCredits);
            
            if (user) {
              const { error } = await createClient()
                .from("user_profiles")
                .update({ credits: newCredits })
                .eq("id", user.id);

              if (error) {
                toast({
                  title: "Warning",
                  description: "Credits were deducted but failed to update in database. Please refresh the page.",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Success",
                  description: `Image generated successfully! ${CREDITS_PER_IMAGE} credits have been deducted.`,
                  variant: "success",
                });
              }
            }
          } catch (error) {
            toast({
              title: "Error",
              description: `Failed to update credits: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh the page.`,
              variant: "destructive",
            });
          }
        };
        
        img.onerror = () => {
          setIsGenerating(false);
          toast({
            title: "Error",
            description: "Generated URL is invalid.",
            variant: "destructive",
          });
        };
        
        const timeoutId = setTimeout(() => {
          if (!img.complete) {
            setIsGenerating(false);
            toast({
              title: "Error",
              description: "Image loading timed out.",
              variant: "destructive",
            });
          }
        }, 30000);
        
        img.src = data.imageUrl;
        
        return () => clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Error in image generation process:", error);
      setIsGenerating(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // 添加查看所有图片的函数
  const handleViewAllImages = () => {
    router.push(`/images/gallery`);
  };

  // 添加清除生成的图片的函数
  const handleGenerateAnother = () => {
    setGeneratedImage(null);
    setShowConfirmation(false);
    setPrompt(""); // 可选：清除提示文本
  };

  // 渲染主页面
  const hasEnoughCredits = credits >= CREDITS_FOR_MENU;
  const hasEnoughCreditsForGenerate = credits >= CREDITS_PER_IMAGE;
  const filteredMenu = parsedMenu.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-12 px-4 space-y-4">
        {/* Skeleton for header */}
        <div className="space-y-2">
          <div className="h-10 w-3/4 bg-bg-200 rounded-lg animate-pulse"></div>
          <div className="h-6 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Skeleton for main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="card overflow-hidden">
              <CardHeader className="pb-2 border-b border-bg-200">
                <div className="h-6 w-1/3 bg-bg-200 rounded-lg animate-pulse"></div>
                <div className="h-4 w-2/3 bg-bg-200 rounded-lg animate-pulse mt-2"></div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Credits info skeleton */}
                <div className="flex items-center justify-between bg-bg-100 p-3 rounded-lg">
                  <div className="h-6 w-1/3 bg-bg-200 rounded-lg animate-pulse"></div>
                  <div className="h-6 w-1/4 bg-bg-200 rounded-lg animate-pulse"></div>
                </div>

                {/* Prompt input skeleton */}
                <div className="space-y-2">
                  <div className="h-5 w-1/4 bg-bg-200 rounded-lg animate-pulse"></div>
                  <div className="h-[120px] w-full bg-bg-200 rounded-lg animate-pulse"></div>
                </div>

                {/* Button skeleton */}
                <div className="h-12 w-full bg-bg-200 rounded-lg animate-pulse"></div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Tips card skeleton */}
            <Card className="card overflow-hidden">
              <CardHeader className="pb-2 border-b border-bg-200">
                <div className="h-6 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-bg-200 animate-pulse mr-2"></div>
                      <div className="h-4 w-full bg-bg-200 rounded-lg animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Example prompts skeleton */}
            <Card className="card overflow-hidden">
              <CardHeader className="pb-2 border-b border-bg-200">
                <div className="h-6 w-1/2 bg-bg-200 rounded-lg animate-pulse"></div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 w-full bg-bg-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it works skeleton */}
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="h-6 w-1/4 bg-bg-200 rounded-lg animate-pulse"></div>
          </div>

          <Card className="card border-dashed border-2 bg-bg-100">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center"
                  >
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

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      <div className="flex flex-col items-center justify-between relative overflow-hidden py-12 px-4 rounded-2xl">
        <GradientBackground className="absolute inset-0 rounded-2xl opacity-70" />

        {/* 装饰元素 */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 opacity-20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 0.2, y: 0 }}
          transition={{ duration: 1 }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#FF0066"
              d="M47.5,-57.2C59.9,-46.1,67.5,-29.7,69.9,-12.8C72.3,4.1,69.5,21.5,60.5,34.8C51.5,48.1,36.3,57.4,19.3,64.3C2.3,71.2,-16.5,75.8,-32.4,70.1C-48.2,64.3,-61.1,48.3,-68.3,30.1C-75.5,11.9,-77,-8.5,-70.8,-26.4C-64.7,-44.3,-50.9,-59.7,-35.1,-69.4C-19.3,-79.1,-1.4,-83.1,14.2,-78.5C29.8,-73.9,35.1,-68.3,47.5,-57.2Z"
              transform="translate(100 100)"
            />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-0 left-0 w-72 h-72 opacity-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#00DDFF"
              d="M42.8,-62.2C54.9,-54.3,63.6,-40.9,69.9,-26.2C76.2,-11.5,80.1,4.6,76.3,19.1C72.6,33.6,61.2,46.6,47.8,56.5C34.3,66.4,18.8,73.2,2.2,71.1C-14.4,69,-32.1,58,-44.1,44.5C-56.1,31,-62.5,15,-65.2,-2.7C-67.9,-20.4,-67,-39.8,-57.3,-50.8C-47.6,-61.8,-29.1,-64.4,-12.3,-65.5C4.5,-66.6,30.7,-70.1,42.8,-62.2Z"
              transform="translate(100 100)"
            />
          </svg>
        </motion.div>

        <div className="relative z-10 w-full">
          <AnimatedTitle
            title="Visualize your menu with AI"
            titleClassName="text-4xl md:text-6xl font-bold text-text-100 mb-6"
            subtitle="Take a picture of your menu and get pictures of each dish so you can better decide what to order, or generate individual dish images from descriptions."
            subtitleClassName="text-lg text-text-200 max-w-3xl mx-auto text-balance"
          />
        </div>
      </div>

      <div className="fade-in" style={{ animationDelay: "0.1s" }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            variant="pills"
            className="grid w-full grid-cols-2 mb-6 bg-bg-200"
          >
            <TabsTrigger
              variant="pills"
              value="prompt"
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate from Prompt</span>
            </TabsTrigger>
            <TabsTrigger
              variant="pills"
              value="upload"
              className="flex items-center gap-2"
            >
              <PhotoIcon className="h-4 w-4" />
              <span>Upload Menu</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Card className="card overflow-hidden">
                  <CardHeader className="pb-2 border-b border-bg-200">
                    <CardTitle className="flex items-center">
                      <Wand2 className="mr-2 h-5 w-5 text-primary-100" />
                      Create a New Image
                    </CardTitle>
                    <CardDescription>
                      Describe what you want to see in your generated image
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center justify-between bg-bg-100 p-3 rounded-lg">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-primary-100 mr-2" />
                        <span className="text-sm font-medium">
                          Your credits:
                        </span>
                        <span className="ml-2 font-bold text-lg text-primary-100">
                          {credits}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">
                          Cost per image:
                        </span>
                        <span className="ml-2 font-bold text-lg text-primary-100">
                          {CREDITS_PER_IMAGE}
                        </span>
                      </div>
                    </div>

                    {isGenerating && status === "generating" ? (
                      <div className="mt-10 flex flex-col items-center">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-bg-300 border-t-primary-100" />
                          <p className="text-lg text-text-200">
                            Generating your dish image...
                          </p>
                        </div>
                        <div className="w-full max-w-2xl space-y-4">
                          <div className="h-8 bg-bg-200 rounded-lg animate-pulse" />
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <div className="h-64 bg-bg-200 rounded-lg animate-pulse" />
                              <div className="h-4 bg-bg-200 rounded animate-pulse" />
                              <div className="h-4 w-2/3 bg-bg-200 rounded animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label
                            htmlFor="prompt"
                            className="text-sm font-medium flex items-center"
                          >
                            <Sparkles className="mr-2 h-4 w-4 text-primary-100" />
                            Image Prompt
                          </label>
                          <div className="relative">
                            <textarea
                              id="prompt"
                              placeholder="Describe the image you want to generate... Be specific about style, colors, and composition."
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              className="w-full min-h-[120px] p-4 rounded-lg border border-bg-300 focus:ring-2 focus:ring-primary-100 focus:border-transparent outline-none transition-all resize-none"
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-text-200">
                              {prompt.length} characters
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleGenerateImage}
                          disabled={
                            isGenerating || !hasEnoughCreditsForGenerate || !prompt.trim()
                          }
                          className="w-full btn-primary py-6 text-lg"
                        >
                          {isGenerating ? (
                            <>
                              <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                              Generating Your Image...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="mr-2 h-5 w-5" />
                              Generate Image
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {!hasEnoughCreditsForGenerate && (
                      <div className="bg-bg-100 border border-bg-200 rounded-lg p-4 flex items-start">
                        <AlertCircle className="h-5 w-5 text-primary-100 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-text-100">
                            You don&apos;t have enough credits
                          </p>
                          <p className="text-sm text-text-200 mt-1">
                            Purchase more credits to generate images
                          </p>
                          <Link
                            href="/credits/purchase"
                            className="mt-3 inline-block"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center"
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Buy Credits
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* 显示生成的图片 */}
                    {generatedImage && (
                      <div className="mt-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Generated Image:</h3>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  // 显示下载中状态
                                  toast({
                                    title: "Downloading...",
                                    description: "Preparing your image for download",
                                  });

                                  // 获取图片数据
                                  const response = await fetch(generatedImage);
                                  const blob = await response.blob();
                                  
                                  // 创建一个临时的 Blob URL
                                  const blobUrl = URL.createObjectURL(blob);
                                  
                                  // 创建一个临时的a标签来下载图片
                                  const link = document.createElement('a');
                                  link.href = blobUrl;
                                  link.download = `generated-image-${Date.now()}.png`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  
                                  // 清理 Blob URL
                                  URL.revokeObjectURL(blobUrl);

                                  toast({
                                    title: "Success",
                                    description: "Image downloaded successfully",
                                    variant: "success",
                                  });
                                } catch (error) {
                                  console.error("Error downloading image:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to download image. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="flex items-center gap-2"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                              <span>Download</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setGeneratedImage(null);
                                setShowConfirmation(false);
                                handleGenerateImage();
                              }}
                              className="flex items-center gap-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span>Regenerate</span>
                            </Button>
                          </div>
                        </div>
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-bg-300 shadow-md">
                          <Image
                            src={generatedImage}
                            alt="Generated image"
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                            onError={(e) => {
                              console.error("Error loading generated image:", e);
                              e.currentTarget.onerror = null;
                              toast({
                                title: "Image load failed",
                                description: "Failed to load the generated image",
                                variant: "destructive",
                              });
                            }}
                            onLoad={() => {
                              setIsGenerating(false);
                              setShowConfirmation(true);
                            }}
                          />
                        </div>

                        {/* 确认对话框 */}
                        {showConfirmation && (
                          <div className="bg-bg-100 border border-bg-200 rounded-lg p-4 mt-4">
                            <div className="flex items-start">
                              <div className="h-8 w-8 rounded-full bg-primary-100/10 flex items-center justify-center mr-3 mt-0.5">
                                <Sparkles className="h-4 w-4 text-primary-100" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-100 mb-2">
                                  Your image has been generated successfully!
                                </p>
                                <p className="text-xs text-text-200 mb-3">
                                  You can generate another image or view all your generated images in the dashboard.
                                </p>
                                <div className="flex space-x-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateAnother}
                                    className="flex-1 flex items-center gap-1"
                                  >
                                    <Wand2 className="h-3 w-3" />
                                    <span>Generate Another</span>
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleViewAllImages}
                                    className="flex-1 flex items-center gap-1"
                                  >
                                    <ImageIcon className="h-3 w-3" />
                                    <span>View All Images</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="card overflow-hidden">
                  <CardHeader className="pb-2 border-b border-bg-200">
                    <CardTitle className="flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-accent-100" />
                      Tips for Better Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-primary-100" />
                        </div>
                        <span className="text-sm">
                          Be specific about what you want to see
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-primary-100" />
                        </div>
                        <span className="text-sm">
                          Include details about style, lighting, and composition
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-primary-100" />
                        </div>
                        <span className="text-sm">
                          Mention colors, textures, and mood
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-primary-100" />
                        </div>
                        <span className="text-sm">
                          Specify the type of image (photo, painting, 3D render)
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="card overflow-hidden">
                  <CardHeader className="pb-2 border-b border-bg-200">
                    <CardTitle className="flex items-center">
                      <Palette className="mr-2 h-5 w-5 text-accent-100" />
                      Example Prompts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div
                        className="p-3 bg-bg-100 rounded-lg text-sm cursor-pointer hover:bg-bg-200 transition-colors"
                        onClick={() =>
                          setPrompt(
                            "Italian Bacon Cream Pasta Italian spaghetti with egg cream sauce, Italian bacon and Parmesan cheese"
                          )
                        }
                      >
                        <span className="text-base font-semibold">Italian Bacon Cream Pasta</span>
                        <br />
                        Italian spaghetti with egg cream sauce, Italian bacon
                        and Parmesan cheese
                      </div>
                      <div
                        className="p-3 bg-bg-100 rounded-lg text-sm cursor-pointer hover:bg-bg-200 transition-colors"
                        onClick={() =>
                          setPrompt(
                            "Red Sauce Bacon Pasta Hollow pasta, tomato red sauce, Italian bacon, chili, Pecorino cheese"
                          )
                        }
                      >
                        <span className="text-base font-semibold">Red Sauce Bacon Pasta</span>
                        <br />
                        Hollow pasta, tomato red sauce, Italian bacon, chili,
                        Pecorino cheese
                      </div>
                      <div
                        className="p-3 bg-bg-100 rounded-lg text-sm cursor-pointer hover:bg-bg-200 transition-colors"
                        onClick={() =>
                          setPrompt(
                            "Wild Mushroom Cream Fettuccine Fresh egg pasta, mushroom cream sauce, crispy prosciutto, Parmesan cheese"
                          )
                        }
                      >
                        <span className="text-base font-semibold">
                          Wild Mushroom Cream Fettuccine
                        </span>
                        <br />
                        Fresh egg pasta, mushroom cream sauce, crispy
                        prosciutto, Parmesan cheese
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Card className="card overflow-hidden">
                  <CardHeader className="pb-2 border-b border-bg-200">
                    <CardTitle className="flex items-center">
                      <PhotoIcon className="mr-2 h-5 w-5 text-primary-100" />
                      Upload a Menu
                    </CardTitle>
                    <CardDescription>
                      Upload a menu image to generate images for each dish
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center justify-between bg-bg-100 p-3 rounded-lg">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-primary-100 mr-2" />
                        <span className="text-sm font-medium">
                          Your credits:
                        </span>
                        <span className="ml-2 font-bold text-lg text-primary-100">
                          {credits}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">
                          Cost per menu:
                        </span>
                        <span className="ml-2 font-bold text-lg text-primary-100">
                          {CREDITS_FOR_MENU}
                        </span>
                      </div>
                    </div>

                    {status === "initial" && (
                      <>
                        <Dropzone
                          accept={{
                            "image/*": [".jpg", ".jpeg", ".png"],
                          }}
                          multiple={false}
                          onDrop={(acceptedFiles) => {
                            if (acceptedFiles && acceptedFiles.length > 0) {
                              // 只设置文件，不立即上传
                              setSelectedFile(acceptedFiles[0]);
                              console.log(
                                "File selected:",
                                acceptedFiles[0].name
                              );
                            }
                          }}
                          disabled={!hasEnoughCredits}
                        >
                          {({
                            getRootProps,
                            getInputProps,
                            isDragActive,
                            open,
                          }) => (
                            <div
                              className={`mt-2 flex flex-col aspect-video items-center justify-center rounded-lg border-2 border-dashed ${
                                !hasEnoughCredits
                                  ? "border-bg-300 opacity-60 cursor-not-allowed"
                                  : isDragActive
                                  ? "border-primary-100"
                                  : "border-bg-300"
                              } p-6`}
                            >
                              <div
                                {...getRootProps({
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    if (hasEnoughCredits) {
                                      open();
                                    } else {
                                      toast({
                                        title: "Insufficient credits",
                                        description:
                                          "Please purchase more credits to generate images",
                                        variant: "destructive",
                                      });
                                    }
                                  },
                                })}
                                className="w-full h-full flex flex-col items-center justify-center"
                              >
                                <input {...getInputProps()} />
                                <PhotoIcon
                                  className="mx-auto h-12 w-12 text-bg-300"
                                  aria-hidden="true"
                                />
                                <div className="mt-4 text-sm leading-6 text-text-200 text-center">
                                  <p className="text-xl font-semibold text-text-100">
                                    Upload your menu
                                  </p>
                                  <p className="mt-1 font-normal text-text-200">
                                    or drag and drop an image here
                                  </p>
                                </div>

                                {selectedFile && (
                                  <div className="mt-4 p-3 bg-bg-100 rounded-lg w-full">
                                    <p className="text-sm font-medium text-text-100">
                                      Selected: {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-text-200">
                                      Size:{" "}
                                      {Math.round(selectedFile.size / 1024)} KB
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Dropzone>

                        {selectedFile && (
                          <Button
                            onClick={() => handleFileChange(selectedFile)}
                            disabled={!hasEnoughCredits || isUploading}
                            className="w-full mt-4 btn-primary"
                          >
                            {isUploading ? (
                              <>
                                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <PhotoIcon className="mr-2 h-5 w-5" />
                                Process Menu
                              </>
                            )}
                          </Button>
                        )}

                        <button
                          className={`mt-5 font-medium text-primary-100 text-md underline decoration-transparent hover:decoration-primary-200 decoration-2 underline-offset-4 transition ${
                            hasEnoughCredits
                              ? "hover:text-primary-200"
                              : "opacity-60 cursor-not-allowed"
                          }`}
                          onClick={(e) => {
                            if (!hasEnoughCredits) {
                              e.preventDefault();
                              toast({
                                title: "Insufficient credits",
                                description:
                                  "Please purchase more credits to generate images",
                                variant: "destructive",
                              });
                              return;
                            }
                            handleSampleImage();
                          }}
                        >
                          Need an example image? Try ours.
                        </button>
                      </>
                    )}

                    {!hasEnoughCredits && (
                      <div className="bg-bg-100 border border-bg-200 rounded-lg p-4 flex items-start">
                        <AlertCircle className="h-5 w-5 text-primary-100 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-text-100">
                            You don&apos;t have enough credits
                          </p>
                          <p className="text-sm text-text-200 mt-1">
                            Purchase more credits to generate images
                          </p>
                          <Link
                            href="/credits/purchase"
                            className="mt-3 inline-block"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center"
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Buy Credits
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="card overflow-hidden">
                  <CardHeader className="pb-2 border-b border-bg-200">
                    <CardTitle className="flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-accent-100" />
                      How Menu Upload Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-primary-100" />
                        </div>
                        <span className="text-sm">
                          Upload a clear photo of a menu
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-primary-100" />
                        </div>
                        <span className="text-sm">
                          Our AI extracts all dishes from the menu
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-primary-100" />
                        </div>
                        <span className="text-sm">
                          We generate an image for each dish
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-primary-100" />
                        </div>
                        <span className="text-sm">
                          Download all images or view them individually
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {menuUrl && activeTab === "upload" && status === "uploading" && (
        <div className="my-10 mx-auto flex flex-col items-center fade-in">
          <Image
            width={1024}
            height={768}
            src={menuUrl}
            alt="Menu"
            className="w-40 rounded-lg shadow-md"
            onError={(e) => {
              console.error("Error loading menu image:", e);
              e.currentTarget.onerror = null;
            }}
          />
        </div>
      )}

      {(status === "parsing" || status === "generating") && (
        <div className="mt-10 flex flex-col items-center fade-in">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-bg-300 border-t-primary-100" />
            <p className="text-lg text-text-200">
              {status === "parsing"
                ? "Creating your visual menu..."
                : "Generating your dish image..."}
            </p>
          </div>
          <div className="w-full max-w-2xl space-y-4">
            <div className="h-8 bg-bg-200 rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-32 bg-bg-200 rounded-lg animate-pulse" />
                  <div className="h-4 bg-bg-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-bg-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {parsedMenu.length > 0 && status === "created" && (
        <div className="mt-10 fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-4xl font-bold text-text-100">
              Menu – {parsedMenu.length} dishes detected
            </h2>
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading || !jsZipLoaded}
              className={`flex items-center gap-2 ${
                isDownloading || !jsZipLoaded
                  ? "bg-primary-200/70 cursor-not-allowed"
                  : "bg-primary-100 hover:bg-primary-200"
              } text-white px-4 py-2 rounded-lg transition-colors`}
              title={
                jsZipLoaded
                  ? "Download all images"
                  : "Loading download functionality..."
              }
            >
              {isDownloading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Downloading...</span>
                </>
              ) : !jsZipLoaded ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>Download all</span>
                </>
              )}
            </button>
          </div>

          {/* 添加重新生成提示 */}
          <div className="mb-4 p-4 bg-bg-100 border border-bg-200 rounded-lg">
            <div className="flex items-start">
              <RefreshCw className="h-5 w-5 text-primary-100 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-100">
                  Not satisfied with an image? You can regenerate individual
                  items!
                </p>
                <p className="text-xs text-text-200 mt-1">
                  Click the <RefreshCw className="h-3 w-3 inline-block mx-1" />{" "}
                  button on any image to regenerate it for {CREDITS_PER_IMAGE} credit.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-200" />
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-bg-100 border-bg-300 text-text-100 placeholder:text-text-200/70"
            />
          </div>
          <MenuGrid
            items={filteredMenu}
            onRegenerateItem={async (item, index) => {
              console.log("Regenerating item:", item.name, "at index:", index);

              // 确保用户有足够的积分
              if (credits < CREDITS_PER_IMAGE) {
                toast({
                  title: "Insufficient credits",
                  description:
                    `You need at least ${CREDITS_PER_IMAGE} credits to regenerate an image`,
                  variant: "destructive",
                });
                return;
              }

              try {
                console.log("Sending regeneration request for:", item.name);

                // 生成新图片
                const response = await fetch("/api/generateImage", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    description: `${item.name}, ${item.description}`,
                    singleItemRegeneration: true,
                  }),
                });

                if (!response.ok) {
                  throw new Error(
                    `Failed to regenerate image: ${response.statusText}`
                  );
                }

                const data = await response.json();
                console.log("Regeneration response:", data);

                // 更新菜单项的图片
                const updatedMenu = [...parsedMenu];
                const realIndex = parsedMenu.findIndex(
                  (menuItem) =>
                    menuItem.name === item.name &&
                    menuItem.description === item.description
                );

                console.log("Found item at index:", realIndex);

                if (realIndex !== -1 && data.image && data.image.b64_json) {
                  updatedMenu[realIndex].menuImage = data.image;
                  setParsedMenu(updatedMenu);

                  // 更新用户积分
                  updateCredits(credits - CREDITS_PER_IMAGE);

                  toast({
                    title: "Image regenerated",
                    description: "The image has been successfully regenerated",
                    variant: "success",
                  });

                  console.log("Successfully updated menu item with new image");
                } else {
                  throw new Error("Failed to update menu item with new image");
                }
              } catch (error) {
                console.error("Error regenerating image:", error);
                toast({
                  title: "Regeneration failed",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Please try again later",
                  variant: "destructive",
                });
                throw error; // 重新抛出错误，让MenuGrid组件知道操作失败
              }
            }}
          />
        </div>
      )}

      <div className="space-y-4 fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center">
          <Camera className="mr-2 h-5 w-5 text-accent-100" />
          <h2 className="text-2xl font-bold text-text-100">How It Works</h2>
        </div>

        <Card className="card border-dashed border-2 bg-bg-100">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary-100/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary-100" />
                </div>
                <h3 className="font-medium mb-2">
                  1. Write a Prompt or Upload Menu
                </h3>
                <p className="text-sm text-text-200">
                  Describe the image you want or upload a menu photo
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary-100/10 flex items-center justify-center mb-4">
                  <Wand2 className="h-6 w-6 text-primary-100" />
                </div>
                <h3 className="font-medium mb-2">2. Generate</h3>
                <p className="text-sm text-text-200">
                  Our AI creates images based on your input
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary-100/10 flex items-center justify-center mb-4">
                  <ImageIcon className="h-6 w-6 text-primary-100" />
                </div>
                <h3 className="font-medium mb-2">3. Download</h3>
                <p className="text-sm text-text-200">
                  View and download your generated images
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
