import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/auth-context';
import { ThemeProvider } from '../contexts/theme-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import CustomErrorBoundary from '../components/ErrorBoundary';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Root layout component that wraps the entire app
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <CustomErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <AuthGuard>
              <Slot />
            </AuthGuard>
          </SafeAreaProvider>
        </AuthProvider>
      </ThemeProvider>
    </CustomErrorBoundary>
  );
}

// Auth guard component to handle protected routes
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inDebugGroup = segments[0] === 'debug';

    // Allow access to debug screens without authentication
    if (inDebugGroup) {
      return;
    }

    if (!isAuthenticated && !inAuthGroup && !inOnboardingGroup) {
      // Redirect to the sign-in page if not authenticated
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && (inAuthGroup || inOnboardingGroup)) {
      // Redirect to the main app if authenticated and trying to access auth pages
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  return <>{children}</>;
}
