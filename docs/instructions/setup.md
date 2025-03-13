# **Workout Logger & Macro Tracker - Full-Stack Setup Guide for Mac**

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
mkdir -p fitness-app && cd fitness-app
npm init -y
```

### **Step 2: Setup Workspaces (Yarn or Turborepo)**
#### **Using Yarn Workspaces (macOS)**
First, make sure Yarn is installed:
```sh
brew install yarn
```

Then update `package.json`:
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

#### **Using Turborepo (Alternative)**
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
mkdir -p apps
cd apps
npx create-next-app web --typescript --use-npm
cd web
npm install @supabase/supabase-js @tanstack/react-query chart.js recharts @mantine/core @mantine/hooks socket.io-client mapbox-gl leaflet
```

### **Step 4: Setup React Native Mobile App with Expo Router**

First, ensure you have the required dependencies for React Native development on macOS:
```sh
brew install node watchman
sudo gem install cocoapods
```

Then initialize the React Native project using the latest Expo template with Expo Router:

```sh
cd ..
# Create a new directory for your mobile app and navigate to it
mkdir mobile
cd mobile

# Create a new Expo project with Expo Router template
npx create-expo-app@latest . --template tabs

# Alternatively, to start with a clean slate:
# npx create-expo-app@latest . --template blank
```

The tabs template comes with Expo Router pre-configured and includes:
- Basic tab navigation structure
- TypeScript support
- Proper directory structure for file-based routing

Install the required dependencies for your fitness app:
```sh
# Install Supabase, React Query
npm install @supabase/supabase-js @tanstack/react-query @react-native-async-storage/async-storage

# Install charting libraries
npm install react-native-chart-kit react-native-svg

# Install map components
npm install react-native-maps

# Install camera functionality (using the local expo CLI - recommended)
npx expo install expo-camera

# Install health tracking
npm install @kingstinct/react-native-healthkit

# Install WebSocket for real-time features
npm install socket.io-client

# Required Expo packages
npx expo install expo-location expo-status-bar expo-updates expo-dev-client
```

> **Note:** Always use `npx expo install` instead of `npm install` for Expo packages to ensure version compatibility with your Expo SDK version.

#### **Important: Understanding Expo Router File Structure**

With Expo Router, your app's screens and navigation are based on the file structure:

- The `app` directory is where all your screens go
- Each file in the `app` directory becomes a route
- Use directories for nested routes (e.g., `app/profile/settings.js`)
- Special files like `_layout.tsx` define layouts for routes

Here's a simple example of the file structure:
```
app/
├── _layout.tsx       # Root layout (applies to all routes)
├── index.tsx         # Home screen
├── profile/          # Profile section
│   ├── _layout.tsx   # Layout just for profile section
│   ├── index.tsx     # Profile main screen
│   └── settings.tsx  # Profile settings screen
└── workouts/         # Workouts section
    ├── _layout.tsx   # Layout for workouts section
    ├── index.tsx     # Workouts list
    └── [id].tsx      # Dynamic workout details screen
```

#### **Important: Troubleshooting Common Issues**

If you encounter TypeScript bundling errors like `Invalid call at line XXXX: require(modulePath)` or errors with Expo Router:

```sh
# Clean up any TypeScript lib files that might be causing issues
find . -name "typescript.js" -delete
find . -name "lib/typescript*" -delete
rm -rf lib/

# For Expo Router context errors, check your app directory structure
# Make sure your app/ directory exists and contains at least:
mkdir -p app
touch app/index.js  # Basic entry point

# Clean up node_modules and reinstall
rm -rf node_modules/
npm install

# Clean Expo cache
npx expo start --clear
```

#### **Step 4.1: Configure iOS Settings for Expo**
For iOS development on Mac, you'll need to set up the correct permissions in your `app.json`:

