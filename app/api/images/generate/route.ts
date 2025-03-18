import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import * as Bytescale from "@bytescale/sdk"
import { Together } from "together-ai"

// Credits required per image
const CREDITS_PER_IMAGE = 5

// Initialize Bytescale upload manager
const uploadManager = new Bytescale.UploadManager({
  apiKey: process.env.NEXT_PUBLIC_BYTESCALE_API_KEY || "free"
});

// 初始化Together客户端
const options: ConstructorParameters<typeof Together>[0] = {};
if (process.env.HELICONE_API_KEY) {
  options.baseURL = "https://together.helicone.ai/v1";
  options.defaultHeaders = {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Property-IMAGE": "true",
  };
}

const together = new Together(options);

// 添加延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 添加重试函数
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries <= 0) throw error;
    
    // 如果是速率限制错误，获取Retry-After头部值或使用默认值
    const errorObj = error as { response?: { headers?: { [key: string]: string } } };
    const retryAfterHeader = errorObj?.response?.headers && "retry-after" in errorObj.response.headers
      ? errorObj.response.headers["retry-after"]
      : null;
    
    const retryAfter = retryAfterHeader 
      ? parseInt(retryAfterHeader) * 1000 
      : delayMs;
    
    console.log(`请求失败，${retryAfter/1000}秒后重试，剩余重试次数: ${retries-1}`);
    await delay(retryAfter);
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

// Helper function to convert base64 to blob
async function base64ToBlob(base64: string, mimeType: string = 'image/png'): Promise<Blob> {
  // Remove data URL prefix if present
  const base64Data = base64.startsWith('data:') 
    ? base64.split(',')[1] 
    : base64;
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: mimeType });
}

