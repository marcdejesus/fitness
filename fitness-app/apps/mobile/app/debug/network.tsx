import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/theme-context';
import { API_URL, getApiUrl } from '../../lib/api/config';
import Constants from 'expo-constants';
import NetworkStatus from '../../components/NetworkStatus';

export default function NetworkDebugScreen() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [apiTest, setApiTest] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message: string }>({
    status: 'idle',
    message: '',
  });

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

  const fetchNetworkInfo = async () => {
    setIsLoading(true);
    try {
      // Get basic network info
      setNetworkInfo({
        constants: {
          hostUri: Constants.expoConfig?.hostUri,
          expoVersion: Constants.expoVersion,
          appOwnership: Constants.appOwnership,
          deviceName: Constants.deviceName,
        },
        platform: {
          os: Platform.OS,
          version: Platform.Version,
        },
        apiUrl: API_URL,
      });
    } catch (error) {
      console.error('Error fetching network info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testApiConnection = async () => {
    setApiTest({ status: 'loading', message: 'Testing connection...' });
    try {
      const response = await fetch(getApiUrl('/'), { 
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      setApiTest({ 
        status: 'success', 
        message: `Connection successful! Status: ${response.status} ${response.statusText}` 
      });
    } catch (error: any) {
      setApiTest({ 
        status: 'error', 
        message: `Connection failed: ${error.message}` 
      });
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <Stack.Screen 
        options={{ 
          title: 'Network Debug',
          headerStyle: { 
            backgroundColor: isDark ? '#1E1E1E' : '#ffffff',
          },
          headerTintColor: isDark ? '#ffffff' : '#000000',
        }} 
      />
      
      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Network Status
        </Text>
        
        <NetworkStatus onRetry={fetchNetworkInfo} />
      </View>
      
      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          API Connection Test
        </Text>
        
        <View style={styles.apiUrlContainer}>
          <Text style={[styles.label, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            API URL:
          </Text>
          <Text style={[styles.value, { color: isDark ? '#ffffff' : '#000000' }]}>
            {API_URL || 'Not set'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.button,
            { opacity: apiTest.status === 'loading' ? 0.7 : 1 }
          ]}
          onPress={testApiConnection}
          disabled={apiTest.status === 'loading'}
        >
          <Text style={styles.buttonText}>
            Test API Connection
          </Text>
        </TouchableOpacity>
        
        {apiTest.status !== 'idle' && (
          <View style={[
            styles.resultContainer,
            {
              backgroundColor: apiTest.status === 'success' ? '#e8f5e9' : 
                              apiTest.status === 'error' ? '#ffebee' : '#f5f5f5',
              borderColor: apiTest.status === 'success' ? '#4caf50' : 
                          apiTest.status === 'error' ? '#f44336' : '#e0e0e0',
            }
          ]}>
            {apiTest.status === 'loading' ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={[
                styles.resultText,
                {
                  color: apiTest.status === 'success' ? '#2e7d32' : 
                        apiTest.status === 'error' ? '#c62828' : '#333333',
                }
              ]}>
                {apiTest.message}
              </Text>
            )}
          </View>
        )}
      </View>
      
      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Network Information
        </Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : networkInfo ? (
          <>
            <InfoItem 
              label="Host URI" 
              value={networkInfo.constants?.hostUri || 'N/A'} 
              isDark={isDark} 
            />
            <InfoItem 
              label="Expo Version" 
              value={networkInfo.constants?.expoVersion} 
              isDark={isDark} 
            />
            <InfoItem 
              label="Platform" 
              value={`${networkInfo.platform?.os} (${networkInfo.platform?.version})`} 
              isDark={isDark} 
            />
            <InfoItem 
              label="API URL" 
              value={networkInfo.apiUrl} 
              isDark={isDark} 
            />
          </>
        ) : (
          <Text style={[styles.errorText, { color: isDark ? '#ff8a80' : '#d32f2f' }]}>
            Failed to load network information
          </Text>
        )}
        
        <TouchableOpacity
          style={[styles.button, { marginTop: 15 }]}
          onPress={fetchNetworkInfo}
        >
          <Text style={styles.buttonText}>
            Refresh Information
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Troubleshooting Tips
        </Text>
        
        <Text style={[styles.tipTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          iOS Simulator:
        </Text>
        <Text style={[styles.tipText, { color: isDark ? '#bbbbbb' : '#666666' }]}>
          • Make sure your backend server is running{'\n'}
          • Try using your machine's IP address instead of localhost{'\n'}
          • Check that port 8000 is not blocked by a firewall{'\n'}
          • Restart the Expo development server
        </Text>
        
        <Text style={[styles.tipTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Android Emulator:
        </Text>
        <Text style={[styles.tipText, { color: isDark ? '#bbbbbb' : '#666666' }]}>
          • Use 10.0.2.2 instead of localhost to access your computer{'\n'}
          • Ensure your backend server is listening on all interfaces (0.0.0.0){'\n'}
          • Check Android emulator network settings
        </Text>
      </View>
    </ScrollView>
  );
}

interface InfoItemProps {
  label: string;
  value: string | number | boolean | undefined | null;
  isDark: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, isDark }) => (
  <View style={styles.infoItem}>
    <Text style={[styles.label, { color: isDark ? '#bbbbbb' : '#666666' }]}>
      {label}:
    </Text>
    <Text style={[styles.value, { color: isDark ? '#ffffff' : '#000000' }]}>
      {value?.toString() || 'N/A'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  loader: {
    marginVertical: 20,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    width: 150,
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 14,
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  apiUrlContainer: {
    marginBottom: 15,
  },
  resultContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  resultText: {
    fontSize: 14,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
}); 