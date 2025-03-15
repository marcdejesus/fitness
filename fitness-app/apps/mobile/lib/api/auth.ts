import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
import { Platform } from 'react-native';

// Create an axios instance with default settings
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Use the API_URL from config
// const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
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

// Helper function to determine if a token is a JWT
const isJWT = (token: string): boolean => {
  // JWT tokens typically have 3 segments separated by dots
  return token.split('.').length === 3;
};

// Helper function to format error messages
const formatErrorMessage = (error: any): string => {
  // Define apiUrl here to ensure it's available in all code paths
  const apiUrl = API_URL || '';
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (error.response.data && error.response.data.error) {
      return error.response.data.error;
    }
    if (error.response.data && error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response.data && typeof error.response.data === 'string') {
      return error.response.data;
    }
    return `Server error: ${error.response.status}`;
  } else if (error.request) {
    // The request was made but no response was received
    if (Platform.OS === 'ios' && apiUrl.includes('localhost')) {
      return 'Network error: Make sure your backend server is running. iOS simulators use localhost.';
    } else if (Platform.OS === 'android' && apiUrl.includes('localhost')) {
      return 'Network error: Android emulators cannot connect to localhost. Use 10.0.2.2 instead to access your computer\'s localhost.';
    }
    return 'Network error: Could not connect to the server. Please check your internet connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || 'An unknown error occurred';
  }
};

const authApi = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/api/auth/signup/', data);
      return response.data;
    } catch (error: any) {
      console.error('Sign up error:', formatErrorMessage(error));
      throw new Error(formatErrorMessage(error));
    }
  },
  
  signIn: async (data: SignInData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/api/auth/login/', data);
      console.log('Sign in response:', response.data);
      
      // If the token doesn't include the user ID, add it
      let token = response.data.token;
      const userId = response.data.user.id;
      
      // If the token doesn't already contain the user ID, prepend it
      if (token && userId && !token.includes(userId)) {
        // Format: userId:token
        token = `${userId}:${token}`;
        response.data.token = token;
      }
      
      console.log('Enhanced token with user ID:', token);
      return response.data;
    } catch (error: any) {
      console.error('Sign in error:', formatErrorMessage(error));
      throw new Error(formatErrorMessage(error));
    }
  },
  
  getCurrentUser: async (token: string): Promise<AuthResponse['user']> => {
    console.log('Getting current user with token:', token);
    
    // Determine the likely token format
    const tokenFormat = isJWT(token) ? 'Bearer' : 'Token';
    console.log(`Detected token format: ${tokenFormat}`);
    
    // Try with the detected format first
    try {
      console.log(`Trying ${tokenFormat} format first`);
      const response = await apiClient.get('/api/auth/me/', {
        headers: {
          Authorization: `${tokenFormat} ${token}`
        }
      });
      console.log('User data retrieved successfully with detected format');
      return response.data;
    } catch (error: any) {
      console.log(`Error with ${tokenFormat} format:`, error.response?.status);
      
      // If the first attempt fails, try the alternative format
      const alternativeFormat = tokenFormat === 'Bearer' ? 'Token' : 'Bearer';
      console.log(`Trying alternative ${alternativeFormat} format`);
      
      try {
        const response = await apiClient.get('/api/auth/me/', {
          headers: {
            Authorization: `${alternativeFormat} ${token}`
          }
        });
        console.log('User data retrieved successfully with alternative format');
        return response.data;
      } catch (innerError: any) {
        console.log(`Error with ${alternativeFormat} format:`, innerError.response?.status);
        
        // If both formats fail with 403, it might be that the /me endpoint is not supported
        if (error.response?.status === 403 || innerError.response?.status === 403) {
          console.log('Both formats failed with 403, endpoint might not be supported');
          // Return a mock user to allow the app to continue
          throw new Error('AUTH_ENDPOINT_NOT_SUPPORTED');
        }
        
        // If both formats fail, throw the original error
        throw new Error(formatErrorMessage(error));
      }
    }
  },

  // Helper method to store the auth token
  storeToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw error;
    }
  },

  // Helper method to retrieve the auth token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  },

  // Helper method to remove the auth token
  removeToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing auth token:', error);
      throw error;
    }
  }
};

export default authApi; 