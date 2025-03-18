import * as Bytescale from "@bytescale/sdk";

// 标记为动态路由
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uploadManager = new Bytescale.UploadManager({
      apiKey: process.env.NEXT_PUBLIC_BYTESCALE_API_KEY || "free"
    });

    // 创建一个简单的SVG占位图
    const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f0f0f0" />
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#999" text-anchor="middle">图片不可用</text>
    </svg>
    `;

    // 将SVG转换为Blob
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });

    // 上传到Bytescale
    const { fileUrl } = await uploadManager.upload({
      data: blob,
      mime: 'image/svg+xml',
      originalFileName: 'placeholder.svg',
    });

    return Response.json({ 
      success: true, 
      message: "占位图已生成",
      url: fileUrl
    });
  } catch (error: Error | unknown) {
    console.error("生成占位图失败:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 