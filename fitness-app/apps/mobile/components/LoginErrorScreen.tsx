import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import NetworkStatus from './NetworkStatus';
import { API_URL } from '../lib/api/config';

interface LoginErrorScreenProps {
  error: string;
  onRetry: () => void;
}

const LoginErrorScreen: React.FC<LoginErrorScreenProps> = ({ error, onRetry }) => {
  const [showNetworkStatus, setShowNetworkStatus] = useState(false);
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Login Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>

        <View style={styles.apiUrlContainer}>
          <Text style={styles.apiUrlLabel}>API URL:</Text>
          <Text style={styles.apiUrl}>{API_URL || 'Not set'}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.networkButton} 
          onPress={() => setShowNetworkStatus(!showNetworkStatus)}
        >
          <Text style={styles.networkButtonText}>
            {showNetworkStatus ? 'Hide Network Diagnostics' : 'Show Network Diagnostics'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => router.push('/debug/network')}
        >
          <Text style={styles.debugButtonText}>
            Advanced Network Debugging
          </Text>
        </TouchableOpacity>
      </View>

      {showNetworkStatus && <NetworkStatus onRetry={onRetry} />}

      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>Troubleshooting Tips</Text>
        
        <Text style={styles.troubleshootingSubtitle}>Common Issues:</Text>
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>• Check that your backend server is running</Text>
          <Text style={styles.tipText}>• Verify your username and password</Text>
          <Text style={styles.tipText}>• Check your internet connection</Text>
        </View>
        
        <Text style={styles.troubleshootingSubtitle}>iOS Simulator:</Text>
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>• iOS simulators use 'localhost' to connect to your computer</Text>
          <Text style={styles.tipText}>• Make sure your backend is listening on port 8000</Text>
        </View>
        
        <Text style={styles.troubleshootingSubtitle}>Android Emulator:</Text>
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>• Android emulators should use '10.0.2.2' instead of 'localhost'</Text>
          <Text style={styles.tipText}>• Check that your API URL is configured correctly</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  apiUrlContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  apiUrlLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  apiUrl: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  networkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  networkButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  debugButtonText: {
    color: '#E91E63',
    fontSize: 14,
    fontWeight: 'bold',
  },
  troubleshootingContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  troubleshootingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  troubleshootingSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    color: '#555',
  },
  tipContainer: {
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default LoginErrorScreen; 