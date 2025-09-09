const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    const response = await this.request<any>('/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
    return response;
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // Students
  async getStudents(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/students${queryString}`);
  }

  async getStudent(id: string) {
    return this.request<any>(`/students/${id}`);
  }

  async getStudentDashboard(id: string) {
    return this.request<any>(`/students/${id}/dashboard`);
  }

  async createStudent(studentData: any) {
    return this.request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id: string, studentData: any) {
    return this.request<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  // Teachers
  async getTeachers(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/teachers${queryString}`);
  }

  async getTeacherDashboard() {
    return this.request<any>('/teachers/dashboard');
  }

  // Classes
  async getClasses(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/classes${queryString}`);
  }

  async getClass(id: string) {
    return this.request<any>(`/classes/${id}`);
  }

  async createClass(classData: any) {
    return this.request<any>('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  // Subjects
  async getSubjects(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/subjects${queryString}`);
  }

  async getSubjectProgress(id: string) {
    return this.request<any>(`/subjects/${id}/progress`);
  }

  // Assignments
  async getAssignments(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/assignments${queryString}`);
  }

  async getAssignment(id: string) {
    return this.request<any>(`/assignments/${id}`);
  }

  async createAssignment(assignmentData: any) {
    return this.request<any>('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  }

  async submitAssignment(id: string, submissionData: any) {
    return this.request<any>(`/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async gradeAssignment(assignmentId: string, studentId: string, gradeData: any) {
    return this.request<any>(`/assignments/${assignmentId}/grade/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
  }

  // Wellness
  async getWellnessRecords(studentId: string, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/wellness/records/${studentId}${queryString}`);
  }

  async createWellnessRecord(studentId: string, recordData: any) {
    return this.request<any>(`/wellness/records/${studentId}`, {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  async getWellnessAnalytics(studentId: string, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/wellness/analytics/${studentId}${queryString}`);
  }

  async getCounselingSessions(studentId: string, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/wellness/counseling/${studentId}${queryString}`);
  }

  async getWellnessAlerts(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/wellness/alerts${queryString}`);
  }

  // Notifications
  async getNotifications(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/notifications${queryString}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Messages
  async getConversations() {
    return this.request<any>('/messages/conversations');
  }

  async getConversationMessages(conversationId: string, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/messages/conversations/${conversationId}/messages${queryString}`);
  }

  async sendMessage(messageData: any) {
    return this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async createConversation(conversationData: any) {
    return this.request<any>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    });
  }

  // Analytics
  async getStudentAnalytics(studentId: string, params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/analytics/student/${studentId}${queryString}`);
  }

  async getClassAnalytics(classId: string) {
    return this.request<any>(`/analytics/class/${classId}`);
  }

  // Gamification
  async getGamificationProfile() {
    return this.request<any>('/gamification/profile');
  }

  async getAchievements() {
    return this.request<any>('/gamification/achievements');
  }

  async getLeaderboard(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<any>(`/gamification/leaderboard${queryString}`);
  }

  async getChallenges() {
    return this.request<any>('/gamification/challenges');
  }

  async checkAchievements() {
    return this.request<any>('/gamification/check-achievements', {
      method: 'POST'
    });
  }

  // AI
  async chatWithAI(message: string, context?: any) {
    return this.request<any>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getStudySuggestions() {
    return this.request<any>('/ai/study-suggestions');
  }

  async generateStudyPlan(planData: any) {
    return this.request<any>('/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async getHomeworkHelp(questionData: any) {
    return this.request<any>('/ai/homework-help', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }
}

export const apiService = new ApiService();
export default apiService;