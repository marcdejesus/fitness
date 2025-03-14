"use client";

import { Box, Container, Tabs, Title, Group, Button } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { IconPlus, IconHistory, IconBarbell } from '@tabler/icons-react';

export default function WorkoutsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const router = useRouter();
  
  // Determine active tab based on current path
  let activeTab = 'history';
  if (pathname.includes('/create')) {
    activeTab = 'create';
  }

  return (
    <Container size="lg" py={30}>
      <Group justify="space-between" mb={30}>
        <Title order={2}>Fitness Tracker</Title>
        <Button 
          leftSection={<IconPlus size={16} />}
          onClick={() => router.push('/workouts/create')}
        >
          New Workout
        </Button>
      </Group>
      
      <Tabs value={activeTab} onChange={(value) => router.push(`/workouts/${value}`)}>
        <Tabs.List mb={20}>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            Workout History
          </Tabs.Tab>
          <Tabs.Tab value="create" leftSection={<IconBarbell size={16} />}>
            Create Workout
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
      
      {children}
    </Container>
  );
} 