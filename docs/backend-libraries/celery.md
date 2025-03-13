# Celery Task Queue

## Overview
Celery is an asynchronous task queue/job queue based on distributed message passing. It's used in our fitness app to handle background processing, scheduled tasks, and long-running operations without blocking the main request cycle.

## Features Used in Our Fitness App

- **AI Processing**: Handling compute-intensive AI operations like food recognition
- **Scheduled Tasks**: Running daily/weekly analytics calculations
- **Email Notifications**: Sending workout reminders and achievement notifications
- **Data Aggregation**: Calculating user statistics and leaderboards
- **Workout Plan Generation**: Creating personalized workout plans with AI
- **Database Maintenance**: Cleaning up expired data and optimizing storage

## Implementation Examples

### Celery Configuration
```python
# celery.py
import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('fitness')

# Using a string here avoids the need to serialize 
# the configuration object to child processes
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps
app.autodiscover_tasks()

# Optional: Configure specific queues
app.conf.task_routes = {
    'api.ai.*': {'queue': 'ai'},
    'api.notifications.*': {'queue': 'notifications'},
    'api.analytics.*': {'queue': 'analytics'},
}

# Configure periodic tasks
app.conf.beat_schedule = {
    'update-daily-leaderboards': {
        'task': 'api.analytics.tasks.update_leaderboards',
        'schedule': 3600.0,  # Every hour
    },
    'send-workout-reminders': {
        'task': 'api.notifications.tasks.send_workout_reminders',
        'schedule': 86400.0,  # Daily
    },
}
```

### AI Processing Task
```python
# api/ai/tasks.py
from celery import shared_task
import logging
import openai
from api.ai.services import encode_image

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_food_image(self, image_path, user_id):
    """
    Process food image with AI and store the results
    """
    try:
        from api.nutrition.models import Food
        from api.ai.services import identify_food
        
        # Process the image with OpenAI
        food_data = identify_food(image_path)
        
        # Save the recognized food
        food = Food(
            name=food_data['food_name'],
            calories=food_data['calories'],
            protein=food_data['protein'],
            carbs=food_data['carbs'],
            fat=food_data['fat'],
            image_url=image_path,
            user_id=user_id,
            is_custom=False
        )
        food.save()
        
        return food.id
    except (openai.error.APIError, openai.error.RateLimitError) as exc:
        logger.warning(f"OpenAI API error: {exc}")
        raise self.retry(exc=exc)
    except Exception as exc:
        logger.error(f"Food recognition failed: {exc}")
        return None
```

### Workout Reminder Task
```python
# api/notifications/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_workout_reminders():
    """
    Send workout reminders to users who haven't worked out recently
    """
    from api.workouts.models import Workout
    from api.notifications.services import send_push_notification
    
    try:
        # Find users who haven't worked out in 3 days
        three_days_ago = timezone.now() - timedelta(days=3)
        recent_workout_users = Workout.objects.filter(
            date__gte=three_days_ago
        ).values_list('user_id', flat=True).distinct()
        
        # Get user profiles who need reminders
        from api.social.models import UserProfile
        users_needing_reminder = UserProfile.objects.exclude(
            user_id__in=recent_workout_users
        )
        
        for user in users_needing_reminder:
            # Send push notification
            send_push_notification(
                user_id=user.user_id,
                title="Time to workout!",
                body="It's been a few days since your last workout. Keep your momentum going!",
                data={
                    "type": "workout_reminder",
                    "days_since_workout": 3
                }
            )
            
            logger.info(f"Sent workout reminder to user {user.user_id}")
            
        return len(users_needing_reminder)
    except Exception as e:
        logger.error(f"Failed to send workout reminders: {e}")
        return 0
```

