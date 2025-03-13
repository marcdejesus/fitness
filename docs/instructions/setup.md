# **Workout Logger & Macro Tracker - Full-Stack Setup Guide**

## **1. Project Overview**
This project is a fitness app combining **workout logging, macro tracking, AI food recognition, and social features**. The tech stack includes:
- **Frontend (Web)**: Next.js
- **Frontend (Mobile)**: React Native
- **Backend**: Django (Django REST Framework)
- **Database & Auth**: Supabase
- **AI Integration**: OpenAI API
- **Geolocation & Maps**: MapBox/Google Maps API
- **Wearable Integration**: Apple HealthKit/Google Fit SDKs
- **Real-time Features**: WebSockets/Socket.io

## **2. Folder Structure**
```plaintext
/fitness-app  
│── /apps  
│   ├── /web            # Next.js frontend  
│   ├── /mobile         # React Native frontend  
│── /backend            # Django backend  
│   ├── /api            # Django app (workouts, macros, users, social)  
│   │   ├── /workouts   # Workout tracking endpoints
│   │   ├── /nutrition  # Macro tracking endpoints
│   │   ├── /social     # Social features endpoints
│   │   ├── /ai         # AI recommendation endpoints
│   │   ├── /analytics  # User progress analytics
│   │   ├── /wearables  # Wearable device integration
│   ├── /core           # Main Django project files  
│── /shared             # Shared utilities for both frontends  
│   ├── /components     # Shared UI components
│   ├── /hooks          # Shared React hooks
│   ├── /types          # TypeScript types/interfaces
│   ├── /utils          # Shared utilities
│── package.json        # Monorepo management (Turborepo or Yarn Workspaces)  
│── README.md  
```

## **3. Initial Setup**
### **Step 1: Create the Monorepo**
```sh
mkdir fitness-app && cd fitness-app
npm init -y
```

### **Step 2: Setup Workspaces (Yarn or Turborepo)**
#### **Using Yarn Workspaces**
```json
{
  "private": true,
  "workspaces": [
    "apps/web",
    "apps/mobile",
    "shared"
  ]
}
```
#### **Using Turborepo**
```sh
npm install -g turbo
npm install --save-dev turbo
```
Create `turbo.json`:
```json
{
  "pipeline": {
    "dev": {
      "dependsOn": ["^dev"],
      "outputs": []
    }
  }
}
```

## **4. Frontend Setup**
### **Step 3: Setup Next.js Web App**
```sh
cd apps
npx create-next-app web --ts --use-npm
cd web
npm install @supabase/supabase-js react-query @tanstack/react-query chart.js recharts @mantine/core @mantine/hooks socket.io-client mapbox-gl leaflet
```

### **Step 4: Setup React Native Mobile App**
```sh
npx react-native init mobile --template react-native-template-typescript
cd mobile
npm install @supabase/supabase-js react-query @tanstack/react-query @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs @react-native-async-storage/async-storage react-native-chart-kit react-native-maps react-native-svg react-native-vision-camera socket.io-client react-native-ble-plx react-native-health react-native-barcode-scanner react-native-push-notification
```

#### **Step 4.1: Configure External APIs for Mobile**
Update `android/app/src/main/AndroidManifest.xml` for permissions:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

<!-- For Google Maps -->
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY_HERE"/>
```

For iOS, update `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>App needs camera access for food recognition and barcode scanning</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>App needs location access for workout tracking</string>
<key>NSHealthShareUsageDescription</key>
<string>App needs health data access to sync workouts</string>
<key>NSHealthUpdateUsageDescription</key>
<string>App needs health data access to sync workouts</string>
```

## **5. Backend Setup**
### **Step 5: Setup Django Backend**
```sh
cd backend
python -m venv venv
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
pip install django djangorestframework supabase python-dotenv django-cors-headers djangorestframework-simplejwt openai pillow celery redis django-storages boto3 django-filter django-rest-auth drf-yasg channels
```

### **Step 6: Create Django Project & Apps**
```sh
django-admin startproject core .
python manage.py startapp api

# Create specific feature modules
mkdir -p api/workouts api/nutrition api/social api/ai api/analytics api/wearables
touch api/workouts/{__init__,views,models,serializers,urls}.py
touch api/nutrition/{__init__,views,models,serializers,urls}.py
touch api/social/{__init__,views,models,serializers,urls}.py
touch api/ai/{__init__,views,models,serializers,urls}.py
touch api/analytics/{__init__,views,models,serializers,urls}.py
touch api/wearables/{__init__,views,models,serializers,urls}.py
```

### **Step 7: Configure Supabase in Django**
Modify `settings.py`:
```python
import os
from dotenv import load_dotenv
import supabase

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# Add channels for WebSockets
INSTALLED_APPS = [
    # ...
    'channels',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_yasg',
    'storages',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...other middleware
]

