# Mantine UI Framework

## Overview
Mantine is a React component library with a focus on usability, accessibility, and developer experience.

## Features Used in Our Fitness App
- **Responsive Components**: Building adaptive layouts for both desktop and mobile web
- **Form Handling**: Creating intuitive forms for workout logging and food tracking
- **Data Visualization**: Charts and progress displays for fitness metrics
- **Theming**: Supporting light and dark modes with customizable color schemes
- **Notifications**: Providing feedback for user actions and achievements
- **Modals and Overlays**: Creating interactive experiences for workout planning

## Key Components in Use

### Dashboard Layout
```tsx
import { AppShell, Navbar, Header } from '@mantine/core';

function DashboardLayout({ children }) {
  return (
    <AppShell
      padding="md"
      navbar={<Navbar width={{ base: 300 }} p="xs">{/* Navbar content */}</Navbar>}
      header={<Header height={60} p="xs">{/* Header content */}</Header>}
    >
      {children}
    </AppShell>
  );
}
```

### Workout Form
```tsx
import { TextInput, NumberInput, Select, Button, Group } from '@mantine/core';
import { DatePicker } from '@mantine/dates';

function WorkoutForm() {
  return (
    <form>
      <TextInput label="Workout Name" required />
      <DatePicker label="Date" required />
      <NumberInput label="Duration (minutes)" required min={1} />
      <Select 
        label="Workout Type" 
        data={[
          { value: 'strength', label: 'Strength' },
          { value: 'cardio', label: 'Cardio' },
          { value: 'flexibility', label: 'Flexibility' },
        ]} 
      />
      <Group position="right" mt="md">
        <Button type="submit">Save Workout</Button>
      </Group>
    </form>
  );
}
```

### Nutrition Progress Charts
```tsx
import { Card, Text, Group, RingProgress } from '@mantine/core';

function MacroProgressCard({ consumed, target, nutrient }) {
  const percentage = Math.round((consumed / target) * 100);
  
  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group position="apart">
        <Text weight={500}>{nutrient}</Text>
        <Text size="sm" color="dimmed">{consumed}g of {target}g</Text>
      </Group>
      <RingProgress
        sections={[{ value: percentage, color: 'blue' }]}
        label={
          <Text size="xl" align="center">
            {percentage}%
          </Text>
        }
        size={120}
        thickness={12}
      />
    </Card>
  );
}
```

## Accessibility Benefits
- ARIA-compliant components
- Keyboard navigation support
- Screen reader friendly elements
- Focus management for modals and dialogs