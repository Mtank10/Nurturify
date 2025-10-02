import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    const demoUsers = [
      {
        email: 'admin@demo.com',
        password: 'admin123',
        role: 'admin' as const,
        firstName: 'Admin',
        lastName: 'User',
      },
      {
        email: 'teacher@demo.com',
        password: 'teacher123',
        role: 'teacher' as const,
        firstName: 'John',
        lastName: 'Smith',
        subjects: ['Mathematics', 'Physics'],
      },
      {
        email: 'student@demo.com',
        password: 'student123',
        role: 'student' as const,
        firstName: 'Jane',
        lastName: 'Doe',
        grade: 10,
      },
      {
        email: 'parent@demo.com',
        password: 'parent123',
        role: 'parent' as const,
        firstName: 'Robert',
        lastName: 'Doe',
        relationshipToStudent: 'father',
      },
    ];

    for (const userData of demoUsers) {
      console.log(`Creating user: ${userData.email}...`);

      const existingUser = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingUser.data) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          role: userData.role,
          status: 'active',
          profile_completed: true,
          email_verified: true,
        })
        .select()
        .single();

      if (userError) {
        console.error(`Error creating user ${userData.email}:`, userError);
        continue;
      }

      console.log(`User ${userData.email} created successfully`);

      if (userData.role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: newUser.id,
            student_id: `STU${Date.now()}`,
            first_name: userData.firstName,
            last_name: userData.lastName,
            grade: (userData as any).grade,
          });

        if (studentError) {
          console.error('Error creating student profile:', studentError);
        } else {
          console.log('Student profile created');
        }
      } else if (userData.role === 'teacher') {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            user_id: newUser.id,
            teacher_id: `TCH${Date.now()}`,
            first_name: userData.firstName,
            last_name: userData.lastName,
            subjects: (userData as any).subjects || [],
          });

        if (teacherError) {
          console.error('Error creating teacher profile:', teacherError);
        } else {
          console.log('Teacher profile created');
        }
      } else if (userData.role === 'parent') {
        const { error: parentError } = await supabase
          .from('parents')
          .insert({
            user_id: newUser.id,
            first_name: userData.firstName,
            last_name: userData.lastName,
            relationship_to_student: (userData as any).relationshipToStudent || 'father',
          });

        if (parentError) {
          console.error('Error creating parent profile:', parentError);
        } else {
          console.log('Parent profile created');
        }
      }
    }

    console.log('Creating sample subjects...');

    const subjects = [
      { name: 'Mathematics', code: 'MATH', grade: 10, category: 'core', color_code: '#3b82f6' },
      { name: 'Physics', code: 'PHY', grade: 10, category: 'core', color_code: '#8b5cf6' },
      { name: 'Chemistry', code: 'CHEM', grade: 10, category: 'core', color_code: '#10b981' },
      { name: 'English', code: 'ENG', grade: 10, category: 'core', color_code: '#f59e0b' },
      { name: 'History', code: 'HIST', grade: 10, category: 'core', color_code: '#ef4444' },
    ];

    for (const subject of subjects) {
      const existing = await supabase
        .from('subjects')
        .select('id')
        .eq('code', subject.code)
        .maybeSingle();

      if (!existing.data) {
        await supabase.from('subjects').insert(subject);
        console.log(`Created subject: ${subject.name}`);
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

seedDatabase()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
