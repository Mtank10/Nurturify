import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  profile_completed: boolean;
  student?: any;
  teacher?: any;
  parent?: any;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'parent';
  firstName: string;
  lastName: string;
  phone?: string;
  grade?: number;
  subjects?: string[];
  relationshipToStudent?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const sessionData = localStorage.getItem('supabase_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session && session.userId) {
          const { data, error } = await supabase
            .from('users')
            .select(`
              *,
              students(*),
              teachers(*),
              parents(*)
            `)
            .eq('id', session.userId)
            .maybeSingle();

          if (!error && data) {
            const userData: User = {
              id: data.id,
              email: data.email,
              role: data.role,
              status: data.status,
              profile_completed: data.profile_completed,
              student: data.students?.[0] || null,
              teacher: data.teachers?.[0] || null,
              parent: data.parents?.[0] || null,
            };
            setUser(userData);
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('supabase_session');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          students(*),
          teachers(*),
          parents(*)
        `)
        .eq('email', email)
        .eq('status', 'active')
        .maybeSingle();

      if (userError || !userData) {
        throw new Error('Invalid email or password');
      }

      const passwordMatch = await bcrypt.compare(password, userData.password_hash);
      if (!passwordMatch) {
        throw new Error('Invalid email or password');
      }

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      const session = {
        userId: userData.id,
        email: userData.email,
        timestamp: Date.now(),
      };
      localStorage.setItem('supabase_session', JSON.stringify(session));

      const user: User = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        profile_completed: userData.profile_completed,
        student: userData.students?.[0] || null,
        teacher: userData.teachers?.[0] || null,
        parent: userData.parents?.[0] || null,
      };
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('supabase_session');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const existingUser = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingUser.data) {
        throw new Error('User with this email already exists');
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          role: userData.role,
          phone: userData.phone || null,
          status: 'active',
          profile_completed: false,
        })
        .select()
        .single();

      if (userError || !newUser) {
        throw new Error(userError?.message || 'Failed to create user');
      }

      if (userData.role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: newUser.id,
            student_id: `STU${Date.now()}`,
            first_name: userData.firstName,
            last_name: userData.lastName,
            grade: userData.grade || 1,
          });

        if (studentError) {
          await supabase.from('users').delete().eq('id', newUser.id);
          throw new Error('Failed to create student profile');
        }
      } else if (userData.role === 'teacher') {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            user_id: newUser.id,
            teacher_id: `TCH${Date.now()}`,
            first_name: userData.firstName,
            last_name: userData.lastName,
            subjects: userData.subjects || [],
          });

        if (teacherError) {
          await supabase.from('users').delete().eq('id', newUser.id);
          throw new Error('Failed to create teacher profile');
        }
      } else if (userData.role === 'parent') {
        const { error: parentError } = await supabase
          .from('parents')
          .insert({
            user_id: newUser.id,
            first_name: userData.firstName,
            last_name: userData.lastName,
            relationship_to_student: userData.relationshipToStudent || 'father',
          });

        if (parentError) {
          await supabase.from('users').delete().eq('id', newUser.id);
          throw new Error('Failed to create parent profile');
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};