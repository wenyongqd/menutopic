-- 创建用户配置文件触发器
-- 这个触发器会在auth.users表中插入新用户时，自动在user_profiles表中创建对应的记录

-- 首先创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除可能已存在的触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新的触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 为现有用户创建配置文件记录
INSERT INTO public.user_profiles (id, credits)
SELECT id, 0 FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 确保表有正确的行级安全策略
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON public.user_profiles
  USING (true)
  WITH CHECK (true); 