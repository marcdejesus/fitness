# Django Channels & WebSockets

## Overview
Django Channels extends Django to handle WebSockets, enabling real-time features essential for interactive elements in our fitness app such as live workout sharing and instant notifications.

## Features Used in Our Fitness App

- **Live Workout Sharing**: Real-time updates during workout sessions
- **Group Challenges**: Live leaderboards and progress updates
- **Real-time Notifications**: Instant alerts for achievements and social interactions
- **Chat Functionality**: Direct messaging between users and trainers
- **Social Feed Updates**: Live updates for social content
- **Exercise Form Feedback**: Real-time feedback during workout sessions

## Implementation Examples

### Basic WebSocket Consumer
```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class WorkoutConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'workout_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        # Handle different message types
        if message_type == 'workout_update':
            # Process workout update
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'workout_update',
                    'workout': data.get('workout')
                }
            )
    
    # Receive workout update from room group
    async def workout_update(self, event):
        workout = event['workout']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'workout_update',
            'workout': workout
        }))
```

### WebSocket Routing
```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/workout/(?P<user_id>\w+)/$', consumers.WorkoutConsumer.as_asgi()),
    re_path(r'ws/social/(?P<user_id>\w+)/$', consumers.SocialConsumer.as_asgi()),
    re_path(r'ws/notifications/(?P<user_id>\w+)/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
```

### ASGI Configuration
```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import api.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})
```

### Authentication for WebSockets
```python
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get the token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = dict(x.split('=') for x in query_string.split('&') if x)
        
        token = query_params.get('token', None)
        scope['user'] = AnonymousUser()
        
        # Authenticate with JWT token
        if token:
            try:
                # Verify the token and get the user
                access_token = AccessToken(token)
                user = await self.get_user(access_token['user_id'])
                scope['user'] = user
            except (InvalidToken, TokenError):
                pass
        
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
```

### Group Challenge Consumer
```python
class ChallengeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.challenge_id = self.scope['url_route']['kwargs']['challenge_id']
        self.room_group_name = f'challenge_{self.challenge_id}'
        
        # Add user to challenge group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        
        # Send current challenge state
        challenge_data = await self.get_challenge_data()
        await self.send(text_data=json.dumps({
            'type': 'challenge_state',
            'challenge': challenge_data
        }))
    
    async def disconnect(self, close_code):
        # Remove from challenge group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'progress_update':
            # User has submitted new progress
            user_id = data.get('user_id')
            progress = data.get('progress')
            
            # Save progress to database
            await self.save_progress(user_id, progress)
            
            # Get updated leaderboard
            leaderboard = await self.get_leaderboard()
            
            # Broadcast to challenge group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'leaderboard_update',
                    'leaderboard': leaderboard
                }
            )
    
    async def leaderboard_update(self, event):
        leaderboard = event['leaderboard']
        
        # Send leaderboard update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_update',
            'leaderboard': leaderboard
        }))
    
    @database_sync_to_async
    def get_challenge_data(self):
        challenge = Challenge.objects.get(id=self.challenge_id)
        return {
            'id': challenge.id,
            'title': challenge.title,
            'description': challenge.description,
            'start_date': challenge.start_date.isoformat(),
            'end_date': challenge.end_date.isoformat(),
            'participants_count': challenge.participants.count()
        }
    
    @database_sync_to_async
    def save_progress(self, user_id, progress):
        # Implementation to save progress to database
        pass
    
    @database_sync_to_async
    def get_leaderboard(self):
        # Implementation to get current leaderboard data
        pass
```

