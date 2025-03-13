# AI Services Documentation

## Overview
Our fitness app leverages advanced artificial intelligence to provide personalized, data-driven features that enhance the user experience and deliver better fitness outcomes. This document details the implementation and functionality of our core AI services.

## Key AI Features

- **Food Recognition & Nutritional Analysis**: Identify foods from photos and provide accurate nutritional data
- **Personalized Workout Planning**: Generate custom workout routines based on user goals and metrics
- **Smart Exercise Suggestions**: Recommend optimal exercises to balance workouts and target specific goals
- **Form Analysis & Feedback**: Analyze workout videos to provide form correction advice
- **Predictive Progress Analytics**: Forecast fitness improvements based on current performance
- **Adaptive Training Intensity**: Dynamically adjust workout difficulty based on user performance
- **Meal Planning & Recipes**: Create personalized meal plans aligned with nutritional targets

## Architecture Overview

Our AI services use a combination of:
- **OpenAI APIs**: Vision models for image recognition, GPT models for planning and recommendations
- **Django Backend**: Processing requests, storing results, and managing AI service orchestration
- **Celery Task Queue**: Handling asynchronous AI processing tasks
- **Redis Cache**: Storing intermediate results and managing task states
- **Supabase Storage**: Storing and serving user-uploaded images for AI processing

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│            │     │            │     │            │
│  Frontend  │────▶│  Backend   │────▶│  Celery    │
│            │     │            │     │  Workers   │
└────────────┘     └────────────┘     └─────┬──────┘
                                            │
                                            ▼
                                     ┌────────────┐
                                     │            │
                                     │  OpenAI    │
                                     │  APIs      │
                                     │            │
                                     └────────────┘
```

## Food Recognition Implementation

### Process Flow

1. User uploads food image in the app
2. Image is stored temporarily in cloud storage
3. Backend dispatches a Celery task for processing
4. OpenAI Vision API analyzes the image
5. Results are parsed, stored, and returned to user
6. User can confirm or adjust the identified food and portions

### Code Implementation

#### 1. Food Image Processing Service
```python
# api/ai/services.py
import os
import base64
import openai
from typing import Dict, Any
from django.conf import settings

openai.api_key = settings.OPENAI_API_KEY

