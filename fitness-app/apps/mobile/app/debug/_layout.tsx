import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/theme-context';

export default function DebugLayout() {
  const { isDark } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: isDark ? '#121212' : '#F5F5F5',
        },
      }}
    >
      <Stack.Screen
        name="network"
        options={{
          title: 'Network Debug',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
} 