import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/auth-context';
import { useTheme } from '../../../contexts/theme-context';
import { workoutApi } from '../../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function AddSetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  
  const [exercises, setExercises] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [exerciseId, setExerciseId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    fetchExercises();
  }, [token]);

  const fetchExercises = async () => {
    if (!token) return;
    
    try {
      setIsLoadingExercises(true);
      const data = await workoutApi.getExercises(token);
      setExercises(data);
      if (data.length > 0) {
        setExerciseId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Error', 'Failed to load exercises. Please try again.');
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const handleAddSet = async () => {
    if (!token || !id) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    if (!exerciseId) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }

    // Validate that at least one of weight, reps, or duration is provided
    if (!weight && !reps && !duration) {
      Alert.alert('Error', 'Please provide at least one of: weight, reps, or duration');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const setData = {
        workout_id: id,
        exercise_id: exerciseId,
        weight: weight ? parseFloat(weight) : undefined,
        reps: reps ? parseInt(reps, 10) : undefined,
        duration: duration ? parseInt(duration, 10) : undefined,
        notes: notes || undefined
      };
      
      await workoutApi.createWorkoutSet(token, id, setData);
      Alert.alert('Success', 'Set added successfully');
      router.back();
    } catch (error: any) {
      console.error('Error adding set:', error);
      Alert.alert('Error', error.message || 'Failed to add set. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingExercises) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#000000' }]}>
          Loading exercises...
        </Text>
      </View>
    );
  }

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
          Add Set
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.formCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
          <Text style={[styles.formLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
            Exercise
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#333333' : '#f0f0f0' }]}>
            <Picker
              selectedValue={exerciseId}
              onValueChange={(itemValue) => setExerciseId(itemValue)}
              style={[styles.picker, { color: isDark ? '#ffffff' : '#000000' }]}
              dropdownIconColor={isDark ? '#ffffff' : '#000000'}
            >
              {exercises.map((exercise) => (
                <Picker.Item 
                  key={exercise.id} 
                  label={exercise.name} 
                  value={exercise.id} 
                />
              ))}
            </Picker>
          </View>

          <Text style={[styles.formLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
            Weight (kg)
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#333333' : '#f0f0f0',
                color: isDark ? '#ffffff' : '#000000'
              }
            ]}
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight"
            placeholderTextColor={isDark ? '#999999' : '#888888'}
            keyboardType="numeric"
          />

          <Text style={[styles.formLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
            Reps
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#333333' : '#f0f0f0',
                color: isDark ? '#ffffff' : '#000000'
              }
            ]}
            value={reps}
            onChangeText={setReps}
            placeholder="Enter reps"
            placeholderTextColor={isDark ? '#999999' : '#888888'}
            keyboardType="numeric"
          />

          <Text style={[styles.formLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
            Duration (seconds)
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: isDark ? '#333333' : '#f0f0f0',
                color: isDark ? '#ffffff' : '#000000'
              }
            ]}
            value={duration}
            onChangeText={setDuration}
            placeholder="Enter duration"
            placeholderTextColor={isDark ? '#999999' : '#888888'}
            keyboardType="numeric"
          />

          <Text style={[styles.formLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
            Notes (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { 
                backgroundColor: isDark ? '#333333' : '#f0f0f0',
                color: isDark ? '#ffffff' : '#000000'
              }
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this set"
            placeholderTextColor={isDark ? '#999999' : '#888888'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.addButton, isSubmitting && styles.disabledButton]}
            onPress={handleAddSet}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.addButtonText}>Add Set</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#8BC34A',
    opacity: 0.7,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
}); 