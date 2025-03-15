import axios from 'axios';
import { API_URL } from './config';

// Create an axios instance with default settings
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper function to format error messages
const formatErrorMessage = (error: any): string => {
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
    return 'Network error: Could not connect to the server. Please check your internet connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || 'An unknown error occurred';
  }
};

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: string;
  date_joined?: string;
  height?: number;
  weight?: number;
  gender?: string;
  birth_date?: string;
  fitness_level?: string;
  fitness_goals?: string[];
  preferred_activities?: string[];
  settings?: {
    theme?: string;
    notifications_enabled?: boolean;
    measurement_system?: 'metric' | 'imperial';
  };
}

const profileApi = {
  /**
   * Get the current user's profile
   */
  getProfile: async (token: string): Promise<UserProfile> => {
    try {
      const response = await apiClient.get('/api/users/profile/', {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user profile:', formatErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (token: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const response = await apiClient.patch('/api/users/profile/', profileData, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating user profile:', formatErrorMessage(error));
      throw error;
    }
  },

  /**
   * Upload a profile avatar
   */
  uploadAvatar: async (token: string, imageUri: string): Promise<{ avatar: string }> => {
    try {
      // Create form data
      const formData = new FormData();
      
      // Get the file name from the URI
      const uriParts = imageUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      // Determine the file type
      const fileType = fileName.split('.').pop() || 'jpg';
      
      // @ts-ignore - FormData expects specific structure
      formData.append('avatar', {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      });

      const response = await apiClient.post('/api/users/profile/avatar/', formData, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error uploading avatar:', formatErrorMessage(error));
      throw error;
    }
  },

  /**
   * Change user password
   */
  changePassword: async (
    token: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post('/api/users/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      }, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error changing password:', formatErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get user settings
   */
  getSettings: async (token: string): Promise<UserProfile['settings']> => {
    try {
      const response = await apiClient.get('/api/users/settings/', {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user settings:', formatErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update user settings
   */
  updateSettings: async (
    token: string, 
    settings: Partial<UserProfile['settings']>
  ): Promise<UserProfile['settings']> => {
    try {
      const response = await apiClient.patch('/api/users/settings/', settings, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating user settings:', formatErrorMessage(error));
      throw error;
    }
  }
};

export default profileApi; 