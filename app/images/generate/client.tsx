"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/toast";
import { getUserCredits } from "@/lib/supabase";
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
import Dropzone from "react-dropzone";
import Image from "next/image";
import * as Bytescale from "@bytescale/sdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuGrid } from "@/components/menu-grid";
import { PhotoIcon } from "@heroicons/react/20/solid";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import {
  Image as ImageIcon,
  Sparkles,
  CreditCard,
  Wand2,
  AlertCircle,
  Lightbulb,
  Palette,
  Camera,
  Search as MagnifyingGlassIcon,
  RefreshCw,
} from "lucide-react";
import { GradientBackground } from "@/components/gradient-background";
import { motion } from "framer-motion";
import { MenuItem } from "./types";

interface GenerateClientProps {
  user: User;
  initialCredits: number;
}

export function GenerateClient({ user, initialCredits }: GenerateClientProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userCredits, setUserCredits] = useState(initialCredits);
  const [isLoading] = useState(false);
  const { toast } = useToast();

  // 菜单上传功能的状态
  const [activeTab, setActiveTab] = useState("prompt");
  const [status, setStatus] = useState<
    "initial" | "uploading" | "parsing" | "created" | "generating"
  >("initial");
  const [parsedMenu, setParsedMenu] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // 初始化 Bytescale 上传管理器
  const uploadManager = new Bytescale.UploadManager({
    apiKey: process.env.NEXT_PUBLIC_BYTESCALE_API_KEY || "free",
  });

  const CREDITS_PER_IMAGE = 5; // Credits required per image

  // 从服务器获取的初始credit已经可用，无需再次获取
  useEffect(() => {
    console.log("GenerateClient - Initialized with credits:", initialCredits);
  }, [initialCredits]);

  // 预加载JSZip库
  useEffect(() => {
    const preloadJSZip = async () => {
      try {
        await import("jszip");
      } catch (error) {
        console.error("Failed to preload JSZip:", error);
      }
    };

    preloadJSZip();
  }, []);

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

    if (userCredits < CREDITS_PER_IMAGE) {
      toast({
        title: "Insufficient credits",
        description: "Please purchase more credits to generate images",
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
    setStatus("uploading");

    try {
      console.log("Starting upload to Bytescale...");
      // 使用Bytescale上传文件
      const { fileUrl } = await uploadManager.upload({
        data: file,
        mime: file.type,
        originalFileName: file.name,
      });

      console.log("Upload successful, file URL:", fileUrl);
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

        // Try to fetch the image from the database
        try {
          // Fetch updated credits from the database
          try {
            if (user) {
              const updatedCredits = await getUserCredits();
              setUserCredits(updatedCredits ?? 0);
            } else {
              console.error(
                "User not found when trying to fetch updated credits"
              );
              // Still update the local state as a fallback
              setUserCredits((prev) => prev - CREDITS_PER_IMAGE);
            }
          } catch (creditFetchError) {
            console.error("Error fetching updated credits:", creditFetchError);
            // Still update the local state as a fallback
            setUserCredits((prev) => prev - CREDITS_PER_IMAGE);
          }
        } catch (creditFetchError) {
          console.error("Error fetching updated credits:", creditFetchError);
          // Still update the local state as a fallback
          setUserCredits((prev) => prev - CREDITS_PER_IMAGE);
        }

        // 更新状态和菜单数据
        setStatus("created");
        setParsedMenu(json.menu);

        toast({
          title: "Menu processed successfully",
          description: `${CREDITS_PER_IMAGE} credits have been deducted from your account`,
          variant: "success",
        });
      } catch (parseError: unknown) {
        console.error("Parse menu error:", parseError);
        setStatus("initial");
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
      console.error("File upload error:", uploadError);
      setStatus("initial");
      toast({
        title: "Upload failed",
        description:
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
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

    if (userCredits < CREDITS_PER_IMAGE) {
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate image");
      }

      let data;
      try {
        data = await response.json();
        console.log("Image generation API response data:", data);
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        throw new Error("Invalid response format from server");
      }

      // Try to fetch the image from the database
      try {
        // Fetch updated credits from the database
        try {
          if (user) {
            const updatedCredits = await getUserCredits();
            setUserCredits(updatedCredits ?? 0);
          } else {
            console.error(
              "User not found when trying to fetch updated credits"
            );
            // Still update the local state as a fallback
            setUserCredits((prev) => prev - CREDITS_PER_IMAGE);
          }
        } catch (creditFetchError) {
          console.error("Error fetching updated credits:", creditFetchError);
          // Still update the local state as a fallback
          setUserCredits((prev) => prev - CREDITS_PER_IMAGE);
        }
      } catch (creditFetchError) {
        console.error("Error fetching updated credits:", creditFetchError);
        // Still update the local state as a fallback
        setUserCredits((prev) => prev - CREDITS_PER_IMAGE);
      }

      // 处理图像 URL 或 base64 数据
      let imageUrl;
      if (data.image?.url) {
        // API 返回的是 URL
        imageUrl = data.image.url;
      } else if (data.image?.b64_json) {
        // API 返回的是 base64 数据
        imageUrl = `data:image/jpeg;base64,${data.image.b64_json}`;
      } else if (data.imageUrl) {
        // 直接返回的是 URL
        imageUrl = data.imageUrl;
      } else if (data.image) {
        // 可能是其他格式
        imageUrl = data.image;
      }

      if (!imageUrl) {
        throw new Error("No image data in response");
      }

      setGeneratedImage(imageUrl);
      setIsGenerating(false);
    } catch (error: unknown) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  // 渲染主页面
  const hasEnoughCredits = userCredits >= CREDITS_PER_IMAGE;
  const filteredMenu = parsedMenu.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-10">
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify({
              user: { id: user.id, email: user.email },
              credits: userCredits,
              isLoading
            }, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex flex-col items-center justify-between relative overflow-hidden py-12 px-4 rounded-2xl">
        <GradientBackground className="absolute inset-0 rounded-2xl opacity-70" />
        <div className="z-10 space-y-6 max-w-2xl w-full text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-primary-100 to-primary-300 bg-clip-text text-transparent">
            Generate food images with AI
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-text-200 max-w-lg mx-auto"
          >
            Create beautiful images of food for your menu or website in seconds
          </motion.p>
        </div>
      </div>

      <Tabs defaultValue="prompt" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="prompt" className="flex gap-2">
            <Wand2 className="h-4 w-4" />
            <span>Generate with a prompt</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>Upload a menu</span>
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
                        {userCredits}
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

                  <div className="space-y-2">
                    <label htmlFor="prompt" className="text-sm font-medium">
                      Describe what you want to generate
                    </label>
                    <Input
                      id="prompt"
                      placeholder="e.g. A delicious hamburger with fries and a milkshake"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateImage}
                    disabled={isGenerating || !hasEnoughCredits || !prompt.trim()}
                    className="w-full bg-primary-100 hover:bg-primary-200"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Image
                      </>
                    )}
                  </Button>

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

            <div>
              <Card className="card overflow-hidden">
                <CardHeader className="pb-2 border-b border-bg-200">
                  <CardTitle className="flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-primary-100" />
                    Tips for Great Results
                  </CardTitle>
                  <CardDescription>
                    How to get the best images
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <Palette className="h-4 w-4 text-primary-100 mr-2" />
                      Be specific and detailed
                    </h4>
                    <p className="text-sm text-text-200">
                      Include the type of food, presentation style, and setting
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <Camera className="h-4 w-4 text-primary-100 mr-2" />
                      Mention the photography style
                    </h4>
                    <p className="text-sm text-text-200">
                      Terms like &quot;professional food photography&quot; help
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const examples = [
                          "A professional food photography of a gourmet hamburger with melted cheese, lettuce, and tomato on a wooden board",
                          "A colorful acai bowl with fresh berries, banana slices, and granola in a ceramic bowl, bright natural lighting",
                          "A perfectly seared salmon fillet with asparagus and lemon slices on a white plate, restaurant presentation",
                        ];
                        setPrompt(
                          examples[Math.floor(Math.random() * examples.length)]
                        );
                      }}
                      className="w-full text-primary-100 hover:text-primary-200 hover:bg-transparent"
                    >
                      <span className="mr-2">💡</span> Use an example prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {generatedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Generated Image</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Download the image
                      const link = document.createElement("a");
                      link.href = generatedImage;
                      link.download = `generated-${Date.now()}.jpg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGeneratedImage(null)}
                    className="flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                </div>
              </div>

              <Card className="card overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={generatedImage}
                    alt="Generated food image"
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
                <CardContent className="py-4">
                  <p className="text-sm text-text-200">{prompt}</p>
                </CardContent>
              </Card>
            </div>
          )}
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
                        {userCredits}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">
                        Cost per menu:
                      </span>
                      <span className="ml-2 font-bold text-lg text-primary-100">
                        {CREDITS_PER_IMAGE}
                      </span>
                    </div>
                  </div>

                  <Dropzone
                    onDrop={(acceptedFiles) => {
                      if (acceptedFiles.length > 0) {
                        handleFileChange(acceptedFiles[0]);
                      }
                    }}
                    accept={{
                      "image/jpeg": [],
                      "image/png": [],
                      "image/webp": [],
                      "image/heic": [],
                    }}
                    maxFiles={1}
                    disabled={isUploading || status !== "initial" || !hasEnoughCredits}
                  >
                    {({ getRootProps, getInputProps, isDragActive }) => (
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isDragActive
                            ? "border-primary-100 bg-primary-100/5"
                            : "border-bg-300 hover:border-primary-100 hover:bg-bg-100"
                        } ${
                          isUploading || status !== "initial" || !hasEnoughCredits
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center">
                          <PhotoIcon className="h-12 w-12 text-text-200 mb-3" />
                          {isUploading ? (
                            <p className="text-sm text-text-200 flex items-center">
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </p>
                          ) : (
                            <>
                              <p className="text-sm font-medium">
                                Drag & drop a menu image, or{" "}
                                <span className="text-primary-100">browse</span>
                              </p>
                              <p className="text-xs text-text-200 mt-1">
                                Supports JPG, PNG, WEBP (max 5MB)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </Dropzone>

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

            <div>
              <Card className="card">
                <CardHeader className="pb-2 border-b border-bg-200">
                  <CardTitle className="flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-primary-100" />
                    How It Works
                  </CardTitle>
                  <CardDescription>
                    Upload a menu and get dish images
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2">
                        <span className="text-xs text-primary-100">1</span>
                      </div>
                      Upload a menu image
                    </h4>
                    <p className="text-sm text-text-200">
                      We support most image formats including JPG and PNG
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2">
                        <span className="text-xs text-primary-100">2</span>
                      </div>
                      AI extracts menu items
                    </h4>
                    <p className="text-sm text-text-200">
                      Our AI identifies dish names, descriptions and prices
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <div className="h-5 w-5 rounded-full bg-primary-100/10 flex items-center justify-center mr-2">
                        <span className="text-xs text-primary-100">3</span>
                      </div>
                      Generate images for each dish
                    </h4>
                    <p className="text-sm text-text-200">
                      High-quality images are created based on each menu item
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {status === "created" && parsedMenu.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h3 className="text-xl font-bold flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary-100" />
                  Extracted Menu Items
                </h3>
                <div className="flex gap-2 items-center">
                  <div className="relative w-full md:w-64">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-200" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {filteredMenu.length > 0 ? (
                <MenuGrid 
                  items={filteredMenu} 
                />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-text-200">No menu items found matching your search.</p>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 