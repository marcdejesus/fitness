import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import NetworkStatus from '../../components/NetworkStatus';
import { API_URL, getApiUrl } from '../../lib/api/config';
import { checkApiConnection, getNetworkDiagnostics } from '../../lib/utils/network';

export default function NetworkSettingsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const isConnected = await checkApiConnection();
      const diagnostics = await getNetworkDiagnostics();
      
      if (isConnected) {
        setConnectionStatus('Connected to server successfully!');
      } else {
        setConnectionStatus(`Unable to connect to server at ${API_URL}`);
      }
      
      console.log('Network diagnostics:', diagnostics);
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus('Error testing connection');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <Stack.Screen 
        options={{ 
          title: 'Network Settings',
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
        
        <NetworkStatus onRetry={testConnection} />
      </View>
      
      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Connection Details
        </Text>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            API URL:
          </Text>
          <Text style={[styles.detailValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            {API_URL || 'Not set'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            Auth Endpoint:
          </Text>
          <Text style={[styles.detailValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            {getApiUrl('/api/auth/login/')}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.testButton,
            { opacity: isTestingConnection ? 0.7 : 1 }
          ]}
          onPress={testConnection}
          disabled={isTestingConnection}
        >
          <Text style={styles.testButtonText}>
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Text>
        </TouchableOpacity>
        
        {connectionStatus && (
          <View style={[
            styles.statusContainer, 
            { 
              backgroundColor: connectionStatus.includes('success') 
                ? '#e8f5e9' 
                : '#ffebee',
              borderColor: connectionStatus.includes('success')
                ? '#4caf50'
                : '#f44336'
            }
          ]}>
            <Text style={[
              styles.statusText,
              {
                color: connectionStatus.includes('success')
                  ? '#2e7d32'
                  : '#c62828'
              }
            ]}>
              {connectionStatus}
            </Text>
          </View>
        )}
      </View>
      
      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Troubleshooting
        </Text>
        
        <TouchableOpacity style={styles.troubleshootingItem} onPress={() => Alert.alert('Info', 'Make sure your backend server is running and accessible.')}>
          <Ionicons name="server-outline" size={22} color={isDark ? '#bbbbbb' : '#666666'} />
          <Text style={[styles.troubleshootingText, { color: isDark ? '#ffffff' : '#000000' }]}>
            Check server status
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.troubleshootingItem} onPress={() => Alert.alert('Info', 'iOS simulators use localhost, Android emulators use 10.0.2.2')}>
          <Ionicons name="phone-portrait-outline" size={22} color={isDark ? '#bbbbbb' : '#666666'} />
          <Text style={[styles.troubleshootingText, { color: isDark ? '#ffffff' : '#000000' }]}>
            Platform-specific settings
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.troubleshootingItem} onPress={() => Alert.alert('Info', 'Try restarting the app or your development server.')}>
          <Ionicons name="refresh-outline" size={22} color={isDark ? '#bbbbbb' : '#666666'} />
          <Text style={[styles.troubleshootingText, { color: isDark ? '#ffffff' : '#000000' }]}>
            Restart app or server
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statusContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
  },
  troubleshootingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  troubleshootingText: {
    fontSize: 16,
    marginLeft: 15,
  },
}); 