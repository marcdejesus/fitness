import { useState, useEffect } from 'react';
import { Input, Button, Box, Text, Stack, Grid, Alert } from '@mantine/core';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/contexts/auth-context';
import { IconAlertCircle, IconSearch } from '@tabler/icons-react';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment_needed: string;
  is_cardio: boolean;
}

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
}

// Mock exercises to use as fallback when API fails
const MOCK_EXERCISES: Exercise[] = [
  {
    id: 'mock-1',
    name: 'Bench Press',
    muscle_group: 'Chest',
    equipment_needed: 'Barbell',
    is_cardio: false
  },
  {
    id: 'mock-2',
    name: 'Squat',
    muscle_group: 'Legs',
    equipment_needed: 'Barbell',
    is_cardio: false
  },
  {
    id: 'mock-3',
    name: 'Deadlift',
    muscle_group: 'Back',
    equipment_needed: 'Barbell',
    is_cardio: false
  },
  {
    id: 'mock-4',
    name: 'Running',
    muscle_group: 'Cardio',
    equipment_needed: 'None',
    is_cardio: true
  },
  {
    id: 'mock-5',
    name: 'Pull-up',
    muscle_group: 'Back',
    equipment_needed: 'Pull-up Bar',
    is_cardio: false
  },
  {
    id: 'mock-6',
    name: 'Push-up',
    muscle_group: 'Chest',
    equipment_needed: 'None',
    is_cardio: false
  },
  {
    id: 'mock-7',
    name: 'Bicep Curl',
    muscle_group: 'Arms',
    equipment_needed: 'Dumbbells',
    is_cardio: false
  },
  {
    id: 'mock-8',
    name: 'Shoulder Press',
    muscle_group: 'Shoulders',
    equipment_needed: 'Dumbbells',
    is_cardio: false
  },
  {
    id: 'mock-9',
    name: 'Lat Pulldown',
    muscle_group: 'Back',
    equipment_needed: 'Cable Machine',
    is_cardio: false
  },
  {
    id: 'mock-10',
    name: 'Leg Press',
    muscle_group: 'Legs',
    equipment_needed: 'Machine',
    is_cardio: false
  },
  {
    id: 'mock-11',
    name: 'Tricep Extension',
    muscle_group: 'Arms',
    equipment_needed: 'Cable',
    is_cardio: false
  },
  {
    id: 'mock-12',
    name: 'Cycling',
    muscle_group: 'Cardio',
    equipment_needed: 'Bike',
    is_cardio: true
  }
];