def encode_image(image_path: str) -> str:
    """Convert image to base64 string for API transmission"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def identify_food(image_path: str) -> Dict[str, Any]:
    """
    Identify food from an image and return nutritional information
    """
    try:
        # Create base64 image string
        base64_image = encode_image(image_path)
        
        response = openai.ChatCompletion.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a nutritional expert. Identify the food in the image and provide accurate nutritional information."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What food is in this image? Provide name and estimated nutritional information in JSON format with keys: food_name, calories, protein, carbs, fat, fiber, sugar."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        # Extract the JSON result from the response
        result = response.choices[0].message.content
        import json
        nutritional_data = json.loads(result)
        
        # Add confidence level - this would be enhanced in a production system
        nutritional_data['confidence'] = 0.85
        
        return nutritional_data
    except Exception as e:
        # Log the error
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Food recognition error: {str(e)}")
        
        # Return a default response
        return {
            "food_name": "Unknown Food",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "confidence": 0,
            "error": str(e)
        }
```

#### 2. Celery Task for Asynchronous Processing
```python
# api/ai/tasks.py
from celery import shared_task
import logging
from api.ai.services import identify_food
from api.nutrition.models import Food, FoodImage, MealEntry
from django.utils import timezone

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_food_image(self, image_path, user_id, meal_entry_id=None):
    """
    Process food image with AI and store the results
    """
    try:
        # Process the image with OpenAI
        food_data = identify_food(image_path)
        
        # Save the recognized food
        food = Food.objects.create(
            name=food_data['food_name'],
            calories=food_data.get('calories', 0),
            protein=food_data.get('protein', 0),
            carbs=food_data.get('carbs', 0),
            fat=food_data.get('fat', 0),
            fiber=food_data.get('fiber', 0),
            sugar=food_data.get('sugar', 0),
            is_custom=False,
        )
        
        # Create food image record
        food_image = FoodImage.objects.create(
            user_id=user_id,
            image=image_path,
            ai_processed=True,
            food=food
        )
        
        # Link to meal entry if provided
        if meal_entry_id:
            try:
                meal_entry = MealEntry.objects.get(id=meal_entry_id)
                meal_entry.food = food
                meal_entry.save()
            except MealEntry.DoesNotExist:
                logger.warning(f"Meal entry {meal_entry_id} not found")
        
        return {
            "food_id": food.id,
            "food_name": food.name,
            "calories": food.calories,
            "confidence": food_data.get('confidence', 0)
        }
        
    except Exception as e:
        logger.error(f"Error processing food image: {str(e)}")
        # Retry the task if it fails
        self.retry(exc=e)
```

#### 3. API Endpoint for Food Recognition
```python
# api/nutrition/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from api.ai.tasks import process_food_image
from api.utils.storage import handle_uploaded_food_image
from django.utils import timezone

class FoodRecognitionView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response(
                {"error": "No image provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get meal details from request
        meal_type = request.data.get('meal_type', 'snack')
        date = request.data.get('date', timezone.now().date().isoformat())
        time = request.data.get('time', timezone.now().time().strftime('%H:%M'))
        
        # Handle file upload
        image_file = request.FILES['image']
        file_info = handle_uploaded_food_image(image_file)
        
        # Create a placeholder meal entry
        from api.nutrition.models import MealEntry
        meal_entry = MealEntry.objects.create(
            user_id=request.user.id,
            meal_type=meal_type,
            date=date,
            time=time,
            # Food will be set once AI processing is complete
        )
        
        # Process with Celery task
        task = process_food_image.delay(
            file_info['path'], 
            request.user.id,
            meal_entry.id
        )
        
        return Response({
            'task_id': task.id,
            'status': 'Processing',
            'image_url': file_info['url'],
            'meal_entry_id': meal_entry.id
        }, status=status.HTTP_202_ACCEPTED)
```

### Improving Food Recognition Accuracy

Our food recognition system implements several strategies to improve accuracy:

1. **Pre-processing images** to enhance quality and remove noise
2. **Multiple recognition passes** for complex plates with multiple foods
3. **User feedback loop** to continuously train and improve the model
4. **Regional food database** to better recognize local cuisines
5. **Portion size estimation** using reference objects in images

## Workout Planning Implementation

### Process Flow

1. User inputs their fitness goals, experience level, and preferences
2. System retrieves user's workout history and performance metrics
3. AI generates personalized workout plan based on inputs and historical data
4. Plan is reviewed and can be adjusted by the user
5. System tracks adherence and results to improve future recommendations

### Code Implementation

#### 1. Workout Planning Service
```python
# api/ai/services.py
import openai
from typing import Dict, Any, List
from django.conf import settings

def generate_workout_plan(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a personalized workout plan based on user data
    """
    # Extract user info
    fitness_level = user_data.get('fitness_level', 'beginner')
    goal = user_data.get('goal', 'general fitness')
    available_equipment = user_data.get('available_equipment', [])
    limitations = user_data.get('limitations', 'none')
    days_per_week = user_data.get('days_per_week', 3)
    workout_duration = user_data.get('workout_duration', 60)
    
    # Build prompt with detailed user information
    prompt = f"""
    Create a personalized {days_per_week}-day workout plan for a {fitness_level} with the goal of {goal}.
    Available equipment: {', '.join(available_equipment)}
    Limitations or injuries: {limitations}
    Workout duration: {workout_duration} minutes per session
    
    The workout plan should include:
    1. A structured weekly schedule
    2. Specific exercises for each day
    3. Sets, reps, and rest periods for each exercise
    4. Warm-up and cool-down recommendations
    5. Progressive overload strategy
    
    Format the response as a JSON object with the following structure:
    {{
        "plan_name": "Name of the workout plan",
        "description": "Brief description of the plan and its benefits",
        "days": [
            {{
                "day": 1,
                "focus": "Main focus of the workout (e.g., 'Upper Body')",
                "exercises": [
                    {{
                        "name": "Exercise name",
                        "sets": number of sets,
                        "reps": number of reps (or duration for timed exercises),
                        "rest": rest period in seconds,
                        "notes": "Any specific instructions for the exercise"
                    }},
                    // More exercises...
                ],
                "warm_up": "Warm-up instructions",
                "cool_down": "Cool-down instructions"
            }},
            // More days...
        ],
        "progression": "How to progress with this plan over time"
    }}
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert fitness coach specializing in creating personalized workout plans based on individual goals and circumstances."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2000,
        response_format={"type": "json_object"}
    )
    
    # Parse the response
    import json
    plan = json.loads(response.choices[0].message.content)
    
    # Enhance the plan with exercise details from our database
    plan = enrich_workout_plan_with_exercise_data(plan)
    
    return plan

def enrich_workout_plan_with_exercise_data(plan: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enhance the workout plan with additional exercise data from our database
    """
    from api.workouts.models import Exercise
    
    # Go through each exercise in the plan
    for day in plan.get('days', []):
        for i, exercise in enumerate(day.get('exercises', [])):
            exercise_name = exercise.get('name')
            
            # Try to find the exercise in our database
            try:
                db_exercise = Exercise.objects.filter(name__icontains=exercise_name).first()
                
                if db_exercise:
                    # Add additional information from our database
                    exercise['id'] = db_exercise.id
                    exercise['muscle_group'] = db_exercise.muscle_group
                    exercise['description'] = db_exercise.description
                    exercise['is_cardio'] = db_exercise.is_cardio
                    # Add illustration/video if available
                    if hasattr(db_exercise, 'illustration') and db_exercise.illustration:
                        exercise['illustration'] = db_exercise.illustration.url
                    
            except Exception as e:
                # Log the error but continue processing
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error enriching exercise data for {exercise_name}: {e}")
    
    return plan
