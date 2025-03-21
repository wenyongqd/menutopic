import { MenuItem } from "@/app/images/generate/types";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface MenuGridProps {
  items: MenuItem[];
  onRegenerateItem?: (item: MenuItem, index: number) => Promise<void>;
}

export function MenuGrid({ items, onRegenerateItem }: MenuGridProps) {
  // 跟踪图片加载状态
  const [imageStates, setImageStates] = useState<Record<string, "loading" | "loaded" | "error" | "regenerating">>({});
  const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null);

  // 获取占位图URL
  useEffect(() => {
    // 这里可以使用一个静态占位图URL
    setPlaceholderUrl("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0' /%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='%23999' text-anchor='middle'%3E图片不可用%3C/text%3E%3C/svg%3E");
    
    // 或者从API获取
    // fetch('/api/placeholder')
    //   .then(res => res.json())
    //   .then(data => {
    //     if (data.success) {
    //       setPlaceholderUrl(data.url);
    //     }
    //   })
    //   .catch(err => console.error("获取占位图失败:", err));
  }, []);

  // 处理图片加载错误
  const handleImageError = (itemName: string) => {
    setImageStates(prev => ({
      ...prev,
      [itemName]: "error"
    }));
  };

  // 处理图片加载成功
  const handleImageLoad = (itemName: string) => {
    setImageStates(prev => ({
      ...prev,
      [itemName]: "loaded"
    }));
  };

  // 处理图片下载
  const handleDownload = (item: MenuItem) => {
    if (!item.menuImage || !item.menuImage.b64_json) {
      alert("图片不可用，无法下载");
      return;
    }

    // 创建一个链接元素
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${item.menuImage.b64_json}`;
    link.download = `${item.name.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 处理重新生成图片
  const handleRegenerate = async (item: MenuItem, index: number) => {
    if (!onRegenerateItem) return;
    
    // 设置为重新生成状态
    setImageStates(prev => ({
      ...prev,
      [item.name]: "regenerating"
    }));
    
    try {
      await onRegenerateItem(item, index);
      // 成功后会自动触发图片加载事件，状态会更新为loaded
    } catch (error) {
      console.error(`Failed to regenerate image for ${item.name}:`, error);
      // 如果失败，设置为错误状态
      setImageStates(prev => ({
        ...prev,
        [item.name]: "error"
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item, index) => (
        <div
          key={item.name}
          className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
        >
          <div className="relative h-48 bg-gray-100 group">
            {item.menuImage && item.menuImage.b64_json ? (
              <>
                <Image
                  src={`data:image/png;base64,${item.menuImage.b64_json}`}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                  onError={() => handleImageError(item.name)}
                  onLoad={() => handleImageLoad(item.name)}
                  className={imageStates[item.name] === "error" ? "hidden" : ""}
                />
                
                {/* 操作按钮组 - 修改为始终可见，不再依赖hover */}
                <div className="absolute bottom-2 right-2 flex space-x-2 transition-opacity duration-200">
                  {/* 重新生成按钮 */}
                  {onRegenerateItem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerate(item, index);
                      }}
                      disabled={imageStates[item.name] === "regenerating"}
                      className="bg-white bg-opacity-90 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-colors"
                      title="重新生成图片"
                    >
                      {imageStates[item.name] === "regenerating" ? (
                        <ArrowPathIcon className="h-5 w-5 text-gray-700 animate-spin" />
                      ) : (
                        <ArrowPathIcon className="h-5 w-5 text-gray-700" />
                      )}
                    </button>
                  )}
                  
                  {/* 下载按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item);
                    }}
                    className="bg-white bg-opacity-90 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-colors"
                    title="下载图片"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              </>
            ) : null}

            {/* 显示占位图或错误状态 */}
            {(!item.menuImage || !item.menuImage.b64_json || imageStates[item.name] === "error") && (
              <>
                {placeholderUrl ? (
                  <Image
                    src={placeholderUrl}
                    alt={`${item.name} 占位图`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-xs text-gray-500 text-center">
                      {item.name} 图片不可用
                    </p>
                  </div>
                )}
              </>
            )}
            
            {/* 重新生成中的加载状态 */}
            {imageStates[item.name] === "regenerating" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <ArrowPathIcon className="w-12 h-12 text-white animate-spin mb-2" />
                <p className="text-xs text-white text-center">
                  Regenerating...
                </p>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                <p className="text-gray-600 mb-2">{item.price}</p>
              </div>
              {/* 小屏幕下的操作按钮 */}
              {item.menuImage && item.menuImage.b64_json && (
                <div className="sm:hidden flex space-x-1">
                  {/* 小屏幕下的重新生成按钮 */}
                  {onRegenerateItem && (
                    <button
                      onClick={() => handleRegenerate(item, index)}
                      disabled={imageStates[item.name] === "regenerating"}
                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      title="重新生成图片"
                    >
                      {imageStates[item.name] === "regenerating" ? (
                        <ArrowPathIcon className="h-4 w-4 text-gray-700 animate-spin" />
                      ) : (
                        <ArrowPathIcon className="h-4 w-4 text-gray-700" />
                      )}
                    </button>
                  )}
                  
                  {/* 小屏幕下的下载按钮 */}
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    title="下载图片"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
