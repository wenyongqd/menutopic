import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥以获取管理员权限
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET() {
  try {
    // 查询所有信用包，不过滤 is_active
    const { data: allPackages, error: allError } = await supabase
      .from('credit_packages')
      .select('*')
    
    // 查询活跃的信用包
    const { data: activePackages, error: activeError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
    
    if (allError) throw allError
    if (activeError) throw activeError
    
    return NextResponse.json({
      allPackages,
      activePackages,
      message: '这是所有信用包和活跃的信用包数据'
    })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
} 