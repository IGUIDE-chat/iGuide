/**
 * @file ./src/services/courseService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Read courses from Supabase v2 `course` and `course_offering` tables.
// [服务] 从 Supabase v2 `course` 和 `course_offering` 表读取课程数据。
import { supabase } from "./supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  school_id: string;
  subject: string;
  number: string;
  code: string; // e.g. "CS 101"
  title: string; // e.g. "Introduction to Computer Science"
  description: string | null;
  credits: string | null; // e.g. "3" or "3-4"
  status: string;
  canonical_url: string | null;
  department_code: string | null;
  department_name: string | null;
  academic_level: string | null;
  prerequisites_text: string | null;
  prerequisite_codes: string[] | null;
  corequisites_text: string | null;
  attribute_codes: string[] | null;
  attribute_labels: string[] | null;
  source_id: string | null;
  source_snapshot_id: string | null;
  primary_artifact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseOffering {
  id: string;
  course_id: string;
  school_id: string;
  term_code: string;
  status: string;
  section_code: string | null;
  class_number: string | null;
  instructor_names: string[] | null;
  instruction_method: string | null;
  campus: string | null;
  meeting_days: string[] | null;
  meeting_time_text: string | null;
  schedule_text: string | null;
  room_text: string | null;
  source_id: string | null;
  source_snapshot_id: string | null;
  primary_artifact_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COURSE_TABLE = "course";
const OFFERING_TABLE = "course_offering";
const DEFAULT_SCHOOL_ID = "uiuc";

// ── Query functions ───────────────────────────────────────────────────────────

/** Fetch all active courses for the default school. */
async function getCourses(schoolId = DEFAULT_SCHOOL_ID): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from(COURSE_TABLE)
      .select("*")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .order("subject", { ascending: true })
      .order("number", { ascending: true });

    if (error) {
      console.error("[courseService] getCourses error:", error);
      return [];
    }
    return (data ?? []) as Course[];
  } catch (err) {
    console.error("[courseService] getCourses exception:", err);
    return [];
  }
}

/** Fetch a single course by its code (e.g. "CS 101"). */
async function getCourseByCode(
  code: string,
  schoolId = DEFAULT_SCHOOL_ID
): Promise<Course | undefined> {
  try {
    const { data, error } = await supabase
      .from(COURSE_TABLE)
      .select("*")
      .eq("school_id", schoolId)
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("[courseService] getCourseByCode error:", error);
      return undefined;
    }
    return (data ?? undefined) as Course | undefined;
  } catch (err) {
    console.error("[courseService] getCourseByCode exception:", err);
    return undefined;
  }
}

/** Fetch all offerings for a given course ID. */
async function getCourseOfferings(courseId: string): Promise<CourseOffering[]> {
  try {
    const { data, error } = await supabase
      .from(OFFERING_TABLE)
      .select("*")
      .eq("course_id", courseId)
      .eq("status", "active")
      .order("term_code", { ascending: false });

    if (error) {
      console.error("[courseService] getCourseOfferings error:", error);
      return [];
    }
    return (data ?? []) as CourseOffering[];
  } catch (err) {
    console.error("[courseService] getCourseOfferings exception:", err);
    return [];
  }
}

export const courseService = {
  getCourses,
  getCourseByCode,
  getCourseOfferings,
};
