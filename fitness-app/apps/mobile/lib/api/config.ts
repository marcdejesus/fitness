import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the local IP address for development
const getLocalIpAddress = (): string | null => {
  // In Expo Go, we can access the manifest URL which contains the local IP
  if (Constants.expoConfig?.hostUri) {
    const match = Constants.expoConfig.hostUri.match(/^([^:]+)/);
    if (match) {
      return match[1];
    }
  }
  return null;
};

// Use environment variables or fallback to appropriate URL based on platform
let API_URL = process.env.EXPO_PUBLIC_API_URL;

// Debug information about environment
console.log('Environment:', {
  platform: Platform.OS,
  version: Platform.Version,
  envApiUrl: process.env.EXPO_PUBLIC_API_URL,
});

// Use the computer's local IP address (found via ifconfig)
const LOCAL_IP = '10.0.0.158';

if (!API_URL) {
  // Always use the computer's local IP address for API connections
  API_URL = `http://${LOCAL_IP}:8000`;
  console.log(`Using local IP address: ${LOCAL_IP}`);
}

// Ensure API_URL doesn't end with a trailing slash
if (API_URL && API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

console.log(`Using API URL: ${API_URL}`);

// Export a function to get the API URL with a specific path
export const getApiUrl = (path: string): string => {
  if (!API_URL) {
    console.warn('API_URL is not defined!');
    return path;
  }
  
  // Ensure path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${formattedPath}`;
};

export { API_URL }; 