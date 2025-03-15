import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { workoutApi } from '../../lib/api';
import { Workout } from '../../lib/api/workouts';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const workouts = await workoutApi.getWorkoutHistory(token, 7);
      setRecentWorkouts(workouts.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: isDark ? '#ffffff' : '#000000' }]}>
          Hello, {user?.display_name || 'Fitness Enthusiast'}!
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#bbbbbb' : '#666666' }]}>
          Here's your fitness summary
        </Text>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            {recentWorkouts.length}
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            Recent Workouts
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            0
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            Meals Logged
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            0
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
            Goals Achieved
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Recent Workouts
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/workouts')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : recentWorkouts.length > 0 ? (
        <View>
          {recentWorkouts.map((workout: any, index) => (
            <TouchableOpacity 
              key={workout.id || index}
              style={[styles.workoutCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}
              onPress={() => router.push(`/workout/${workout.id}`)}
            >
              <View style={styles.workoutCardContent}>
                <View>
                  <Text style={[styles.workoutName, { color: isDark ? '#ffffff' : '#000000' }]}>
                    {workout.name || 'Workout'}
                  </Text>
                  <Text style={[styles.workoutDate, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                    {formatDate(workout.date)}
                  </Text>
                </View>
                <View style={styles.workoutStats}>
                  <Text style={[styles.workoutExercises, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                    {workout.exercises?.length || 0} exercises
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#bbbbbb' : '#666666'} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
          <Ionicons name="barbell-outline" size={48} color="#4CAF50" />
          <Text style={[styles.emptyStateText, { color: isDark ? '#ffffff' : '#000000' }]}>
            No recent workouts
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push('/(tabs)/workouts')}
          >
            <Text style={styles.startButtonText}>Start a Workout</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Nutrition Summary
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/nutrition')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.nutritionCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
        <View style={styles.nutritionHeader}>
          <Text style={[styles.nutritionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Today's Nutrition
          </Text>
          <TouchableOpacity 
            style={styles.addMealButton}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <Text style={styles.addMealButtonText}>Add Meal</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.nutritionStats}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: isDark ? '#ffffff' : '#000000' }]}>
              0
            </Text>
            <Text style={[styles.nutritionLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
              Calories
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: isDark ? '#ffffff' : '#000000' }]}>
              0g
            </Text>
            <Text style={[styles.nutritionLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
              Protein
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: isDark ? '#ffffff' : '#000000' }]}>
              0g
            </Text>
            <Text style={[styles.nutritionLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
              Carbs
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: isDark ? '#ffffff' : '#000000' }]}>
              0g
            </Text>
            <Text style={[styles.nutritionLabel, { color: isDark ? '#bbbbbb' : '#666666' }]}>
              Fat
            </Text>
          </View>
        </View>
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
    paddingTop: 15,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
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
  emptyState: {
    alignItems: 'center',
    padding: 30,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  nutritionCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addMealButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addMealButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  nutritionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 12,
  },
});
