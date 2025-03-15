"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { format, parseISO, isToday, isYesterday, addDays, subDays } from 'date-fns';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  RingProgress,
  Tabs,
  Divider,
  ActionIcon,
  Badge,
  Flex,
  Paper,
  SimpleGrid,
  Stack,
  Progress,
  Menu,
  rem,
  Modal,
  NumberInput,
  Select,
  Textarea,
  Alert
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconInfoCircle,
  IconSettings,
  IconChartBar,
  IconApple,
  IconCoffee,
  IconSalad,
  IconMeat,
  IconCookie
} from '@tabler/icons-react';
import nutritionApi, {
  FoodItem,
  MealEntry,
  MealType,
  DailyNutritionSummary,
  CreateMealEntryData
} from '@/lib/api/nutrition';
import FoodSearch from './components/food-search';

export default function NutritionPage() {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySummary, setDailySummary] = useState<DailyNutritionSummary | null>(null);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add food modal
  const [addFoodModalOpened, { open: openAddFoodModal, close: closeAddFoodModal }] = useDisclosure(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [servings, setServings] = useState<number | string>(1);
  const [notes, setNotes] = useState('');
  const [addingFood, setAddingFood] = useState(false);
  
  // Goal settings modal
  const [goalModalOpened, { open: openGoalModal, close: closeGoalModal }] = useDisclosure(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    
    loadData();
  }, [isAuthenticated, token, selectedDate]);
  
  const loadData = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading nutrition data for date:', format(selectedDate, 'yyyy-MM-dd'));
      
      // Load meal types
      console.log('Loading meal types...');
      const mealTypesData = await nutritionApi.getMealTypes(token);
      console.log('Meal types loaded:', mealTypesData);
      setMealTypes(mealTypesData);
      
      // If no meal types exist, seed them
      if (mealTypesData.length === 0) {
        console.log('No meal types found, seeding default meal types...');
        await nutritionApi.seedMealTypes(token);
        const updatedMealTypes = await nutritionApi.getMealTypes(token);
        console.log('Updated meal types:', updatedMealTypes);
        setMealTypes(updatedMealTypes);
      }
      
      // Load daily summary
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('Loading daily summary for date:', dateStr);
      const summary = await nutritionApi.getDailySummary(token, dateStr);
      console.log('Daily summary loaded:', summary);
      setDailySummary(summary);
      
      // Set default meal type if none selected
      if (!selectedMealType && mealTypesData.length > 0) {
        console.log('Setting default meal type:', mealTypesData[0]);
        setSelectedMealType(mealTypesData[0].id);
      }
    } catch (err) {
      console.error('Error loading nutrition data:', err);
      setError('Failed to load nutrition data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };
  
  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  const formatDateDisplay = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d');
    }
  };
  
  const handleFoodSelect = (food: FoodItem) => {
    setSelectedFood(food);
    console.log('Selected food for adding:', food);
    
    // Set default meal type if none selected
    if (!selectedMealType && mealTypes.length > 0) {
      console.log('Setting default meal type:', mealTypes[0]);
      setSelectedMealType(mealTypes[0].id);
    }
    
    openAddFoodModal();
  };
  
  const handleAddFood = async () => {
    if (!token || !selectedFood || !selectedMealType) {
      console.error('Missing required data:', { 
        hasToken: !!token, 
        selectedFood: selectedFood?.name, 
        selectedMealType 
      });
      setError('Missing required information. Please ensure a meal type is selected.');
      return;
    }
    
    setAddingFood(true);
    setError(null);
    
    try {
      // Format the date properly
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get current time in HH:MM format
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Ensure servings is a number
      const servingsNum = Number(servings);
      if (isNaN(servingsNum) || servingsNum <= 0) {
        setError('Please enter a valid number of servings greater than 0.');
        setAddingFood(false);
        return;
      }
      
      console.log('Adding food to log:', {
        food: selectedFood.name,
        foodId: selectedFood.id,
        mealType: selectedMealType,
        servings: servingsNum,
        date: dateStr,
        time: timeStr
      });
      
      const mealData: CreateMealEntryData = {
        food_item: selectedFood.id,
        meal_type: selectedMealType,
        servings: servingsNum,
        notes: notes,
        date: dateStr,
        time: timeStr
      };
      
      await nutritionApi.createMealEntry(token, mealData);
      console.log('Food added successfully');
      
      // Reload data
      const summary = await nutritionApi.getDailySummary(token, dateStr);
      setDailySummary(summary);
      
      // Reset form
      setSelectedFood(null);
      setServings(1);
      setNotes('');
      closeAddFoodModal();
    } catch (err) {
      console.error('Error adding food:', err);
      if (err instanceof Error) {
        setError(`Failed to add food: ${err.message}`);
      } else {
        setError('Failed to add food. Please try again.');
      }
    } finally {
      setAddingFood(false);
    }
  };
  
  const handleDeleteMealEntry = async (entryId: string) => {
    if (!token) return;
    
    try {
      await nutritionApi.deleteMealEntry(token, entryId);
      
      // Reload data
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const summary = await nutritionApi.getDailySummary(token, dateStr);
      setDailySummary(summary);
    } catch (err) {
      console.error('Error deleting meal entry:', err);
      setError('Failed to delete meal entry. Please try again.');
    }
  };
  
  const getMealIcon = (mealName: string) => {
    const name = mealName.toLowerCase();
    if (name.includes('breakfast')) return <IconCoffee size={20} />;
    if (name.includes('lunch')) return <IconSalad size={20} />;
    if (name.includes('dinner')) return <IconMeat size={20} />;
    if (name.includes('snack')) return <IconCookie size={20} />;
    return <IconApple size={20} />;
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>Nutrition Tracker</Title>
        <Group>
          <Button 
            variant="outline" 
            leftSection={<IconSettings size={16} />}
            onClick={openGoalModal}
          >
            Goals
          </Button>
          <Button 
            variant="outline" 
            leftSection={<IconChartBar size={16} />}
            onClick={() => router.push('/nutrition/stats')}
          >
            Stats
          </Button>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push('/nutrition/create')}
          >
            Add Custom Food
          </Button>
        </Group>
      </Group>
      
      {/* Date selector */}
      <Card shadow="sm" p="md" radius="md" withBorder mb="lg">
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={goToPreviousDay}>
              <IconChevronLeft size={20} />
            </ActionIcon>
            <Text fw={500} size="lg">{formatDateDisplay(selectedDate)}</Text>
            <ActionIcon variant="subtle" onClick={goToNextDay}>
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
          <Group>
            <Button variant="subtle" leftSection={<IconCalendar size={16} />} onClick={goToToday}>
              Today
            </Button>
            <DatePickerInput
              value={selectedDate}
              onChange={handleDateChange}
              valueFormat="YYYY-MM-DD"
              placeholder="Pick date"
            />
          </Group>
        </Group>
      </Card>
      
      {error && (
        <Alert color="red" title="Error" mb="md">
          {error}
        </Alert>
      )}
      
      {/* Nutrition summary */}
      {dailySummary && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={3} mb="md">Daily Progress</Title>
            <Group grow mb="md">
              <RingProgress
                size={160}
                thickness={16}
                label={
                  <Text ta="center" size="lg" fw={700}>
                    {dailySummary.calorie_progress}%
                  </Text>
                }
                sections={[
                  { value: Math.min(dailySummary.calorie_progress, 100), color: 'blue' }
                ]}
              />
              <Stack gap="xs">
                <Text fw={500}>Calories</Text>
                <Text size="xl" fw={700}>{dailySummary.total_calories} / {dailySummary.calorie_goal}</Text>
                <Text c="dimmed" size="sm">
                  {dailySummary.calorie_goal - dailySummary.total_calories > 0 
                    ? `${dailySummary.calorie_goal - dailySummary.total_calories} calories remaining` 
                    : `${dailySummary.total_calories - dailySummary.calorie_goal} calories over`}
                </Text>
              </Stack>
            </Group>
            
            <Divider my="md" />
            
            <Title order={4} mb="sm">Macronutrients</Title>
            <Stack gap="md">
              <div>
                <Group justify="space-between" mb={5}>
                  <Text size="sm">Protein ({dailySummary.total_protein}g / {dailySummary.protein_goal}g)</Text>
                  <Text size="sm" fw={500}>{dailySummary.protein_progress}%</Text>
                </Group>
                <Progress value={Math.min(dailySummary.protein_progress, 100)} color="blue" />
              </div>
              
              <div>
                <Group justify="space-between" mb={5}>
                  <Text size="sm">Carbs ({dailySummary.total_carbs}g / {dailySummary.carbs_goal}g)</Text>
                  <Text size="sm" fw={500}>{dailySummary.carbs_progress}%</Text>
                </Group>
                <Progress value={Math.min(dailySummary.carbs_progress, 100)} color="green" />
              </div>
              
              <div>
                <Group justify="space-between" mb={5}>
                  <Text size="sm">Fat ({dailySummary.total_fat}g / {dailySummary.fat_goal}g)</Text>
                  <Text size="sm" fw={500}>{dailySummary.fat_progress}%</Text>
                </Group>
                <Progress value={Math.min(dailySummary.fat_progress, 100)} color="yellow" />
              </div>
            </Stack>
          </Card>
          
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={3} mb="md">Nutrition Breakdown</Title>
            <SimpleGrid cols={2} spacing="md">
              <Paper withBorder p="md" radius="md">
                <Text c="dimmed" size="xs">Protein</Text>
                <Text fw={700} size="lg">{dailySummary.total_protein}g</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text c="dimmed" size="xs">Carbs</Text>
                <Text fw={700} size="lg">{dailySummary.total_carbs}g</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text c="dimmed" size="xs">Fat</Text>
                <Text fw={700} size="lg">{dailySummary.total_fat}g</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text c="dimmed" size="xs">Fiber</Text>
                <Text fw={700} size="lg">{dailySummary.total_fiber}g</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text c="dimmed" size="xs">Sugar</Text>
                <Text fw={700} size="lg">{dailySummary.total_sugar}g</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text c="dimmed" size="xs">Sodium</Text>
                <Text fw={700} size="lg">{dailySummary.total_sodium}mg</Text>
              </Paper>
            </SimpleGrid>
          </Card>
        </SimpleGrid>
      )}
      
      {/* Food search and meal log */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="md">Add Food</Title>
          <FoodSearch onFoodSelect={handleFoodSelect} />
        </Card>
        
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="md">Today's Meals</Title>
          
          {dailySummary && Object.keys(dailySummary.meals).length > 0 ? (
            <Tabs defaultValue={Object.keys(dailySummary.meals)[0]}>
              <Tabs.List>
                {Object.keys(dailySummary.meals).map(mealType => (
                  <Tabs.Tab 
                    key={mealType} 
                    value={mealType}
                    leftSection={getMealIcon(mealType)}
                  >
                    {mealType}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
              
              {Object.entries(dailySummary.meals).map(([mealType, entries]) => (
                <Tabs.Panel key={mealType} value={mealType} pt="md">
                  <Stack gap="md">
                    {entries.map(entry => (
                      <Paper key={entry.id} withBorder p="md" radius="md">
                        <Group justify="space-between" wrap="nowrap">
                          <div>
                            <Group gap="xs">
                              <Text fw={500}>{entry.food_item_details.name}</Text>
                              {entry.food_item_details.brand && (
                                <Text size="xs" c="dimmed">({entry.food_item_details.brand})</Text>
                              )}
                            </Group>
                            <Text size="sm">
                              {entry.servings} {entry.servings === 1 ? 'serving' : 'servings'} 
                              ({entry.food_item_details.serving_size} {entry.food_item_details.serving_unit})
                            </Text>
                            {entry.notes && <Text size="xs" c="dimmed">{entry.notes}</Text>}
                          </div>
                          
                          <Group gap="xs">
                            <Badge>{entry.calories} cal</Badge>
                            <ActionIcon 
                              variant="subtle" 
                              color="red"
                              onClick={() => handleDeleteMealEntry(entry.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Tabs.Panel>
              ))}
            </Tabs>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              No meals logged for this day. Add some food to get started!
            </Text>
          )}
        </Card>
      </SimpleGrid>
      
      {/* Add food modal */}
      <Modal 
        opened={addFoodModalOpened} 
        onClose={closeAddFoodModal}
        title="Add Food to Log"
        centered
      >
        {selectedFood && (
          <Stack>
            <div>
              <Text fw={700} size="lg">{selectedFood.name}</Text>
              {selectedFood.brand && <Text size="sm" c="dimmed">{selectedFood.brand}</Text>}
              <Group mt="xs">
                <Badge>{selectedFood.calories} cal</Badge>
                <Text size="sm">P: {selectedFood.protein}g</Text>
                <Text size="sm">C: {selectedFood.carbs}g</Text>
                <Text size="sm">F: {selectedFood.fat}g</Text>
              </Group>
            </div>
            
            <Divider my="xs" />
            
            <Select
              label="Meal"
              placeholder="Select meal type"
              data={mealTypes.map(type => ({ value: type.id, label: type.name }))}
              value={selectedMealType}
              onChange={setSelectedMealType}
              required
              error={!selectedMealType ? "Please select a meal type" : null}
            />
            
            <NumberInput
              label="Servings"
              placeholder="Number of servings"
              min={0.25}
              step={0.25}
              value={servings}
              onChange={setServings}
              required
            />
            
            <Text size="sm">
              Serving size: {selectedFood.serving_size} {selectedFood.serving_unit}
            </Text>
            
            <Textarea
              label="Notes (optional)"
              placeholder="Add any notes about this food"
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
            />
            
            {error && (
              <Alert color="red" title="Error">
                {error}
              </Alert>
            )}
            
            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeAddFoodModal}>Cancel</Button>
              <Button 
                onClick={handleAddFood} 
                loading={addingFood}
                disabled={!selectedMealType || Number(servings) <= 0}
              >
                Add to Log
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
      
      {/* Goal settings modal */}
      <Modal
        opened={goalModalOpened}
        onClose={closeGoalModal}
        title="Nutrition Goals"
        centered
      >
        {dailySummary && (
          <GoalSettingsForm 
            initialGoals={{
              calorie_target: dailySummary.calorie_goal,
              protein_target: dailySummary.protein_goal,
              carbs_target: dailySummary.carbs_goal,
              fat_target: dailySummary.fat_goal
            }}
            onSave={async (goals) => {
              if (!token) return;
              
              try {
                await nutritionApi.updateGoal(token, goals);
                
                // Reload data
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const summary = await nutritionApi.getDailySummary(token, dateStr);
                setDailySummary(summary);
                
                closeGoalModal();
              } catch (err) {
                console.error('Error updating goals:', err);
                setError('Failed to update goals. Please try again.');
              }
            }}
          />
        )}
      </Modal>
    </Container>
  );
}

interface GoalSettingsFormProps {
  initialGoals: {
    calorie_target: number;
    protein_target: number;
    carbs_target: number;
    fat_target: number;
  };
  onSave: (goals: any) => void;
}

function GoalSettingsForm({ initialGoals, onSave }: GoalSettingsFormProps) {
  const [calorieTarget, setCalorieTarget] = useState<number | string>(initialGoals.calorie_target);
  const [proteinTarget, setProteinTarget] = useState<number | string>(initialGoals.protein_target);
  const [carbsTarget, setCarbsTarget] = useState<number | string>(initialGoals.carbs_target);
  const [fatTarget, setFatTarget] = useState<number | string>(initialGoals.fat_target);
  const [goalType, setGoalType] = useState<string>('maintain');
  const [saving, setSaving] = useState(false);
  
  const handleSave = () => {
    setSaving(true);
    
    const goals = {
      calorie_target: Number(calorieTarget),
      protein_target: Number(proteinTarget),
      carbs_target: Number(carbsTarget),
      fat_target: Number(fatTarget),
      goal_type: goalType
    };
    
    onSave(goals);
    setSaving(false);
  };
  
  return (
    <Stack>
      <Select
        label="Goal Type"
        placeholder="Select your goal"
        data={[
          { value: 'lose', label: 'Lose Weight' },
          { value: 'maintain', label: 'Maintain Weight' },
          { value: 'gain', label: 'Gain Weight' }
        ]}
        value={goalType}
        onChange={(value) => setGoalType(value || 'maintain')}
      />
      
      <NumberInput
        label="Daily Calorie Target"
        placeholder="Enter calorie target"
        min={1000}
        max={10000}
        value={calorieTarget}
        onChange={setCalorieTarget}
      />
      
      <SimpleGrid cols={3}>
        <NumberInput
          label="Protein (g)"
          placeholder="Protein"
          min={0}
          value={proteinTarget}
          onChange={setProteinTarget}
        />
        
        <NumberInput
          label="Carbs (g)"
          placeholder="Carbs"
          min={0}
          value={carbsTarget}
          onChange={setCarbsTarget}
        />
        
        <NumberInput
          label="Fat (g)"
          placeholder="Fat"
          min={0}
          value={fatTarget}
          onChange={setFatTarget}
        />
      </SimpleGrid>
      
      <Alert icon={<IconInfoCircle />} title="Macronutrient Recommendations" color="blue">
        <Text size="sm">
          For a {calorieTarget} calorie diet:
          <br />
          • Protein: 10-35% of calories ({Math.round(Number(calorieTarget) * 0.1 / 4)}-{Math.round(Number(calorieTarget) * 0.35 / 4)}g)
          <br />
          • Carbs: 45-65% of calories ({Math.round(Number(calorieTarget) * 0.45 / 4)}-{Math.round(Number(calorieTarget) * 0.65 / 4)}g)
          <br />
          • Fat: 20-35% of calories ({Math.round(Number(calorieTarget) * 0.2 / 9)}-{Math.round(Number(calorieTarget) * 0.35 / 9)}g)
        </Text>
      </Alert>
      
      <Group justify="flex-end">
        <Button variant="subtle" onClick={() => onSave(initialGoals)}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Save Goals</Button>
      </Group>
    </Stack>
  );
} 