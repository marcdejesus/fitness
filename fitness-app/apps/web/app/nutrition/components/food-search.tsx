"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  TextInput,
  Button,
  Group,
  Card,
  Text,
  Badge,
  ActionIcon,
  Select,
  Stack,
  Loader,
  Tooltip,
  Divider,
  Box,
  Alert
} from '@mantine/core';
import { IconSearch, IconStar, IconStarFilled, IconInfoCircle } from '@tabler/icons-react';
import nutritionApi, { FoodItem, FoodCategory } from '@/lib/api/nutrition';

interface FoodSearchProps {
  onFoodSelect: (food: FoodItem) => void;
}

export default function FoodSearch({ onFoodSelect }: FoodSearchProps) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  useEffect(() => {
    if (!token) return;
    
    // Load categories
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        console.log('Loading food categories...');
        const categoriesData = await nutritionApi.getCategories(token);
        console.log('Categories loaded:', categoriesData);
        setCategories(categoriesData);
        
        // If categories loaded successfully, try to load some initial foods
        if (categoriesData.length > 0) {
          try {
            console.log('Loading initial foods...');
            // Use an empty string for query to get all foods
            const initialFoods = await nutritionApi.searchFoods(token, '', undefined, 10);
            console.log('Initial foods loaded:', initialFoods);
            setSearchResults(initialFoods);
          } catch (err) {
            console.error('Error loading initial foods:', err);
            // Don't set an error for initial foods loading failure
            // Just log it and continue with empty results
          }
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load food categories. Please check your connection and try again.');
        if (err instanceof Error) {
          setDebugInfo(`Error: ${err.message}`);
        } else {
          setDebugInfo(JSON.stringify(err));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Load user favorites
    const loadFavorites = async () => {
      try {
        console.log('Loading favorites...');
        const favoritesData = await nutritionApi.getFavorites(token);
        console.log('Favorites loaded:', favoritesData);
        setFavorites(favoritesData.map(item => item.id));
      } catch (err) {
        console.error('Error loading favorites:', err);
        // Don't set an error for favorites loading failure
        // Just log it and continue with empty favorites
      }
    };
    
    loadCategories();
    loadFavorites();
  }, [token]);
  
  const handleSearch = async () => {
    if (!token) return;
    
    setIsSearching(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log('Searching foods with query:', searchQuery, 'category:', selectedCategory);
      const results = await nutritionApi.searchFoods(token, searchQuery, selectedCategory || undefined);
      console.log('Search results:', results);
      setSearchResults(results);
      
      if (results.length === 0) {
        setDebugInfo(`No results found for query: "${searchQuery}" in category: ${selectedCategory || 'All'}`);
      }
    } catch (err) {
      console.error('Error searching foods:', err);
      setError('Failed to search foods. Please try again.');
      if (err instanceof Error) {
        setDebugInfo(`Error: ${err.message}`);
      } else {
        setDebugInfo(JSON.stringify(err));
      }
    } finally {
      setIsSearching(false);
    }
  };
  
  const toggleFavorite = async (food: FoodItem) => {
    if (!token) return;
    
    try {
      const isFavorite = favorites.includes(food.id);
      console.log(isFavorite ? 'Removing from favorites:' : 'Adding to favorites:', food.name);
      
      if (isFavorite) {
        await nutritionApi.removeFromFavorites(token, food.id);
        setFavorites(prev => prev.filter(id => id !== food.id));
      } else {
        await nutritionApi.addToFavorites(token, food.id);
        setFavorites(prev => [...prev, food.id]);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorites. Please try again.');
    }
  };
  
  return (
    <Stack>
      <Group align="flex-end">
        <TextInput
          label="Search Foods"
          placeholder="Enter food name, brand, or barcode"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          data-testid="food-search-input"
        />
        
        <Select
          label="Category"
          placeholder="All Categories"
          data={categories.map(cat => ({ value: cat.id, label: cat.name }))}
          value={selectedCategory}
          onChange={setSelectedCategory}
          clearable
          style={{ minWidth: 150 }}
          data-testid="category-select"
        />
        
        <Button 
          leftSection={<IconSearch size={16} />} 
          onClick={handleSearch}
          loading={isSearching}
          data-testid="search-button"
        >
          Search
        </Button>
      </Group>
      
      {error && (
        <Alert color="red" title="Error" icon={<IconInfoCircle />}>
          {error}
          {debugInfo && (
            <Text size="xs" mt="xs" style={{ wordBreak: 'break-word' }}>
              Debug info: {debugInfo}
            </Text>
          )}
        </Alert>
      )}
      
      {isLoading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Loader />
        </Box>
      ) : (
        <Stack mt="md" data-testid="food-search-results">
          {searchResults.length > 0 ? (
            searchResults.map(food => (
              <Card key={food.id} shadow="sm" p="sm" radius="md" withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <div style={{ flex: 1 }}>
                    <Group justify="space-between">
                      <Text fw={500}>{food.name}</Text>
                      <Tooltip label={favorites.includes(food.id) ? "Remove from favorites" : "Add to favorites"}>
                        <ActionIcon 
                          color="yellow" 
                          variant="subtle"
                          onClick={() => toggleFavorite(food)}
                          data-testid={favorites.includes(food.id) ? "star-filled-icon" : "star-icon"}
                        >
                          {favorites.includes(food.id) ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                    
                    {food.brand && <Text size="xs" c="dimmed">{food.brand}</Text>}
                    
                    <Group mt="xs">
                      <Text size="sm">
                        {food.serving_size} {food.serving_unit}
                      </Text>
                      <Badge>{food.calories} cal</Badge>
                    </Group>
                    
                    <Group mt="xs">
                      <Text size="sm">P: {food.protein}g</Text>
                      <Text size="sm">C: {food.carbs}g</Text>
                      <Text size="sm">F: {food.fat}g</Text>
                    </Group>
                  </div>
                  
                  <Button 
                    variant="light" 
                    size="xs"
                    onClick={() => onFoodSelect(food)}
                    data-testid="add-food-button"
                  >
                    Add
                  </Button>
                </Group>
              </Card>
            ))
          ) : (
            searchQuery || selectedCategory ? (
              <Text c="dimmed" ta="center" py="xl">
                No foods found. Try a different search term or category.
              </Text>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Search for foods by name, brand, or select a category to see results.
              </Text>
            )
          )}
        </Stack>
      )}
    </Stack>
  );
} 