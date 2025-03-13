# Push Notifications

## Overview
Push notifications are essential for user engagement in our fitness app, allowing us to notify users about workout reminders, achievements, social interactions, and more.

## Features Used in Our Fitness App

- **Workout Reminders**: Scheduled notifications to remind users of planned workouts
- **Achievement Notifications**: Alerts when users reach milestones or earn badges
- **Challenge Updates**: Notifications about challenge starts, ends, and updates
- **Social Interactions**: Alerts for likes, comments, and friend requests
- **Inactivity Reminders**: Notifications when users haven't logged in for a while
- **Progress Milestones**: Celebrations of user progress and goals reached

## Implementation Examples

### Firebase Cloud Messaging (FCM) Setup
```python
# settings.py
import firebase_admin
from firebase_admin import credentials, messaging
import os

# Initialize Firebase Admin SDK
cred = credentials.Certificate(os.environ.get('FIREBASE_CREDENTIALS_PATH'))
firebase_app = firebase_admin.initialize_app(cred)
```

### Notification Service
```python
# api/notifications/services.py
from firebase_admin import messaging
from api.social.models import UserProfile, DeviceToken
import logging

logger = logging.getLogger(__name__)

def send_push_notification(user_id, title, body, data=None):
    """
    Send a push notification to a specific user
    
    Args:
        user_id: The user's unique identifier
        title: Title of the notification
        body: Body text of the notification
        data: Optional dictionary of additional data
    """
    try:
        # Get the user's device tokens
        device_tokens = DeviceToken.objects.filter(
            user_id=user_id,
            is_active=True
        ).values_list('token', flat=True)
        
        if not device_tokens:
            logger.info(f"No active device tokens found for user {user_id}")
            return False
        
        # Prepare notification
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=list(device_tokens),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        sound="default",
                        badge=1
                    )
                )
            ),
        )
        
        # Send the message
        response = messaging.send_multicast(message)
        
        # Log results
        logger.info(
            f"Sent notification to user {user_id}: "
            f"{response.success_count} successful, {response.failure_count} failed"
        )
        
        # Handle failures - remove invalid tokens
        if response.failure_count > 0:
            failed_tokens = []
            for idx, result in enumerate(response.responses):
                if not result.success:
                    failed_tokens.append(device_tokens[idx])
            
            # Update or delete failed tokens
            if failed_tokens:
                DeviceToken.objects.filter(token__in=failed_tokens).update(is_active=False)
        
        return response.success_count > 0
    
    except Exception as e:
        logger.error(f"Failed to send notification to user {user_id}: {e}")
        return False

def send_daily_summary(user_id, activity_data):
    """
    Send a daily summary notification with activity stats
    """
    # Format the notification based on user's activity
    if activity_data.get('workouts_completed', 0) > 0:
        title = "Daily Fitness Summary"
        body = f"Great work! You completed {activity_data['workouts_completed']} workout(s) " \
               f"and burned {activity_data['calories_burned']} calories yesterday."
    else:
        title = "Daily Fitness Summary"
        body = "No workouts logged yesterday. Let's get moving today!"
    
    # Additional data for deep linking
    data = {
        "type": "daily_summary",
        "date": activity_data['date'],
        "screen": "summary"
    }
    
    return send_push_notification(user_id, title, body, data)

def send_achievement_notification(user_id, achievement):
    """
    Send notification when a user earns an achievement
    """
    title = "New Achievement Unlocked! 🏆"
    body = f"Congratulations! You've earned the '{achievement['title']}' badge."
    
    data = {
        "type": "achievement",
        "achievement_id": achievement['id'],
        "screen": "achievements"
    }
    
    return send_push_notification(user_id, title, body, data)
```

### Device Token Registration API
```python
# api/notifications/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from api.social.models import DeviceToken

class DeviceTokenView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Register a device token for push notifications"""
        token = request.data.get('token')
        device_type = request.data.get('device_type')  # 'ios' or 'android'
        
        if not token or not device_type:
            return Response(
                {"error": "Token and device type are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update or create token
        DeviceToken.objects.update_or_create(
            token=token,
            defaults={
                'user_id': request.user.id,
                'device_type': device_type,
                'is_active': True
            }
        )
        
        return Response({"status": "Device registered successfully"})
    
    def delete(self, request):
        """Unregister a device token"""
        token = request.data.get('token')
        
        if not token:
            return Response(
                {"error": "Token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deactivate the token
        DeviceToken.objects.filter(
            token=token,
            user_id=request.user.id
        ).update(is_active=False)
        
        return Response({"status": "Device unregistered successfully"})
```

