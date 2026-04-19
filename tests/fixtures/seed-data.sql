-- Seed data for iGuide database v2 schema testing
-- This file is idempotent - uses ON CONFLICT DO NOTHING
-- All school_id values set to 'uiuc'
-- Embedding values left as NULL (keyword_search is FTS-only)

-- ============================================================================
-- SOURCES
-- ============================================================================
INSERT INTO sources (
  id,
  school_id,
  source_key,
  name,
  source_kind,
  content_domain,
  freshness_class,
  default_retrieval_policy,
  base_url,
  created_at,
  updated_at
)
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'uiuc', 'uiuc-course-catalog', 'UIUC Course Explorer', 'website', 'course', 'stable', 'local_first', 'https://courses.illinois.edu', NOW(), NOW()),
  ('a1b2c3d4-0002-0001-0001-000000000002', 'uiuc', 'uiuc-housing-guide', 'UIUC Housing Division', 'website', 'housing', 'semi_volatile', 'local_first', 'https://housing.illinois.edu', NOW(), NOW()),
  ('a1b2c3d4-0003-0001-0001-000000000003', 'uiuc', 'uiuc-campus-map', 'UIUC Campus Map', 'google_maps', 'location', 'semi_volatile', 'local_first', 'https://map.illinois.edu', NOW(), NOW()),
  ('a1b2c3d4-0004-0001-0001-000000000004', 'uiuc', 'uiuc-academic-calendar', 'UIUC Academic Calendar', 'website', 'calendar', 'stable', 'local_first', 'https://registrar.illinois.edu/academic-calendars', NOW(), NOW()),
  ('a1b2c3d4-0005-0001-0001-000000000005', 'uiuc', 'uiuc-student-services', 'UIUC Student Services Guide', 'website', 'student_life', 'semi_volatile', 'local_first', 'https://students.illinois.edu', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SOURCE_SNAPSHOTS
-- ============================================================================
INSERT INTO source_snapshots (
  id,
  source_id,
  snapshot_key,
  capture_mode,
  capture_status,
  canonical_url,
  captured_at,
  is_current,
  raw_metadata
)
VALUES
  ('b2c3d4e5-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', '2025-spring-course-catalog', 'crawl', 'success', 'https://courses.illinois.edu', NOW(), true, '{"record_count": 5000}'::jsonb),
  ('b2c3d4e5-0002-0001-0001-000000000002', 'a1b2c3d4-0002-0001-0001-000000000002', '2025-spring-housing', 'crawl', 'success', 'https://housing.illinois.edu', NOW(), true, '{"record_count": 50}'::jsonb),
  ('b2c3d4e5-0003-0001-0001-000000000003', 'a1b2c3d4-0003-0001-0001-000000000003', '2025-spring-campus-map', 'api_sync', 'success', 'https://map.illinois.edu', NOW(), true, '{"record_count": 200}'::jsonb),
  ('b2c3d4e5-0004-0001-0001-000000000004', 'a1b2c3d4-0004-0001-0001-000000000004', '2025-2026-calendar', 'crawl', 'success', 'https://registrar.illinois.edu/academic-calendars', NOW(), true, '{"record_count": 12}'::jsonb),
  ('b2c3d4e5-0005-0001-0001-000000000005', 'a1b2c3d4-0005-0001-0001-000000000005', '2025-student-services', 'crawl', 'success', 'https://students.illinois.edu', NOW(), true, '{"record_count": 20}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ARTIFACTS
-- ============================================================================
INSERT INTO artifacts (
  id,
  source_snapshot_id,
  artifact_type,
  artifact_role,
  title,
  summary,
  content_text,
  canonical_url,
  is_searchable,
  is_primary,
  created_at
)
VALUES
  ('c3d4e5f6-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'clean_markdown', 'primary', 'UIUC Course Explorer 2025', 'Catalog and offering content for UIUC courses.', 'Course catalog coverage for CS 225, ECE 110, MATH 241, prerequisites, and Fall 2025 offerings.', 'https://courses.illinois.edu', true, true, NOW()),
  ('c3d4e5f6-0002-0001-0001-000000000002', 'b2c3d4e5-0002-0001-0001-000000000002', 'clean_markdown', 'primary', 'UIUC Housing Guide 2025', 'Housing options, residence halls, and amenities.', 'Housing details for Nugent Hall, Allen Hall, and PAR including room types, amenities, and nearby dining.', 'https://housing.illinois.edu', true, true, NOW()),
  ('c3d4e5f6-0003-0001-0001-000000000003', 'b2c3d4e5-0003-0001-0001-000000000003', 'normalized_json', 'primary', 'UIUC Campus Map and Services', 'Campus buildings and services including printing.', 'Location and service information for Siebel Center, Grainger printing, and CRCE.', 'https://map.illinois.edu', true, true, NOW()),
  ('c3d4e5f6-0004-0001-0001-000000000004', 'b2c3d4e5-0004-0001-0001-000000000004', 'clean_markdown', 'primary', 'UIUC Academic Calendar 2025-2026', 'Academic calendar deadlines and semester dates.', 'Registrar content for Fall 2025 semester start and add/drop deadline.', 'https://registrar.illinois.edu/academic-calendars', true, true, NOW()),
  ('c3d4e5f6-0005-0001-0001-000000000005', 'b2c3d4e5-0005-0001-0001-000000000005', 'clean_markdown', 'primary', 'UIUC Student Services', 'Student services, orientation, CPT, and dining.', 'Student services coverage for CPT application process, new student orientation schedule, and campus dining options and hours.', 'https://students.illinois.edu', true, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CHUNKS
-- Note: fts_vector is a generated column - NOT included in INSERT
-- ============================================================================
INSERT INTO chunks (
  id,
  artifact_id,
  chunk_index,
  chunk_text,
  search_text,
  embedding,
  is_active,
  embedding_model,
  metadata
)
VALUES
  ('d4e5f6a7-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 0, 'CS 225 Data Structures is a Computer Science course covering linked lists, trees, graphs, heaps, hash tables, and algorithm analysis. Prerequisites include CS 173 or equivalent.', 'CS 225 data structures computer science prerequisite', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0001-0001-0001-000000000002', 'c3d4e5f6-0001-0001-0001-000000000001', 1, 'ECE 110 in Electrical and Computer Engineering requires MATH 241 calculus and PHYS 211 as prerequisite preparation for introductory electronics.', 'courses with prerequisite MATH 241 calculus electrical computer engineering', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0001-0001-0001-000000000003', 'c3d4e5f6-0001-0001-0001-000000000001', 2, 'Fall 2025 ECE offerings include open lecture sections for ECE 110 in Electrical and Computer Engineering with in-person instruction in Urbana.', 'Fall 2025 ECE offerings electrical computer engineering', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0002-0001-0001-000000000004', 'c3d4e5f6-0002-0001-0001-000000000002', 0, 'Nugent Hall is a UIUC dorm and residence hall with single room and double room type options near dining halls. Amenity highlights include study lounges, computer labs, and laundry.', 'dorm single room dining residence hall Nugent Hall amenity UIUC', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0002-0001-0001-000000000005', 'c3d4e5f6-0002-0001-0001-000000000002', 1, 'Allen Hall is an arts and humanities living learning community with shared bathrooms, music rooms, and collaborative study spaces.', 'Allen Hall housing LLC arts amenities', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0003-0001-0001-000000000006', 'c3d4e5f6-0003-0001-0001-000000000003', 0, 'Siebel Center hours and location: Siebel Center for Computer Science is at 201 North Goodwin Avenue and is open 7 AM to 10 PM on weekdays near the ECE corridor.', 'Siebel Center hours location ECE computer science', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0003-0001-0001-000000000007', 'c3d4e5f6-0003-0001-0001-000000000003', 1, 'Students can print on campus at Grainger Library, Main Library, and computer labs. Printing services support black and white printing, scanning, and copying.', 'print campus library printing services', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0004-0001-0001-000000000008', 'c3d4e5f6-0004-0001-0001-000000000004', 0, 'Fall 2025 semester start is Monday August 25, 2025, the first day of classes on the academic calendar.', 'Fall 2025 semester start calendar', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0004-0001-0001-000000000009', 'c3d4e5f6-0004-0001-0001-000000000004', 1, 'The Fall 2025 add drop deadline is September 8, 2025, for registration changes without penalty.', 'add drop deadline Fall 2025 registration', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0005-0001-0001-000000000010', 'c3d4e5f6-0005-0001-0001-000000000005', 0, 'The CPT application process for international students includes advisor review, employer details, work authorization timing, and related OPT planning guidance.', 'CPT application process OPT work authorization', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0005-0001-0001-000000000011', 'c3d4e5f6-0005-0001-0001-000000000005', 1, 'New student orientation schedule includes arrival check-in, welcome sessions, advising, registration support, and campus resource tours.', 'new student orientation schedule arrival', NULL, true, NULL, '{}'::jsonb),
  ('d4e5f6a7-0005-0001-0001-000000000012', 'c3d4e5f6-0005-0001-0001-000000000005', 2, 'Campus dining options and hours include dining halls, food courts, cafes, and restaurant locations with breakfast, lunch, and dinner service hours.', 'campus dining food hours restaurant', NULL, true, NULL, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COURSE
-- ============================================================================
INSERT INTO course (
  id,
  school_id,
  subject,
  number,
  code,
  title,
  description,
  credits,
  canonical_url,
  search_text,
  source_id,
  source_snapshot_id,
  primary_artifact_id,
  department_code,
  department_name,
  academic_level,
  prerequisites_text,
  prerequisite_codes,
  corequisites_text,
  attribute_codes,
  attribute_labels
)
VALUES
  ('e5f6a7b8-0001-0001-0001-000000000001', 'uiuc', 'CS', '225', 'CS225', 'Data Structures', 'Fundamental data structures and algorithms including linked lists, trees, graphs, heaps, and hash tables.', '4', 'https://courses.illinois.edu/cs/225', 'CS 225 data structures algorithms computer science', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'CS', 'Computer Science', 'undergraduate', 'CS 173 or equivalent', ARRAY['CS173'], NULL, ARRAY['CS225'], ARRAY['Data Structures']),
  ('e5f6a7b8-0002-0001-0001-000000000002', 'uiuc', 'ECE', '110', 'ECE110', 'Introduction to Electronics', 'Fundamental circuit analysis, Kirchhoff laws, Thevenin and Norton equivalents, operational amplifiers, and digital logic fundamentals.', '3', 'https://courses.illinois.edu/ece/110', 'ECE 110 introduction electronics circuit electrical computer engineering', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'ECE', 'Electrical and Computer Engineering', 'undergraduate', 'MATH 241; PHYS 211', ARRAY['MATH241', 'PHYS211'], NULL, ARRAY['ECE110'], ARRAY['Intro to Electronics']),
  ('e5f6a7b8-0003-0001-0001-000000000003', 'uiuc', 'MATH', '241', 'MATH241', 'Calculus III', 'Multivariable calculus including vectors, partial derivatives, multiple integrals, and vector calculus.', '4', 'https://courses.illinois.edu/math/241', 'MATH 241 calculus multivariable', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'MATH', 'Mathematics', 'undergraduate', 'MATH 231', ARRAY['MATH231'], NULL, ARRAY['MATH241'], ARRAY['Calculus III']),
  ('e5f6a7b8-0004-0001-0001-000000000004', 'uiuc', 'CS', '374', 'CS374', 'Introduction to Algorithms and Models of Computation', 'Formal models of computation, algorithm design, complexity analysis, and NP-completeness.', '4', 'https://courses.illinois.edu/cs/374', 'CS 374 algorithms models computation complexity', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'CS', 'Computer Science', 'undergraduate', 'CS 225', ARRAY['CS225'], NULL, ARRAY['CS374'], ARRAY['Algorithms']),
  ('e5f6a7b8-0005-0001-0001-000000000005', 'uiuc', 'CS', '173', 'CS173', 'Discrete Structures', 'Logic, sets, functions, relations, induction, combinatorics, and graph theory for computer science.', '3', 'https://courses.illinois.edu/cs/173', 'CS 173 discrete structures logic sets induction', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'CS', 'Computer Science', 'undergraduate', 'MATH 115 or equivalent', ARRAY['MATH115'], NULL, ARRAY['CS173'], ARRAY['Discrete Structures'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COURSE_OFFERING
-- ============================================================================
INSERT INTO course_offering (
  id,
  course_id,
  school_id,
  term_code,
  status,
  canonical_url,
  search_text,
  source_id,
  source_snapshot_id,
  primary_artifact_id,
  section_code,
  class_number,
  instructor_names,
  instruction_method,
  campus,
  meeting_days,
  meeting_time_text,
  schedule_text,
  room_text
)
VALUES
  ('f6a7b8c9-0001-0001-0001-000000000001', 'e5f6a7b8-0001-0001-0001-000000000001', 'uiuc', '2025-fa', 'open', 'https://courses.illinois.edu/cs/225/2025-fa', 'CS 225 Fall 2025 data structures', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'LEC', '12345', ARRAY['Prof. Jane Smith'], 'in_person', 'urbana', ARRAY['MWF'], '10:00 - 10:50', 'MWF 10:00-10:50', 'Siebel Center 1404'),
  ('f6a7b8c9-0002-0001-0001-000000000002', 'e5f6a7b8-0002-0001-0001-000000000002', 'uiuc', '2025-fa', 'open', 'https://courses.illinois.edu/ece/110/2025-fa', 'ECE 110 Fall 2025 introduction electronics', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'LEC', '23456', ARRAY['Prof. John Doe'], 'in_person', 'urbana', ARRAY['TR'], '14:00 - 15:15', 'TR 14:00-15:15', 'Everitt Lab 2310'),
  ('f6a7b8c9-0003-0001-0001-000000000003', 'e5f6a7b8-0003-0001-0001-000000000003', 'uiuc', '2025-fa', 'open', 'https://courses.illinois.edu/math/241/2025-fa', 'MATH 241 Fall 2025 calculus', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'LEC', '34567', ARRAY['Prof. Alice Johnson'], 'in_person', 'urbana', ARRAY['MWF'], '09:00 - 09:50', 'MWF 09:00-09:50', 'Altgeld Hall 245'),
  ('f6a7b8c9-0004-0001-0001-000000000004', 'e5f6a7b8-0001-0001-0001-000000000001', 'uiuc', '2025-fa', 'open', 'https://courses.illinois.edu/cs/225/2025-fa/dis', 'CS 225 Fall 2025 discussion section', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'DIS', '12346', ARRAY['TA Bob Lee'], 'in_person', 'urbana', ARRAY['F'], '11:00 - 11:50', 'F 11:00-11:50', 'Siebel Center 0216'),
  ('f6a7b8c9-0005-0001-0001-000000000005', 'e5f6a7b8-0002-0001-0001-000000000002', 'uiuc', '2026-sp', 'open', 'https://courses.illinois.edu/ece/110/2026-sp', 'ECE 110 Spring 2026 introduction electronics', 'a1b2c3d4-0001-0001-0001-000000000001', 'b2c3d4e5-0001-0001-0001-000000000001', 'c3d4e5f6-0001-0001-0001-000000000001', 'LEC', '45678', ARRAY['Prof. Mary Chen'], 'in_person', 'urbana', ARRAY['MWF'], '13:00 - 13:50', 'MWF 13:00-13:50', 'Everitt Lab 2310')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ACADEMIC_CALENDAR_ITEM
-- ============================================================================
INSERT INTO academic_calendar_item (
  id,
  school_id,
  calendar_type,
  item_type,
  title,
  summary,
  start_at,
  end_at,
  all_day,
  timezone,
  status,
  canonical_url,
  search_text,
  source_id,
  source_snapshot_id,
  primary_artifact_id,
  term_code,
  academic_year,
  applies_to_population,
  is_deadline,
  is_time_sensitive
)
VALUES
  ('a7b8c9d0-0001-0001-0001-000000000001', 'uiuc', 'academic', 'semester_start', 'Fall 2025 Semester Begins', 'First day of classes for the Fall 2025 semester.', '2025-08-25 08:00:00-05', '2025-08-25 17:00:00-05', false, 'America/Chicago', 'published', 'https://registrar.illinois.edu/academic-calendars', 'Fall 2025 semester start classes calendar', 'a1b2c3d4-0004-0001-0001-000000000004', 'b2c3d4e5-0004-0001-0001-000000000004', 'c3d4e5f6-0004-0001-0001-000000000004', '2025-fa', '2025-2026', 'all_students', false, false),
  ('a7b8c9d0-0002-0001-0001-000000000002', 'uiuc', 'academic', 'deadline', 'Fall 2025 Add/Drop Deadline', 'Last day to add or drop courses without penalty.', '2025-09-08 17:00:00-05', '2025-09-08 17:00:00-05', false, 'America/Chicago', 'published', 'https://registrar.illinois.edu/academic-calendars', 'Fall 2025 add drop deadline registration', 'a1b2c3d4-0004-0001-0001-000000000004', 'b2c3d4e5-0004-0001-0001-000000000004', 'c3d4e5f6-0004-0001-0001-000000000004', '2025-fa', '2025-2026', 'all_students', true, true),
  ('a7b8c9d0-0003-0001-0001-000000000003', 'uiuc', 'academic', 'break', 'Spring Break 2026', 'Spring break for Spring 2026 semester.', '2026-03-16 00:00:00-05', '2026-03-22 23:59:59-05', true, 'America/Chicago', 'published', 'https://registrar.illinois.edu/academic-calendars', 'Spring 2026 break vacation calendar', 'a1b2c3d4-0004-0001-0001-000000000004', 'b2c3d4e5-0004-0001-0001-000000000004', 'c3d4e5f6-0004-0001-0001-000000000004', '2026-sp', '2025-2026', 'all_students', false, false),
  ('a7b8c9d0-0004-0001-0001-000000000004', 'uiuc', 'academic', 'deadline', 'Fall 2025 Withdrawal Deadline', 'Last day to withdraw from courses with W grade.', '2025-10-17 17:00:00-05', '2025-10-17 17:00:00-05', false, 'America/Chicago', 'published', 'https://registrar.illinois.edu/academic-calendars', 'Fall 2025 withdrawal deadline registration', 'a1b2c3d4-0004-0001-0001-000000000004', 'b2c3d4e5-0004-0001-0001-000000000004', 'c3d4e5f6-0004-0001-0001-000000000004', '2025-fa', '2025-2026', 'all_students', true, true),
  ('a7b8c9d0-0005-0001-0001-000000000005', 'uiuc', 'academic', 'semester_end', 'Fall 2025 Finals Week', 'Final examinations period for Fall 2025 semester.', '2025-12-15 08:00:00-06', '2025-12-19 22:00:00-06', false, 'America/Chicago', 'published', 'https://registrar.illinois.edu/academic-calendars', 'Fall 2025 finals week exams calendar', 'a1b2c3d4-0004-0001-0001-000000000004', 'b2c3d4e5-0004-0001-0001-000000000004', 'c3d4e5f6-0004-0001-0001-000000000004', '2025-fa', '2025-2026', 'all_students', false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LOCATION_OR_SERVICE
-- ============================================================================
INSERT INTO location_or_service (
  id,
  school_id,
  object_type,
  name,
  display_name,
  summary,
  status,
  address_text,
  latitude,
  longitude,
  canonical_url,
  search_text,
  source_id,
  source_snapshot_id,
  primary_artifact_id,
  service_type,
  service_tags,
  audience_tags,
  hours_text,
  campus_zone,
  building_code
)
VALUES
  ('b8c9d0e1-0001-0001-0001-000000000001', 'uiuc', 'building', 'Siebel Center', 'Siebel Center for Computer Science', 'Home of the Department of Computer Science with labs, study rooms, lecture halls, and the coffee shop.', 'active', '201 N Goodwin Ave, Urbana, IL 61801', 40.1138, -88.2249, 'https://map.illinois.edu', 'Siebel Center computer science hours location ECE', 'a1b2c3d4-0003-0001-0001-000000000003', 'b2c3d4e5-0003-0001-0001-000000000003', 'c3d4e5f6-0003-0001-0001-000000000003', 'academic_building', ARRAY['computer_lab', 'study_rooms', 'coffee_shop'], ARRAY['students', 'faculty'], 'Mon-Fri 7:00 AM - 10:00 PM', 'engineering', 'SIEB'),
  ('b8c9d0e1-0002-0001-0001-000000000002', 'uiuc', 'service', 'Grainger Library Printing', 'Grainger Library Printing Services', 'Campus printing services for students including black and white printing, color printing, scanning, and copying.', 'active', '1301 W Springfield Ave, Urbana, IL 61801', 40.1120, -88.2269, 'https://map.illinois.edu', 'printing campus library services Grainger', 'a1b2c3d4-0003-0001-0001-000000000003', 'b2c3d4e5-0003-0001-0001-000000000003', 'c3d4e5f6-0003-0001-0001-000000000003', 'printing_service', ARRAY['printing', 'scanning', 'copying'], ARRAY['students', 'staff'], 'Mon-Thu 8:00 AM - 10:00 PM, Fri 8:00 AM - 6:00 PM, Sat-Sun 12:00 PM - 6:00 PM', 'main_quad', 'GRAI'),
  ('b8c9d0e1-0003-0001-0001-000000000003', 'uiuc', 'service', 'CRCE', 'Campus Recreation Center East', 'Fitness facility with gym equipment, pools, group fitness classes, and intramural sports.', 'active', '1102 E Gregory Dr, Urbana, IL 61820', 40.1028, -88.2203, 'https://campusrec.illinois.edu', 'fitness gym recreation CRCE', 'a1b2c3d4-0003-0001-0001-000000000003', 'b2c3d4e5-0003-0001-0001-000000000003', 'c3d4e5f6-0003-0001-0001-000000000003', 'fitness_recreation', ARRAY['gym', 'pool', 'fitness_classes', 'intramurals'], ARRAY['students', 'faculty', 'staff'], 'Mon-Fri 6:00 AM - 11:00 PM, Sat-Sun 8:00 AM - 9:00 PM', 'south_quad', 'CRCE'),
  ('b8c9d0e1-0004-0001-0001-000000000004', 'uiuc', 'building', 'Main Library', 'University of Illinois Main Library', 'Central research library with study spaces, printing, computer labs, and special collections.', 'active', '1408 W Gregory Dr, Urbana, IL 61801', 40.1047, -88.2290, 'https://library.illinois.edu', 'Main Library study printing computer lab research', 'a1b2c3d4-0003-0001-0001-000000000003', 'b2c3d4e5-0003-0001-0001-000000000003', 'c3d4e5f6-0003-0001-0001-000000000003', 'library', ARRAY['printing', 'study_rooms', 'computer_lab', 'research'], ARRAY['students', 'faculty', 'staff'], 'Mon-Thu 8:00 AM - 10:00 PM, Fri 8:00 AM - 6:00 PM, Sat-Sun 10:00 AM - 6:00 PM', 'main_quad', 'MAIN'),
  ('b8c9d0e1-0005-0001-0001-000000000005', 'uiuc', 'service', 'McKinley Health Center', 'McKinley Health Center', 'Student health services including primary care, mental health, pharmacy, and immunizations.', 'active', '1109 S Lincoln Ave, Urbana, IL 61801', 40.1019, -88.2213, 'https://mckinley.illinois.edu', 'health center medical services pharmacy mental health', 'a1b2c3d4-0005-0001-0001-000000000005', 'b2c3d4e5-0005-0001-0001-000000000005', 'c3d4e5f6-0005-0001-0001-000000000005', 'health_service', ARRAY['primary_care', 'mental_health', 'pharmacy', 'immunizations'], ARRAY['students'], 'Mon-Fri 8:00 AM - 5:00 PM', 'south_quad', 'MCKN')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- HOUSING
-- ============================================================================
INSERT INTO housing (
  id,
  school_id,
  housing_type,
  name,
  display_name,
  summary,
  status,
  canonical_url,
  search_text,
  source_id,
  source_snapshot_id,
  primary_artifact_id,
  address_text,
  campus_zone,
  audience_tags,
  gender_policy,
  room_type_tags,
  bathroom_style,
  amenity_tags,
  price_text,
  price_period
)
VALUES
  ('c9d0e1f2-0001-0001-0001-000000000001', 'uiuc', 'residence_hall', 'Nugent Hall', 'Nugent Hall', 'Traditional residence hall with single and double rooms near dining halls, study lounges, and parking.', 'active', 'https://housing.illinois.edu/nugent', 'Nugent Hall residence hall housing single rooms dining', 'a1b2c3d4-0002-0001-0001-000000000002', 'b2c3d4e5-0002-0001-0001-000000000002', 'c3d4e5f6-0002-0001-0001-000000000002', '1105 W Springfield Ave, Urbana, IL 61801', 'lincoln_avenue', ARRAY['undergraduate', 'first_year', 'transfer'], 'co_ed', ARRAY['single', 'double'], 'shared', ARRAY['dining_nearby', 'study_lounge', 'computer_lab', 'laundry'], '$8,500 - $10,500', 'academic_year'),
  ('c9d0e1f2-0002-0001-0001-000000000002', 'uiuc', 'residence_hall', 'Allen Hall', 'Allen Hall', 'Living Learning Community focused on arts and humanities with collaborative spaces.', 'active', 'https://housing.illinois.edu/allen', 'Allen Hall LLC arts housing', 'a1b2c3d4-0002-0001-0001-000000000002', 'b2c3d4e5-0002-0001-0001-000000000002', 'c3d4e5f6-0002-0001-0001-000000000002', '1005 W Gregory Dr, Urbana, IL 61801', 'lincoln_avenue', ARRAY['undergraduate', 'first_year', 'transfer'], 'co_ed', ARRAY['double', 'triple'], 'shared', ARRAY['llc', 'art_studio', 'music_room', 'study_lounge'], '$8,200 - $9,800', 'academic_year'),
  ('c9d0e1f2-0003-0001-0001-000000000003', 'uiuc', 'apartment', 'PAR', 'Polo Annex Residences', 'Apartment-style housing for upper-division and graduate students with kitchens and living areas.', 'active', 'https://housing.illinois.edu/par', 'PAR apartment housing graduate', 'a1b2c3d4-0002-0001-0001-000000000002', 'b2c3d4e5-0002-0001-0001-000000000002', 'c3d4e5f6-0002-0001-0001-000000000002', '1901 S Race St, Urbana, IL 61820', 'south_campus', ARRAY['upper_division', 'graduate', 'family'], 'co_ed', ARRAY['efficiency', 'one_bedroom', 'two_bedroom'], 'private', ARRAY['kitchen', 'living_room', 'parking', 'laundry'], '$12,000 - $18,000', 'academic_year'),
  ('c9d0e1f2-0004-0001-0001-000000000004', 'uiuc', 'residence_hall', 'ISR', 'Illinois Street Residence Halls', 'Large residence hall complex with multiple dining options, study spaces, and recreational facilities.', 'active', 'https://housing.illinois.edu/isr', 'ISR Illinois Street Residence Halls dining housing', 'a1b2c3d4-0002-0001-0001-000000000002', 'b2c3d4e5-0002-0001-0001-000000000002', 'c3d4e5f6-0002-0001-0001-000000000002', '1010 W Illinois St, Urbana, IL 61801', 'south_campus', ARRAY['undergraduate', 'first_year'], 'co_ed', ARRAY['single', 'double', 'triple'], 'shared', ARRAY['dining_hall', 'study_lounge', 'fitness_room', 'laundry'], '$8,800 - $11,000', 'academic_year'),
  ('c9d0e1f2-0005-0001-0001-000000000005', 'uiuc', 'residence_hall', 'Bromley Hall', 'Bromley Hall', 'Quiet residence hall with single rooms and suite-style options near engineering quad.', 'active', 'https://housing.illinois.edu/bromley', 'Bromley Hall quiet single rooms engineering housing', 'a1b2c3d4-0002-0001-0001-000000000002', 'b2c3d4e5-0002-0001-0001-000000000002', 'c3d4e5f6-0002-0001-0001-000000000002', '1005 W Gregory Dr, Urbana, IL 61801', 'engineering', ARRAY['undergraduate', 'upper_division'], 'co_ed', ARRAY['single', 'suite'], 'shared', ARRAY['study_lounge', 'quiet_hours', 'laundry'], '$9,000 - $11,500', 'academic_year')
ON CONFLICT (id) DO NOTHING;
