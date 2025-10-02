/*
  # Initial Schema for AI-Powered Student CRM

  ## Summary
  Creates the complete database schema for a comprehensive student management system with AI-powered features, mental health tracking, and gamification.

  ## New Tables

  ### Core User Tables
  - `users` - Main user authentication table (extends Supabase auth.users)
    - id, email, role, status, profile data
  - `students` - Student profile information
  - `teachers` - Teacher profile information
  - `parents` - Parent/guardian profile information
  - `schools` - School/institution information

  ### Academic Tables
  - `subjects` - Available subjects/courses
  - `classes` - Class sessions with teacher assignments
  - `student_classes` - Student enrollments in classes
  - `assignments` - Homework, projects, and assessments
  - `assignment_submissions` - Student assignment submissions
  - `grades` - Student grades and performance records

  ### AI & Analytics Tables
  - `learning_analytics` - Track student learning activities
  - `ai_recommendations` - AI-generated recommendations
  - `student_progress` - Skill-based progress tracking

  ### Mental Health & Wellness Tables
  - `mental_health_records` - Daily mood and wellness tracking
  - `counseling_sessions` - Scheduled counseling appointments
  - `mental_health_alerts` - Automated wellness alerts

  ### Communication Tables
  - `conversations` - Group and direct message conversations
  - `conversation_participants` - Conversation membership
  - `messages` - Individual messages
  - `notifications` - In-app notifications

  ### Gamification Tables
  - `achievements` - Available achievements and badges
  - `user_achievements` - Earned achievements
  - `leaderboard_entries` - Gamification scores

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated access based on user roles
  - Ensure data isolation between students, teachers, and parents

  ## Notes
  - Uses UUID for all primary keys
  - Timestamps for audit trails
  - JSON fields for flexible data storage
  - Foreign key constraints for referential integrity
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parent', 'admin', 'counselor');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE learning_style AS ENUM ('visual', 'auditory', 'kinesthetic', 'reading_writing');
CREATE TYPE school_type AS ENUM ('public', 'private', 'charter');
CREATE TYPE board AS ENUM ('CBSE', 'ICSE', 'State', 'IB', 'Other');
CREATE TYPE subject_category AS ENUM ('core', 'elective', 'extracurricular');
CREATE TYPE class_status AS ENUM ('active', 'dropped', 'completed');
CREATE TYPE assignment_type AS ENUM ('homework', 'project', 'quiz', 'exam', 'presentation');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'graded', 'returned');
CREATE TYPE grade_type AS ENUM ('assignment', 'quiz', 'exam', 'project', 'participation');
CREATE TYPE term AS ENUM ('term1', 'term2', 'annual');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian', 'other');

-- Core Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL,
  status user_status DEFAULT 'active',
  email_verified boolean DEFAULT false,
  phone text,
  profile_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender gender,
  grade integer NOT NULL,
  section text,
  school_id uuid,
  parent_id uuid,
  admission_date date,
  blood_group text,
  address text,
  emergency_contact text,
  profile_picture_url text,
  interests jsonb DEFAULT '[]'::jsonb,
  learning_style learning_style,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  subjects jsonb DEFAULT '[]'::jsonb,
  qualifications text,
  experience_years integer,
  school_id uuid,
  department text,
  profile_picture_url text,
  bio text,
  specializations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Parents Table
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  relationship_to_student relationship_type,
  occupation text,
  workplace text,
  address text,
  profile_picture_url text,
  emergency_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update parent_id foreign key in students
ALTER TABLE students ADD CONSTRAINT students_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL;

-- Schools Table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  type school_type NOT NULL,
  address text,
  city text,
  state text,
  postal_code text,
  phone text,
  email text,
  website text,
  principal_name text,
  established_year integer,
  board board NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  grade integer NOT NULL,
  description text,
  category subject_category NOT NULL,
  credits integer DEFAULT 1,
  color_code text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id uuid NOT NULL REFERENCES teachers(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  grade integer NOT NULL,
  section text NOT NULL,
  school_year text NOT NULL,
  schedule jsonb DEFAULT '{}'::jsonb,
  room_number text,
  max_students integer DEFAULT 40,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Student Classes (Enrollments)
CREATE TABLE IF NOT EXISTS student_classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrollment_date timestamptz DEFAULT now(),
  status class_status DEFAULT 'active',
  UNIQUE(student_id, class_id)
);

-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type assignment_type NOT NULL,
  due_date timestamptz NOT NULL,
  total_marks integer NOT NULL,
  instructions text,
  attachments jsonb DEFAULT '[]'::jsonb,
  weight numeric(3,2) DEFAULT 1.00,
  allow_late_submission boolean DEFAULT true,
  late_penalty numeric(3,2) DEFAULT 0.10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assignment Submissions Table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_text text,
  attachments jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamptz DEFAULT now(),
  status submission_status DEFAULT 'draft',
  marks_obtained integer,
  feedback text,
  graded_by uuid REFERENCES users(id),
  graded_at timestamptz,
  is_late boolean DEFAULT false,
  UNIQUE(assignment_id, student_id)
);

-- Grades Table
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  class_id uuid NOT NULL REFERENCES classes(id),
  assignment_id uuid REFERENCES assignments(id),
  grade_type grade_type NOT NULL,
  marks_obtained numeric(5,2) NOT NULL,
  total_marks numeric(5,2) NOT NULL,
  grade_letter text,
  gpa_points numeric(3,2),
  term term NOT NULL,
  academic_year text NOT NULL,
  recorded_by uuid NOT NULL REFERENCES users(id),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Learning Analytics Table
CREATE TABLE IF NOT EXISTS learning_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id),
  activity_type text NOT NULL,
  duration_minutes integer,
  performance_score numeric(5,2),
  difficulty_level text,
  completion_rate numeric(5,2),
  engagement_score numeric(5,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

-- AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL,
  confidence_score numeric(3,2),
  reasoning text,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending',
  created_by_ai_model text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Student Progress Table
CREATE TABLE IF NOT EXISTS student_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id),
  skill_name text NOT NULL,
  current_level integer NOT NULL,
  target_level integer,
  progress_percentage numeric(5,2),
  last_assessment_date timestamptz,
  improvement_rate numeric(5,2),
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, skill_name)
);

-- Mental Health Records Table
CREATE TABLE IF NOT EXISTS mental_health_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 10),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_hours numeric(3,1),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  anxiety_level integer CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
  notes text,
  triggers jsonb DEFAULT '[]'::jsonb,
  coping_strategies_used jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Counseling Sessions Table
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  counselor_id uuid NOT NULL REFERENCES users(id),
  session_type text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text NOT NULL,
  mode text NOT NULL,
  session_notes text,
  follow_up_required boolean DEFAULT false,
  next_session_date timestamptz,
  privacy_level text DEFAULT 'confidential',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mental Health Alerts Table
CREATE TABLE IF NOT EXISTS mental_health_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL,
  description text,
  triggered_by jsonb DEFAULT '{}'::jsonb,
  ai_analysis text,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active',
  assigned_to uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  title text,
  description text,
  created_by uuid NOT NULL REFERENCES users(id),
  is_archived boolean DEFAULT false,
  last_message_at timestamptz,
  participant_count integer DEFAULT 0,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_muted boolean DEFAULT false,
  last_read_message_id uuid,
  UNIQUE(conversation_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES users(id),
  recipient_id uuid REFERENCES users(id),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_type text DEFAULT 'text',
  content text,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  is_ai_generated boolean DEFAULT false,
  priority text DEFAULT 'medium',
  reply_to_message_id uuid REFERENCES messages(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  is_sent boolean DEFAULT false,
  priority text DEFAULT 'medium',
  delivery_method text DEFAULT 'in_app',
  scheduled_for timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon text,
  category text NOT NULL,
  points integer DEFAULT 0,
  criteria jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  progress numeric(5,2) DEFAULT 100.00,
  UNIQUE(user_id, achievement_id)
);

-- Leaderboard Table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  level integer DEFAULT 1,
  rank integer,
  weekly_points integer DEFAULT 0,
  monthly_points integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- RLS Policies for Students
CREATE POLICY "Students can view own data"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Students can update own data"
  ON students FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Teachers and admins can view students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role IN ('teacher', 'admin', 'counselor')
    )
  );

-- RLS Policies for Teachers
CREATE POLICY "Teachers can view own data"
  ON teachers FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Teachers can update own data"
  ON teachers FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for Parents
CREATE POLICY "Parents can view own data"
  ON parents FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Parents can view their children"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parents
      WHERE parents.user_id::text = auth.uid()::text
      AND parents.id = students.parent_id
    )
  );

-- RLS Policies for Subjects (Public read)
CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for Classes
CREATE POLICY "Students can view their classes"
  ON classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN students s ON s.id = sc.student_id
      WHERE s.user_id::text = auth.uid()::text
      AND sc.class_id = classes.id
    )
  );

CREATE POLICY "Teachers can view their classes"
  ON classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.user_id::text = auth.uid()::text
      AND t.id = classes.teacher_id
    )
  );

-- RLS Policies for Assignments
CREATE POLICY "Students can view assignments for their classes"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN students s ON s.id = sc.student_id
      WHERE s.user_id::text = auth.uid()::text
      AND sc.class_id = assignments.class_id
    )
  );

-- RLS Policies for Assignment Submissions
CREATE POLICY "Students can view own submissions"
  ON assignment_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id::text = auth.uid()::text
      AND students.id = assignment_submissions.student_id
    )
  );

CREATE POLICY "Students can insert own submissions"
  ON assignment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id::text = auth.uid()::text
      AND students.id = assignment_submissions.student_id
    )
  );

CREATE POLICY "Students can update own submissions"
  ON assignment_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id::text = auth.uid()::text
      AND students.id = assignment_submissions.student_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id::text = auth.uid()::text
      AND students.id = assignment_submissions.student_id
    )
  );

-- RLS Policies for Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for Messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id::text = auth.uid()::text
    )
  );

-- RLS Policies for Mental Health Records
CREATE POLICY "Students can view own mental health records"
  ON mental_health_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id::text = auth.uid()::text
      AND students.id = mental_health_records.student_id
    )
  );

CREATE POLICY "Students can insert own mental health records"
  ON mental_health_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id::text = auth.uid()::text
      AND students.id = mental_health_records.student_id
    )
  );

CREATE POLICY "Counselors can view mental health records"
  ON mental_health_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id::text = auth.uid()::text
      AND users.role = 'counselor'
    )
  );

-- RLS Policies for Gamification
CREATE POLICY "Users can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own earned achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view leaderboard"
  ON leaderboard_entries FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_subject_id ON classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_student_id ON student_classes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_class_id ON student_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mental_health_records_student_id ON mental_health_records(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_student_id ON learning_analytics(student_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
