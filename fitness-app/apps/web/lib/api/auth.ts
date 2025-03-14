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

// Helper function to determine if a token is a JWT
const isJWT = (token: string): boolean => {
  // JWT tokens typically have 3 segments separated by dots
  return token.split('.').length === 3;
};

const authApi = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/api/auth/signup/`, data);
    return response.data;
  },
  
  signIn: async (data: SignInData): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/api/auth/login/`, data);
    console.log('Sign in response:', response.data);
    return response.data;
  },
  
  getCurrentUser: async (token: string): Promise<AuthResponse['user']> => {
    console.log('Getting current user with token:', token);
    
    // Determine the likely token format
    const tokenFormat = isJWT(token) ? 'Bearer' : 'Token';
    console.log(`Detected token format: ${tokenFormat}`);
    
    // Try with the detected format first
    try {
      console.log(`Trying ${tokenFormat} format first`);
      const response = await axios.get(`${API_URL}/api/auth/me/`, {
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
        const response = await axios.get(`${API_URL}/api/auth/me/`, {
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
        throw error;
      }
    }
  }
};

export default authApi;