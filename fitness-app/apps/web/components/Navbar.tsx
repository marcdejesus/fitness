"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { 
  IconBarbell, 
  IconHome, 
  IconUser, 
  IconLogout, 
  IconMenu2,
  IconX,
  IconApple
} from '@tabler/icons-react';
import { 
  AppShell, 
  Burger, 
  Group, 
  Button, 
  Text, 
  UnstyledButton, 
  ThemeIcon, 
  Divider,
  Box,
  Container,
  Drawer,
  Stack
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export default function Navbar() {
  const { isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure(false);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { name: 'Home', href: '/', icon: <IconHome size={20} /> },
    { name: 'Workouts', href: '/workouts', icon: <IconBarbell size={20} /> },
    { name: 'Nutrition', href: '/nutrition', icon: <IconApple size={20} /> },
    { name: 'Profile', href: '/profile', icon: <IconUser size={20} /> },
  ];

  const handleSignOut = () => {
    signOut();
    router.push('/auth/signin');
  };

  const MainLinks = navItems.map((item) => (
    <UnstyledButton
      key={item.name}
      component={Link}
      href={item.href}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        color: pathname === item.href ? '#228be6' : '#495057',
        backgroundColor: pathname === item.href ? '#e7f5ff' : 'transparent',
        fontWeight: pathname === item.href ? 600 : 400,
      }}
    >
      <Group>
        <ThemeIcon 
          variant={pathname === item.href ? 'filled' : 'light'} 
          color={pathname === item.href ? 'blue' : 'gray'}
        >
          {item.icon}
        </ThemeIcon>
        <Text size="sm">{item.name}</Text>
      </Group>
    </UnstyledButton>
  ));

  return (
    <>
      {/* Desktop navbar */}
      <Box 
        component="header" 
        py="xs" 
        style={{
          borderBottom: '1px solid #e9ecef',
          backgroundColor: 'white',
        }}
      >
        <Container size="lg">
          <Group justify="space-between">
            <Group>
              <Text 
                component={Link} 
                href="/" 
                size="xl" 
                fw={700} 
                c="blue"
                style={{ textDecoration: 'none' }}
              >
                Fitness App
              </Text>
              
              {/* Desktop navigation links */}
              <Group ml="xl" gap="lg" visibleFrom="sm">
                {navItems.map((item) => (
                  <UnstyledButton
                    key={item.name}
                    component={Link}
                    href={item.href}
                    style={{
                      color: pathname === item.href ? '#228be6' : '#495057',
                      fontWeight: pathname === item.href ? 600 : 400,
                    }}
                  >
                    <Group gap="xs">
                      {item.icon}
                      <Text size="sm">{item.name}</Text>
                    </Group>
                  </UnstyledButton>
                ))}
              </Group>
            </Group>
            
            {/* Sign out button */}
            <Group>
              <Button 
                variant="subtle" 
                leftSection={<IconLogout size={16} />}
                onClick={handleSignOut}
                visibleFrom="sm"
              >
                Sign Out
              </Button>
              
              {/* Mobile menu button */}
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
            </Group>
          </Group>
        </Container>
      </Box>
      
      {/* Mobile drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Text size="lg" fw={700} c="blue">
            Fitness App
          </Text>
        }
        hiddenFrom="sm"
        size="xs"
      >
        <Divider my="sm" />
        <Stack>
          {MainLinks}
          <Divider my="sm" />
          <Button 
            variant="subtle" 
            leftSection={<IconLogout size={16} />}
            onClick={handleSignOut}
            fullWidth
          >
            Sign Out
          </Button>
        </Stack>
      </Drawer>
    </>
  );
} 