### Sending Push Notifications through WebSockets
```python
async def broadcast_achievement(user_id, achievement_data):
    """
    Broadcast an achievement notification to all connections for this user
    """
    channel_layer = get_channel_layer()
    
    # Prepare achievement notification
    notification = {
        'type': 'achievement_notification',
        'achievement': {
            'id': achievement_data['id'],
            'title': achievement_data['title'],
            'description': achievement_data['description'],
            'icon': achievement_data['icon'],
            'earned_at': achievement_data['earned_at'].isoformat()
        }
    }
    
    # Send to user's notification group
    await channel_layer.group_send(
        f'notifications_{user_id}',
        notification
    )
    
    # If this is a public achievement, also broadcast to friends
    if achievement_data.get('is_public', False):
        friend_ids = await get_user_friend_ids(user_id)
        
        for friend_id in friend_ids:
            await channel_layer.group_send(
                f'social_{friend_id}',
                {
                    'type': 'friend_achievement',
                    'user_id': user_id,
                    'achievement': achievement_data
                }
            )
```

### Chat Consumer for Trainer-Client Communication
```python
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Load chat history
        chat_history = await self.get_chat_history()
        await self.send(text_data=json.dumps({
            'type': 'chat_history',
            'messages': chat_history
        }))
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'chat_message':
            message = data.get('message')
            user_id = data.get('user_id')
            user_name = data.get('user_name')
            
            # Save message to database
            await self.save_message(user_id, message)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'user_id': user_id,
                    'user_name': user_name,
                    'timestamp': datetime.now().isoformat()
                }
            )
    
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'user_id': event['user_id'],
            'user_name': event['user_name'],
            'timestamp': event['timestamp']
        }))
    
    @database_sync_to_async
    def get_chat_history(self):
        # Get chat history from database
        messages = ChatMessage.objects.filter(
            room_name=self.room_name
        ).order_by('created_at')[:50]
        
        return [
            {
                'message': msg.content,
                'user_id': str(msg.user_id),
                'user_name': msg.user_name,
                'timestamp': msg.created_at.isoformat()
            }
            for msg in messages
        ]
    
    @database_sync_to_async
    def save_message(self, user_id, message):
        # Get user info
        user = UserProfile.objects.get(user_id=user_id)
        
        # Save message to database
        ChatMessage.objects.create(
            room_name=self.room_name,
            user_id=user_id,
            user_name=user.display_name,
            content=message
        )
```

## Scaling Considerations

### Redis Channel Layer Configuration
```python
# settings.py
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                (os.environ.get('REDIS_HOST', 'localhost'), 
                 int(os.environ.get('REDIS_PORT', 6379)))
            ],
            "capacity": 1500,  # Maximum number of messages in memory
            "expiry": 10,  # Message expiry time in seconds
        },
    },
}
```

### Running with Daphne (Production Server)
```sh
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

### Load Testing WebSockets
```python
# Example load testing script using locust
from locust import HttpUser, task, between
import websocket
import json
import time

class WebSocketUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Connect to WebSocket
        self.ws = websocket.create_connection(
            f"ws://{self.host}/ws/workout/{self.user_id}/",
            header={"Authorization": f"Bearer {self.token}"}
        )
    
    def on_stop(self):
        # Disconnect WebSocket
        self.ws.close()
    
    @task
    def send_workout_update(self):
        # Send workout update
        message = {
            "type": "workout_update",
            "workout": {
                "exercise": "Bench Press",
                "sets": 3,
                "reps": 10,
                "weight": 100
            }
        }
        self.ws.send(json.dumps(message))
        
        # Wait for response
        result = self.ws.recv()
        response = json.loads(result)
        
        # Log success/failure
        if response.get("type") == "workout_update":
            self.environment.events.request_success.fire(
                request_type="WebSocket", 
                name="workout_update", 
                response_time=0,
                response_length=0
            )
        else:
            self.environment.events.request_failure.fire(
                request_type="WebSocket", 
                name="workout_update", 
                response_time=0,
                exception=Exception("Invalid response")
            )
```

## Best Practices

1. **Always use asynchronous code** in consumer methods to prevent blocking
2. **Keep connections lightweight** - avoid heavy processing in WebSocket handlers
3. **Implement proper authentication** for all WebSocket connections
4. **Use database_sync_to_async** for all database operations in async consumers
5. **Implement message validation** to prevent malicious data
6. **Monitor channel layer usage** to prevent memory issues
7. **Implement reconnection logic** in frontend clients