"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Text, 
  Paper, 
  Group, 
  Button, 
  Stack, 
  Divider, 
  Badge, 
  Loader, 
  Alert, 
  Container, 
  Title, 
  Card, 
  Grid, 
  ThemeIcon,
  Progress,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { format } from 'date-fns';
import { 
  IconArrowLeft, 
  IconAlertCircle, 
  IconCalendar, 
  IconClock, 
  IconNotes, 
  IconBarbell,
  IconWeight,
  IconRepeat,
  IconEdit,
  IconTrash,
  IconShare
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/auth-context';

interface WorkoutSet {
  id: string;
  exercise_name: string;
  weight?: number;
  reps?: number;
  duration?: number;
  notes?: string;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  start_time: string;
  duration: number;
  notes: string;
  sets: WorkoutSet[];
}

export default function WorkoutDetail() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchWorkout = async () => {
      if (!params?.id) {
        setError('No workout ID provided');
        setLoading(false);
        return;
      }
      
      if (!token) {
        setError('You need to be logged in to view workout details');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log(`Fetching workout with ID: ${params.id}`);
        
        // Try different URL formats with more variations
        const urlFormats = [
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/${params.id}/`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/${params.id}`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/detail/${params.id}/`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/detail/${params.id}`,
          // Legacy formats for backward compatibility
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/${params.id}/`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/${params.id}`
        ];
        
        let response = null;
        let errorMessages = [];
        let successfulUrl = '';
        let successfulFormat = '';
        
        // Try both token formats for each URL
        for (const url of urlFormats) {
          // Try with Token format
          try {
            console.log(`Trying API URL: ${url} with Token format`);
            
            const resp = await fetch(url, {
              headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`Response status for ${url} with Token format: ${resp.status}`);
            
            if (resp.ok) {
              response = resp;
              successfulUrl = url;
              successfulFormat = 'Token';
              break;
            } else {
              const errorText = await resp.text();
              console.error(`API Error for ${url} with Token format: ${resp.status} - ${errorText}`);
              errorMessages.push(`API Error for ${url} with Token format: ${resp.status} - ${errorText}`);
              
              // If we get a 401 Unauthorized, the token might be invalid or expired
              if (resp.status === 401) {
                console.log('Token authentication failed, will try Bearer format');
              }
            }
          } catch (err: any) {
            console.error(`Network error for ${url} with Token format:`, err);
            errorMessages.push(`Network error for ${url} with Token format: ${err.message}`);
          }
          
          // Try with Bearer format
          try {
            console.log(`Trying API URL: ${url} with Bearer format`);
            
            const resp = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`Response status for ${url} with Bearer format: ${resp.status}`);
            
            if (resp.ok) {
              response = resp;
              successfulUrl = url;
              successfulFormat = 'Bearer';
              break;
            } else {
              const errorText = await resp.text();
              console.error(`API Error for ${url} with Bearer format: ${resp.status} - ${errorText}`);
              errorMessages.push(`API Error for ${url} with Bearer format: ${resp.status} - ${errorText}`);
            }
          } catch (err: any) {
            console.error(`Network error for ${url} with Bearer format:`, err);
            errorMessages.push(`Network error for ${url} with Bearer format: ${err.message}`);
          }
        }
        
        if (!response) {
          console.error('All URL formats failed:', errorMessages);
          
          // Check if all errors are 403 or 404, which might indicate the workout doesn't exist
          const all403or404 = errorMessages.every(msg => 
            msg.includes('403') || msg.includes('404')
          );
          
          if (all403or404) {
            console.log('All endpoints returned 403 or 404, assuming workout does not exist');
            setError('Workout not found or you do not have permission to view it.');
            setWorkout(null);
            setLoading(false);
            return;
          }
          
          // Check if all errors are 401, which indicates authentication issues
          const all401 = errorMessages.every(msg => msg.includes('401'));
          if (all401) {
            console.log('All endpoints returned 401, authentication issue detected');
            setError('Authentication failed. Please log out and log in again.');
            setWorkout(null);
            setLoading(false);
            return;
          }
          
          throw new Error('Failed to fetch workout details: All URL formats failed');
        }
        
        console.log(`Successfully fetched data from ${successfulUrl} with ${successfulFormat} format`);
        
        const data = await response.json();
        console.log('Workout data received:', data);
        
        // Ensure the data has the expected structure and valid formats
        const processedData = {
          ...data,
          // Ensure sets is always an array
          sets: Array.isArray(data.sets) ? data.sets : [],
          // Ensure date is valid
          date: data.date || new Date().toISOString().split('T')[0],
          // Ensure start_time is valid
          start_time: data.start_time || '00:00',
          // Ensure duration is a number
          duration: typeof data.duration === 'number' ? data.duration : 0,
          // Ensure notes is a string
          notes: data.notes || ''
        };
        
        setWorkout(processedData);
      } catch (error) {
        console.error('Error fetching workout details:', error);
        setError('Unable to load workout details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkout();
  }, [params?.id, token]);
  
  if (loading) {
    return (
      <Container size="lg" py={40}>
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader size="lg" />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container size="lg" py={40}>
        <Alert 
          icon={<IconAlertCircle size={20} />} 
          title="Error" 
          color="red"
          variant="filled"
          mb={20}
        >
          {error}
        </Alert>
        <Button 
          leftSection={<IconArrowLeft size={16} />} 
          onClick={() => router.push('/workouts')}
          variant="light"
          fullWidth
        >
          Back to Workouts
        </Button>
      </Container>
    );
  }
  
  if (!workout) {
    return (
      <Container size="lg" py={40}>
        <Card withBorder shadow="sm" p="xl" radius="md" style={{ textAlign: 'center' }}>
          <ThemeIcon size={60} radius={60} mx="auto" mb={20} color="gray">
            <IconAlertCircle size={30} />
          </ThemeIcon>
          <Title order={2} mb={10}>Workout Not Found</Title>
          <Text size="lg" c="dimmed" mb={30}>
            The workout you're looking for doesn't exist or has been deleted.
          </Text>
          <Button 
            leftSection={<IconArrowLeft size={16} />} 
            onClick={() => router.push('/workouts')}
            size="lg"
          >
            Back to Workouts
          </Button>
        </Card>
      </Container>
    );
  }
  
  // Group sets by exercise
  const exerciseGroups: Record<string, WorkoutSet[]> = {};
  
  // Ensure workout.sets exists before trying to use forEach
  if (workout.sets && Array.isArray(workout.sets)) {
    workout.sets.forEach(set => {
      if (!exerciseGroups[set.exercise_name]) {
        exerciseGroups[set.exercise_name] = [];
      }
      exerciseGroups[set.exercise_name].push(set);
    });
  }

  // Calculate total volume (for strength exercises)
  const totalVolume = (workout.sets || []).reduce((total, set) => {
    if (set.weight && set.reps) {
      return total + (set.weight * set.reps);
    }
    return total;
  }, 0);

  // Calculate total cardio minutes
  const totalCardioMinutes = (workout.sets || []).reduce((total, set) => {
    if (set.duration) {
      return total + set.duration;
    }
    return total;
  }, 0);
  
  return (
    <Container size="lg" py={40}>
      {/* Header with navigation and actions */}
      <Group justify="space-between" mb={30}>
        <Button 
          leftSection={<IconArrowLeft size={16} />} 
          onClick={() => router.back()}
          variant="light"
        >
          Back
        </Button>
        
        <Group>
          <Tooltip label="Edit Workout">
            <ActionIcon variant="light" size="lg" radius="md">
              <IconEdit size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Share Workout">
            <ActionIcon variant="light" size="lg" radius="md">
              <IconShare size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete Workout">
            <ActionIcon variant="light" color="red" size="lg" radius="md">
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      
      {/* Workout Summary Card */}
      <Card withBorder shadow="sm" radius="md" p="xl" mb={30}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Title order={2} mb={15}>{workout.name}</Title>
            
            <Group mb={20}>
              <Group gap="xs">
                <ThemeIcon size={30} radius="md" variant="light">
                  <IconCalendar size={18} />
                </ThemeIcon>
                <Text>
                  {(() => {
                    try {
                      // Validate that workout.date is a valid date string
                      if (!workout.date) return 'No date available';
                      return format(new Date(workout.date), 'EEEE, MMMM d, yyyy');
                    } catch (error) {
                      console.error('Error formatting date:', error, workout.date);
                      return 'Invalid date format';
                    }
                  })()}
                </Text>
              </Group>
              
              <Group gap="xs">
                <ThemeIcon size={30} radius="md" variant="light">
                  <IconClock size={18} />
                </ThemeIcon>
                <Text>{workout.start_time} • {workout.duration} minutes</Text>
              </Group>
            </Group>
            
            {workout.notes && (
              <Group align="flex-start" mb={15}>
                <ThemeIcon size={30} radius="md" variant="light">
                  <IconNotes size={18} />
                </ThemeIcon>
                <Box>
                  <Text fw={500} mb={5}>Notes</Text>
                  <Text>{workout.notes}</Text>
                </Box>
              </Group>
            )}
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder radius="md" p="md">
              <Title order={4} mb={15}>Workout Stats</Title>
              
              <Stack gap="md">
                <Box>
                  <Group justify="space-between" mb={5}>
                    <Text size="sm">Exercises</Text>
                    <Text fw={500}>{Object.keys(exerciseGroups).length}</Text>
                  </Group>
                  <Progress value={(Object.keys(exerciseGroups).length / 10) * 100} size="sm" />
                </Box>
                
                <Box>
                  <Group justify="space-between" mb={5}>
                    <Text size="sm">Total Sets</Text>
                    <Text fw={500}>{workout.sets.length}</Text>
                  </Group>
                  <Progress value={(workout.sets.length / 20) * 100} size="sm" color="blue" />
                </Box>
                
                {totalVolume > 0 && (
                  <Box>
                    <Group justify="space-between" mb={5}>
                      <Text size="sm">Volume</Text>
                      <Text fw={500}>{totalVolume.toLocaleString()} lbs</Text>
                    </Group>
                    <Progress value={Math.min((totalVolume / 5000) * 100, 100)} size="sm" color="green" />
                  </Box>
                )}
                
                {totalCardioMinutes > 0 && (
                  <Box>
                    <Group justify="space-between" mb={5}>
                      <Text size="sm">Cardio</Text>
                      <Text fw={500}>{totalCardioMinutes} min</Text>
                    </Group>
                    <Progress value={Math.min((totalCardioMinutes / 60) * 100, 100)} size="sm" color="orange" />
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Card>
      
      {/* Exercises Section */}
      <Title order={3} mb={20}>
        <Group gap="xs">
          <IconBarbell size={24} />
          <span>Exercises</span>
        </Group>
      </Title>
      
      <Grid>
        {Object.entries(exerciseGroups).map(([exerciseName, sets]) => {
          const isCardio = sets.some(set => set.duration !== undefined);
          
          return (
            <Grid.Col key={exerciseName} span={{ base: 12, md: 6 }}>
              <Card withBorder shadow="sm" radius="md" p="lg" mb={20}>
                <Card.Section withBorder inheritPadding py="xs">
                  <Group justify="space-between">
                    <Title order={4}>{exerciseName}</Title>
                    <Badge size="lg" radius="sm" color={isCardio ? "orange" : "blue"}>
                      {isCardio ? "Cardio" : "Strength"}
                    </Badge>
                  </Group>
                </Card.Section>
                
                <Box mt={15}>
                  {sets.map((set, index) => {
                    const isCardio = set.duration !== undefined;
                    
                    return (
                      <Box key={set.id} mb={15}>
                        <Group justify="space-between" mb={5}>
                          <Group gap="xs">
                            <ThemeIcon size={24} radius="xl" variant="light">
                              {index + 1}
                            </ThemeIcon>
                            <Text fw={500}>Set {index + 1}</Text>
                          </Group>
                          
                          {set.notes && (
                            <Tooltip label={set.notes}>
                              <IconNotes size={16} style={{ opacity: 0.6 }} />
                            </Tooltip>
                          )}
                        </Group>
                        
                        <Group ml={32}>
                          {isCardio ? (
                            <Group gap="xs">
                              <IconClock size={16} />
                              <Text>{set.duration} minutes</Text>
                            </Group>
                          ) : (
                            <>
                              {set.weight && set.reps && (
                                <>
                                  <Group gap="xs">
                                    <IconWeight size={16} />
                                    <Text>{set.weight} lbs</Text>
                                  </Group>
                                  <Group gap="xs">
                                    <IconRepeat size={16} />
                                    <Text>{set.reps} reps</Text>
                                  </Group>
                                </>
                              )}
                            </>
                          )}
                        </Group>
                        
                        {index < sets.length - 1 && <Divider my={15} />}
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>
    </Container>
  );
} 