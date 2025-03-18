import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥以获取管理员权限
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET() {
  try {
    // 查询活跃的信用包
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
    
    if (error) throw error
    
    return NextResponse.json({ packages: data })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
} 