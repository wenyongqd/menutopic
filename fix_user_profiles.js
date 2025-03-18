// 这个脚本用于检查和修复现有用户的配置文件
// 可以在本地运行，也可以在服务器上运行

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixUserProfiles() {
  console.log('开始修复用户配置文件...')
  
  try {
    // 获取所有用户
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
    
    if (usersError) {
      throw usersError
    }
    
    console.log(`找到 ${users.length} 个用户`)
    
    // 获取所有用户配置文件
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
    
    if (profilesError) {
      throw profilesError
    }
    
    console.log(`找到 ${profiles.length} 个用户配置文件`)
    
    // 找出没有配置文件的用户
    const profileIds = profiles.map(profile => profile.id)
    const usersWithoutProfiles = users.filter(user => !profileIds.includes(user.id))
    
    console.log(`有 ${usersWithoutProfiles.length} 个用户没有配置文件`)
    
    if (usersWithoutProfiles.length === 0) {
      console.log('所有用户都有配置文件，无需修复')
      return
    }
    
    // 为没有配置文件的用户创建配置文件
    const profilesToCreate = usersWithoutProfiles.map(user => ({
      id: user.id,
      credits: 0
    }))
    
    const { data: createdProfiles, error: createError } = await supabase
      .from('user_profiles')
      .insert(profilesToCreate)
      .select()
    
    if (createError) {
      throw createError
    }
    
    console.log(`成功创建了 ${createdProfiles.length} 个用户配置文件`)
    
  } catch (error) {
    console.error('修复用户配置文件时出错:', error)
  }
}

// 运行修复脚本
fixUserProfiles()
  .then(() => console.log('脚本执行完成'))
  .catch(err => console.error('脚本执行失败:', err)) 