"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';

// Create a consistent theme for the entire application
const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: 6,
  fontFamily: 'var(--font-geist-sans), sans-serif',
  fontFamilyMonospace: 'var(--font-geist-mono), monospace',
  headings: {
    fontFamily: 'var(--font-geist-sans), sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  colors: {
    // Custom color palette that matches the workout details page
    dark: [
      '#C1C2C5', // 0
      '#A6A7AB', // 1
      '#909296', // 2
      '#5c5f66', // 3
      '#373A40', // 4
      '#2C2E33', // 5
      '#25262b', // 6
      '#1A1B1E', // 7
      '#141517', // 8
      '#101113', // 9
    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
        shadow: 'sm',
      },
    },
  },
});

export default function ClientProviders({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <React.Fragment>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <AuthProvider>
          {children}
        </AuthProvider>
      </MantineProvider>
    </React.Fragment>
  );
}