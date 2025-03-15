import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from './config';
import { Platform } from 'react-native';

/**
 * Creates a configured axios instance with default settings
 */
export const createApiClient = (config?: AxiosRequestConfig): AxiosInstance => {
  return axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
    ...config
  });
};

/**
 * Formats error messages from API responses
 */
export const formatErrorMessage = (error: any): string => {
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

/**
 * Creates an authorization header with the token
 */
export const createAuthHeader = (token: string) => {
  return {
    Authorization: `Token ${token}`
  };
};

/**
 * Handles API errors with consistent logging
 */
export const handleApiError = (error: any, context: string): never => {
  console.error(`Error ${context}:`, formatErrorMessage(error));
  throw error;
};

/**
 * Default API client instance
 */
export const apiClient = createApiClient(); 