import { useState, useEffect } from 'react';
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
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [currentSet, setCurrentSet] = useState<WorkoutSet>({ exercise_id: exerciseId });
  const [error, setError] = useState<string | null>(null);
  
  // Initialize sets properly
  useEffect(() => {
    // Only set the state if initialSets has changed and is different from current sets
    // This prevents infinite loops by avoiding unnecessary state updates
    const initialSetsJson = JSON.stringify(initialSets);
    const currentSetsJson = JSON.stringify(sets);
    
    if (initialSetsJson !== currentSetsJson) {
      if (initialSets.length > 0) {
        setSets(initialSets);
      } else if (sets.length === 0) {
        // Only set empty array if sets is not already empty
        setSets([]);
      }
    }
    
    // Reset current set when exercise changes
    setCurrentSet({ exercise_id: exerciseId });
  }, [exerciseId, initialSets]);

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
    
    setSets([...sets, newSet]);
    setCurrentSet({ exercise_id: exerciseId });
  };
  
  const removeSet = (index: number) => {
    const newSets = [...sets];
    newSets.splice(index, 1);
    setSets(newSets);
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
              onChange={(value) => setCurrentSet({ ...currentSet, weight: Number(value) })}
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
              onChange={(value) => setCurrentSet({ ...currentSet, reps: Number(value) })}
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
              onChange={(value) => setCurrentSet({ ...currentSet, duration: Number(value) })}
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
            onChange={(e) => setCurrentSet({ ...currentSet, notes: e.target.value })}
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