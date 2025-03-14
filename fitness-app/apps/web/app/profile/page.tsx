"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Paper, 
  Title, 
  Text, 
  Button, 
  Group, 
  Avatar, 
  Loader, 
  Grid, 
  Card, 
  SimpleGrid,
  ThemeIcon,
  Divider,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { 
  IconBarbell, 
  IconUser, 
  IconMail, 
  IconCalendar, 
  IconEdit, 
  IconSettings,
  IconChartLine,
  IconHistory,
  IconTrophy
} from '@tabler/icons-react';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);
  
  if (isLoading) {
    return (
      <Container size="lg" py={40}>
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader size="lg" />
        </Box>
      </Container>
    );
  }
  
  if (!user) {
    return null; // Will redirect due to the useEffect
  }

  // Mock data for stats
  const stats = [
    { title: 'Workouts', value: '24', icon: <IconHistory size={24} /> },
    { title: 'Exercises', value: '48', icon: <IconBarbell size={24} /> },
    { title: 'Achievements', value: '7', icon: <IconTrophy size={24} /> },
  ];
  
  return (
    <Container size="lg" py={40}>
      <Grid gutter={30}>
        {/* Profile Card */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder shadow="sm" radius="md" p="xl">
            <Box style={{ textAlign: 'center' }}>
              <Avatar 
                size={120} 
                radius={120} 
                mx="auto" 
                color="blue" 
                mb={20}
              >
                {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              
              <Group justify="center" mb={5}>
                <Title order={2}>{user.display_name || 'User'}</Title>
                <Tooltip label="Edit Profile">
                  <ActionIcon variant="subtle" color="gray" size="sm">
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              
              <Text c="dimmed" size="sm" mb={20}>{user.email}</Text>
              
              <Button 
                variant="light" 
                fullWidth 
                leftSection={<IconSettings size={16} />}
                mb={10}
              >
                Account Settings
              </Button>
            </Box>
            
            <Divider my={20} />
            
            <Box>
              <Title order={5} mb={15}>Personal Information</Title>
              
              <Group mb={10}>
                <ThemeIcon size={36} radius="md" variant="light">
                  <IconUser size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Name</Text>
                  <Text>{user.display_name || 'Not set'}</Text>
                </div>
              </Group>
              
              <Group mb={10}>
                <ThemeIcon size={36} radius="md" variant="light">
                  <IconMail size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Email</Text>
                  <Text>{user.email}</Text>
                </div>
              </Group>
              
              <Group mb={10}>
                <ThemeIcon size={36} radius="md" variant="light">
                  <IconCalendar size={20} />
                </ThemeIcon>
                <div>
                  <Text size="xs" c="dimmed">Member Since</Text>
                  <Text>{new Date().toLocaleDateString()}</Text>
                </div>
              </Group>
            </Box>
          </Card>
        </Grid.Col>
        
        {/* Main Content */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} mb={30}>
            {stats.map((stat, index) => (
              <Card key={index} withBorder shadow="sm" radius="md" p="md">
                <Group>
                  <ThemeIcon size={48} radius="md" variant="light">
                    {stat.icon}
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">{stat.title}</Text>
                    <Title order={3}>{stat.value}</Title>
                  </div>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
          
          {/* Recent Activity */}
          <Card withBorder shadow="sm" radius="md" p="xl" mb={30}>
            <Group justify="space-between" mb={20}>
              <Title order={3}>Recent Activity</Title>
              <Button 
                variant="subtle" 
                rightSection={<IconChartLine size={16} />}
              >
                View All
              </Button>
            </Group>
            
            <Text c="dimmed" mb={20}>
              You haven't logged any workouts recently. Start tracking your fitness journey today!
            </Text>
            
            <Button 
              leftSection={<IconBarbell size={16} />}
              onClick={() => router.push('/workouts')}
              fullWidth
            >
              View My Workouts
            </Button>
          </Card>
          
          {/* Quick Actions */}
          <Card withBorder shadow="sm" radius="md" p="xl">
            <Title order={3} mb={20}>Quick Actions</Title>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <Button 
                variant="light" 
                leftSection={<IconBarbell size={16} />}
                onClick={() => router.push('/workouts/create')}
                fullWidth
              >
                Log New Workout
              </Button>
              
              <Button 
                variant="light" 
                leftSection={<IconHistory size={16} />}
                onClick={() => router.push('/workouts')}
                fullWidth
              >
                View Workout History
              </Button>
            </SimpleGrid>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}