"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, 
  Title, 
  TextInput, 
  NumberInput, 
  Select, 
  Button, 
  Group, 
  Card, 
  Text, 
  Alert,
  Box,
  Divider,
  ThemeIcon,
  Loader
} from '@mantine/core';
import { 
  IconArrowLeft, 
  IconPlus, 
  IconCheck, 
  IconAlertCircle,
  IconApple
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/auth-context';
import nutritionApi, { FoodCategory, CreateFoodItemData } from '@/lib/api/nutrition';
import Link from 'next/link';

export default function CreateCustomFoodPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<CreateFoodItemData>({
    name: '',
    brand: '',
    category: '',
    serving_size: 100,
    serving_unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    barcode: ''
  });
  
  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const categoriesData = await nutritionApi.getCategories(token);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load food categories. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, [token]);
  
  const handleInputChange = (field: keyof CreateFoodItemData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async () => {
    if (!token) {
      console.error('No token available');
      setError('Authentication required. Please log in again.');
      return;
    }
    
    // Validate form
    if (!formData.name.trim()) {
      setError('Food name is required');
      return;
    }
    
    if (formData.serving_size <= 0) {
      setError('Serving size must be greater than 0');
      return;
    }
    
    if (!formData.serving_unit.trim()) {
      setError('Serving unit is required');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      console.log('Creating custom food with data:', formData);
      await nutritionApi.createCustomFood(token, formData);
      console.log('Custom food created successfully');
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        brand: '',
        category: '',
        serving_size: 100,
        serving_unit: 'g',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        barcode: ''
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/nutrition');
      }, 2000);
    } catch (err) {
      console.error('Error creating custom food:', err);
      if (err instanceof Error) {
        setError(`Failed to create custom food: ${err.message}`);
      } else {
        setError('Failed to create custom food. Please try again later.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <Container size="lg" py={40}>
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Authentication Required" 
          color="red"
          mb={20}
        >
          You need to be logged in to create custom foods.
        </Alert>
        <Button component={Link} href="/login" fullWidth>
          Log In
        </Button>
      </Container>
    );
  }
  
  if (isLoading) {
    return (
      <Container size="lg" py={40}>
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader size="lg" />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container size="md" py={40}>
      <Group mb={30}>
        <Button 
          component={Link} 
          href="/nutrition" 
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Nutrition
        </Button>
      </Group>
      
      <Title order={2} mb={30}>
        <Group gap="md">
          <ThemeIcon size={40} radius="md" color="green">
            <IconApple size={24} />
          </ThemeIcon>
          Create Custom Food
        </Group>
      </Title>
      
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
      
      {success && (
        <Alert 
          icon={<IconCheck size={16} />} 
          title="Success" 
          color="green"
          mb={20}
        >
          Custom food created successfully! Redirecting...
        </Alert>
      )}
      
      <Card withBorder shadow="sm" p="xl" radius="md">
        <Box mb={20}>
          <TextInput
            label="Food Name"
            placeholder="e.g., Homemade Granola"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            mb={15}
          />
          
          <TextInput
            label="Brand (optional)"
            placeholder="e.g., Homemade"
            value={formData.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
            mb={15}
          />
          
          <Select
            label="Category"
            placeholder="Select a category"
            data={categories.map(cat => ({ value: cat.id, label: cat.name }))}
            value={formData.category}
            onChange={(value) => handleInputChange('category', value)}
            mb={15}
            clearable
          />
        </Box>
        
        <Divider label="Serving Information" labelPosition="center" mb={20} />
        
        <Group grow mb={20}>
          <NumberInput
            label="Serving Size"
            placeholder="100"
            value={formData.serving_size}
            onChange={(value) => handleInputChange('serving_size', value)}
            required
            min={0}
            decimalScale={2}
          />
          
          <TextInput
            label="Serving Unit"
            placeholder="g, ml, oz, etc."
            value={formData.serving_unit}
            onChange={(e) => handleInputChange('serving_unit', e.target.value)}
            required
          />
        </Group>
        
        <Divider label="Nutrition Facts (per serving)" labelPosition="center" mb={20} />
        
        <Group grow mb={15}>
          <NumberInput
            label="Calories"
            placeholder="0"
            value={formData.calories}
            onChange={(value) => handleInputChange('calories', value)}
            required
            min={0}
          />
        </Group>
        
        <Group grow mb={15}>
          <NumberInput
            label="Protein (g)"
            placeholder="0"
            value={formData.protein}
            onChange={(value) => handleInputChange('protein', value)}
            required
            min={0}
            decimalScale={1}
          />
          
          <NumberInput
            label="Carbs (g)"
            placeholder="0"
            value={formData.carbs}
            onChange={(value) => handleInputChange('carbs', value)}
            required
            min={0}
            decimalScale={1}
          />
          
          <NumberInput
            label="Fat (g)"
            placeholder="0"
            value={formData.fat}
            onChange={(value) => handleInputChange('fat', value)}
            required
            min={0}
            decimalScale={1}
          />
        </Group>
        
        <Group grow mb={15}>
          <NumberInput
            label="Fiber (g)"
            placeholder="0"
            value={formData.fiber}
            onChange={(value) => handleInputChange('fiber', value)}
            min={0}
            decimalScale={1}
          />
          
          <NumberInput
            label="Sugar (g)"
            placeholder="0"
            value={formData.sugar}
            onChange={(value) => handleInputChange('sugar', value)}
            min={0}
            decimalScale={1}
          />
          
          <NumberInput
            label="Sodium (mg)"
            placeholder="0"
            value={formData.sodium}
            onChange={(value) => handleInputChange('sodium', value)}
            min={0}
            decimalScale={1}
          />
        </Group>
        
        <TextInput
          label="Barcode (optional)"
          placeholder="Enter UPC/EAN barcode"
          value={formData.barcode}
          onChange={(e) => handleInputChange('barcode', e.target.value)}
          mb={30}
        />
        
        <Group justify="flex-end">
          <Button 
            component={Link} 
            href="/nutrition" 
            variant="light"
          >
            Cancel
          </Button>
          
          <Button 
            color="green" 
            leftSection={<IconPlus size={16} />}
            onClick={handleSubmit}
            loading={isSaving}
          >
            Create Food
          </Button>
        </Group>
      </Card>
    </Container>
  );
} 