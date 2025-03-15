import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { workoutApi } from '../../lib/api';
import { Workout, WorkoutSet } from '../../lib/api/workouts';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkout();
  }, [id, token]);

  const fetchWorkout = async () => {
    if (!id || !token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await workoutApi.getWorkoutById(token, id);
      setWorkout(data);
    } catch (error: any) {
      console.error(`Error fetching workout ${id}:`, error);
      setError(error.message || 'Failed to load workout');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderSets = (sets: WorkoutSet[] = []) => {
    if (sets.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            No sets recorded for this workout
          </Text>
        </View>
      );
    }

    return sets.map((set, index) => (
      <View 
        key={set.id || index} 
        style={[styles.setItem, { borderBottomColor: isDark ? '#333333' : '#e0e0e0' }]}
      >
        <View style={styles.setHeader}>
          <Text style={[styles.exerciseName, { color: isDark ? '#ffffff' : '#000000' }]}>
            {set.exercise_name || 'Exercise'}
          </Text>
          <Text style={[styles.setNumber, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            Set {index + 1}
          </Text>
        </View>
        <View style={styles.setDetails}>
          {set.weight && (
            <View style={styles.setDetail}>
              <Text style={[styles.setDetailLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                Weight
              </Text>
              <Text style={[styles.setDetailValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                {set.weight} kg
              </Text>
            </View>
          )}
          {set.reps && (
            <View style={styles.setDetail}>
              <Text style={[styles.setDetailLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                Reps
              </Text>
              <Text style={[styles.setDetailValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                {set.reps}
              </Text>
            </View>
          )}
          {set.duration && (
            <View style={styles.setDetail}>
              <Text style={[styles.setDetailLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                Duration
              </Text>
              <Text style={[styles.setDetailValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                {set.duration} sec
              </Text>
            </View>
          )}
        </View>
        {set.notes && (
          <Text style={[styles.setNotes, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            {set.notes}
          </Text>
        )}
      </View>
    ));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
        <Text style={[styles.errorText, { color: isDark ? '#ffffff' : '#000000' }]}>
          {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWorkout}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
          Workout Details
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push(`/workout/edit/${id}`)}
        >
          <Ionicons name="create-outline" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {workout && (
          <>
            <View style={[styles.workoutCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
              <Text style={[styles.workoutName, { color: isDark ? '#ffffff' : '#000000' }]}>
                {workout.name}
              </Text>
              <Text style={[styles.workoutDate, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                {formatDate(workout.date)}
              </Text>
              {workout.notes && (
                <Text style={[styles.workoutNotes, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                  {workout.notes}
                </Text>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Sets
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push(`/workout/${id}/add-set`)}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.addButtonText}>Add Set</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.setsCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
              {renderSets(workout.sets)}
            </View>
          </>
        )}
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workoutCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 16,
    marginBottom: 12,
  },
  workoutNotes: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  setsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  setItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  setNumber: {
    fontSize: 14,
  },
  setDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  setDetail: {
    marginRight: 24,
  },
  setDetailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  setDetailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  setNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
}); 