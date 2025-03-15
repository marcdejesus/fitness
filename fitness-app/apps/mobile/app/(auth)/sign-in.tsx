import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { StatusBar } from 'expo-status-bar';
import LogoPlaceholder from '../../components/LogoPlaceholder';
import LoginErrorScreen from '../../components/LoginErrorScreen';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setLoginError(null);
    
    try {
      await signIn({ email, password });
      // Navigation is handled by the auth guard in _layout.tsx
    } catch (error: any) {
      setLoginError(error.message || 'Please check your credentials and try again');
    } finally {
      setIsLoading(false);
    }
  };

  // If there's a login error, show the LoginErrorScreen
  if (loginError) {
    return <LoginErrorScreen error={loginError} onRetry={() => setLoginError(null)} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#ffffff' }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <LogoPlaceholder size={100} />
          <Text style={[styles.appName, { color: isDark ? '#ffffff' : '#000000' }]}>
            Fitness App
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            Sign In
          </Text>
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#333333' : '#f5f5f5',
                color: isDark ? '#ffffff' : '#000000',
                borderColor: isDark ? '#444444' : '#e0e0e0'
              }
            ]}
            placeholder="Email"
            placeholderTextColor={isDark ? '#aaaaaa' : '#888888'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#333333' : '#f5f5f5',
                color: isDark ? '#ffffff' : '#000000',
                borderColor: isDark ? '#444444' : '#e0e0e0'
              }
            ]}
            placeholder="Password"
            placeholderTextColor={isDark ? '#aaaaaa' : '#888888'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={[styles.linkText, { color: isDark ? '#4dabf7' : '#0066cc' }]}>
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.linkButton, styles.debugLink]}
            onPress={() => router.push('/debug/network')}
          >
            <Text style={[styles.linkText, { color: isDark ? '#f48fb1' : '#e91e63' }]}>
              Network Issues? Debug Connection
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  debugLink: {
    marginTop: 24,
    padding: 8,
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    borderRadius: 8,
  },
}); 