import { useState, useEffect, useRef } from 'react';
import { Box, Button, NumberInput, TextInput, Group, Table, ActionIcon, Text, Alert } from '@mantine/core';
import { IconTrash, IconPlus, IconAlertCircle } from '@tabler/icons-react';

interface WorkoutSet {
  id?: string;
  exercise_id: string;
  weight?: number;
  reps?: number;
  duration?: number;
  notes?: string;
}

interface SetRecorderProps {
  exerciseId: string;
  exerciseName: string;
  isCardio: boolean;
  onSaveSets: (sets: WorkoutSet[]) => void;
  initialSets?: WorkoutSet[];
}

export default function SetRecorder({ 
  exerciseId, 
  exerciseName, 
  isCardio, 
  onSaveSets, 
  initialSets = [] 
}: SetRecorderProps) {
  // Use a ref to store the initial sets to avoid re-renders
  const initialSetsRef = useRef<WorkoutSet[]>(initialSets);
  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);
  // Use a ref to track the previous exerciseId
  const prevExerciseIdRef = useRef(exerciseId);
  
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [currentSet, setCurrentSet] = useState<WorkoutSet>({ exercise_id: exerciseId });
  const [error, setError] = useState<string | null>(null);
  
  // Initialize sets only once on mount or when exerciseId changes
  useEffect(() => {
    // Only run initialization logic on first render
    if (isFirstRender.current) {
      if (initialSetsRef.current.length > 0) {
        setSets(initialSetsRef.current);
      }
      isFirstRender.current = false;
      return;
    }
    
    // If exerciseId changes, reset the current set
    if (prevExerciseIdRef.current !== exerciseId) {
      setCurrentSet({ exercise_id: exerciseId });
      prevExerciseIdRef.current = exerciseId;
    }
  }, [exerciseId]);

  const addSet = () => {
    setError(null);
    
    // Validate input
    if (!isCardio && (!currentSet.weight || !currentSet.reps)) {
      setError('Weight and reps are required for strength exercises');
      return;
    } else if (isCardio && !currentSet.duration) {
      setError('Duration is required for cardio exercises');
      return;
    }
    
    const newSet = {
      ...currentSet,
      id: `temp-${Date.now()}`
    };
    
    setSets(prevSets => [...prevSets, newSet]);
    setCurrentSet({ exercise_id: exerciseId });
  };
  
  const removeSet = (index: number) => {
    setSets(prevSets => {
      const newSets = [...prevSets];
      newSets.splice(index, 1);
      return newSets;
    });
  };
  
  const saveSets = () => {
    if (sets.length === 0) {
      setError('Please add at least one set before saving');
      return;
    }
    
    // Make sure exercise ID is included in sets for proper server handling
    const setsWithExerciseId = sets.map(set => ({
      ...set,
      exercise_id: exerciseId // Include the exercise ID for backend association
    }));
    
    onSaveSets(setsWithExerciseId);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSet();
    }
  };
  
  return (
    <Box>
      <Text fw={500} size="xl" mb={10}>{exerciseName}</Text>
      
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Error" 
          color="red" 
          mb={15}
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {sets.length > 0 ? (
        <Table striped mb={20}>
          <thead>
            <tr>
              <th>#</th>
              {!isCardio && <th>Weight</th>}
              {!isCardio && <th>Reps</th>}
              {isCardio && <th>Duration (min)</th>}
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, index) => (
              <tr key={set.id}>
                <td>{index + 1}</td>
                {!isCardio && (
                  <td>{set.weight || '-'}</td>
                )}
                {!isCardio && (
                  <td>{set.reps || '-'}</td>
                )}
                {isCardio && (
                  <td>{set.duration || '-'}</td>
                )}
                <td>{set.notes || ''}</td>
                <td>
                  <ActionIcon color="red" onClick={() => removeSet(index)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Text c="dimmed" mb={20} size="sm" ta="center">
          No sets added yet. Use the form below to add your first set.
        </Text>
      )}
      
      <Box mb={20}>
        <Text fw={500} mb={10}>Add New Set</Text>
        <Group gap="xs" align="flex-end">
          {!isCardio && (
            <NumberInput
              label="Weight"
              value={currentSet.weight || ''}
              onChange={(value) => setCurrentSet(prev => ({ ...prev, weight: Number(value) }))}
              min={0}
              step={2.5}
              decimalScale={1}
              w={120}
              onKeyDown={handleKeyDown}
              aria-label="Weight"
            />
          )}
          {!isCardio && (
            <NumberInput
              label="Reps"
              value={currentSet.reps || ''}
              onChange={(value) => setCurrentSet(prev => ({ ...prev, reps: Number(value) }))}
              min={1}
              w={120}
              onKeyDown={handleKeyDown}
              aria-label="Reps"
            />
          )}
          {isCardio && (
            <NumberInput
              label="Duration (min)"
              value={currentSet.duration || ''}
              onChange={(value) => setCurrentSet(prev => ({ ...prev, duration: Number(value) }))}
              min={1}
              decimalScale={1}
              w={120}
              onKeyDown={handleKeyDown}
              aria-label="Duration"
            />
          )}
          <TextInput
            label="Notes (optional)"
            value={currentSet.notes || ''}
            onChange={(e) => setCurrentSet(prev => ({ ...prev, notes: e.target.value }))}
            w={200}
            onKeyDown={handleKeyDown}
          />
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={addSet}
            disabled={(!isCardio && (!currentSet.weight || !currentSet.reps)) || 
                     (isCardio && !currentSet.duration)}
          >
            Add Set
          </Button>
        </Group>
      </Box>
      
      <Group justify="flex-end">
        <Button 
          color="green" 
          onClick={saveSets}
          disabled={sets.length === 0}
        >
          Save Exercise
        </Button>
      </Group>
    </Box>
  );
}