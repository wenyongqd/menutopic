"use client";

// import { useState, useEffect } from "react";
// import Dropzone from "react-dropzone";
// import { PhotoIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
// import { ArrowDownTrayIcon, SparklesIcon } from "@heroicons/react/24/outline";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { MenuGrid } from "@/components/menu-grid";
// import Image from "next/image";
// import { italianMenuUrl, italianParsedMenu } from "@/lib/constants";
// import * as Bytescale from "@bytescale/sdk";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { AnimatedTitle } from "@/components/animated-title";
// import { GradientBackground } from "@/components/gradient-background";
// import { motion } from "framer-motion";

// export interface MenuItem {
//   name: string;
//   price: string;
//   description: string;
//   menuImage: {
//     b64_json: string;
//   };
// }

// export default function Home() {
//   const uploadManager = new Bytescale.UploadManager({
//     apiKey: process.env.NEXT_PUBLIC_BYTESCALE_API_KEY || "free" // 使用环境变量中的API密钥
//   });
//   const [menuUrl, setMenuUrl] = useState<string | undefined>(undefined);
//   const [status, setStatus] = useState<
//     "initial" | "uploading" | "parsing" | "created" | "generating"
//   >("initial");
//   const [parsedMenu, setParsedMenu] = useState<MenuItem[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [dishDescription, setDishDescription] = useState("");
//   const [activeTab, setActiveTab] = useState("upload");
//   const [jsZipLoaded, setJsZipLoaded] = useState<boolean>(false);

//   // 预加载JSZip库
//   useEffect(() => {
//     const preloadJSZip = async () => {
//       try {
//         await import('jszip');
//         setJsZipLoaded(true);
//       } catch (error) {
//         console.error('Failed to preload JSZip:', error);
//       }
//     };
    
//     preloadJSZip();
//   }, []);

//   const handleFileChange = async (file: File) => {
//     const objectUrl = URL.createObjectURL(file);
//     setStatus("uploading");
//     setMenuUrl(objectUrl);
    
//     try {
//       // 使用Bytescale上传文件
//       const { fileUrl } = await uploadManager.upload({
//         data: file,
//         mime: file.type,
//         originalFileName: file.name,
//       });
      
//       setMenuUrl(fileUrl);
//       setStatus("parsing");

//       try {
//         const res = await fetch("/api/parseMenu", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             menuUrl: fileUrl,
//           }),
//         });
        
//         if (!res.ok) {
//           throw new Error(`Server responded with status: ${res.status}`);
//         }
        
//         const contentType = res.headers.get("content-type");
//         if (!contentType || !contentType.includes("application/json")) {
//           throw new Error(`Expected JSON response but got ${contentType}`);
//         }
        
//         const json = await res.json();
//         console.log({ json });

//         setStatus("created");
//         setParsedMenu(json.menu);
//       } catch (parseError: unknown) {
//         console.error("Parse menu error:", parseError);
//         setStatus("initial");
//         alert(`Failed to parse menu: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
//       }
//     } catch (uploadError: unknown) {
//       console.error("Upload error:", uploadError);
//       setStatus("initial");
//       alert(`Failed to upload image: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
//     }
//   };

//   const handleSampleImage = async () => {
//     setStatus("parsing");
//     setMenuUrl(italianMenuUrl);
//     await new Promise((resolve) => setTimeout(resolve, 3000));

//     setStatus("created");
//     setParsedMenu(italianParsedMenu);
//   };

//   const handleGenerateSingleImage = async () => {
//     if (!dishDescription.trim()) {
//       alert("Please enter a dish description");
//       return;
//     }

//     setStatus("generating");
    
//     try {
//       const res = await fetch("/api/generateImage", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           description: dishDescription,
//         }),
//       });
      
//       if (!res.ok) {
//         throw new Error(`Server responded with status: ${res.status}`);
//       }
      
//       const json = await res.json();
//       console.log({ json });