```json
{
  "expo": {
    "name": "Fitness App",
    "slug": "fitness-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.fitnessapp",
      "infoPlist": {
        "NSCameraUsageDescription": "This app needs camera access to scan food items and barcodes",
        "NSPhotoLibraryUsageDescription": "This app needs photo library access to upload workout photos",
        "NSLocationWhenInUseUsageDescription": "This app needs location access to track workout routes",
        "NSHealthShareUsageDescription": "This app needs health data access to sync workouts and activity",
        "NSHealthUpdateUsageDescription": "This app needs to save workouts and activities to your health data"
      },
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACTIVITY_RECOGNITION"
      ],
      "package": "com.yourcompany.fitnessapp",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to take photos of food for tracking purposes."
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location to track your workouts."
        }
      ]
    ]
  }
}
```

#### **Step 4.1.1: Add Required Asset Files**

Before running prebuild or starting your Expo app, make sure to create all the required asset files:

```sh
# Create assets directory
mkdir -p assets

# Download all required assets
curl -o assets/icon.png https://raw.githubusercontent.com/expo/examples/master/with-dev-client/assets/icon.png
curl -o assets/splash.png https://raw.githubusercontent.com/expo/examples/master/with-dev-client/assets/splash.png
curl -o assets/adaptive-icon.png https://raw.githubusercontent.com/expo/examples/master/with-dev-client/assets/adaptive-icon.png
curl -o assets/favicon.png https://raw.githubusercontent.com/expo/examples/master/with-dev-client/assets/icon.png
```

These assets are required for the Expo build process and web configuration, even if you plan to replace them later with your own branding. Without these files, you may encounter errors when running or building your app.

#### **Step 4.2: Enable Healthkit Integration with Expo**
For iOS HealthKit integration with Expo:

1. First, install the proper HealthKit package:
```sh
# Remove the non-existent package if you've already installed it
npm uninstall expo-health

# Install the correct package
npm install @kingstinct/react-native-healthkit
# Or alternatively: npm install react-native-health
```

2. Create a development build to use native modules:
```sh
# This is needed when using native modules that aren't fully supported in Expo Go
npx expo prebuild
```

3. Update your app.json to include the necessary health permissions:
```json
{
  "expo": {
    "plugins": [
      [
        "@kingstinct/react-native-healthkit",
        {
          "healthSharePermission": "Allow $(PRODUCT_NAME) to access your health data for workout tracking",
          "healthUpdatePermission": "Allow $(PRODUCT_NAME) to save workout data to your health app"
        }
      ]
    ]
  }
}
```

4. For development testing, you can start with Expo Go which will provide warnings about missing native modules:
```sh
npx expo start
```

5. For full HealthKit functionality, you'll need to build a development client:
```sh
# After configuring EAS
eas build --profile development --platform ios
```

#### **Step 4.2.1: HealthKit Implementation Example**

Here's an example of how to use HealthKit in your app:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import Health from '@kingstinct/react-native-healthkit';

