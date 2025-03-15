import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import AvatarPlaceholder from '../../components/AvatarPlaceholder';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isDark, theme, setTheme } = useTheme();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // Navigation is handled by the auth guard in _layout.tsx
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleThemeChange = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const renderSettingItem = (
    icon: string, 
    title: string, 
    onPress: () => void, 
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: isDark ? '#333333' : '#e0e0e0' }]} 
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={22} color={isDark ? '#bbbbbb' : '#666666'} />
        <Text style={[styles.settingTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          {title}
        </Text>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#bbbbbb' : '#666666'} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Profile
        </Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <View style={styles.profileInfo}>
          <AvatarPlaceholder 
            size={60} 
            name={user?.display_name || 'User'} 
          />
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: isDark ? '#ffffff' : '#000000' }]}>
              {user?.display_name || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: isDark ? '#bbbbbb' : '#666666' }]}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push('/profile/edit')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.settingsSection, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Settings
        </Text>

        {renderSettingItem(
          'moon-outline', 
          'Dark Mode', 
          () => {}, 
          <Switch
            value={theme === 'dark'}
            onValueChange={handleThemeChange}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor="#f4f3f4"
          />
        )}

        {renderSettingItem(
          'notifications-outline', 
          'Notifications', 
          () => router.push('/settings/notifications')
        )}

        {renderSettingItem(
          'lock-closed-outline', 
          'Privacy', 
          () => router.push('/settings/privacy')
        )}
      </View>

      <View style={[styles.settingsSection, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          App
        </Text>

        {renderSettingItem(
          'help-circle-outline', 
          'Help & Support', 
          () => router.push('/settings/help')
        )}

        {renderSettingItem(
          'information-circle-outline', 
          'About', 
          () => router.push('/settings/about')
        )}
        
        {renderSettingItem(
          'wifi-outline', 
          'Network Status', 
          () => router.push('/settings/network')
        )}
        
        {renderSettingItem(
          'bug-outline', 
          'Network Debug', 
          () => router.push('/debug/network')
        )}
      </View>

      <TouchableOpacity 
        style={[
          styles.signOutButton, 
          { opacity: isSigningOut ? 0.7 : 1 }
        ]}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        <Text style={styles.signOutText}>
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: isDark ? '#777777' : '#999999' }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileCard: {
    margin: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  settingsSection: {
    margin: 10,
    marginTop: 5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 15,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    marginLeft: 15,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
  },
}); 