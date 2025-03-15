"use client";

import { useState } from 'react';
import { 
  Box, 
  Button, 
  TextInput, 
  Textarea, 
  NumberInput, 
  Group, 
  Stepper, 
  Paper, 
  Text, 
  Container, 
  Title, 
  Card, 
  ThemeIcon, 
  SimpleGrid,
  Badge,
  Alert,
  Divider
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import ExerciseSelector from '../exercise-selector';
import SetRecorder from '../set-recorder';
import { 
  IconCalendarEvent, 
  IconClock, 
  IconNotes, 
  IconBarbell, 
  IconCheck, 
  IconAlertCircle,
  IconInfoCircle
} from '@tabler/icons-react';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment_needed: string;
  is_cardio: boolean;
}

interface WorkoutSet {
  id?: string;
  exercise_id: string;
  weight?: number;
  reps?: number;
  duration?: number;
  notes?: string;
}

export default function CreateWorkout() {
  const { token } = useAuth();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [workout, setWorkout] = useState({
    name: '',
    date: new Date(),
    start_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    duration: 60,
    notes: ''
  });
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  
  const handleWorkoutInfoChange = (field: string, value: any) => {
    setWorkout({ ...workout, [field]: value });
  };
  
  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setExerciseNames(prev => ({
      ...prev,
      [exercise.id]: exercise.name
    }));
    setActiveStep(2);
  };
  
  const handleSaveSets = (sets: WorkoutSet[]) => {
    // Map the sets to include the exercise_id
    const newSets = sets.map(set => ({
      ...set,
      exercise_id: selectedExercise!.id
    }));
    
    // Add new sets to existing workout sets
    setWorkoutSets([...workoutSets, ...newSets]);
    
    // Reset selected exercise and go back to exercise selection
    setSelectedExercise(null);
    setActiveStep(1);
  };
  
  const handleSubmitWorkout = async () => {
    if (workoutSets.length === 0) {
      setError('Please add at least one exercise with sets');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Format the date properly
      const formattedDate = workout.date.toISOString().split('T')[0];
      
      // Ensure start_time is in the correct format (HH:MM)
      // If it's already in the correct format, use it as is
      let formattedTime = workout.start_time;
      if (formattedTime.includes(':')) {
        // Make sure it's just HH:MM without seconds
        formattedTime = formattedTime.split(':').slice(0, 2).join(':');
      }
      
      console.log('Submitting workout with data:', {
        name: workout.name,
        date: formattedDate,
        start_time: formattedTime,
        duration: workout.duration,
        notes: workout.notes
      });
      
      // Create workout
      const workoutResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          name: workout.name,
          date: formattedDate,
          start_time: formattedTime,
          duration: workout.duration,
          notes: workout.notes
        })
      });
      
      if (!workoutResponse.ok) {
        const errorText = await workoutResponse.text();
        console.error(`API Error: ${workoutResponse.status} - ${errorText}`);
        throw new Error(`Failed to create workout: ${workoutResponse.status} - ${errorText}`);
      }
      
      const workoutData = await workoutResponse.json();
      console.log('Workout created successfully:', workoutData);
      
      // Create workout sets
      const setPromises = workoutSets.map(async (set, index) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/${workoutData.id}/sets/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
              exercise: set.exercise_id,
              set_number: index + 1,
              weight: set.weight || null,
              reps: set.reps || null,
              duration: set.duration || null,
              notes: set.notes || ''
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error for set: ${response.status} - ${errorText}`);
            return { success: false, error: errorText };
          }
          
          return { success: true };
        } catch (error: any) {
          console.error('Error creating set:', error);
          return { success: false, error: error.message };
        }
      });
      
      const setResults = await Promise.all(setPromises);
      const failedSets = setResults.filter(result => !result.success);
      
      if (failedSets.length > 0) {
        console.warn(`${failedSets.length} sets failed to save, but workout was created`);
      }
      
      // Redirect to workout detail or history
      router.push('/workouts');
      
    } catch (error: any) {
      console.error('Error creating workout:', error);
      setError(error.message || 'Failed to save workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container size="lg" py={30}>
      <Title order={2} mb={30}>Create New Workout</Title>
      
      <Stepper 
        active={activeStep} 
        onStepClick={setActiveStep} 
        color="blue"
        size="md"
        radius="md"
        mb={30}
      >
        <Stepper.Step
          label="Workout Info"
          description="Basic details"
          icon={<IconInfoCircle size={18} />}
          allowStepSelect={true}
        />
        
        <Stepper.Step
          label="Select Exercise"
          description="Choose exercises"
          icon={<IconBarbell size={18} />}
          allowStepSelect={activeStep > 0}
        />
        
        <Stepper.Step
          label="Record Sets"
          description="Log your sets"
          icon={<IconClock size={18} />}
          allowStepSelect={selectedExercise !== null}
        />
        
        <Stepper.Completed>
          <div></div>
        </Stepper.Completed>
      </Stepper>
      
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Error" 
          color="red" 
          mb={20}
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {activeStep === 0 && (
        <Card shadow="sm" radius="md" withBorder p="xl">
          <Title order={3} mb={20}>Workout Details</Title>
          
          <TextInput
            label="Workout Name"
            placeholder="e.g., Monday Upper Body"
            value={workout.name}
            onChange={(e) => handleWorkoutInfoChange('name', e.target.value)}
            required
            mb={20}
            size="md"
            radius="md"
            leftSection={<IconBarbell size={18} />}
          />
          
          <SimpleGrid cols={{ base: 1, sm: 2 }} mb={20}>
            <DateInput
              label="Date"
              placeholder="Select date" 
              value={workout.date}
              onChange={(value) => handleWorkoutInfoChange('date', value)}
              required
              size="md"
              radius="md"
              leftSection={<IconCalendarEvent size={18} />}
            />
            
            <TimeInput
              label="Start Time"
              withAsterisk
              value={workout.start_time}
              onChange={(value) => handleWorkoutInfoChange('start_time', value || '')}
              size="md"
              radius="md"
              leftSection={<IconClock size={18} />}
              withSeconds={false}
            />
          </SimpleGrid>
          
          <NumberInput
            label="Duration (minutes)"
            value={workout.duration}
            onChange={(value) => handleWorkoutInfoChange('duration', value)}
            required
            min={1}
            mb={20}
            size="md"
            radius="md"
            aria-label="Duration (minutes)"
          />
          
          <Textarea
            label="Notes (optional)"
            placeholder="Any additional information about this workout"
            value={workout.notes}
            onChange={(e) => handleWorkoutInfoChange('notes', e.target.value)}
            autosize
            minRows={3}
            maxRows={6}
            mb={30}
            size="md"
            radius="md"
            leftSection={<IconNotes size={18} />}
          />
          
          <Group justify="flex-end">
            <Button 
              size="lg"
              radius="md"
              onClick={() => setActiveStep(1)}
              disabled={!workout.name || !workout.date || !workout.start_time}
            >
              Next Step
            </Button>
          </Group>
        </Card>
      )}
      
      {activeStep === 1 && (
        <Card shadow="sm" radius="md" withBorder p="xl">
          <Title order={3} mb={20}>Select Exercise</Title>
          <ExerciseSelector onSelectExercise={handleSelectExercise} />
          
          {workoutSets.length > 0 && (
            <Box mt={30}>
              <Divider my={20} />
              <Group justify="space-between">
                <Text fw={500} size="lg">
                  {workoutSets.length} sets added across {Array.from(new Set(workoutSets.map(set => set.exercise_id))).length} exercises
                </Text>
                <Button 
                  color="green" 
                  size="md"
                  radius="md"
                  leftSection={<IconCheck size={18} />}
                  onClick={() => setActiveStep(3)}
                >
                  Finish Workout
                </Button>
              </Group>
            </Box>
          )}
        </Card>
      )}
      
      {activeStep === 2 && (
        <Card shadow="sm" radius="md" withBorder p="xl">
          <Title order={3} mb={20}>
            Record Sets for {selectedExercise?.name}
          </Title>
          
          {selectedExercise && (
            <SetRecorder
              exerciseId={selectedExercise.id}
              exerciseName={selectedExercise.name}
              isCardio={selectedExercise.is_cardio}
              onSaveSets={handleSaveSets}
            />
          )}
        </Card>
      )}
      
      {activeStep === 3 && (
        <Card shadow="sm" radius="md" withBorder p="xl">
          <Group mb={20}>
            <ThemeIcon size={40} radius={40} color="green">
              <IconCheck size={24} />
            </ThemeIcon>
            <Title order={3}>Workout Summary</Title>
          </Group>
          
          <Card withBorder radius="md" mb={30}>
            <Group mb={15}>
              <ThemeIcon size={36} radius="md" variant="light">
                <IconBarbell size={20} />
              </ThemeIcon>
              <Title order={4}>{workout.name}</Title>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 3 }} mb={15}>
              <Group gap="xs">
                <IconCalendarEvent size={18} />
                <Text>{workout.date.toLocaleDateString()}</Text>
              </Group>
              
              <Group gap="xs">
                <IconClock size={18} />
                <Text>{workout.start_time}</Text>
              </Group>
              
              <Group gap="xs">
                <IconClock size={18} />
                <Text>{workout.duration} minutes</Text>
              </Group>
            </SimpleGrid>
            
            {workout.notes && (
              <Box mb={15}>
                <Group gap="xs" mb={5}>
                  <IconNotes size={18} />
                  <Text fw={500}>Notes</Text>
                </Group>
                <Text size="sm" fs="italic">{workout.notes}</Text>
              </Box>
            )}
          </Card>
          
          <Title order={4} mb={15}>Exercises</Title>
          
          {workoutSets.length === 0 ? (
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              No exercises added yet. Go back to add exercises and sets.
            </Alert>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb={30}>
              {Array.from(new Set(workoutSets.map(set => set.exercise_id))).map((exerciseId, index) => {
                const exerciseSets = workoutSets.filter(set => set.exercise_id === exerciseId);
                const exerciseName = exerciseNames[exerciseId] || `Exercise ${exerciseId}`;
                const isCardio = exerciseSets.some(set => set.duration !== undefined);
                
                return (
                  <Card key={exerciseId} withBorder shadow="sm" radius="md" p="md">
                    <Group justify="space-between" mb={10}>
                      <Group gap="xs">
                        <ThemeIcon size={28} radius="xl" variant="light">
                          {index + 1}
                        </ThemeIcon>
                        <Text fw={500}>{exerciseName}</Text>
                      </Group>
                      <Badge color={isCardio ? "orange" : "blue"}>
                        {isCardio ? "Cardio" : "Strength"}
                      </Badge>
                    </Group>
                    
                    <Divider mb={10} />
                    
                    <Box>
                      <Text size="sm" mb={5}>{exerciseSets.length} sets</Text>
                      
                      {exerciseSets.slice(0, 3).map((set, idx) => (
                        <Text key={idx} size="sm" c="dimmed">
                          Set {idx + 1}: {' '}
                          {set.weight && set.reps && `${set.weight} lbs × ${set.reps} reps`}
                          {set.duration && `${set.duration} min`}
                          {set.notes && ` (${set.notes})`}
                        </Text>
                      ))}
                      
                      {exerciseSets.length > 3 && (
                        <Text size="sm" c="dimmed">
                          +{exerciseSets.length - 3} more sets
                        </Text>
                      )}
                    </Box>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
          
          <Group justify="space-between">
            <Button 
              variant="light" 
              onClick={() => setActiveStep(1)}
              radius="md"
              leftSection={<IconBarbell size={16} />}
            >
              Add More Exercises
            </Button>
            
            <Button 
              color="green" 
              onClick={handleSubmitWorkout}
              loading={isSubmitting}
              size="lg"
              radius="md"
              leftSection={<IconCheck size={16} />}
            >
              Save Workout
            </Button>
          </Group>
        </Card>
      )}
    </Container>
  );
}