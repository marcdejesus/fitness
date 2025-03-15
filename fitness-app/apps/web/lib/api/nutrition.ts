import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FoodCategory {
  id: string;
  name: string;
  description: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  category_name: string;
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
  barcode: string;
  created_at: string;
  updated_at: string;
}

export interface UserFoodItem {
  id: string;
  user_id: string;
  food_item: string;
  food_item_details: FoodItem;
  is_favorite: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFoodItemData {
  name: string;
  brand?: string;
  category?: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  barcode?: string;
}

export interface NutritionGoal {
  id: string;
  user_id: string;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  fiber_target: number;
  sugar_target: number;
  sodium_target: number;
  goal_type: 'lose' | 'maintain' | 'gain';
  created_at: string;
  updated_at: string;
}

export interface UpdateNutritionGoalData {
  calorie_target?: number;
  protein_target?: number;
  carbs_target?: number;
  fat_target?: number;
  fiber_target?: number;
  sugar_target?: number;
  sodium_target?: number;
  goal_type?: 'lose' | 'maintain' | 'gain';
}

export interface MealType {
  id: string;
  name: string;
  order: number;
}

export interface MealEntry {
  id: string;
  user_id: string;
  food_item: string;
  food_item_details: FoodItem;
  meal_type: string;
  meal_type_name: string;
  date: string;
  time: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMealEntryData {
  food_item: string;
  meal_type: string;
  date?: string;
  time?: string;
  servings: number;
  notes?: string;
}

export interface DailyNutritionSummary {
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
  meals: {
    [key: string]: MealEntry[];
  };
}

export interface WeeklyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const nutritionApi = {
  // Food Categories
  getCategories: async (token: string): Promise<FoodCategory[]> => {
    try {
      console.log('Fetching categories from:', `${API_URL}/api/nutrition/categories/`);
      const response = await axios.get(`${API_URL}/api/nutrition/categories/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Categories response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
      }
      throw error;
    }
  },
  
  // Food Items
  searchFoods: async (token: string, query: string, category?: string, limit: number = 20): Promise<FoodItem[]> => {
    try {
      // Handle empty query case differently
      let url = '';
      if (!query && !category) {
        // If both query and category are empty, get all foods with a limit
        url = `${API_URL}/api/nutrition/foods/?limit=${limit}`;
      } else {
        // Otherwise use the search endpoint with parameters
        url = `${API_URL}/api/nutrition/foods/search/?limit=${limit}`;
        
        // Only add query param if it exists
        if (query) {
          url += `&q=${encodeURIComponent(query)}`;
        }
        
        // Only add category param if it exists
        if (category) {
          url += `&category=${encodeURIComponent(category)}`;
        }
      }
      
      console.log('Searching foods with URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching foods:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  getFoodById: async (token: string, id: string): Promise<FoodItem> => {
    const response = await axios.get(`${API_URL}/api/nutrition/foods/${id}/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  createCustomFood: async (token: string, data: CreateFoodItemData): Promise<FoodItem> => {
    try {
      console.log('Creating custom food with data:', data);
      const response = await axios.post(`${API_URL}/api/nutrition/foods/`, data, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating custom food:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
      }
      throw error;
    }
  },
  
  updateCustomFood: async (token: string, id: string, data: Partial<CreateFoodItemData>): Promise<FoodItem> => {
    const response = await axios.patch(`${API_URL}/api/nutrition/foods/${id}/`, data, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  deleteCustomFood: async (token: string, id: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/nutrition/foods/${id}/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  
  // Favorites
  getFavorites: async (token: string): Promise<FoodItem[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/nutrition/foods/favorites/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },
  
  addToFavorites: async (token: string, foodId: string): Promise<void> => {
    try {
      await axios.post(`${API_URL}/api/nutrition/foods/${foodId}/favorite/`, {}, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },
  
  removeFromFavorites: async (token: string, foodId: string): Promise<void> => {
    try {
      await axios.post(`${API_URL}/api/nutrition/foods/${foodId}/unfavorite/`, {}, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },
  
  // Custom Foods
  getCustomFoods: async (token: string): Promise<FoodItem[]> => {
    const response = await axios.get(`${API_URL}/api/nutrition/foods/custom/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  // Barcode Search
  searchByBarcode: async (token: string, barcode: string): Promise<FoodItem> => {
    const response = await axios.get(`${API_URL}/api/nutrition/foods/barcode/?code=${encodeURIComponent(barcode)}`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  // Nutrition Goals
  getCurrentGoal: async (token: string): Promise<NutritionGoal> => {
    try {
      const response = await axios.get(`${API_URL}/api/nutrition/goals/current/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nutrition goal:', error);
      throw error;
    }
  },
  
  updateGoal: async (token: string, data: UpdateNutritionGoalData): Promise<NutritionGoal> => {
    try {
      // Get current goal first
      const currentGoal = await nutritionApi.getCurrentGoal(token);
      
      // Update the goal
      const response = await axios.patch(`${API_URL}/api/nutrition/goals/${currentGoal.id}/`, data, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating nutrition goal:', error);
      throw error;
    }
  },
  
  // Meal Types
  getMealTypes: async (token: string): Promise<MealType[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/nutrition/meal-types/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching meal types:', error);
      throw error;
    }
  },
  
  seedMealTypes: async (token: string): Promise<void> => {
    await axios.get(`${API_URL}/api/nutrition/meal-types/seed/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  
  // Meal Entries
  getMealEntries: async (token: string, date?: string): Promise<MealEntry[]> => {
    try {
      let url = `${API_URL}/api/nutrition/meals/daily/`;
      if (date) {
        url += `?date=${encodeURIComponent(date)}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching meal entries:', error);
      throw error;
    }
  },
  
  createMealEntry: async (token: string, data: CreateMealEntryData): Promise<MealEntry> => {
    try {
      console.log('Creating meal entry with data:', data);
      
      // Ensure date is in the correct format (YYYY-MM-DD)
      if (data.date) {
        // No need to modify if already in correct format
        console.log('Using date:', data.date);
      }
      
      // Ensure time is in the correct format (HH:MM:SS) or add default
      if (!data.time) {
        // Add current time if not provided
        const now = new Date();
        data.time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
        console.log('Added default time:', data.time);
      }
      
      // Ensure servings is a number
      if (typeof data.servings !== 'number') {
        data.servings = Number(data.servings);
      }
      
      const response = await axios.post(`${API_URL}/api/nutrition/meals/`, data, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Meal entry created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating meal entry:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  updateMealEntry: async (token: string, id: string, data: Partial<CreateMealEntryData>): Promise<MealEntry> => {
    const response = await axios.patch(`${API_URL}/api/nutrition/meals/${id}/`, data, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },
  
  deleteMealEntry: async (token: string, id: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/nutrition/meals/${id}/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  
  // Nutrition Summary
  getDailySummary: async (token: string, date?: string): Promise<DailyNutritionSummary> => {
    try {
      let url = `${API_URL}/api/nutrition/meals/summary/`;
      if (date) {
        url += `?date=${encodeURIComponent(date)}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      throw error;
    }
  },
  
  getWeeklySummary: async (token: string): Promise<WeeklyNutritionData[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/nutrition/meals/weekly/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      throw error;
    }
  },
  
  getFrequentlyUsedFoods: async (token: string, limit: number = 10): Promise<FoodItem[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/nutrition/meals/frequently-used/?limit=${limit}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching frequently used foods:', error);
      throw error;
    }
  }
};

export default nutritionApi; 