```

#### 2. Celery Task for Workout Plan Generation
```python
# api/ai/tasks.py
from celery import shared_task
import logging
from api.ai.services import generate_workout_plan
from api.workouts.models import WorkoutPlan, WorkoutDay, PlannedExercise
from django.utils import timezone

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def create_workout_plan(self, user_id, user_data):
    """
    Generate and save a personalized workout plan
    """
    try:
        # Generate the plan using AI
        plan_data = generate_workout_plan(user_data)
        
        # Create workout plan in database
        workout_plan = WorkoutPlan.objects.create(
            user_id=user_id,
            name=plan_data.get('plan_name', 'Custom Workout Plan'),
            description=plan_data.get('description', ''),
            goal=user_data.get('goal', 'general fitness'),
            days_per_week=user_data.get('days_per_week', 3),
            created_at=timezone.now(),
            progression_strategy=plan_data.get('progression', '')
        )
        
        # Create workout days and exercises
        for day_data in plan_data.get('days', []):
            workout_day = WorkoutDay.objects.create(
                plan=workout_plan,
                day_number=day_data.get('day', 1),
                focus=day_data.get('focus', ''),
                warm_up=day_data.get('warm_up', ''),
                cool_down=day_data.get('cool_down', '')
            )
            
            # Add exercises to the day
            for i, exercise_data in enumerate(day_data.get('exercises', [])):
                exercise_id = exercise_data.get('id', None)
                
                # Create the planned exercise
                PlannedExercise.objects.create(
                    day=workout_day,
                    exercise_id=exercise_id,  # Link to our exercise DB if available
                    name=exercise_data.get('name', ''),
                    sets=exercise_data.get('sets', 3),
                    reps=exercise_data.get('reps', 10),
                    rest_seconds=exercise_data.get('rest', 60),
                    notes=exercise_data.get('notes', ''),
                    order=i + 1
                )
        
        return {
            'plan_id': workout_plan.id,
            'name': workout_plan.name,
            'days': workout_plan.days_per_week
        }
        
    except Exception as e:
        logger.error(f"Error creating workout plan: {str(e)}")
        self.retry(exc=e)
