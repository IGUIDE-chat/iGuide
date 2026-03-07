-- 运行这个代码来给宿舍覆盖项表添加 `floor_plans` 对应的 JSONB 数组字段
-- 并且检查是否需要添加一个 `gallery_images` 图库数组用来上传房型照片

ALTER TABLE public.dorm_overrides
ADD COLUMN IF NOT EXISTS floor_plans jsonb;