import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { StatusBar } from 'expo-status-bar';
import LogoPlaceholder from '../../components/LogoPlaceholder';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();

  const handleSignUp = async () => {
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await signUp({ name, email, password });
      // Navigation is handled by the auth guard in _layout.tsx
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#ffffff' }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <LogoPlaceholder size={80} />
          <Text style={[styles.appName, { color: isDark ? '#ffffff' : '#000000' }]}>
            Fitness App
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            Create Account
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
            placeholder="Full Name"
            placeholderTextColor={isDark ? '#aaaaaa' : '#888888'}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
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
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#333333' : '#f5f5f5',
                color: isDark ? '#ffffff' : '#000000',
                borderColor: isDark ? '#444444' : '#e0e0e0'
              }
            ]}
            placeholder="Confirm Password"
            placeholderTextColor={isDark ? '#aaaaaa' : '#888888'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={[styles.linkText, { color: isDark ? '#4dabf7' : '#0066cc' }]}>
              Already have an account? Sign In
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
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: {
    fontSize: 22,
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
}); 