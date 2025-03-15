import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { nutritionApi } from '../../lib/api';
import { DailySummary, MealEntry, MealType } from '../../lib/api/nutrition';
import { Ionicons } from '@expo/vector-icons';

export default function NutritionScreen() {
  const { token } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchNutritionData = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      
      // Format date as YYYY-MM-DD
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Fetch meal types
      const mealTypesData = await nutritionApi.getMealTypes(token);
      setMealTypes(mealTypesData);
      
      // Fetch daily summary
      const summary = await nutritionApi.getDailySummary(token, dateString);
      setDailySummary(summary);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionData();
  }, [token, selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNutritionData();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const renderMacroProgress = (current: number, target: number, label: string, color: string) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    
    return (
      <View style={styles.macroItem}>
        <View style={styles.macroLabelRow}>
          <Text style={[styles.macroLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
            {label}
          </Text>
          <Text style={[styles.macroValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            {current} / {target}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: isDark ? '#333333' : '#e0e0e0' }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    );
  };

  const renderMealSection = (mealType: MealType, entries: MealEntry[]) => {
    return (
      <View 
        key={mealType.id}
        style={[styles.mealSection, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}
      >
        <View style={styles.mealHeader}>
          <Text style={[styles.mealTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            {mealType.name}
          </Text>
          <TouchableOpacity 
            style={styles.addFoodButton}
            onPress={() => router.push(`/nutrition/add-food?mealTypeId=${mealType.id}`)}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.addFoodText}>Add Food</Text>
          </TouchableOpacity>
        </View>

        {entries.length > 0 ? (
          entries.map((entry) => (
            <View key={entry.id} style={styles.foodItem}>
              <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {entry.food_item_details?.name || 'Food Item'}
                </Text>
                <Text style={[styles.foodServings, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                  {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.foodNutrition}>
                <Text style={[styles.calorieText, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {entry.calories || 0} cal
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyMeal}>
            <Text style={[styles.emptyMealText, { color: isDark ? '#bbbbbb' : '#666666' }]}>
              No foods logged for {mealType.name.toLowerCase()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Nutrition
        </Text>
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)}>
          <Ionicons name="chevron-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={[styles.dateText, { color: isDark ? '#ffffff' : '#000000' }]}>
          {formatDate(selectedDate)}
        </Text>
        <TouchableOpacity onPress={() => changeDate(1)}>
          <Ionicons name="chevron-forward" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {dailySummary ? (
            <>
              <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
                <Text style={[styles.summaryTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                  Daily Summary
                </Text>
                
                {renderMacroProgress(
                  dailySummary.total_calories, 
                  dailySummary.calorie_goal, 
                  'Calories', 
                  '#4CAF50'
                )}
                
                {renderMacroProgress(
                  dailySummary.total_protein, 
                  dailySummary.protein_goal, 
                  'Protein (g)', 
                  '#2196F3'
                )}
                
                {renderMacroProgress(
                  dailySummary.total_carbs, 
                  dailySummary.carbs_goal, 
                  'Carbs (g)', 
                  '#FF9800'
                )}
                
                {renderMacroProgress(
                  dailySummary.total_fat, 
                  dailySummary.fat_goal, 
                  'Fat (g)', 
                  '#F44336'
                )}
              </View>

              {mealTypes.map((mealType) => {
                const mealEntries = dailySummary.meals[mealType.id] || [];
                return renderMealSection(mealType, mealEntries);
              })}
            </>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: isDark ? '#1E1E1E' : '#ffffff' }]}>
              <Ionicons name="nutrition-outline" size={64} color="#4CAF50" />
              <Text style={[styles.emptyStateTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                No nutrition data
              </Text>
              <Text style={[styles.emptyStateText, { color: isDark ? '#bbbbbb' : '#666666' }]}>
                Start tracking your nutrition by adding your first meal
              </Text>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => router.push('/nutrition/add-food')}
              >
                <Text style={styles.startButtonText}>Add Food</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    margin: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  macroItem: {
    marginBottom: 12,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  mealSection: {
    margin: 10,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  addFoodText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  foodServings: {
    fontSize: 12,
  },
  foodNutrition: {
    alignItems: 'flex-end',
  },
  calorieText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyMeal: {
    padding: 15,
    alignItems: 'center',
  },
  emptyMealText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyState: {
    margin: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
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