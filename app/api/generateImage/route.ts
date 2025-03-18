/* eslint-disable @typescript-eslint/no-explicit-any */
import { Together } from "together-ai";
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import * as Bytescale from "@bytescale/sdk";
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

// Credits required per image
const CREDITS_PER_IMAGE = 5;

// Initialize Bytescale upload manager
const uploadManager = new Bytescale.UploadManager({
  apiKey: process.env.NEXT_PUBLIC_BYTESCALE_API_KEY || "free"
});

// Add observability if a Helicone key is specified, otherwise skip
const options: ConstructorParameters<typeof Together>[0] = {};
if (process.env.HELICONE_API_KEY) {
  options.baseURL = "https://together.helicone.ai/v1";
  options.defaultHeaders = {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Property-MENU": "true",
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
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    // 如果是速率限制错误，获取Retry-After头部值或使用默认值
    const retryAfter = error.response?.headers?.["retry-after"] 
      ? parseInt(error.response.headers["retry-after"]) * 1000 
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

export async function POST(request: Request) {
  try {
    // Get current user
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;
    
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
    );
    
    const body = await request.json();
    const { description, singleItemRegeneration } = body;

    console.log({ description, singleItemRegeneration });

    if (!description) {
      return Response.json({ error: "No description provided" }, { status: 400 });
    }
    
    // Check if user has enough credits
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*') // Select all fields to check which column exists
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('[GENERATE_IMAGE] Profile error:', profileError);
      return Response.json({ 
        error: "Failed to get user profile",
        details: profileError.message
      }, { status: 500 });
    }
    
    // Determine which column to use for credits
    const userCredits = profile.credits !== undefined ? profile.credits : (profile.credit_amount || 0);
    
    // 单个菜单项重新生成只需要1个积分，普通生成需要5个积分
    const CREDITS_REQUIRED = singleItemRegeneration ? 1 : CREDITS_PER_IMAGE;
    
    if (!profile || userCredits < CREDITS_REQUIRED) {
      return Response.json({ 
        error: "Insufficient credits",
        details: `You need at least ${CREDITS_REQUIRED} credits to generate an image`
      }, { status: 402 });
    }
    
    // Create image generation record
    const { data: imageGeneration, error: generationError } = await supabaseAdmin
      .from('image_generations')
      .insert({
        user_id: userId,
        prompt: description,
        credits_used: CREDITS_REQUIRED,
        status: 'pending'
      })
      .select()
      .single();
      
    if (generationError) {
      console.error('[GENERATE_IMAGE] Generation record error:', generationError);
      return Response.json({ 
        error: "Failed to create image generation record",
        details: generationError.message
      }, { status: 500 });
    }

    try {
      console.log("Generating image for:", description);
      
      const response = await withRetry(() => together.images.create({
        prompt: `A picture of food for a menu, hyper realistic, highly detailed, ${description}.`,
        model: "black-forest-labs/FLUX.1-schnell",
        width: 1024,
        height: 768,
        steps: 5,
        // @ts-expect-error - this is not typed in the API
        response_format: "base64",
      }));
      
      // Upload the image to Bytescale
      let imageUrl = "";
      try {
        // Convert base64 to blob
        const imageBlob = await base64ToBlob(response.data[0].b64_json);
        
        // Generate a safe filename
        const filename = `${userId}_${Date.now()}_${description.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.png`;
        
        // Upload to Bytescale
        const uploadResult = await uploadManager.upload({
          data: imageBlob,
          mime: "image/png",
          originalFileName: filename,
        });
        
        imageUrl = uploadResult.fileUrl;
        console.log("Image uploaded to Bytescale:", imageUrl);
      } catch (uploadError) {
        console.error("Error uploading to Bytescale:", uploadError);
        // Continue with the process even if upload fails
        // We'll still have the base64 data to return to the client
      }
      
      // Update image generation record with the actual URL
      const { error: updateError } = await supabaseAdmin
        .from('image_generations')
        .update({
          image_url: imageUrl || "failed_to_upload",
          status: 'completed'
        })
        .eq('id', imageGeneration.id);
      
      if (updateError) {
        console.error('[GENERATE_IMAGE] Update error:', updateError);
        // Continue anyway, this is not critical
      }
      
      // Update user credits
      let creditUpdateError;
      if (profile.credits !== undefined) {
        const { error } = await supabaseAdmin
          .from('user_profiles')
          .update({ credits: profile.credits - CREDITS_REQUIRED })
          .eq('id', userId);
        creditUpdateError = error;
      } else {
        const { error } = await supabaseAdmin
          .from('user_profiles')
          .update({ credit_amount: (profile.credit_amount || 0) - CREDITS_REQUIRED })
          .eq('id', userId);
        creditUpdateError = error;
      }
      
      if (creditUpdateError) {
        console.error('[GENERATE_IMAGE] Credit update error:', creditUpdateError);
        return Response.json({ 
          error: "Failed to update user credits",
          details: creditUpdateError.message
        }, { status: 500 });
      }
      
      // Record credit transaction
      const { error: transactionError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -CREDITS_REQUIRED,
          type: 'consumption',
          description: singleItemRegeneration 
            ? `Regenerated menu item image: ${description.substring(0, 30)}...`
            : `Generated image: ${description.substring(0, 30)}...`
        });
      
      if (transactionError) {
        console.error('[GENERATE_IMAGE] Transaction record error:', transactionError);
        // Continue anyway, this is not critical
      }
      
      return Response.json({ 
        image: response.data[0],
        name: description,
        price: "",
        description: description,
        imageUrl: imageUrl // Also return the URL for reference
      });
    } catch (aiError: any) {
      console.error("AI processing error:", aiError);
      
      // Update image generation record to failed
      await supabaseAdmin
        .from('image_generations')
        .update({
          status: 'failed',
          error_message: aiError.message || String(aiError)
        })
        .eq('id', imageGeneration.id);
      
      return Response.json({ 
        error: "Error generating image with AI", 
        details: aiError.message || String(aiError) 
      }, { status: 500 });
    }
  } catch (parseError: any) {
    console.error("Request parsing error:", parseError);
    return Response.json({ 
      error: "Failed to parse request", 
      details: parseError.message || String(parseError) 
    }, { status: 400 });
  }
}

export const maxDuration = 60; // 设置最大执行时间为1分钟 