export default function ExerciseSelector({ onSelectExercise }: ExerciseSelectorProps) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      setError(null);
      
      // Check if token exists
      if (!token) {
        console.log('No token available, using mock exercises');
        setError("You must be logged in to view exercises. Using mock data instead.");
        setExercises(MOCK_EXERCISES);
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Define all URL formats to try
      const urlFormats = [
        `${apiUrl}/api/workouts/exercises`,
        `${apiUrl}/api/workouts/exercises/`,
        `${apiUrl}/api/exercises`,
        `${apiUrl}/api/exercises/`,
        `${apiUrl}/api/workouts/exercise`,
        `${apiUrl}/api/workouts/exercise/`
      ];
      
      // Use Token format consistently
      const authHeader = `Token ${token}`;
      
      const errors: string[] = [];
      let success = false;
      
      // Try all URL formats with Token auth
      for (const url of urlFormats) {
        if (success) continue; // Skip if we already succeeded
        
        try {
          console.log(`Trying ${url} with Token format...`);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`Response status for ${url}: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Success with ${url}!`);
            console.log('Data received:', data);
            
            // Check if data is in expected format
            if (Array.isArray(data) && data.length > 0 && 'name' in data[0]) {
              setExercises(data);
              success = true;
              break;
            } else {
              const errorMsg = `API returned unexpected data format from ${url}`;
              console.error(errorMsg);
              errors.push(errorMsg);
            }
          } else {
            const errorText = await response.text();
            const errorMessage = `API Error for ${url}: ${response.status} - ${errorText}`;
            console.error(errorMessage);
            errors.push(errorMessage);
          }
        } catch (error) {
          const errorMessage = `Network error for ${url}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }
      
      // If all attempts failed, check if we have 403/404 errors and provide mock data
      if (!success) {
        console.error('All URL formats failed:', JSON.stringify(errors));
        
        // Check if we have authentication issues (401/403)
        const hasAuthIssue = errors.some(err => err.includes('403') || err.includes('401'));
        
        // Check if endpoints don't exist (404)
        const hasEndpointIssue = errors.some(err => err.includes('404'));
        
        if (hasAuthIssue) {
          console.log('Authentication issues detected, using mock exercises');
          setError("Authentication failed. Your session may have expired. Using mock data instead.");
          // Provide mock exercises as fallback
          setExercises(MOCK_EXERCISES);
        } else if (hasEndpointIssue) {
          console.log('Endpoint issues detected, using mock exercises');
          setError("Exercise API endpoints not found. Using mock data instead.");
          // Provide mock exercises as fallback
          setExercises(MOCK_EXERCISES);
        } else {
          console.log('Unknown error, using mock exercises');
          setError("Failed to fetch exercises. Using mock data instead.");
          setExercises(MOCK_EXERCISES);
        }
      }
      
      setLoading(false);
    };

    fetchExercises();
  }, [token]);

  // Filter exercises based on search query and selected muscle group
  useEffect(() => {
    if (!exercises.length) {
      setFilteredExercises([]);
      return;
    }

    let filtered = [...exercises];

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(query) || 
        exercise.muscle_group.toLowerCase().includes(query)
      );
    }

    if (selectedMuscleGroup) {
      filtered = filtered.filter(exercise => 
        exercise.muscle_group.toLowerCase() === selectedMuscleGroup.toLowerCase()
      );
    }

    setFilteredExercises(filtered);
  }, [exercises, debouncedSearchQuery, selectedMuscleGroup]);

  // Get unique muscle groups for filtering
  const muscleGroups = exercises.length 
    ? Array.from(new Set(exercises.map(exercise => exercise.muscle_group)))
    : [];

  return (
    <Box>
      <Text fw={500} size="xl" mb={15}>Select Exercise</Text>
      
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Notice" 
          color="blue" 
          mb={15}
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <Stack gap="md">
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          disabled={loading}
        />
        
        <Box>
          <Text fw={500} mb={10}>Filter by Muscle Group</Text>
          <Grid>
            {muscleGroups.map(group => (
              <Grid.Col span={6} key={group}>
                <Button
                  variant={selectedMuscleGroup === group ? "filled" : "outline"}
                  onClick={() => setSelectedMuscleGroup(selectedMuscleGroup === group ? null : group)}
                  fullWidth
                  size="xs"
                >
                  {group}
                </Button>
              </Grid.Col>
            ))}
          </Grid>
        </Box>
        
        {loading ? (
          <Text ta="center">Loading exercises...</Text>
        ) : filteredExercises.length > 0 ? (
          <Stack gap="xs">
            {filteredExercises.map(exercise => (
              <Button
                key={exercise.id}
                variant="light"
                onClick={() => onSelectExercise(exercise)}
                fullWidth
                justify="flex-start"
              >
                <Box>
                  <Text>{exercise.name}</Text>
                  <Text size="xs" c="dimmed">
                    {exercise.muscle_group} • {exercise.equipment_needed} • {exercise.is_cardio ? 'Cardio' : 'Strength'}
                  </Text>
                </Box>
              </Button>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed" ta="center">
            {exercises.length > 0 
              ? 'No exercises match your search criteria' 
              : 'No exercises available'}
          </Text>
        )}
      </Stack>
    </Box>
  );
}