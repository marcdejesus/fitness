# Supabase Integration

## Overview
Supabase is an open-source Firebase alternative providing a PostgreSQL database, authentication, instant APIs, and real-time subscriptions. In our fitness app, it serves as both our database and authentication system.

## Features Used in Our Fitness App

- **Authentication**: User signup, login, and profile management
- **Database**: PostgreSQL database for storing app data
- **Storage**: File storage for user uploads (profile pictures, workout images)
- **Real-time Subscriptions**: Live updates for social features and workout sharing
- **Row-Level Security**: Fine-grained access control for user data
- **Postgres Functions**: Custom database functions for complex operations
- **Edge Functions**: Serverless functions for custom business logic

## Implementation Examples

### Authentication Setup
```python
# Django settings.py
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

### User Authentication
```python
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
@require_POST
def sign_up(request):
    data = json.loads(request.body)
    email = data.get('email')
    password = data.get('password')
    
    try:
        # Register user with Supabase
        response = supabase_client.auth.sign_up({
            "email": email,
            "password": password,
        })
        
        # Create user profile in our database
        if response.user:
            UserProfile.objects.create(
                user_id=response.user.id,
                display_name=data.get('display_name', ''),
                email=email
            )
        
        return JsonResponse({
            'user_id': response.user.id,
            'message': 'User created successfully'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
```

### Database Access with Row-Level Security
```sql
-- SQL for Supabase setup
-- Setting up RLS on workouts table

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create policy for select (read)
CREATE POLICY "Users can view own workouts" 
ON workouts FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for insert
CREATE POLICY "Users can create own workouts" 
ON workouts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for update
CREATE POLICY "Users can update own workouts" 
ON workouts FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for delete
CREATE POLICY "Users can delete own workouts" 
ON workouts FOR DELETE
USING (auth.uid() = user_id);
```

### File Storage for User Uploads
```python
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import base64
import uuid
import time

@require_POST
def upload_profile_picture(request):
    user_id = request.user.id
    file_data = request.FILES['profile_picture']
    file_ext = file_data.name.split('.')[-1]
    file_name = f"{user_id}/{uuid.uuid4()}.{file_ext}"
    
    try:
        # Upload to Supabase storage
        response = supabase_client.storage.from_('profile_pictures').upload(
            file_name,
            file_data.read(),
            file_options={"content-type": file_data.content_type}
        )
        
        # Get public URL
        file_url = supabase_client.storage.from_('profile_pictures').get_public_url(file_name)
        
        # Update user profile
        UserProfile.objects.filter(user_id=user_id).update(avatar_url=file_url)
        
        return JsonResponse({'avatar_url': file_url})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
```

### Real-time Subscriptions (Frontend Implementation)
```tsx
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

function useRealtimeChallenges(challengeId) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Initial fetch
    fetchParticipants();
    
    // Set up real-time subscription
    const subscription = supabase
      .from(`challenge_participants:challenge_id=eq.${challengeId}`)
      .on('INSERT', payload => {
        setParticipants(current => [...current, payload.new]);
      })
      .on('DELETE', payload => {
        setParticipants(current => 
          current.filter(p => p.id !== payload.old.id)
        );
      })
      .subscribe();
    
    // Cleanup subscription
    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [challengeId]);
  
  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*, profiles(*)')
        .eq('challenge_id', challengeId);
        
      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { participants, loading };
}
```

### Custom PostgreSQL Functions
```sql
-- Create a function to calculate user's total workout volume over time
CREATE OR REPLACE FUNCTION calculate_workout_volume(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  workout_date DATE,
  total_volume NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.date::DATE as workout_date,
    SUM(ws.reps * COALESCE(ws.weight, 0)) as total_volume
  FROM 
    workouts w
  JOIN 
    workout_sets ws ON w.id = ws.workout_id
  WHERE 
    w.user_id = p_user_id
    AND w.date::DATE BETWEEN p_start_date AND p_end_date
  GROUP BY 
    workout_date
  ORDER BY 
    workout_date;
END;
$$;

-- Usage from the API
-- supabase_client.rpc('calculate_workout_volume', { 
--   p_user_id: 'user-uuid', 
--   p_start_date: '2023-01-01', 
--   p_end_date: '2023-01-31' 
-- })
```

## Security Considerations
- Row-Level Security (RLS) policies on all tables
- JWT validation for API requests
- Input sanitization to prevent SQL injection
- Rate limiting to prevent abuse
- Content validation for uploaded files