```

#### 3. API Endpoint for Workout Plan Generation
```python
# api/workouts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from api.ai.tasks import create_workout_plan
from .serializers import WorkoutPlanRequestSerializer

class GenerateWorkoutPlanView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = WorkoutPlanRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare user data for AI processing
        user_data = {
            'fitness_level': serializer.validated_data.get('fitness_level'),
            'goal': serializer.validated_data.get('goal'),
            'available_equipment': serializer.validated_data.get('available_equipment'),
            'limitations': serializer.validated_data.get('limitations'),
            'days_per_week': serializer.validated_data.get('days_per_week'),
            'workout_duration': serializer.validated_data.get('workout_duration')
        }
        
        # Enhance with user history data
        user_data = enrich_with_user_history(request.user.id, user_data)
        
        # Process with Celery task
        task = create_workout_plan.delay(request.user.id, user_data)
        
        return Response({
            'task_id': task.id,
            'status': 'Processing',
            'message': 'Your personalized workout plan is being generated'
        }, status=status.HTTP_202_ACCEPTED)

def enrich_with_user_history(user_id, user_data):
    """
    Add user workout history data to improve plan personalization
    """
    from api.workouts.models import Workout, WorkoutSet
    from django.db.models import Avg, Max, Count
    from django.utils import timezone
    
    # Get recent workout data (last 30 days)
    thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
    recent_workouts = Workout.objects.filter(
        user_id=user_id, 
        date__gte=thirty_days_ago
    )
    
    # Calculate workout frequency
    workout_count = recent_workouts.count()
    days_with_workouts = recent_workouts.dates('date', 'day').count()
    
    if days_with_workouts > 0:
        avg_workouts_per_week = (workout_count / days_with_workouts) * 7
        user_data['recent_workout_frequency'] = avg_workouts_per_week
    
    # Get exercise preferences (most common exercises)
    exercise_counts = WorkoutSet.objects.filter(
        workout__in=recent_workouts
    ).values('exercise__name').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    preferred_exercises = [item['exercise__name'] for item in exercise_counts]
    user_data['preferred_exercises'] = preferred_exercises
    
    # Get strength levels for key exercises
    key_exercises = ['Bench Press', 'Squat', 'Deadlift', 'Shoulder Press']
    strength_data = {}
    
    for exercise in key_exercises:
        max_weight = WorkoutSet.objects.filter(
            workout__in=recent_workouts,
            exercise__name=exercise
        ).aggregate(max_weight=Max('weight'))
        
        if max_weight['max_weight']:
            strength_data[exercise] = max_weight['max_weight']
    
    user_data['strength_data'] = strength_data
    
    return user_data
```

### Workout Planning Optimization

Our workout planning system implements several advanced strategies:

1. **Personal Progression Tracking**: Adjusts plans based on user's actual progression
2. **Volume & Intensity Management**: Ensures proper workout balance and recovery
3. **Periodization**: Implements scientific training phases (hypertrophy, strength, power)
4. **Exercise Variety**: Prevents plateaus by intelligently rotating exercises
5. **Adaptive Rest Periods**: Optimizes rest between sets based on goals

## AI Model Optimization

Our AI pipeline includes several optimization techniques:

1. **Model Caching**: Common queries are cached to reduce API calls
2. **Asynchronous Processing**: All AI tasks run in background workers
3. **Fallback Mechanisms**: Alternative models are used if primary models fail
4. **Request Batching**: Multiple AI requests are batched when possible
5. **Content-Based Filtering**: Only relevant data is sent to AI models

```python
# Example of model caching implementation
from django.core.cache import cache
import hashlib
import json

