import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { workoutApi } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function CreateWorkoutScreen() {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWorkout = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be logged in to create a workout');
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const workout = await workoutApi.createWorkout(token, {
        id: '', // Will be assigned by the server
        name,
        date: today,
        notes,
      });
      
      Alert.alert('Success', 'Workout created successfully');
      router.push(`/workout/${workout.id}`);
    } catch (error: any) {
      console.error('Error creating workout:', error);
      Alert.alert('Error', error.message || 'Failed to create workout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Create Workout
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.formCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
          <Text style={[styles.label, { color: isDark ? '#ffffff' : '#000000' }]}>
            Workout Name
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
            placeholder="Enter workout name"
            placeholderTextColor={isDark ? '#aaaaaa' : '#888888'}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: isDark ? '#ffffff' : '#000000', marginTop: 16 }]}>
            Notes (Optional)
          </Text>
          <TextInput
            style={[
              styles.textArea,
              { 
                backgroundColor: isDark ? '#333333' : '#f5f5f5',
                color: isDark ? '#ffffff' : '#000000',
                borderColor: isDark ? '#444444' : '#e0e0e0'
              }
            ]}
            placeholder="Enter notes about this workout"
            placeholderTextColor={isDark ? '#aaaaaa' : '#888888'}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleCreateWorkout}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating...' : 'Create Workout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 