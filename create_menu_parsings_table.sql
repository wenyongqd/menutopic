-- 创建menu_parsings表
-- 此表用于跟踪菜单解析过程

-- 创建表
CREATE TABLE IF NOT EXISTS public.menu_parsings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_url TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  item_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS menu_parsings_user_id_idx ON public.menu_parsings(user_id);
CREATE INDEX IF NOT EXISTS menu_parsings_status_idx ON public.menu_parsings(status);
CREATE INDEX IF NOT EXISTS menu_parsings_created_at_idx ON public.menu_parsings(created_at);

-- 启用行级安全策略
ALTER TABLE public.menu_parsings ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
-- 用户只能查看自己的菜单解析记录
CREATE POLICY "Users can view own menu parsings" ON public.menu_parsings
  FOR SELECT USING (auth.uid() = user_id);

-- 服务角色可以管理所有记录（用于后台处理）
CREATE POLICY "Service role can manage all menu parsings" ON public.menu_parsings
  USING (true)
  WITH CHECK (true);

-- 创建触发器函数，自动更新updated_at字段
CREATE OR REPLACE FUNCTION public.update_menu_parsings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER update_menu_parsings_updated_at
  BEFORE UPDATE ON public.menu_parsings
  FOR EACH ROW EXECUTE FUNCTION public.update_menu_parsings_updated_at();

-- 注释
COMMENT ON TABLE public.menu_parsings IS '跟踪菜单解析请求和状态的表';
COMMENT ON COLUMN public.menu_parsings.user_id IS '发起解析请求的用户ID';
COMMENT ON COLUMN public.menu_parsings.menu_url IS '菜单图片的URL';
COMMENT ON COLUMN public.menu_parsings.credits_used IS '解析此菜单消耗的积分数量';
COMMENT ON COLUMN public.menu_parsings.status IS '解析状态：pending（等待处理）、processing（处理中）、completed（完成）、failed（失败）';
COMMENT ON COLUMN public.menu_parsings.item_count IS '解析出的菜单项数量';
COMMENT ON COLUMN public.menu_parsings.error_message IS '如果解析失败，记录错误信息'; 