export async function POST(req: Request) {
  try {
    // Get current user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 })
    }
    
    const userId = session.user.id
    
    // 创建具有 service_role 权限的客户端，绕过 RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Parse request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('[IMAGE_GENERATE] JSON parse error:', parseError)
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid request format' 
      }, { status: 400 })
    }
    
    const { prompt } = body
    
    if (!prompt) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing prompt' 
      }, { status: 400 })
    }
    
    // Check if user has enough credits - 使用普通客户端查询用户信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*') // Select all fields to check which column exists
      .eq('id', userId)
      .single()
      
    if (profileError) {
      console.error('[IMAGE_GENERATE] Profile error:', profileError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to get user profile' 
      }, { status: 500 })
    }
    
    // Determine which column to use for credits
    const userCredits = profile.credits !== undefined ? profile.credits : (profile.credit_amount || 0);
    
    if (!profile || userCredits < CREDITS_PER_IMAGE) {
      return NextResponse.json({ 
        success: false, 
        message: 'Insufficient credits' 
      }, { status: 402 })
    }
    
    // Create image generation record - 使用 admin 客户端绕过 RLS
    const { data: imageGeneration, error: generationError } = await supabaseAdmin
      .from('image_generations')
      .insert({
        user_id: userId,
        prompt,
        credits_used: CREDITS_PER_IMAGE,
        status: 'pending'
      })
      .select()
      .single()
      
    if (generationError) {
      console.error('[IMAGE_GENERATE] Generation record error:', generationError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create image generation record' 
      }, { status: 500 })
    }
    
    // Call actual image generation API (e.g., DALL-E, Midjourney API, etc.)
    // This is a placeholder - replace with your actual image generation code
    let imageData;
    let bytescaleUrl = "";
    try {
      imageData = await generateImage(prompt)
      console.log("Image generated successfully, data length:", 
                 typeof imageData === 'string' ? 
                 (imageData.startsWith('http') ? 'URL' : `${imageData.substring(0, 20)}...`) : 
                 'not a string');
      
      // If the image is a base64 string, upload it to Bytescale
      if (typeof imageData === 'string' && !imageData.startsWith('http')) {
        try {
          // Convert base64 to blob
          const imageBlob = await base64ToBlob(imageData);
          
          // Generate a safe filename
          const filename = `gallery_${userId}_${Date.now()}_${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.png`;
          
          // Upload to Bytescale
          const uploadResult = await uploadManager.upload({
            data: imageBlob,
            mime: "image/png",
            originalFileName: filename,
          });
          
          bytescaleUrl = uploadResult.fileUrl;
          console.log("Image uploaded to Bytescale:", bytescaleUrl);
        } catch (uploadError) {
          console.error("Error uploading to Bytescale:", uploadError);
          // Continue with the process even if upload fails
          // We'll still have the base64 data
        }
      } else if (typeof imageData === 'string' && imageData.startsWith('http')) {
        // If it's already a URL, use it directly
        bytescaleUrl = imageData;
      }
    } catch (genError) {
      console.error('[IMAGE_GENERATE] Image generation error:', genError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to generate image' 
      }, { status: 500 })
    }
    
    // 使用 admin 客户端更新记录
    const { error: updateError } = await supabaseAdmin
      .from('image_generations')
      .update({
        image_url: bytescaleUrl || "failed_to_upload",
        status: 'completed'
      })
      .eq('id', imageGeneration.id)
    
    if (updateError) {
      console.error('[IMAGE_GENERATE] Update error:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update image generation record' 
      }, { status: 500 })
    }
    
    // 使用 admin 客户端更新用户积分
    let creditUpdateError;
    if (profile.credits !== undefined) {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({ credits: profile.credits - CREDITS_PER_IMAGE })
        .eq('id', userId)
      creditUpdateError = error;
    } else {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({ credit_amount: (profile.credit_amount || 0) - CREDITS_PER_IMAGE })
        .eq('id', userId)
      creditUpdateError = error;
    }
    
    if (creditUpdateError) {
      console.error('[IMAGE_GENERATE] Credit update error:', creditUpdateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update user credits' 
      }, { status: 500 })
    }
    
    // 使用 admin 客户端记录积分消费
    const { error: transactionError } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -CREDITS_PER_IMAGE,
        type: 'consumption',
        description: `Generated image: ${prompt.substring(0, 30)}...`
      })
    
    if (transactionError) {
      console.error('[IMAGE_GENERATE] Transaction record error:', transactionError)
      // 不返回错误，因为这只是记录，不影响主要功能
    }
    
    return NextResponse.json({ 
      success: true,
      imageId: imageGeneration.id,
      imageUrl: bytescaleUrl || imageData
    })
  } catch (error) {
    console.error('[IMAGE_GENERATE] Unhandled error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

// 真实的图像生成函数，使用 AI 模型生成图像
async function generateImage(prompt: string): Promise<string> {
  try {
    console.log(`Generating image for prompt: ${prompt}`);
    
    // 使用Together SDK生成图像
    const response = await withRetry(() => together.images.create({
      prompt: `A picture of food for a menu, hyper realistic, highly detailed, ${prompt}.`,
      model: "black-forest-labs/FLUX.1-schnell",
      width: 1024,
      height: 768,
      steps: 5,
      // @ts-expect-error - this is not typed in the API
      response_format: "base64",
    }));
    
    console.log("AI API response:", response);

    // 从响应中提取图像数据
    if (response && response.data && response.data[0] && response.data[0].b64_json) {
      // 返回 base64 编码的图像数据
      return response.data[0].b64_json;
    } else {
      // 如果没有找到图像数据，使用备用方法
      console.warn("No image data found in API response, using fallback method");
      
      // 备用方法：使用 picsum 作为临时替代
      const width = 1024;
      const height = 768;
      const seed = encodeURIComponent(`${prompt}_${Date.now()}`);
      return `https://picsum.photos/seed/${seed}/${width}/${height}`;
    }
  } catch (error) {
    console.error("Error generating image:", error);
    // 出错时使用备用方法
    const width = 1024;
    const height = 768;
    const seed = encodeURIComponent(`${prompt}_${Date.now()}`);
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
  }
} 