# For real-time features
ASGI_APPLICATION = 'core.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(os.getenv('REDIS_HOST', 'localhost'), 6379)],
        },
    },
}

# For background tasks
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
```

## **6. API Development**
### **Step 8: Define Core Models**
Example: `api/workouts/models.py`
```python
from django.db import models

class Exercise(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    muscle_group = models.CharField(max_length=100)
    is_cardio = models.BooleanField(default=False)
    is_custom = models.BooleanField(default=False)
    user_id = models.UUIDField(null=True, blank=True)  # Only set for custom exercises
    
    def __str__(self):
        return self.name

class Workout(models.Model):
    user_id = models.UUIDField()
    name = models.CharField(max_length=255)
    date = models.DateTimeField()
    duration = models.IntegerField(help_text="Duration in minutes")
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.name} - {self.date}"

class WorkoutSet(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='sets')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    reps = models.IntegerField()
    weight = models.FloatField(null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True, help_text="Duration in seconds")
    distance = models.FloatField(null=True, blank=True, help_text="Distance in meters")
    set_number = models.IntegerField()
    
    class Meta:
        ordering = ['set_number']
```

Example: `api/nutrition/models.py`
```python
from django.db import models

class Food(models.Model):
    name = models.CharField(max_length=255)
    calories = models.IntegerField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fat = models.FloatField()
    fiber = models.FloatField(default=0)
    sugar = models.FloatField(default=0)
    barcode = models.CharField(max_length=100, null=True, blank=True)
    is_custom = models.BooleanField(default=False)
    user_id = models.UUIDField(null=True, blank=True)  # Only set for custom foods
    image_url = models.URLField(null=True, blank=True)
    
    def __str__(self):
        return self.name

class MealEntry(models.Model):
    MEAL_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]
    
    user_id = models.UUIDField()
    food = models.ForeignKey(Food, on_delete=models.CASCADE)
    meal_type = models.CharField(max_length=20, choices=MEAL_CHOICES)
    servings = models.FloatField(default=1.0)
    date = models.DateField()
    time = models.TimeField()
    
    def __str__(self):
        return f"{self.food.name} - {self.meal_type} on {self.date}"

class WaterIntake(models.Model):
    user_id = models.UUIDField()
    amount = models.FloatField(help_text="Amount in milliliters")
    date = models.DateField()
    time = models.TimeField()
    
    def __str__(self):
        return f"{self.amount}ml on {self.date}"
```

Example: `api/social/models.py`
```python
from django.db import models

class UserProfile(models.Model):
    user_id = models.UUIDField(unique=True)
    display_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(null=True, blank=True)
    fitness_level = models.CharField(max_length=50, blank=True)
    goal = models.CharField(max_length=100, blank=True)
    
    def __str__(self):
        return self.display_name

class FriendRelation(models.Model):
    user_id = models.UUIDField()
    friend_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user_id', 'friend_id')

class Post(models.Model):
    user_id = models.UUIDField()
    content = models.TextField()
    image_url = models.URLField(null=True, blank=True)
    workout = models.ForeignKey('workouts.Workout', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Post by {self.user_id} at {self.created_at}"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user_id = models.UUIDField()
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('post', 'user_id')

class Challenge(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_by = models.UUIDField()
    start_date = models.DateField()
    end_date = models.DateField()
    is_public = models.BooleanField(default=True)
    
    def __str__(self):
        return self.title

class ChallengeParticipant(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='participants')
    user_id = models.UUIDField()
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('challenge', 'user_id')
```

```sh
python manage.py makemigrations
python manage.py migrate
```

## **7. AI Integration**
### **Step 9: OpenAI API for Food Recognition and Workout Planning**
Example: `api/ai/services.py`
```python
import os
import openai
from typing import Dict, List, Any

openai.api_key = os.getenv("OPENAI_API_KEY")

def identify_food(image_path: str) -> Dict[str, Any]:
    """
    Identify food from an image and return nutritional information
    """
    response = openai.ChatCompletion.create(
        model="gpt-4-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What food is in this image? Provide name and estimated nutritional information (calories, protein, carbs, fat)."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encode_image(image_path)}"}}
                ]
            }
        ],
        max_tokens=300
    )
    
    # Process the response to extract structured nutritional data
    # This is a simplified example
    return {
        "food_name": "Sample Food",
        "calories": 200,
        "protein": 15,
        "carbs": 20,
        "fat": 5
    }

