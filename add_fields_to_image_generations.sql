-- 为image_generations表添加source和menu_parsing_id字段

-- 检查source字段是否存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'image_generations' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE public.image_generations 
        ADD COLUMN source TEXT DEFAULT 'prompt_generation';
        
        COMMENT ON COLUMN public.image_generations.source IS '图片来源：prompt_generation（从提示生成）或menu_parsing（从菜单解析）';
    END IF;
END $$;

-- 检查menu_parsing_id字段是否存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'image_generations' 
        AND column_name = 'menu_parsing_id'
    ) THEN
        ALTER TABLE public.image_generations 
        ADD COLUMN menu_parsing_id UUID REFERENCES public.menu_parsings(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN public.image_generations.menu_parsing_id IS '关联的菜单解析ID（如果图片是从菜单解析生成的）';
    END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS image_generations_source_idx ON public.image_generations(source);
CREATE INDEX IF NOT EXISTS image_generations_menu_parsing_id_idx ON public.image_generations(menu_parsing_id); 