//       // Add the new item to the menu
//       setParsedMenu(prev => [
//         {
//           name: json.name,
//           price: json.price,
//           description: json.description,
//           menuImage: json.image
//         },
//         ...prev
//       ]);
      
//       setStatus("created");
//       setDishDescription("");
//     } catch (error: unknown) {
//       console.error("Generate image error:", error);
//       setStatus("initial");
//       alert(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   };

//   const handleDownloadAll = () => {
//     if (!parsedMenu.length || isDownloading) return;

//     setIsDownloading(true);

//     // 预先导入JSZip库
//     import('jszip')
//       .then(async ({ default: JSZip }) => {
//         try {
//           const zip = new JSZip();
          
//           // 添加所有有效的图片到zip
//           for (const item of parsedMenu) {
//             if (item.menuImage && item.menuImage.b64_json) {
//               try {
//                 // 将base64转换为二进制
//                 const binary = atob(item.menuImage.b64_json);
//                 const array = new Uint8Array(binary.length);
//                 for (let i = 0; i < binary.length; i++) {
//                   array[i] = binary.charCodeAt(i);
//                 }
                
//                 // 添加到zip
//                 const fileName = `${item.name.replace(/\s+/g, "_")}.png`;
//                 zip.file(fileName, array);
//               } catch (itemError) {
//                 console.error(`Error processing item ${item.name}:`, itemError);
//                 // 继续处理其他项目
//               }
//             }
//           }
          
//           // 生成并下载zip
//           const content = await zip.generateAsync({ type: 'blob' });
//           const link = document.createElement('a');
//           link.href = URL.createObjectURL(content);
//           link.download = 'menu_images.zip';
//           document.body.appendChild(link);
//           link.click();
//           document.body.removeChild(link);
//         } catch (zipError) {
//           console.error('Error creating zip file:', zipError);
//           alert('创建压缩文件时出错，请稍后再试');
//         } finally {
//           setIsDownloading(false);
//         }
//       })
//       .catch(err => {
//         console.error('Failed to load JSZip:', err);
//         alert('无法加载压缩库，请稍后再试');
//         setIsDownloading(false);
//       });
//   };

//   const filteredMenu = parsedMenu.filter((item) =>
//     item.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="container mx-auto px-4 md:px-6 max-w-7xl py-8 bg-bg-100">
//       <div className="flex flex-col items-center justify-between relative overflow-hidden py-12 px-4 rounded-2xl">
//         <GradientBackground className="absolute inset-0 rounded-2xl opacity-70" />
        
//         {/* 装饰元素 */}
//         <motion.div 
//           className="absolute top-0 right-0 w-64 h-64 opacity-20"
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 0.2, y: 0 }}
//           transition={{ duration: 1 }}
//         >
//           <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
//             <path fill="#FF0066" d="M47.5,-57.2C59.9,-46.1,67.5,-29.7,69.9,-12.8C72.3,4.1,69.5,21.5,60.5,34.8C51.5,48.1,36.3,57.4,19.3,64.3C2.3,71.2,-16.5,75.8,-32.4,70.1C-48.2,64.3,-61.1,48.3,-68.3,30.1C-75.5,11.9,-77,-8.5,-70.8,-26.4C-64.7,-44.3,-50.9,-59.7,-35.1,-69.4C-19.3,-79.1,-1.4,-83.1,14.2,-78.5C29.8,-73.9,35.1,-68.3,47.5,-57.2Z" transform="translate(100 100)" />
//           </svg>
//         </motion.div>
        
