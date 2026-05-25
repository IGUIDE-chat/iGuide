import { supabase } from "./supabase";
import { Housing } from "../components/housing/types/index";

const TABLE = "housing";

function rowToHousing(row: Record<string, unknown>): Housing {
  return {
    id: row.id as string,
    school_id: row.school_id as string,
    housing_type: row.housing_type as string,
    name: row.name as string,
    display_name: (row.display_name as string) ?? null,
    summary: (row.summary as string) ?? null,
    status: row.status as string,
    canonical_url: (row.canonical_url as string) ?? null,
    search_text: (row.search_text as string) ?? null,
    source_id: (row.source_id as string) ?? null,
    source_snapshot_id: (row.source_snapshot_id as string) ?? null,
    primary_artifact_id: (row.primary_artifact_id as string) ?? null,
    address_text: (row.address_text as string) ?? null,
    latitude: (row.latitude as number) ?? null,
    longitude: (row.longitude as number) ?? null,
    campus_zone: (row.campus_zone as string) ?? null,
    location_hint_text: (row.location_hint_text as string) ?? null,
    audience_tags: (row.audience_tags as string[]) ?? null,
    eligibility_text: (row.eligibility_text as string) ?? null,
    gender_policy: (row.gender_policy as string) ?? null,
    room_type_tags: (row.room_type_tags as string[]) ?? null,
    bathroom_style: (row.bathroom_style as string) ?? null,
    contract_type_tags: (row.contract_type_tags as string[]) ?? null,
    meal_plan_required: (row.meal_plan_required as boolean) ?? null,
    amenity_tags: (row.amenity_tags as string[]) ?? null,
    llc_tags: (row.llc_tags as string[]) ?? null,
    price_text: (row.price_text as string) ?? null,
    price_period: (row.price_period as string) ?? null,
    application_url: (row.application_url as string) ?? null,
    availability_cycle_text: (row.availability_cycle_text as string) ?? null,
    comparison_notes: (row.comparison_notes as string) ?? null,
    housing_policy_notes: (row.housing_policy_notes as string) ?? null,
    image_urls: (row.image_urls as string[]) ?? null,
    related_housing_codes: (row.related_housing_codes as string[]) ?? null,
    room_options: (row.room_options as Record<string, unknown>) ?? null,
    contract_options: (row.contract_options as Record<string, unknown>) ?? null,
    pricing_options: (row.pricing_options as Record<string, unknown>) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

async function getHousing(schoolId?: string): Promise<Housing[]> {
  try {
    let query = supabase.from(TABLE).select("*").eq("status", "active");

    if (schoolId) {
      query = query.eq("school_id", schoolId);
    } else {
      query = query.eq("school_id", "uiuc");
    }

    const { data, error } = await query;

    if (error) {
      console.error("[housingService] getHousing error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(rowToHousing);
  } catch (err) {
    console.error("[housingService] getHousing exception:", err);
    return [];
  }
}

async function getHousingById(id: string): Promise<Housing | undefined> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[housingService] getHousingById error:", error);
      return undefined;
    }

    if (!data) {
      return undefined;
    }

    return rowToHousing(data);
  } catch (err) {
    console.error("[housingService] getHousingById exception:", err);
    return undefined;
  }
}

export const housingService = {
  getHousing,
  getHousingById,
  rowToHousing,
};