### Scheduled Notification Example
```python
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

@shared_task
def send_workout_reminder_notifications():
    """
    Send workout reminders to users based on their schedule
    """
    from api.workouts.models import ScheduledWorkout
    from api.notifications.services import send_push_notification
    
    # Find workouts scheduled for tomorrow
    tomorrow = timezone.now().date() + timedelta(days=1)
    scheduled_workouts = ScheduledWorkout.objects.filter(
        date=tomorrow,
        reminder_sent=False
    )
    
    for workout in scheduled_workouts:
        # Send reminder
        success = send_push_notification(
            user_id=workout.user_id,
            title="Workout Tomorrow!",
            body=f"Don't forget your {workout.name} workout scheduled for tomorrow.",
            data={
                "type": "workout_reminder",
                "workout_id": str(workout.id),
                "screen": "workout_details"
            }
        )
        
        # Update reminder status
        if success:
            workout.reminder_sent = True
            workout.save(update_fields=['reminder_sent'])
    
    return len(scheduled_workouts)
```

### Mobile Client Integration (React Native)
```javascript
// React Native example for registering device token
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from '../api';

export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
  if (enabled) {
    const token = await messaging().getToken();
    const deviceType = Platform.OS; // 'ios' or 'android'
    
    // Save token to AsyncStorage
    await AsyncStorage.setItem('pushToken', token);
    
    // Register with backend
    try {
      await api.post('/notifications/device-token', {
        token,
        device_type: deviceType
      });
      console.log('Device registered for push notifications');
      return true;
    } catch (error) {
      console.error('Failed to register device token:', error);
      return false;
    }
  } else {
    console.log('Notification permission denied');
    return false;
  }
}

// Setting up notification handlers
export function setupNotificationHandlers() {
  // Handle notifications when app is in foreground
  messaging().onMessage(async remoteMessage => {
    console.log('Notification received in foreground:', remoteMessage);
    // Show in-app notification
    showInAppNotification(remoteMessage);
  });

  // Handle notification opened when app is in background
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened in background:', remoteMessage);
    // Navigate to appropriate screen based on notification data
    handleNotificationNavigation(remoteMessage);
  });

  // Handle notification that opened the app from terminated state
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      console.log('App opened from terminated state by notification:', remoteMessage);
      // Navigate to appropriate screen based on notification data
      handleNotificationNavigation(remoteMessage);
    }
  });
}
```

## Notification Types and Templates

### Workout Reminders
```python
def create_workout_reminder(user_id, workout_name, scheduled_time):
    title = "Time to Work Out!"
    body = f"Your {workout_name} workout is scheduled for {format_time(scheduled_time)}"
    data = {
        "type": "workout_reminder",
        "workout_name": workout_name,
        "screen": "workout"
    }
    return send_push_notification(user_id, title, body, data)
```

### Social Notifications
```python
def create_social_notification(notification_type, sender, receiver_id, content_id=None):
    if notification_type == 'friend_request':
        title = "New Friend Request"
        body = f"{sender.display_name} sent you a friend request"
        data = {"type": "friend_request", "sender_id": str(sender.user_id)}
    
    elif notification_type == 'post_like':
        title = "New Like"
        body = f"{sender.display_name} liked your post"
        data = {"type": "post_like", "post_id": str(content_id)}
    
    elif notification_type == 'post_comment':
        title = "New Comment"
        body = f"{sender.display_name} commented on your post"
        data = {"type": "post_comment", "post_id": str(content_id)}
    
    return send_push_notification(receiver_id, title, body, data)
```

### Achievement Notifications
```python
def create_achievement_notification(user_id, achievement_type, achievement_data):
    # Map achievement types to friendly messages
    achievement_messages = {
        'streak_milestone': f"🔥 {achievement_data['streak_days']} day streak! Keep it up!",
        'weight_milestone': f"💪 New PR! You lifted {achievement_data['weight']}kg on {achievement_data['exercise']}",
        'workout_count': f"🏆 Milestone reached: {achievement_data['count']} workouts completed!",
        'challenge_complete': f"🎉 You completed the {achievement_data['challenge_name']} challenge!",
    }
    
    title = "Achievement Unlocked!"
    body = achievement_messages.get(
        achievement_type, 
        "You've earned a new achievement!"
    )
    
    data = {
        "type": "achievement",
        "achievement_type": achievement_type,
        "screen": "achievements"
    }
    
    return send_push_notification(user_id, title, body, data)
```

## Best Practices

1. **Prioritize Notifications**: Don't overwhelm users with too many notifications
2. **User Preferences**: Allow users to customize notification preferences
3. **Deep Linking**: Ensure notifications navigate users to relevant app screens
4. **Batch Processing**: Group similar notifications when appropriate
5. **Localization**: Support multiple languages for notification content
6. **Scheduled Timing**: Consider user time zones when scheduling notifications
7. **Analytics**: Track notification engagement to improve effectiveness