# React Query / TanStack Query

## Overview
React Query (now TanStack Query) is a powerful data fetching and state management library for React applications that simplifies working with server state.

## Features Used in Our Fitness App
- **Data Fetching**: Fetching workout data, nutrition logs, and user profiles
- **Caching**: Optimizing performance by caching API responses
- **Automatic Refetching**: Keeping data fresh with configurable refetching strategies
- **Pagination**: Implementing infinite scroll for workout history and social feeds
- **Mutations**: Handling form submissions for adding workouts and food entries
- **Offline Support**: Queuing mutations when the device is offline

## Implementation Examples

### Fetching User Workouts
```tsx
function WorkoutHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['workouts', userId],
    queryFn: () => fetchUserWorkouts(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <WorkoutList workouts={data} />
  );
}
```

### Adding a New Meal Entry
```tsx
function AddMealForm() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addMealEntry,
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['meals', userId, date] });
      toast.success('Meal added successfully!');
    },
  });

  const handleSubmit = (values) => {
    mutation.mutate(values);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Form fields */}
    </Form>
  );
}
```

## Performance Benefits
- Reduced network requests through smart caching
- Improved UX with automatic loading and error states
- Optimistic updates for a snappy user experience
- Background data refetching for fresh data without interrupting the user