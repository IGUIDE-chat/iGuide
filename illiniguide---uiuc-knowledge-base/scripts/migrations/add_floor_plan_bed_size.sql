-- Migration: Add bedSize field to floor_plans JSONB entries
-- bedSize values: 'Twin XL' | 'Full' | 'Queen' | 'King'
-- Run manually in Supabase SQL Editor

-- 1. Validation function (used by trigger)
CREATE OR REPLACE FUNCTION public.validate_floor_plan_bed_size()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.floor_plans IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM jsonb_array_elements(NEW.floor_plans) AS plan
            WHERE (plan->>'bedSize') IS NOT NULL
              AND (plan->>'bedSize') NOT IN ('Twin XL', 'Full', 'Queen', 'King')
        ) THEN
            RAISE EXCEPTION 'Invalid bedSize value in floor_plans. Allowed: Twin XL, Full, Queen, King';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach trigger to dorms table
CREATE OR REPLACE TRIGGER trg_validate_floor_plan_bed_size
    BEFORE INSERT OR UPDATE ON public.dorms
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_floor_plan_bed_size();

-- 3. Backfill: set bedSize to 'Twin XL' for any floor plan entry missing it
UPDATE public.dorms
SET floor_plans = (
    SELECT jsonb_agg(
        CASE
            WHEN plan->>'bedSize' IS NULL THEN plan || '{"bedSize": "Twin XL"}'
            ELSE plan
        END
    )
    FROM jsonb_array_elements(floor_plans) AS plan
)
WHERE floor_plans IS NOT NULL
  AND jsonb_array_length(floor_plans) > 0
  AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(floor_plans) AS plan
      WHERE plan->>'bedSize' IS NULL
  );
