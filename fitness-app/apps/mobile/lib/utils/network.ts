import { Platform } from 'react-native';
import { API_URL } from '../api/config';

// Try to import NetInfo, but handle the case where it's not available
let NetInfo: any;
try {
  NetInfo = require('@react-native-community/netinfo');
} catch (error) {
  console.warn('NetInfo package not available, some network diagnostics will be limited');
  // Create a mock NetInfo if the package is not available
  NetInfo = {
    fetch: async () => ({ 
      isConnected: true, 
      type: 'unknown',
      details: null
    })
  };
}

/**
 * Check if the device has internet connectivity
 */
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch (error) {
    console.warn('Failed to check internet connection:', error);
    return true; // Assume connected if we can't check
  }
};

/**
 * Check if the API server is reachable
 */
export const checkApiConnection = async (): Promise<boolean> => {
  if (!API_URL) {
    console.warn('API_URL is not defined, cannot check API connection');
    return false;
  }
  
  try {
    // Use a simple HEAD request to check if the server is reachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(API_URL, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('API connection check failed:', error);
    return false;
  }
};

/**
 * Get detailed network diagnostics
 */
export const getNetworkDiagnostics = async (): Promise<{
  isConnected: boolean;
  connectionType: string | null;
  isApiReachable: boolean;
  apiUrl: string;
  platform: string;
  details: any;
}> => {
  try {
    const state = await NetInfo.fetch();
    const isApiReachable = await checkApiConnection();
    
    return {
      isConnected: state.isConnected === true,
      connectionType: state.type,
      isApiReachable,
      apiUrl: API_URL || 'not set',
      platform: Platform.OS,
      details: state.details
    };
  } catch (error) {
    console.warn('Failed to get network diagnostics:', error);
    return {
      isConnected: true, // Assume connected
      connectionType: 'unknown',
      isApiReachable: await checkApiConnection(),
      apiUrl: API_URL || 'not set',
      platform: Platform.OS,
      details: null
    };
  }
};

/**
 * Get platform-specific connection troubleshooting tips
 */
export const getConnectionTroubleshootingTips = (): string => {
  if (Platform.OS === 'ios') {
    return `
iOS Connection Troubleshooting:
1. Make sure your backend server is running on your computer
2. iOS simulators use 'localhost' to connect to your computer
3. Check that your backend is listening on port 8000
4. Try restarting your backend server
5. Ensure your app has network permissions
`;
  } else if (Platform.OS === 'android') {
    return `
Android Connection Troubleshooting:
1. Make sure your backend server is running on your computer
2. Android emulators should use '10.0.2.2' instead of 'localhost'
3. Check that your backend is listening on port 8000
4. Try restarting your backend server
5. Ensure your app has network permissions in the manifest
`;
  } else {
    return 'Check your network connection and ensure the backend server is running.';
  }
};

export default {
  checkInternetConnection,
  checkApiConnection,
  getNetworkDiagnostics,
  getConnectionTroubleshootingTips
}; 