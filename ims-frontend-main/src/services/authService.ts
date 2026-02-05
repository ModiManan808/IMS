import api from '../config/api';

export interface LoginRequest {
  username: string;
  password: string;
  userType: 'admin' | 'intern';
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username?: string;
    applicationNo?: string;
    email: string;
    fullName: string;
    role: string;
    status?: string;
  };
}

// Custom event for auth state changes
const AUTH_CHANGE_EVENT = 'auth-state-changed';

const notifyAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      notifyAuthChange();
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sidebarOpen');
      notifyAuthChange();
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  onAuthChange: (callback: () => void) => {
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  },
};
