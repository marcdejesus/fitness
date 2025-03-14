import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SignUpData {
  email: string;
  password: string;
  display_name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
  };
  token: string;
}

const authApi = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/api/auth/signup/`, data);
    return response.data;
  },
  
  signIn: async (data: SignInData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/api/auth/login/`, data);
    return response.data;
  },
  
  getCurrentUser: async (token: string): Promise<AuthResponse['user']> => {
    const response = await axios.get(`${API_URL}/api/auth/me/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

export default authApi;