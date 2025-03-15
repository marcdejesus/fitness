"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  SimpleGrid,
  Stack,
  Paper,
  Divider,
  Loader,
  Alert,
  RingProgress,
  SegmentedControl,
  Box
} from '@mantine/core';
import { IconArrowLeft, IconInfoCircle, IconChartBar, IconChartLine, IconChartPie } from '@tabler/icons-react';
import nutritionApi, { WeeklyNutritionData, NutritionGoal, FoodItem } from '@/lib/api/nutrition';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function NutritionStatsPage() {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [weeklyData, setWeeklyData] = useState<WeeklyNutritionData[]>([]);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [frequentFoods, setFrequentFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<string>('bar');
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    
    loadData();
  }, [isAuthenticated, token]);
  
  const loadData = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Load weekly data
      const weeklyDataResponse = await nutritionApi.getWeeklySummary(token);
      setWeeklyData(weeklyDataResponse);
      
      // Load nutrition goal
      const goalResponse = await nutritionApi.getCurrentGoal(token);
      setNutritionGoal(goalResponse);
      
      // Load frequently used foods
      const frequentFoodsResponse = await nutritionApi.getFrequentlyUsedFoods(token, 5);
      setFrequentFoods(frequentFoodsResponse);
    } catch (err) {
      console.error('Error loading nutrition stats:', err);
      setError('Failed to load nutrition statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEE');
  };
  
  const calculateAverages = () => {
    if (weeklyData.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const totals = weeklyData.reduce((acc, day) => {
      return {
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    return {
      calories: Math.round(totals.calories / weeklyData.length),
      protein: Number((totals.protein / weeklyData.length).toFixed(1)),
      carbs: Number((totals.carbs / weeklyData.length).toFixed(1)),
      fat: Number((totals.fat / weeklyData.length).toFixed(1))
    };
  };
  
  const prepareChartData = () => {
    return weeklyData.map(day => ({
      date: formatDate(day.date),
      calories: day.calories,
      protein: Number(day.protein),
      carbs: Number(day.carbs),
      fat: Number(day.fat)
    }));
  };
  
  const prepareMacrosPieData = () => {
    const averages = calculateAverages();
    return [
      { name: 'Protein', value: averages.protein * 4, color: '#228be6' },
      { name: 'Carbs', value: averages.carbs * 4, color: '#40c057' },
      { name: 'Fat', value: averages.fat * 9, color: '#fab005' }
    ];
  };
  
  const averages = calculateAverages();
  const chartData = prepareChartData();
  const macrosPieData = prepareMacrosPieData();
  
  if (!isAuthenticated) {
    return null;
  }
  
  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Group justify="space-between" mb="md">
          <Title order={2}>Nutrition Statistics</Title>
          <Button 
            variant="subtle" 
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/nutrition')}
          >
            Back to Tracker
          </Button>
        </Group>
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader size="lg" />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>Nutrition Statistics</Title>
        <Button 
          variant="subtle" 
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.push('/nutrition')}
        >
          Back to Tracker
        </Button>
      </Group>
      
      {error && (
        <Alert color="red" title="Error" mb="md">
          {error}
        </Alert>
      )}
      
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="md">Weekly Averages</Title>
          <Group grow mb="md">
            <RingProgress
              size={160}
              thickness={16}
              label={
                <Text ta="center" size="lg" fw={700}>
                  {nutritionGoal ? Math.round((averages.calories / nutritionGoal.calorie_target) * 100) : 0}%
                </Text>
              }
              sections={[
                { 
                  value: nutritionGoal ? 
                    Math.min(Math.round((averages.calories / nutritionGoal.calorie_target) * 100), 100) : 0, 
                  color: 'blue' 
                }
              ]}
            />
            <Stack gap="xs">
              <Text fw={500}>Daily Average</Text>
              <Text size="xl" fw={700}>{averages.calories} cal</Text>
              <Text c="dimmed" size="sm">
                {nutritionGoal ? 
                  `${Math.abs(averages.calories - nutritionGoal.calorie_target)} calories ${averages.calories < nutritionGoal.calorie_target ? 'under' : 'over'} goal` : 
                  'No goal set'}
              </Text>
            </Stack>
          </Group>
          
          <Divider my="md" />
          
          <SimpleGrid cols={3} spacing="md">
            <Paper withBorder p="md" radius="md">
              <Text c="dimmed" size="xs">Protein</Text>
              <Text fw={700} size="lg">{averages.protein}g</Text>
              {nutritionGoal && (
                <Text size="xs" c="dimmed">
                  Goal: {nutritionGoal.protein_target}g
                </Text>
              )}
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text c="dimmed" size="xs">Carbs</Text>
              <Text fw={700} size="lg">{averages.carbs}g</Text>
              {nutritionGoal && (
                <Text size="xs" c="dimmed">
                  Goal: {nutritionGoal.carbs_target}g
                </Text>
              )}
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text c="dimmed" size="xs">Fat</Text>
              <Text fw={700} size="lg">{averages.fat}g</Text>
              {nutritionGoal && (
                <Text size="xs" c="dimmed">
                  Goal: {nutritionGoal.fat_target}g
                </Text>
              )}
            </Paper>
          </SimpleGrid>
        </Card>
        
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="md">Macronutrient Breakdown</Title>
          <Text c="dimmed" mb="md">Average daily calories from each macronutrient</Text>
          
          <Box h={240}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macrosPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {macrosPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} calories`} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          
          <SimpleGrid cols={3} mt="md">
            <Group>
              <Box w={12} h={12} bg="#228be6" />
              <Text size="sm">Protein</Text>
            </Group>
            <Group>
              <Box w={12} h={12} bg="#40c057" />
              <Text size="sm">Carbs</Text>
            </Group>
            <Group>
              <Box w={12} h={12} bg="#fab005" />
              <Text size="sm">Fat</Text>
            </Group>
          </SimpleGrid>
        </Card>
      </SimpleGrid>
      
      <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Weekly Trends</Title>
          <SegmentedControl
            value={chartType}
            onChange={setChartType}
            data={[
              { label: 'Bar', value: 'bar' },
              { label: 'Line', value: 'line' }
            ]}
          />
        </Group>
        
        <Box h={300}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="calories" name="Calories" fill="#6741d9" />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calories" name="Calories" stroke="#6741d9" activeDot={{ r: 8 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>
        
        <Divider my="md" />
        
        <Title order={4} mb="md">Macronutrient Trends</Title>
        
        <Box h={300}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="protein" name="Protein (g)" fill="#228be6" />
                <Bar dataKey="carbs" name="Carbs (g)" fill="#40c057" />
                <Bar dataKey="fat" name="Fat (g)" fill="#fab005" />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="protein" name="Protein (g)" stroke="#228be6" />
                <Line type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#40c057" />
                <Line type="monotone" dataKey="fat" name="Fat (g)" stroke="#fab005" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>
      </Card>
      
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Title order={3} mb="md">Most Frequently Logged Foods</Title>
        
        {frequentFoods.length > 0 ? (
          <Stack>
            {frequentFoods.map((food, index) => (
              <Paper key={food.id} withBorder p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Group gap="xs">
                      <Text fw={500}>{food.name}</Text>
                      {food.brand && <Text size="xs" c="dimmed">({food.brand})</Text>}
                    </Group>
                    <Text size="sm">{food.serving_size} {food.serving_unit}</Text>
                  </div>
                  <Group>
                    <Text fw={500}>{food.calories} cal</Text>
                    <Text size="sm">P: {food.protein}g</Text>
                    <Text size="sm">C: {food.carbs}g</Text>
                    <Text size="sm">F: {food.fat}g</Text>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No food entries logged yet. Start tracking your nutrition to see your most frequent foods here.
          </Text>
        )}
      </Card>
    </Container>
  );
} 