export default function HealthKitScreen() {
  const [steps, setSteps] = useState(0);
  
  useEffect(() => {
    // Request permissions when component mounts
    requestHealthPermissions();
  }, []);
  
  const requestHealthPermissions = async () => {
    try {
      const permissions = await Health.requestPermissions({
        read: [Health.Constants.Permissions.Steps, Health.Constants.Permissions.HeartRate],
```

#### **Step 4.3: Setting Up Development Environment for Expo**

Install the Expo Go app on your iOS device from the App Store for testing.

To run your app in development mode:
```sh
cd mobile
# Use the local expo CLI (recommended)
npx expo start
```

This will display a QR code that you can scan with your iPhone camera to open the app in Expo Go.

For iOS Simulator:
```sh
npx expo start --ios
```

For Android Emulator:
```sh
npx expo start --android
```

#### **Step 4.4: Building for Production**

For creating production builds, use EAS Build:
```sh
# Install the EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project for builds
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

#### **Step 4.5: Handling Expo Updates and Vulnerabilities**

Periodically check and update your Expo SDK version:

```sh
# Update Expo SDK
npx expo-doctor

# Fix vulnerabilities
npm audit fix
```

## **5. Backend Setup**
### **Step 5: Setup Django Backend**
Install Python dependencies on macOS:
```sh
cd ../../backend
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework supabase python-dotenv django-cors-headers djangorestframework-simplejwt openai pillow celery redis django-storages boto3 django-filter django-rest-auth drf-yasg channels
```

### **Step 6: Create Django Project & Apps**
```sh
django-admin startproject core .
python manage.py startapp api

# Create specific feature modules
mkdir -p api/workouts api/nutrition api/social api/ai api/analytics api/wearables
touch api/workouts/__init__.py api/workouts/views.py api/workouts/models.py api/workouts/serializers.py api/workouts/urls.py
touch api/nutrition/__init__.py api/nutrition/views.py api/nutrition/models.py api/nutrition/serializers.py api/nutrition/urls.py
touch api/social/__init__.py api/social/views.py api/social/models.py api/social/serializers.py api/social/urls.py
touch api/ai/__init__.py api/ai/views.py api/ai/models.py api/ai/serializers.py api/ai/urls.py
touch api/analytics/__init__.py api/analytics/views.py api/analytics/models.py api/analytics/serializers.py api/analytics/urls.py
touch api/wearables/__init__.py api/wearables/views.py api/wearables/models.py api/wearables/serializers.py api/wearables/urls.py
```

### **Step 7: Configure Supabase in Django**
Create `.env` in the backend directory:
```sh
touch .env
```

Add the following to `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
REDIS_HOST=localhost
```

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

## **6. Setting up Redis on macOS**
Install and run Redis using Homebrew:
```sh
brew install redis
brew services start redis
```

Check Redis status:
```sh
brew services info redis
```

## **7. API Development**
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

Apply migrations:
```sh
python manage.py makemigrations
python manage.py migrate
```

## **8. AI Integration**
### **Step 9: OpenAI API for Food Recognition and Workout Planning**
First, make sure you have imageio for image processing:
```sh
pip install imageio
```

Example: `api/ai/services.py`
```python
import os
import base64
import openai
import imageio
from typing import Dict, List, Any

openai.api_key = os.getenv("OPENAI_API_KEY")

def encode_image(image_path):
    """Convert image to base64 encoding"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def identify_food(image_path: str) -> Dict[str, Any]:
    """
    Identify food from an image and return nutritional information
    """
    try:
        response = openai.chat.completions.create(
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
        return {
            "food_name": "Sample Food",  # Replace with actual parsing
            "calories": 200,
            "protein": 15,
            "carbs": 20,
            "fat": 5
        }
    except Exception as e:
        print(f"Error identifying food: {e}")
        return {
            "error": str(e)
        }
```

## **9. Running the Project Locally**
```sh
# Start backend (from the backend directory)
source venv/bin/activate
python manage.py runserver

# Start web frontend (from apps/web directory)
npm run dev

# Start mobile app (from apps/mobile directory)
# For iOS
npx react-native start
# In a new terminal
npx react-native run-ios

# For Android (if you have Android emulator set up)
npx react-native run-android
```

## **10. Setting Up Supabase**
1. Create an account on [supabase.com](https://supabase.com)
2. Create a new project
3. Get your API keys from the Settings > API section
4. Add the keys to your `.env` file

## **11. Development Tools for Mac**
- **Postman**: For API testing
  ```sh
  brew install --cask postman
  ```
- **VS Code**: For code editing
  ```sh
  brew install --cask visual-studio-code
  ```
- **React Native Debugger**: For mobile app debugging
  ```sh
  brew install --cask react-native-debugger
  ```
- **pgAdmin**: For PostgreSQL management (used by Supabase)
  ```sh
  brew install --cask pgadmin4
  ```

---
## **Final Thoughts**
This setup guide has been customized for macOS development, providing you with all the necessary commands and configurations to get started with your fitness app. The Next.js web app, React Native mobile app, and Django backend are now properly configured and integrated with Supabase for authentication and database services.

Next steps would include implementing user authentication flows, setting up the database schema in Supabase, and beginning development of the core features. Happy coding! 🚀