//         <motion.div 
//           className="absolute bottom-0 left-0 w-72 h-72 opacity-10"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 0.1, y: 0 }}
//           transition={{ duration: 1, delay: 0.3 }}
//         >
//           <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
//             <path fill="#00DDFF" d="M42.8,-62.2C54.9,-54.3,63.6,-40.9,69.9,-26.2C76.2,-11.5,80.1,4.6,76.3,19.1C72.6,33.6,61.2,46.6,47.8,56.5C34.3,66.4,18.8,73.2,2.2,71.1C-14.4,69,-32.1,58,-44.1,44.5C-56.1,31,-62.5,15,-65.2,-2.7C-67.9,-20.4,-67,-39.8,-57.3,-50.8C-47.6,-61.8,-29.1,-64.4,-12.3,-65.5C4.5,-66.6,30.7,-70.1,42.8,-62.2Z" transform="translate(100 100)" />
//           </svg>
//         </motion.div>
        
//         <div className="relative z-10 w-full">
//           <motion.p 
//             className="mb-2 text-text-200 text-center"
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             Powered by{" "}
//             <a
//               href="https://togetherai.link/"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="hover:text-primary-100 transition font-bold"
//             >
//               Together AI
//             </a>
//             !
//           </motion.p>
          
//           <AnimatedTitle
//             title="Visualize your menu with AI"
//             titleClassName="text-4xl md:text-6xl font-bold text-text-100 mb-6"
//             subtitle="Take a picture of your menu and get pictures of each dish so you can better decide what to order, or generate individual dish images from descriptions."
//             subtitleClassName="text-lg text-text-200 max-w-3xl mx-auto text-balance"
//           />
          
//         </div>
//       </div>

//       <div className="max-w-2xl mx-auto">
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//           <TabsList variant="pills" className="grid w-full grid-cols-2 mb-6">
//             <TabsTrigger variant="pills" value="upload" className="flex items-center gap-2">
//               <PhotoIcon className="h-4 w-4" />
//               <span>Upload Menu</span>
//             </TabsTrigger>
//             <TabsTrigger variant="pills" value="generate" className="flex items-center gap-2">
//               <SparklesIcon className="h-4 w-4" />
//               <span>Generate Single Dish</span>
//             </TabsTrigger>
//           </TabsList>
          
//           <TabsContent value="upload" className="space-y-4">
//             {status === "initial" && (
//               <>
//                 <Dropzone
//                   accept={{
//                     "image/*": [".jpg", ".jpeg", ".png"],
//                   }}
//                   multiple={false}
//                   onDrop={(acceptedFiles) => handleFileChange(acceptedFiles[0])}
//                 >
//                   {({ getRootProps, getInputProps, isDragAccept }) => (
//                     <div
//                       className={`mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed ${
//                         isDragAccept ? "border-primary-100" : "border-bg-300"
//                       }`}
//                       {...getRootProps()}
//                     >
//                       <input {...getInputProps()} />
//                       <div className="text-center">
//                         <PhotoIcon
//                           className="mx-auto h-12 w-12 text-bg-300"
//                           aria-hidden="true"
//                         />
//                         <div className="mt-4 flex text-sm leading-6 text-text-200">
//                           <label
//                             htmlFor="file-upload"
//                             className="relative rounded-md bg-bg-100 font-semibold text-text-100 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-100 focus-within:ring-offset-2 hover:text-text-200"
//                           >
//                             <p className="text-xl">Upload your menu</p>
//                             <p className="mt-1 font-normal text-text-200">
//                               or take a picture
//                             </p>
//                           </label>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </Dropzone>
                
//                 <button
//                   className="mt-5 font-medium text-primary-100 text-md underline decoration-transparent hover:decoration-primary-200 decoration-2 underline-offset-4 transition hover:text-primary-200"
//                   onClick={handleSampleImage}
//                 >
//                   Need an example image? Try ours.
//                 </button>
//               </>
//             )}
//           </TabsContent>
          
