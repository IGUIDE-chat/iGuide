/**
 * @file ./src/components/courses/CourseCard.tsx
 * @description Courses Component / Module
 * @description_zh 此文件属于 Courses 业务域（限界上下文）。请勿在此引入其他业务的代码。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { BookOpen, GraduationCap, Hash } from "lucide-react"
import React from "react"

import { type Course } from "../../services/courseService"

interface CourseCardProps {
  course: Course
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            <Hash size={11} />
            {course.code}
          </span>
          {course.academic_level && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
              <GraduationCap size={11} />
              {course.academic_level}
            </span>
          )}
        </div>
        {course.credits && (
          <span className="shrink-0 text-xs text-slate-500">
            {course.credits} cr
          </span>
        )}
      </div>

      <div>
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-slate-800">
          {course.title}
        </h3>
        {course.department_name && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <BookOpen size={11} />
            {course.department_name}
          </p>
        )}
      </div>

      {course.description && (
        <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
          {course.description}
        </p>
      )}
    </div>
  )
}

export default CourseCard
