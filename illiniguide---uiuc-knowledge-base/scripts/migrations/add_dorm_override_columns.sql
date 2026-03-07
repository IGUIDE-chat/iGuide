-- 运行这个代码来给已经存在的 dorm_overrides 表添加新字段
-- 因为 CREATE TABLE IF NOT EXISTS 不会自动添加新列

ALTER TABLE public.dorm_overrides
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS location_zh text,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS type_zh text,
ADD COLUMN IF NOT EXISTS housing_type text,
ADD COLUMN IF NOT EXISTS room_types text [],
ADD COLUMN IF NOT EXISTS tags text [];