//           <TabsContent value="generate" className="space-y-4">
//             <div className="space-y-4">
//               <div className="flex flex-col space-y-2">
//                 <label htmlFor="dish-description" className="text-text-100 font-medium">
//                   Dish Description
//                 </label>
//                 <Input
//                   id="dish-description"
//                   placeholder="E.g., Spaghetti Carbonara with crispy bacon and parmesan"
//                   value={dishDescription}
//                   onChange={(e) => setDishDescription(e.target.value)}
//                   className="bg-bg-100 border-bg-300 text-text-100"
//                 />
//               </div>
//               <Button 
//                 onClick={handleGenerateSingleImage}
//                 disabled={status === "generating" || !dishDescription.trim()}
//                 className="w-full flex items-center justify-center gap-2"
//               >
//                 {status === "generating" ? (
//                   <>
//                     <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Generating...</span>
//                   </>
//                 ) : (
//                   <>
//                     <SparklesIcon className="h-5 w-5" />
//                     <span>Generate Dish Image</span>
//                   </>
//                 )}
//               </Button>
//             </div>
//           </TabsContent>
//         </Tabs>

//         {menuUrl && activeTab === "upload" && (
//           <div className="my-10 mx-auto flex flex-col items-center">
//             <Image
//               width={1024}
//               height={768}
//               src={menuUrl}
//               alt="Menu"
//               className="w-40 rounded-lg shadow-md"
//               onError={(e) => {
//                 console.error("Error loading menu image:", e);
//                 // 防止无限循环错误
//                 e.currentTarget.onerror = null;
//                 // 可以设置一个默认图片
//                 // e.currentTarget.src = '/placeholder.png';
//               }}
//             />
//           </div>
//         )}

//         {(status === "parsing" || status === "generating") && (
//           <div className="mt-10 flex flex-col items-center">
//             <div className="flex items-center space-x-4 mb-6">
//               <div className="h-8 w-8 animate-spin rounded-full border-4 border-bg-300 border-t-primary-100" />
//               <p className="text-lg text-text-200">
//                 {status === "parsing" ? "Creating your visual menu..." : "Generating your dish image..."}
//               </p>
//             </div>
//             <div className="w-full max-w-2xl space-y-4">
//               <div className="h-8 bg-bg-200 rounded-lg animate-pulse" />
//               <div className="grid grid-cols-3 gap-4">
//                 {[...Array(6)].map((_, i) => (
//                   <div key={i} className="space-y-2">
//                     <div className="h-32 bg-bg-200 rounded-lg animate-pulse" />
//                     <div className="h-4 bg-bg-200 rounded animate-pulse" />
//                     <div className="h-4 w-2/3 bg-bg-200 rounded animate-pulse" />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//       {parsedMenu.length > 0 && (
//         <div className="mt-10">
//           <div className="flex justify-between items-center mb-5">
//             <h2 className="text-4xl font-bold text-text-100">
//               Menu – {parsedMenu.length} dishes detected
//             </h2>
//             <button
//               onClick={handleDownloadAll}
//               disabled={isDownloading || !jsZipLoaded}
//               className={`flex items-center gap-2 ${
//                 isDownloading || !jsZipLoaded
//                   ? 'bg-primary-200/70 cursor-not-allowed' 
//                   : 'bg-primary-100 hover:bg-primary-200'
//               } text-white px-4 py-2 rounded-lg transition-colors`}
//               title={jsZipLoaded ? "下载所有图片" : "正在加载下载功能..."}
//             >
//               {isDownloading ? (
//                 <>
//                   <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   <span>下载中...</span>
//                 </>
//               ) : !jsZipLoaded ? (
//                 <>
//                   <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   <span>加载中...</span>
//                 </>
//               ) : (
//                 <>
//                   <ArrowDownTrayIcon className="h-5 w-5" />
//                   <span>Download all</span>
//                 </>
//               )}
//             </button>
//           </div>
//           <div className="relative mb-6">
//             <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-200" />
//             <Input
//               type="text"
//               placeholder="Search menu items..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 bg-bg-100 border-bg-300 text-text-100 placeholder:text-text-200/70"
//             />
//           </div>
//           <MenuGrid items={filteredMenu} />
//         </div>
//       )}
//     </div>
//   );
// }
import LandingPage from "@/app/landing";
export default function Page() {
  return <LandingPage />;
} 