def cached_ai_request(function, request_data, cache_key_prefix, timeout=3600):
    """
    Wrapper for AI requests that implements caching
    """
    # Generate a unique cache key based on the function and request data
    data_hash = hashlib.md5(json.dumps(request_data, sort_keys=True).encode()).hexdigest()
    cache_key = f"{cache_key_prefix}:{data_hash}"
    
    # Try to get cached result
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return cached_result
    
    # If not cached, call the function
    result = function(request_data)
    
    # Cache the result
    cache.set(cache_key, result, timeout)
    
    return result

# Usage example
def get_food_recommendation(user_preferences):
    return cached_ai_request(
        ai_food_recommendation_function,
        user_preferences,
        'food_rec',
        timeout=86400  # 24 hours
    )
```

## AI Error Handling

Our AI services include robust error handling:

1. **Graceful Degradation**: Fall back to simpler models or cached results when needed
2. **User Feedback Loop**: Allow users to report incorrect AI results
3. **Monitoring & Alerts**: Track AI service performance and error rates
4. **Rate Limiting**: Implement proper throttling to prevent API abuse
5. **Detailed Error Logging**: Collect comprehensive data about AI failures

```python
# Example of AI error handling with fallbacks
def robust_food_recognition(image_path):
    """
    Food recognition with fallback mechanisms
    """
    try:
        # Try primary model (OpenAI GPT-4 Vision)
        result = identify_food_with_gpt4(image_path)
        return result
    except Exception as primary_error:
        # Log the primary error
        logger.error(f"Primary model error: {str(primary_error)}")
        
        try:
            # Try fallback model (local classifier)
            result = identify_food_with_local_model(image_path)
            result['used_fallback'] = True
            return result
        except Exception as fallback_error:
            # Log the fallback error
            logger.error(f"Fallback model error: {str(fallback_error)}")
            
            # Return basic response
            return {
                "food_name": "Unidentified Food",
                "confidence": 0,
                "error": "Could not identify food",
                "service_error": True
            }
```

## Privacy and Ethical Considerations

Our AI implementation prioritizes user privacy and ethical use:

1. **Data Minimization**: Only necessary data is sent to external AI services
2. **User Consent**: Clear opt-in for AI processing of user data
3. **Data Retention**: Raw data sent to AI services is not permanently stored
4. **Transparency**: Users are informed when interacting with AI systems
5. **Bias Prevention**: Regular audits to prevent and address algorithmic bias

## Future AI Enhancements

Planned enhancements to our AI services include:

1. **Multi-food recognition** in a single image
2. **Video-based exercise form analysis** with real-time feedback
3. **Predictive health analytics** based on nutrition and workout data
4. **Natural language workout queries** ("Create a quick arm workout")
5. **Personalized voice coaching** during workouts

## Monitoring and Performance

```python
# Example of AI service monitoring
def log_ai_request(service_name, request_data, response_data, processing_time, error=None):
    """
    Log AI service usage and performance
    """
    from api.analytics.models import AIServiceLog
    
    # Remove sensitive data from logs
    clean_request = sanitize_data_for_logging(request_data)
    
    # Create log entry
    AIServiceLog.objects.create(
        service_name=service_name,
        request_data=clean_request,
        response_status="error" if error else "success",
        error_message=str(error) if error else None,
        processing_time_ms=processing_time * 1000,  # Convert to milliseconds
        timestamp=timezone.now()
    )
    
    # Alert on critical errors
    if error and is_critical_error(error):
        send_admin_alert(service_name, error)
```

By implementing these AI services, our fitness app delivers highly personalized experiences that adapt to each user's unique fitness journey, helping them achieve their goals more efficiently and with better results.