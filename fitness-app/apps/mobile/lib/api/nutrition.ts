import axios from 'axios';
import { API_URL } from './config';

// Create an axios instance with default settings
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper function to format error messages
const formatErrorMessage = (error: any): string => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (error.response.data && error.response.data.error) {
      return error.response.data.error;
    }
    if (error.response.data && error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response.data && typeof error.response.data === 'string') {
      return error.response.data;
    }
    return `Server error: ${error.response.status}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'Network error: Could not connect to the server. Please check your internet connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || 'An unknown error occurred';
  }
};

// Use the API_URL from config
// const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface FoodCategory {
  id: string;
  name: string;
  description?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  category_name?: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  is_verified: boolean;
  is_custom: boolean;
  created_by: string | null;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export interface MealType {
  id: string;
  name: string;
  order: number;
}

export interface MealEntry {
  id?: string;
  user_id?: string;
  food_item: string;
  food_item_details?: FoodItem;
  meal_type: string;
  meal_type_name?: string;
  date: string;
  time?: string;
  servings: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  calorie_progress: number;
  protein_progress: number;
  carbs_progress: number;
  fat_progress: number;
  meals: Record<string, MealEntry[]>;
}

export interface NutritionGoal {
  id?: string;
  user_id?: string;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  fiber_target?: number;
  sugar_target?: number;
  sodium_target?: number;
  goal_type?: string;
  created_at?: string;
  updated_at?: string;
}

const nutritionApi = {
  // Food Categories
  getCategories: async (token: string): Promise<FoodCategory[]> => {
    try {
      const response = await apiClient.get('/api/nutrition/categories/', {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching food categories:', formatErrorMessage(error));
      throw error;
    }
  },

  // Food Items
  searchFoods: async (token: string, query: string, categoryId?: string, limit: number = 10): Promise<FoodItem[]> => {
    try {
      const params: Record<string, string | number> = { limit };
      if (query) params.search = query;
      if (categoryId) params.category = categoryId;

      const response = await apiClient.get('/api/nutrition/foods/', {
        headers: {
          Authorization: `Token ${token}`,
        },
        params
      });
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else {
        console.log('Unexpected data format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error searching foods:', formatErrorMessage(error));
      throw error;
    }
  },

  getFoodById: async (token: string, id: string): Promise<FoodItem> => {
    try {
      const response = await apiClient.get(`/api/nutrition/foods/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching food ${id}:`, formatErrorMessage(error));
      throw error;
    }
  },

  createFood: async (token: string, food: Partial<FoodItem>): Promise<FoodItem> => {
    try {
      const response = await apiClient.post('/api/nutrition/foods/', food, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating food:', formatErrorMessage(error));
      throw error;
    }
  },

  // Favorites
  getFavorites: async (token: string): Promise<FoodItem[]> => {
    try {
      const response = await apiClient.get('/api/nutrition/foods/favorites/', {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching favorites:', formatErrorMessage(error));
      throw error;
    }
  },

  addToFavorites: async (token: string, foodId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/nutrition/foods/${foodId}/favorite/`, {}, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
    } catch (error: any) {
      console.error(`Error adding food ${foodId} to favorites:`, formatErrorMessage(error));
      throw error;
    }
  },

  removeFromFavorites: async (token: string, foodId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/nutrition/foods/${foodId}/unfavorite/`, {}, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
    } catch (error: any) {
      console.error(`Error removing food ${foodId} from favorites:`, formatErrorMessage(error));
      throw error;
    }
  },

  // Meal Types
  getMealTypes: async (token: string): Promise<MealType[]> => {
    try {
      const response = await apiClient.get('/api/nutrition/meal-types/', {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching meal types:', formatErrorMessage(error));
      throw error;
    }
  },

  // Meal Entries
  getMeals: async (token: string, date: string): Promise<MealEntry[]> => {
    try {
      const response = await apiClient.get('/api/nutrition/meals/', {
        headers: {
          Authorization: `Token ${token}`,
        },
        params: { date }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching meals for ${date}:`, formatErrorMessage(error));
      throw error;
    }
  },

  createMeal: async (token: string, meal: Partial<MealEntry>): Promise<MealEntry> => {
    try {
      const response = await apiClient.post('/api/nutrition/meals/', meal, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating meal:', formatErrorMessage(error));
      throw error;
    }
  },

  updateMeal: async (token: string, id: string, meal: Partial<MealEntry>): Promise<MealEntry> => {
    try {
      const response = await apiClient.patch(`/api/nutrition/meals/${id}/`, meal, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating meal ${id}:`, formatErrorMessage(error));
      throw error;
    }
  },

  deleteMeal: async (token: string, id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/nutrition/meals/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
    } catch (error: any) {
      console.error(`Error deleting meal ${id}:`, formatErrorMessage(error));
      throw error;
    }
  },

  // Daily Summary
  getDailySummary: async (token: string, date: string): Promise<DailySummary> => {
    try {
      const response = await apiClient.get('/api/nutrition/meals/summary/', {
        headers: {
          Authorization: `Token ${token}`,
        },
        params: { date }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching daily summary for ${date}:`, formatErrorMessage(error));
      throw error;
    }
  },

  // Nutrition Goals
  getNutritionGoals: async (token: string): Promise<NutritionGoal> => {
    try {
      const response = await apiClient.get('/api/nutrition/goals/', {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching nutrition goals:', formatErrorMessage(error));
      throw error;
    }
  },

  updateNutritionGoals: async (token: string, goals: Partial<NutritionGoal>): Promise<NutritionGoal> => {
    try {
      const response = await apiClient.patch('/api/nutrition/goals/', goals, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating nutrition goals:', formatErrorMessage(error));
      throw error;
    }
  }
};

export default nutritionApi; 