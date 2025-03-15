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

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment_needed: string;
  is_cardio: boolean;
  description?: string;
  instructions?: string;
  video_url?: string;
  image_url?: string;
}

export interface WorkoutSet {
  id?: string;
  exercise_id: string;
  exercise_name?: string;
  weight?: number;
  reps?: number;
  duration?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  start_time?: string;
  duration?: number;
  notes?: string;
  sets?: WorkoutSet[];
  exercises?: Exercise[];
}

const workoutApi = {
  // Exercise endpoints
  getExercises: async (token: string): Promise<Exercise[]> => {
    try {
      const response = await apiClient.get('/api/workouts/exercises/', {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching exercises:', formatErrorMessage(error));
      throw error;
    }
  },

  getExerciseById: async (token: string, id: string): Promise<Exercise> => {
    try {
      const response = await apiClient.get(`/api/workouts/exercises/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching exercise ${id}:`, formatErrorMessage(error));
      throw error;
    }
  },

  // Workout endpoints
  getWorkouts: async (token: string): Promise<Workout[]> => {
    try {
      const response = await apiClient.get('/api/workouts/workouts/', {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching workouts:', formatErrorMessage(error));
      throw error;
    }
  },

  getWorkoutHistory: async (token: string, days: number = 30): Promise<Workout[]> => {
    try {
      const response = await apiClient.get('/api/workouts/workouts/history/', {
        headers: {
          Authorization: `Token ${token}`,
        },
        params: {
          days: days
        }
      });
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else if (response.data.workouts && Array.isArray(response.data.workouts)) {
        return response.data.workouts;
      } else {
        console.log('Unexpected data format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching workout history:', formatErrorMessage(error));
      throw error;
    }
  },

  getWorkoutById: async (token: string, id: string): Promise<Workout> => {
    try {
      const response = await apiClient.get(`/api/workouts/workouts/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching workout ${id}:`, formatErrorMessage(error));
      throw error;
    }
  },

  createWorkout: async (token: string, workout: Workout): Promise<Workout> => {
    try {
      const response = await apiClient.post('/api/workouts/workouts/', workout, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating workout:', formatErrorMessage(error));
      throw error;
    }
  },

  updateWorkout: async (token: string, id: string, workout: Partial<Workout>): Promise<Workout> => {
    try {
      const response = await apiClient.patch(`/api/workouts/workouts/${id}/`, workout, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating workout ${id}:`, formatErrorMessage(error));
      throw error;
    }
  },

  deleteWorkout: async (token: string, id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/workouts/workouts/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
    } catch (error: any) {
      console.error(`Error deleting workout ${id}:`, formatErrorMessage(error));
      throw error;
    }
  },

  // Workout Set endpoints
  createWorkoutSet: async (token: string, workoutId: string, set: WorkoutSet): Promise<WorkoutSet> => {
    try {
      const response = await apiClient.post(`/api/workouts/workouts/${workoutId}/sets/`, set, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating workout set:', formatErrorMessage(error));
      throw error;
    }
  },

  updateWorkoutSet: async (token: string, id: string, set: Partial<WorkoutSet>): Promise<WorkoutSet> => {
    try {
      const response = await apiClient.patch(`/api/workouts/sets/${id}/`, set, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating workout set ${id}:`, formatErrorMessage(error));
      throw error;
    }
  },

  deleteWorkoutSet: async (token: string, id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/workouts/sets/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        }
      });
    } catch (error: any) {
      console.error(`Error deleting workout set ${id}:`, formatErrorMessage(error));
      throw error;
    }
  }
};

export default workoutApi; 