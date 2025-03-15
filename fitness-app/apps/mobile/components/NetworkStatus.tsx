import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getNetworkDiagnostics, getConnectionTroubleshootingTips } from '../lib/utils/network';
import { API_URL } from '../lib/api/config';

interface NetworkStatusProps {
  onRetry?: () => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ onRetry }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkNetwork = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const networkDiagnostics = await getNetworkDiagnostics();
      setDiagnostics(networkDiagnostics);
    } catch (err) {
      setError('Failed to check network status');
      console.error('Network diagnostics error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkNetwork();
  }, []);

  const handleRetry = () => {
    checkNetwork();
    if (onRetry) onRetry();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.text}>Checking network status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={handleRetry}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isConnected = diagnostics?.isConnected;
  const isApiReachable = diagnostics?.isApiReachable;

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.title}>Network Status</Text>
        
        <View style={styles.statusRow}>
          <View style={[styles.indicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            Internet Connection: {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.indicator, { backgroundColor: isApiReachable ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            API Server: {isApiReachable ? 'Reachable' : 'Unreachable'}
          </Text>
        </View>

        {!isApiReachable && (
          <View style={styles.apiUrlContainer}>
            <Text style={styles.apiUrlLabel}>API URL:</Text>
            <Text style={styles.apiUrl}>{API_URL || 'Not set'}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.detailsToggle} 
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Text>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Troubleshooting Tips</Text>
          <Text style={styles.detailsText}>{getConnectionTroubleshootingTips()}</Text>
          
          <Text style={styles.detailsTitle}>Diagnostics</Text>
          <Text style={styles.detailsText}>
            Platform: {diagnostics?.platform}{'\n'}
            Connection Type: {diagnostics?.connectionType || 'Unknown'}{'\n'}
            API URL: {diagnostics?.apiUrl || 'Not set'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRetry}>
        <Text style={styles.buttonText}>Retry Connection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  statusContainer: {
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
  },
  apiUrlContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e0e0e0',
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
  detailsToggle: {
    marginVertical: 8,
    padding: 8,
  },
  detailsToggleText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  detailsContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
  },
  detailsTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  text: {
    marginTop: 8,
    fontSize: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default NetworkStatus; 