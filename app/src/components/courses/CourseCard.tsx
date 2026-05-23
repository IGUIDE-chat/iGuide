/**
 * @file ./src/components/courses/CourseCard.tsx
 * @description Courses Component / Module
 * @description_zh 此文件属于 Courses 业务域（限界上下文）。请勿在此引入其他业务的代码。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react";
import { BookOpen, GraduationCap, Hash } from "lucide-react";
import { Course } from "../../services/courseService";

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md shrink-0">
            <Hash size={11} />
            {course.code}
          </span>
          {course.academic_level && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md shrink-0">
              <GraduationCap size={11} />
              {course.academic_level}
            </span>
          )}
        </div>
        {course.credits && (
          <span className="text-xs text-slate-500 shrink-0">
            {course.credits} cr
          </span>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
          {course.title}
        </h3>
        {course.department_name && (
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <BookOpen size={11} />
            {course.department_name}
          </p>
        )}
      </div>

      {course.description && (
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
          {course.description}
        </p>
      )}
    </div>
  );
};

export default CourseCard;
