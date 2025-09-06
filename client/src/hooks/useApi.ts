import { useState, useEffect } from 'react';
import apiService from '../services/api';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = any>(
  apiCall: () => Promise<any>,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { immediate = true, onSuccess, onError } = options;

  const execute = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      
      if (response.success) {
        setData(response.data);
        onSuccess?.(response.data);
      } else {
        throw new Error(response.message || 'API call failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  };
}

// Specific hooks for common API calls
export function useStudents(params?: any) {
  return useApi(() => apiService.getStudents(params));
}

export function useStudent(id: string) {
  return useApi(() => apiService.getStudent(id), {
    immediate: !!id,
  });
}

export function useStudentDashboard(id: string) {
  return useApi(() => apiService.getStudentDashboard(id), {
    immediate: !!id,
  });
}

export function useAssignments(params?: any) {
  return useApi(() => apiService.getAssignments(params));
}

export function useAssignment(id: string) {
  return useApi(() => apiService.getAssignment(id), {
    immediate: !!id,
  });
}

export function useSubjects(params?: any) {
  return useApi(() => apiService.getSubjects(params));
}

export function useNotifications(params?: any) {
  return useApi(() => apiService.getNotifications(params));
}

export function useConversations() {
  return useApi(() => apiService.getConversations());
}

export function useWellnessRecords(studentId: string, params?: any) {
  return useApi(() => apiService.getWellnessRecords(studentId, params), {
    immediate: !!studentId,
  });
}

export function useWellnessAnalytics(studentId: string, params?: any) {
  return useApi(() => apiService.getWellnessAnalytics(studentId, params), {
    immediate: !!studentId,
  });
}

export function useStudentAnalytics(studentId: string, params?: any) {
  return useApi(() => apiService.getStudentAnalytics(studentId, params), {
    immediate: !!studentId,
  });
}