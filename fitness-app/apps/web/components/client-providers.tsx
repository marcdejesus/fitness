"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/auth-context';

export default function ClientProviders({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <React.Fragment>
      <AuthProvider>
        {children}
      </AuthProvider>
    </React.Fragment>
  );
}