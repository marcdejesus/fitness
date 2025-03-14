"use client";

import { useState, useEffect } from 'react';
import { Box, Text, Paper, Group, Button, Stack, Accordion, Badge, Loader, Title, Container, Alert, Card, SimpleGrid, ThemeIcon } from '@mantine/core';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { IconAlertCircle, IconBarbell, IconCalendar, IconClock } from '@tabler/icons-react';

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
  duration: number;
  notes: string;
  sets: WorkoutSet[];
}

// Helper function to determine if a token is a JWT
const isJWT = (token: string): boolean => {
  // JWT tokens typically have 3 segments separated by dots
  return token.split('.').length === 3;
};

export default function WorkoutHistory() {
  const { token } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Try different URL formats for the workout history endpoint - without query params first
        const urlFormats = [
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/history`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/history`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/history/`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/history/`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/workouts/history/?days=90`,
          `${process.env.NEXT_PUBLIC_API_URL}/api/workouts/history/?days=90`
        ];
        
        let response = null;
        let errorMessages = [];
        let successfulUrl = '';
        let successfulFormat = '';
        
        // Try both token formats for each URL
        for (const url of urlFormats) {
          // Try with Token format
          try {
            console.log(`Trying workout history API URL: ${url} with Token format`);
            
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
              errorMessages.push(`API Error for ${url} with Token format: ${resp.status} - ${errorText}`);
            }
          } catch (err: any) {
            errorMessages.push(`Network error for ${url} with Token format: ${err.message}`);
          }
          
          // Try with Bearer format
          try {
            console.log(`Trying workout history API URL: ${url} with Bearer format`);
            
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
              errorMessages.push(`API Error for ${url} with Bearer format: ${resp.status} - ${errorText}`);
            }
          } catch (err: any) {
            errorMessages.push(`Network error for ${url} with Bearer format: ${err.message}`);
          }
        }
        
        if (!response) {
          console.error('All URL formats failed:', errorMessages);
          
          // Check if all errors are 403 or 404, which might indicate the endpoint doesn't exist
          const all403or404 = errorMessages.every(msg => 
            msg.includes('403') || msg.includes('404')
          );
          
          if (all403or404) {
            console.log('All endpoints returned 403 or 404, assuming no workouts available');
            setWorkouts([]);
            setLoading(false);
            return;
          }
          
          throw new Error('Failed to fetch workout history: All URL formats failed');
        }
        
        console.log(`Successfully fetched data from ${successfulUrl} with ${successfulFormat} format`);
        
        const data = await response.json();
        console.log('Workout history data received:', data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setWorkouts(data);
        } else if (data.results && Array.isArray(data.results)) {
          setWorkouts(data.results);
        } else if (data.workouts && Array.isArray(data.workouts)) {
          setWorkouts(data.workouts);
        } else {
          console.log('Unexpected data format:', data);
          setWorkouts([]);
        }
      } catch (error) {
        console.error('Error fetching workout history:', error);
        setError('Unable to load workout history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkoutHistory();
  }, [token]);
  
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
          icon={<IconAlertCircle size={16} />} 
          title="Error" 
          color="red" 
          variant="filled"
          mb={20}
        >
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()} variant="light" fullWidth>
          Try Again
        </Button>
      </Container>
    );
  }
  
  if (workouts.length === 0) {
    return (
      <Container size="lg" py={40}>
        <Card withBorder shadow="sm" p="xl" radius="md" style={{ textAlign: 'center' }}>
          <ThemeIcon size={60} radius={60} mx="auto" mb={20}>
            <IconBarbell size={30} />
          </ThemeIcon>
          <Title order={2} mb={10}>No Workouts Yet</Title>
          <Text size="lg" c="dimmed" mb={30}>
            You haven't logged any workouts yet. Start tracking your fitness journey today!
          </Text>
          <Button 
            component={Link} 
            href="/workouts/create" 
            size="lg" 
            radius="md"
            leftSection={<IconBarbell size={20} />}
          >
            Log Your First Workout
          </Button>
        </Card>
      </Container>
    );
  }
  
  // Group workouts by month for better organization
  const workoutsByMonth: Record<string, Workout[]> = {};
  
  workouts.forEach(workout => {
    const date = new Date(workout.date);
    const monthYear = format(date, 'MMMM yyyy');
    
    if (!workoutsByMonth[monthYear]) {
      workoutsByMonth[monthYear] = [];
    }
    
    workoutsByMonth[monthYear].push(workout);
  });
  
  return (
    <Container size="lg" py={30}>
      <Title order={2} mb={30}>Your Workout History</Title>
      
      {Object.entries(workoutsByMonth).map(([month, monthWorkouts]) => (
        <Box key={month} mb={40}>
          <Group mb={15}>
            <ThemeIcon size={32} radius="md" variant="light">
              <IconCalendar size={20} />
            </ThemeIcon>
            <Title order={3}>{month}</Title>
          </Group>
          
          <SimpleGrid cols={{ base: 1, sm: 1, md: 2 }} spacing="lg">
            {monthWorkouts.map(workout => (
              <Card key={workout.id} withBorder shadow="sm" radius="md" p="lg">
                <Card.Section withBorder inheritPadding py="xs">
                  <Group justify="space-between">
                    <Title order={4}>{workout.name}</Title>
                    <Badge size="lg" radius="sm">
                      {Array.from(new Set(workout.sets.map(set => set.exercise_name))).length} exercises
                    </Badge>
                  </Group>
                </Card.Section>
                
                <Group mt="md" mb="xs">
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm">{format(new Date(workout.date), 'EEEE, MMM d')}</Text>
                  </Group>
                  <Group gap="xs">
                    <IconClock size={16} />
                    <Text size="sm">{workout.duration} min</Text>
                  </Group>
                </Group>
                
                {workout.notes && (
                  <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                    {workout.notes}
                  </Text>
                )}
                
                <Box mb="md">
                  {Array.from(new Set(workout.sets.map(set => set.exercise_name)))
                    .slice(0, 3)
                    .map(exerciseName => (
                      <Text key={exerciseName} size="sm" mb={5}>
                        • {exerciseName}
                      </Text>
                    ))}
                  
                  {Array.from(new Set(workout.sets.map(set => set.exercise_name))).length > 3 && (
                    <Text size="sm" c="dimmed">
                      +{Array.from(new Set(workout.sets.map(set => set.exercise_name))).length - 3} more exercises
                    </Text>
                  )}
                </Box>
                
                <Button 
                  component={Link} 
                  href={`/workouts/${workout.id}`} 
                  variant="light" 
                  fullWidth
                  radius="md"
                >
                  View Details
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </Container>
  );
}