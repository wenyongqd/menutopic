/* eslint-disable @typescript-eslint/no-explicit-any */
import { Together } from "together-ai";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import * as Bytescale from "@bytescale/sdk";
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

// Credits required per menu
const CREDITS_PER_MENU = 5;

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
    // 获取当前用户
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const { menuUrl } = body;

    console.log({ menuUrl });

    if (!menuUrl) {
      return Response.json({ error: "No menu URL provided" }, { status: 400 });
    }

    // 验证URL格式
    try {
      new URL(menuUrl);
    } catch {
      // 忽略错误变量，只需要知道URL无效
      return Response.json({ error: "Invalid URL format" }, { status: 400 });
    }
    
    // Check if user has enough credits
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*') // Select all fields to check which column exists
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('[PARSE_MENU] Profile error:', profileError);
      return Response.json({ 
        error: "Failed to get user profile",
        details: profileError.message
      }, { status: 500 });
    }
    
    // Determine which column to use for credits
    const userCredits = profile.credits !== undefined ? profile.credits : (profile.credit_amount || 0);
    
    if (!profile || userCredits < CREDITS_PER_MENU) {
      return Response.json({ 
        error: "Insufficient credits",
        details: `You need at least ${CREDITS_PER_MENU} credits to parse a menu`
      }, { status: 402 });
    }
    
    // Create menu parsing record
    const { data: menuParsing, error: parsingError } = await supabaseAdmin
      .from('menu_parsings')
      .insert({
        user_id: userId,
        menu_url: menuUrl,
        credits_used: CREDITS_PER_MENU,
        status: 'pending'
      })
      .select()
      .single();
      
    if (parsingError) {
      console.error('[PARSE_MENU] Parsing record error:', parsingError);
      // Continue anyway, this is not critical
    }

    const systemPrompt = `You are given an image of a menu. Your job is to take each item in the menu and convert it into the following JSON format:

[{"name": "name of menu item", "price": "price of the menu item", "description": "description of menu item"}, ...]

  Please make sure to include all items in the menu and include a price (if it exists) & a description (if it exists). ALSO PLEASE ONLY RETURN JSON. IT'S VERY IMPORTANT FOR MY JOB THAT YOU ONLY RETURN JSON.
  `;

    try {
      const output = await withRetry(() => together.chat.completions.create({
        model: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
        messages: [
          {
            role: "user",
            // @ts-expect-error api is not typed
            content: [
              { type: "text", text: systemPrompt },
              {
                type: "image_url",
                image_url: {
                  url: menuUrl,
                },
              },
            ],
          },
        ],
      }));

      // 处理输出结果，确保类型安全
      // @ts-expect-error - 类型定义不完整，但我们知道这个属性存在
      const outputContent = output?.choices?.[0]?.message?.content;
      if (!outputContent) {
        // Update menu parsing record to failed
        if (menuParsing) {
          await supabaseAdmin
            .from('menu_parsings')
            .update({
              status: 'failed',
              error_message: 'Failed to extract menu items from image'
            })
            .eq('id', menuParsing.id);
        }
        
        return Response.json({ error: "Failed to extract menu items from image" }, { status: 500 });
      }

      // Defining the schema we want our data in
      const menuSchema = z.array(
        z.object({
          name: z.string().describe("The name of the menu item"),
          price: z.string().describe("The price of the menu item"),
          description: z
            .string()
            .describe(
              "The description of the menu item. If this doesn't exist, please write a short one sentence description."
            ),
        })
      );
      const jsonSchema = zodToJsonSchema(menuSchema, "menuSchema");

      const extract = await withRetry(() => together.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "The following is a list of items from a menu. Only answer in JSON.",
          },
          {
            role: "user",
            content: outputContent,
          },
        ],
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        // @ts-expect-error - this is not typed in the API
        response_format: { type: "json_object", schema: jsonSchema },
      }));

      // 处理提取结果，确保类型安全
      // @ts-expect-error - 类型定义不完整，但我们知道这个属性存在
      const extractContent = extract?.choices?.[0]?.message?.content;
      
      let menuItemsJSON;
      if (extractContent) {
        menuItemsJSON = JSON.parse(extractContent);
        console.log({ menuItemsJSON });
      } else {
        // Update menu parsing record to failed
        if (menuParsing) {
          await supabaseAdmin
            .from('menu_parsings')
            .update({
              status: 'failed',
              error_message: 'Failed to parse menu items'
            })
            .eq('id', menuParsing.id);
        }
        
        return Response.json({ error: "Failed to parse menu items" }, { status: 500 });
      }

      // 默认处理最多50个菜单项
      const MAX_ITEMS = 50;
      const itemsToProcess = menuItemsJSON.slice(0, MAX_ITEMS);
      
      console.log(`将处理 ${itemsToProcess.length} 个菜单项中的图片，共 ${menuItemsJSON.length} 个项目`);
      
      // 串行处理图像生成，而不是并行，以避免速率限制
      for (const item of itemsToProcess) {
        console.log("processing image for:", item.name);
        try {
          // 添加延迟，确保不超过API速率限制
          await delay(1200); // 每秒不超过1个请求
          
          const response = await withRetry(() => together.images.create({
            prompt: `A picture of food for a menu, hyper realistic, highly detailed, ${item.name}, ${item.description}.`,
            model: "black-forest-labs/FLUX.1-schnell",
            width: 1024,
            height: 768,
            steps: 5,
            // @ts-expect-error - this is not typed in the API
            response_format: "base64",
          }));
          
          // Store the base64 data for immediate use in the frontend
          item.menuImage = response.data[0];
          
          // Also upload to Bytescale for permanent storage
          try {
            // Convert base64 to blob
            const imageBlob = await base64ToBlob(response.data[0].b64_json);
            
            // Generate a safe filename
            const filename = `menu_${userId}_${Date.now()}_${item.name.substring(0, 20).replace(/[^a-z0-9]/gi, '_')}.png`;
            
            // Upload to Bytescale
            const uploadResult = await uploadManager.upload({
              data: imageBlob,
              mime: "image/png",
              originalFileName: filename,
            });
            
            // Store the URL in the menuImage object
            item.menuImage.url = uploadResult.fileUrl;
            console.log(`Image for "${item.name}" uploaded to Bytescale:`, uploadResult.fileUrl);
            
            // 新增：将图片也保存到image_generations表中
            const { data: imageGeneration, error: imageGenError } = await supabaseAdmin
              .from('image_generations')
              .insert({
                user_id: userId,
                prompt: `${item.name}: ${item.description}`,
                image_url: uploadResult.fileUrl,
                credits_used: 0, // 不额外扣除积分，因为已经在菜单解析中扣除了
                status: 'completed',
                source: 'menu_parsing',
                menu_parsing_id: menuParsing?.id
              })
              .select()
              .single();
              
            if (imageGenError) {
              console.error(`Error saving image for "${item.name}" to image_generations:`, imageGenError);
              // 继续处理，这不是关键错误
            } else {
              console.log(`Image for "${item.name}" saved to image_generations with ID: ${imageGeneration.id}`);
            }
          } catch (uploadError) {
            console.error(`Error uploading image for "${item.name}" to Bytescale:`, uploadError);
            // Continue with the process even if upload fails
            // We'll still have the base64 data
          }
        } catch (imageError) {
          console.error(`Error generating image for ${item.name}:`, imageError);
          // 提供一个空的图像对象，以便前端不会崩溃
          item.menuImage = { b64_json: "" };
        }
      }
      
      // Update menu parsing record to completed
      if (menuParsing) {
        await supabaseAdmin
          .from('menu_parsings')
          .update({
            status: 'completed',
            item_count: itemsToProcess.length
          })
          .eq('id', menuParsing.id);
      }
      
      // Update user credits
      let creditUpdateError;
      if (profile.credits !== undefined) {
        const { error } = await supabaseAdmin
          .from('user_profiles')
          .update({ credits: profile.credits - CREDITS_PER_MENU })
          .eq('id', userId);
        creditUpdateError = error;
      } else {
        const { error } = await supabaseAdmin
          .from('user_profiles')
          .update({ credit_amount: (profile.credit_amount || 0) - CREDITS_PER_MENU })
          .eq('id', userId);
        creditUpdateError = error;
      }
      
      if (creditUpdateError) {
        console.error('[PARSE_MENU] Credit update error:', creditUpdateError);
        // Continue anyway, we've already done the work
      }
      
      // Record credit transaction
      const { error: transactionError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -CREDITS_PER_MENU,
          type: 'consumption',
          description: `Parsed menu with ${itemsToProcess.length} items`
        });
      
      if (transactionError) {
        console.error('[PARSE_MENU] Transaction record error:', transactionError);
        // Continue anyway, this is not critical
      }

      return Response.json({ menu: itemsToProcess });
    } catch (aiError: any) {
      console.error("AI processing error:", aiError);
      
      // Update menu parsing record to failed
      if (menuParsing) {
        await supabaseAdmin
          .from('menu_parsings')
          .update({
            status: 'failed',
            error_message: aiError.message || String(aiError)
          })
          .eq('id', menuParsing.id);
      }
      
      return Response.json({ 
        error: "Error processing menu with AI", 
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

export const maxDuration = 300; // 增加最大执行时间到5分钟