def generate_workout_plan(user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate a personalized workout plan based on user data
    """
    prompt = f"""
    Create a personalized workout plan for a user with the following characteristics:
    - Goal: {user_data['goal']}
    - Fitness level: {user_data['fitness_level']}
    - Available equipment: {', '.join(user_data['available_equipment'])}
    - Preferred workout duration: {user_data['preferred_duration']} minutes
    - Workout frequency: {user_data['frequency']} days per week
    - Any injuries or limitations: {user_data.get('limitations', 'None')}
    
    Format the response as a structured workout plan with exercises, sets, reps, and rest periods.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are an expert fitness coach creating personalized workout plans."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1500
    )
    
    # Process the response to extract structured workout data
    # This is a simplified example
    return [
        {
            "day": 1,
            "focus": "Upper Body",
            "exercises": [
                {"name": "Bench Press", "sets": 3, "reps": 10, "rest": 60},
                {"name": "Pull-ups", "sets": 3, "reps": 8, "rest": 60}
            ]
        },
        # More workout days...
    ]
```

## **8. Real-time Features Setup**
### **Step 10: Configure WebSockets for Live Features**

Create `api/consumers.py` for WebSocket consumers:

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

Update `core/asgi.py` for WebSocket routing:

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

Create `api/routing.py`:

```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/workout/(?P<user_id>\w+)/$', consumers.WorkoutConsumer.as_asgi()),
    re_path(r'ws/social/(?P<user_id>\w+)/$', consumers.SocialConsumer.as_asgi()),
]
```

## **9. Wearable Device Integration**
### **Step 11: Setup Health Data Integration**

Example: `api/wearables/services.py`

```python
from datetime import datetime, timedelta
from typing import Dict, Any, List

def process_health_data(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process health data from wearables (Apple Health, Google Fit)
    """
    # Store health data in database
    # Analyze and extract insights
    return {
        "heartRate": {
            "average": data.get("heartRate", {}).get("average"),
            "min": data.get("heartRate", {}).get("min"),
            "max": data.get("heartRate", {}).get("max")
        },
        "steps": data.get("steps"),
        "distance": data.get("distance"),
        "calories": data.get("calories"),
        "sleep": data.get("sleep"),
        "insights": generate_insights(data)
    }

def generate_insights(health_data: Dict[str, Any]) -> List[str]:
    """
    Generate insights from health data
    """
    insights = []
    
    # Example insights
    if health_data.get("heartRate", {}).get("average", 0) > 75:
        insights.append("Your resting heart rate is above average. Consider more cardio exercise.")
    
    if health_data.get("sleep", 0) < 7:
        insights.append("You're getting less sleep than recommended. This might affect recovery.")
    
    return insights
```

## **10. Deployment**
### **Step 12: Deploy Backend (Railway, AWS, or Heroku)**
```sh
git init
git add .
git commit -m "Initial commit"
heroku create fitness-backend
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

### **Step 13: Deploy Web Frontend (Vercel)**
```sh
cd apps/web
vercel deploy
```

### **Step 14: Mobile App Deployment**
```sh
# For Android
cd apps/mobile
cd android
./gradlew bundleRelease

# For iOS
cd apps/mobile
cd ios
pod install
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release archive -archivePath YourApp.xcarchive
```

## **11. Running the Project Locally**
```sh
# Start backend
cd backend
python manage.py runserver

# Start web frontend
cd apps/web
npm run dev

# Start mobile app
cd apps/mobile
npx react-native start
npx react-native run-android # or run-ios
```

## **12. Scaling Considerations**
- Use **Amazon S3** or another object storage service for storing user images
- Implement **Redis caching** for frequently accessed data
- Consider using **Celery** for background tasks (food recognition, workout plan generation)
- Implement **database sharding** for scaling user data
- Use **CDN** for static assets delivery

---
## **Final Thoughts**
✅ Backend with Django & Supabase ✅ Next.js Web ✅ React Native Mobile ✅ AI Food Recognition & Workout Planning ✅ Social Features ✅ Real-time Communication ✅ Wearable Integration ✅ Analytics & Insights ✅ Deployment Setup  

You're now ready to build the ultimate fitness app with all planned features! 🚀

