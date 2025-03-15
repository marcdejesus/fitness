import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { workoutApi } from '../../lib/api';
import { Workout } from '../../lib/api/workouts';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutsScreen() {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkouts = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const data = await workoutApi.getWorkouts(token);
      setWorkouts(data);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <TouchableOpacity 
      style={[styles.workoutCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}
      onPress={() => router.push(`/workout/${item.id}`)}
    >
      <View style={styles.workoutCardContent}>
        <View>
          <Text style={[styles.workoutName, { color: isDark ? '#ffffff' : '#000000' }]}>
            {item.name || 'Workout'}
          </Text>
          <Text style={[styles.workoutDate, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.workoutStats}>
          <Text style={[styles.workoutExercises, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            {item.sets?.length || 0} sets
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#bbbbbb' : '#666666'} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Workouts
        </Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/workout/create')}
        >
          <Ionicons name="add" size={22} color="#ffffff" />
          <Text style={styles.createButtonText}>New Workout</Text>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : workouts.length > 0 ? (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color="#4CAF50" />
          <Text style={[styles.emptyText, { color: isDark ? '#ffffff' : '#000000' }]}>
            No workouts found
          </Text>
          <Text style={[styles.emptySubtext, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            Start tracking your fitness journey by creating your first workout
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push('/workout/create')}
          >
            <Text style={styles.startButtonText}>Create Workout</Text>
          </TouchableOpacity>
        </View>
      )}
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
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContainer: {
    padding: 10,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  workoutCardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  workoutExercises: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
}); 