### Analytics Aggregation Task
```python
# api/analytics/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def update_leaderboards():
    """
    Update global and challenge leaderboards
    """
    try:
        from api.social.models import Challenge
        from api.analytics.services import calculate_challenge_standings, update_global_leaderboards
        
        # Update global leaderboards
        update_global_leaderboards()
        
        # Update active challenge leaderboards
        today = timezone.now().date()
        active_challenges = Challenge.objects.filter(
            start_date__lte=today,
            end_date__gte=today
        )
        
        for challenge in active_challenges:
            calculate_challenge_standings(challenge.id)
            
        return len(active_challenges)
    except Exception as e:
        logger.error(f"Failed to update leaderboards: {e}")
        return 0

@shared_task
def calculate_user_fitness_stats(user_id):
    """
    Calculate and cache user fitness statistics
    """
    try:
        from api.analytics.models import UserStats
        from api.workouts.models import Workout, WorkoutSet
        from django.db.models import Avg, Sum, Max, Count
        
        # Calculate workout frequency (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        workouts = Workout.objects.filter(
            user_id=user_id,
            date__gte=thirty_days_ago
        )
        
        workout_count = workouts.count()
        total_duration = workouts.aggregate(Sum('duration'))['duration__sum'] or 0
        
        # Calculate lifting stats
        lifting_sets = WorkoutSet.objects.filter(
            workout__user_id=user_id,
            workout__date__gte=thirty_days_ago,
            weight__isnull=False
        )
        
        total_volume = 0
        for lift_set in lifting_sets:
            total_volume += lift_set.weight * lift_set.reps
        
        # Get personal records
        personal_records = {}
        exercise_groups = lifting_sets.values('exercise').annotate(max_weight=Max('weight'))
        
        for group in exercise_groups:
            exercise_id = group['exercise']
            max_weight = group['max_weight']
            max_set = lifting_sets.filter(exercise=exercise_id, weight=max_weight).first()
            
            if max_set:
                from api.workouts.models import Exercise
                exercise = Exercise.objects.get(pk=exercise_id)
                personal_records[exercise.name] = max_weight
        
        # Save or update user stats
        UserStats.objects.update_or_create(
            user_id=user_id,
            defaults={
                'workout_frequency_30d': workout_count,
                'total_duration_30d': total_duration,
                'total_volume_30d': total_volume,
                'personal_records': personal_records,
                'last_calculated': timezone.now()
            }
        )
        
        return user_id
    except Exception as e:
        logger.error(f"Failed to calculate user stats for {user_id}: {e}")
        return None
```

### Usage in Views
```python
# api/ai/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .tasks import process_food_image
import os

class FoodRecognitionView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response(
                {"error": "No image provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image = request.FILES['image']
        user_id = request.user.id
        
        # Save image temporarily
        temp_path = f"/tmp/food_{user_id}_{image.name}"
        with open(temp_path, 'wb+') as f:
            for chunk in image.chunks():
                f.write(chunk)
        
        # Process image asynchronously
        task = process_food_image.delay(temp_path, user_id)
        
        return Response({
            "message": "Food image being processed",
            "task_id": task.id
        })
```

## Monitoring and Management

### Flower Setup for Monitoring
```python
# settings.py
CELERY_FLOWER_USER = os.environ.get('CELERY_FLOWER_USER', 'admin')
CELERY_FLOWER_PASSWORD = os.environ.get('CELERY_FLOWER_PASSWORD', 'password')
```

```sh
# Start Flower monitoring
celery -A core flower --address=0.0.0.0 --port=5555 --basic_auth=$CELERY_FLOWER_USER:$CELERY_FLOWER_PASSWORD
```

### Task Status Checking
```python
from celery.result import AsyncResult
from rest_framework.views import APIView
from rest_framework.response import Response

class TaskStatusView(APIView):
    def get(self, request, task_id):
        task_result = AsyncResult(task_id)
        
        result = {
            "task_id": task_id,
            "status": task_result.status,
            "ready": task_result.ready(),
        }
        
        # Include result if task is ready
        if task_result.ready():
            result["result"] = task_result.get() if task_result.successful() else None
            result["error"] = str(task_result.result) if task_result.failed() else None
        
        return Response(result)
```

## Best Practices

1. **Task Idempotency**: Design tasks to be idempotent (can be run multiple times with the same result)
2. **Appropriate Timeouts**: Set reasonable timeouts for tasks to prevent worker starvation
3. **Error Handling**: Implement proper exception handling and retries
4. **Task Queues**: Use separate queues for different types of tasks (AI, notifications, etc.)
5. **Result Backend**: Configure a reliable result backend for task status tracking
6. **Monitoring**: Set up monitoring for task queues and worker status
7. **Resource Limits**: Set memory and time limits for tasks to prevent resource exhaustion