import { useState } from 'react';
import { Box, Button, TextInput, Textarea, NumberInput, Group, Stepper, Paper, Text } from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { useRouter } from 'next/navigation';
import ExerciseSelector from '../exercise-selector';
import SetRecorder from '../set-recorder';

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
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [workout, setWorkout] = useState({
    name: '',
    date: new Date(),
    start_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    duration: 60,
    notes: ''
  });
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleWorkoutInfoChange = (field: string, value: any) => {
    setWorkout({ ...workout, [field]: value });
  };
  
  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
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
      alert('Please add at least one exercise with sets');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create workout
      const workoutResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workouts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: workout.name,
          date: workout.date.toISOString().split('T')[0],
          start_time: workout.start_time,
          duration: workout.duration,
          notes: workout.notes
        })
      });
      
      if (!workoutResponse.ok) {
        throw new Error('Failed to create workout');
      }
      
      const workoutData = await workoutResponse.json();
      
      // Create workout sets
      await Promise.all(workoutSets.map(set => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workouts/${workoutData.id}/sets/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            exercise: set.exercise_id,
            weight: set.weight,
            reps: set.reps,
            duration: set.duration,
            notes: set.notes
          })
        })
      ));
      
      // Redirect to workout detail or history
      router.push('/workouts/history');
      
    } catch (error) {
      console.error('Error creating workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={20}>
      <Stepper active={activeStep} onStepClick={setActiveStep} maw={800}>
        <Stepper.Step
          label="Workout Info"
          description="Basic details"
          allowStepSelect={true}
        >
          <Paper p={20} mt={20} withBorder>
            <TextInput
              label="Workout Name"
              placeholder="e.g., Monday Upper Body"
              value={workout.name}
              onChange={(e) => handleWorkoutInfoChange('name', e.target.value)}
              required
              mb={15}
            />
            
            <Group grow mb={15}>
              <DateInput
                label="Date"
                placeholder="Select date" 
                value={workout.date}
                onChange={(value) => handleWorkoutInfoChange('date', value)}
                required
              />
              
              <TimeInput
                label="Start Time"
                withAsterisk
                value={workout.start_time}
                onChange={(value) => handleWorkoutInfoChange('start_time', value || '')}
              />
            </Group>
            
            <NumberInput
              label="Duration (minutes)"
              value={workout.duration}
              onChange={(value) => handleWorkoutInfoChange('duration', value)}
              required
              min={1}
              mb={15}
            />
            
            <Textarea
              label="Notes (optional)"
              placeholder="Any additional information about this workout"
              value={workout.notes}
              onChange={(e) => handleWorkoutInfoChange('notes', e.target.value)}
              autosize
              minRows={3}
              maxRows={6}
              mb={15}
            />
            
            <Button 
              mt={10} 
              onClick={() => setActiveStep(1)}
              disabled={!workout.name || !workout.date || !workout.start_time}
            >
              Next Step
            </Button>
          </Paper>
        </Stepper.Step>
        
        <Stepper.Step
          label="Select Exercise"
          description="Choose exercises"
          allowStepSelect={activeStep > 0}
        >
          <Paper p={20} mt={20} withBorder>
            <ExerciseSelector onSelectExercise={handleSelectExercise} />
          </Paper>
        </Stepper.Step>
        
        <Stepper.Step
          label="Record Sets"
          description="Log your sets"
          allowStepSelect={selectedExercise !== null}
        >
          <Paper p={20} mt={20} withBorder>
            {selectedExercise && (
              <SetRecorder
                exerciseId={selectedExercise.id}
                exerciseName={selectedExercise.name}
                isCardio={selectedExercise.is_cardio}
                onSaveSets={handleSaveSets}
              />
            )}
          </Paper>
        </Stepper.Step>
        
        <Stepper.Completed>
          <Paper p={20} mt={20} withBorder>
            <Text size="lg" fw={500} mb={15}>Workout Summary</Text>
            
            <Box mb={20}>
              <Text fw={500}>{workout.name}</Text>
              <Text size="sm">
                {workout.date.toLocaleDateString()} at {workout.start_time}
              </Text>
              <Text size="sm">{workout.duration} minutes</Text>
              {workout.notes && <Text size="sm" fs="italic">{workout.notes}</Text>}
            </Box>
            
            <Text fw={500} mb={10}>Exercises:</Text>
            {workoutSets.length === 0 ? (
              <Text c="dimmed">No exercises added yet</Text>
            ) : (
              <Box>
                {/* Group sets by exercise */}
                {Array.from(new Set(workoutSets.map(set => set.exercise_id))).map((exerciseId, index) => (
                  <Box key={exerciseId} mb={10}>
                    <Text>{index + 1}. Exercise {exerciseId}</Text>
                    <Text size="sm">{workoutSets.filter(set => set.exercise_id === exerciseId).length} sets</Text>
                  </Box>
                ))}
              </Box>
            )}
            
            <Group justify="space-between" mt={20}>
              <Button variant="outline" onClick={() => setActiveStep(1)}>
                Add More Exercises
              </Button>
              
              <Button 
                color="green" 
                onClick={handleSubmitWorkout}
                loading={isSubmitting}
                disabled={workoutSets.length === 0}
              >
                Save Workout
              </Button>
            </Group>
          </Paper>
        </Stepper.Completed>
      </Stepper>
    </Box>
  );
} 