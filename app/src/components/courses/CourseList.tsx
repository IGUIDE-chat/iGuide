/**
 * @file ./src/components/courses/CourseList.tsx
 * @description Courses Component / Module
 * @description_zh 此文件属于 Courses 业务域（限界上下文）。请勿在此引入其他业务的代码。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useEffect, useState } from "react";
import { Course, courseService } from "../../services/courseService";
import CourseCard from "./CourseCard";

interface CourseListProps {
  schoolId?: string;
}

const CourseList: React.FC<CourseListProps> = ({ schoolId }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    courseService
      .getCourses(schoolId)
      .then((data) => {
        if (!cancelled) {
          setCourses(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load courses.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
        Loading courses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
        No courses found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};

export default CourseList;
