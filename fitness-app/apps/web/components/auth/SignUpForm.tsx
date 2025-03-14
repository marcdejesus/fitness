"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Text, 
  Container, 
  Alert, 
  Stack 
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export default function SignUpForm() {
  const { signUp, isLoading, error, isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: ''
  });

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/workouts');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(formData);
  };

  return (
    <Container size="xs" py={40}>
      <Paper radius="md" p="xl" withBorder shadow="md">
        <Title order={2} ta="center" mb="lg">Sign Up</Title>
        
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="Error" 
            color="red" 
            variant="filled" 
            mb="md"
          >
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Name"
              name="display_name"
              required
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Your name"
            />
            
            <TextInput
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
            />
            
            <PasswordInput
              label="Password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Your password"
            />
            
            <Button 
              type="submit" 
              fullWidth 
              loading={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}