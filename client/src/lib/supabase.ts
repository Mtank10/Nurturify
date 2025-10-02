import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: 'student' | 'teacher' | 'parent' | 'admin' | 'counselor';
          status: 'active' | 'inactive' | 'suspended';
          email_verified: boolean;
          phone: string | null;
          profile_completed: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role: 'student' | 'teacher' | 'parent' | 'admin' | 'counselor';
          status?: 'active' | 'inactive' | 'suspended';
          email_verified?: boolean;
          phone?: string | null;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          email?: string;
          password_hash?: string;
          role?: 'student' | 'teacher' | 'parent' | 'admin' | 'counselor';
          status?: 'active' | 'inactive' | 'suspended';
          email_verified?: boolean;
          phone?: string | null;
          profile_completed?: boolean;
          updated_at?: string;
          last_login?: string | null;
        };
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          gender: 'male' | 'female' | 'other' | null;
          grade: number;
          section: string | null;
          profile_picture_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          user_id: string;
          teacher_id: string;
          first_name: string;
          last_name: string;
          subjects: any;
          created_at: string;
          updated_at: string;
        };
      };
      parents: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          relationship_to_student: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
