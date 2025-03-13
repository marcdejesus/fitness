# Model Relationships Documentation

## Overview
This document outlines the database schema and relationships between models in our fitness application. Understanding these relationships is essential for efficient API development, query optimization, and maintaining data integrity.

## Core Model Structure

Our database schema is organized around several core domains:
- **User Management**: Authentication, profiles, and user settings
- **Workout Tracking**: Exercises, workouts, and performance metrics
- **Nutrition Management**: Food items, meals, and nutritional data
- **Social Platform**: Social connections, challenges, and activities
- **Analytics**: Progress tracking and performance insights
- **Wearable Integration**: Data from connected devices and external services

## Entity-Relationship Diagram

Here's a high-level view of the primary relationships between our core models:

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  UserProfile │◄───────┤    User      │───────▶│  UserSettings│
└──────┬───────┘        └──────────────┘        └──────────────┘
       │                        ▲
       │                        │
       ▼                        │
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│ SocialFollow │◄────────┤  Workout     │───────▶│  WorkoutSet  │
└──────────────┘         └──────┬───────┘        └──────┬───────┘
                                │                        │
                                │                        │
                                ▼                        ▼
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│ WorkoutPlan  │◄────────┤  Challenge   │        │  Exercise    │
└──────┬───────┘         └──────────────┘        └──────────────┘
       │                        ▲                        ▲
       │                        │                        │
       ▼                        │                        │
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│  WorkoutDay  │         │  MealEntry   │───────▶│  Food        │
└──────┬───────┘         └──────┬───────┘        └──────────────┘
       │                        │
       │                        │
       ▼                        ▼
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│PlannedExercise│        │ FoodImage    │◄───────┤ BodyMetric   │
└──────────────┘         └──────────────┘        └──────────────┘
```

## Model Relationships in Detail

### User Models

#### User (Django Auth User or Supabase Auth)
The core user account model that handles authentication.

```python
# Using Django's built-in User model or Supabase auth
from django.contrib.auth.models import User
```

#### UserProfile
Extends the base User model with fitness-specific profile information.

```python
class UserProfile(models.Model):
    user_id = models.UUIDField(primary_key=True)  # UUID from auth system
    display_name = models.CharField(max_length=150)
    email = models.EmailField()
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    user_type = models.CharField(
        max_length=20, 
        choices=[('user', 'Regular User'), ('trainer', 'Trainer')],
        default='user'
    )
    fitness_level = models.CharField(
        max_length=20,
        choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), 
                ('advanced', 'Advanced')],
        default='beginner'
    )
    height = models.FloatField(null=True, blank=True)  # in cm
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### UserSettings
Stores user preferences and app configuration settings.

```python
class UserSettings(models.Model):
    user_id = models.UUIDField(unique=True)
    dark_mode = models.BooleanField(default=False)
    notification_workouts = models.BooleanField(default=True)
    notification_nutrition = models.BooleanField(default=True)
    notification_social = models.BooleanField(default=True)
    measurement_system = models.CharField(
        max_length=10,
        choices=[('metric', 'Metric'), ('imperial', 'Imperial')],
        default='metric'
    )
    primary_goal = models.CharField(
        max_length=20,
        choices=[('strength', 'Strength'), ('weight_loss', 'Weight Loss'),
                ('muscle_gain', 'Muscle Gain'), ('endurance', 'Endurance')],
        default='strength'
    )
    workout_days_per_week = models.IntegerField(default=3)
    language = models.CharField(max_length=10, default='en')
```

### Workout Models

#### Exercise
Represents a specific exercise that can be performed.

```python
class Exercise(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    muscle_group = models.CharField(
        max_length=50,
        choices=[('chest', 'Chest'), ('back', 'Back'), ('legs', 'Legs'),
                ('shoulders', 'Shoulders'), ('arms', 'Arms'), ('core', 'Core'),
                ('full_body', 'Full Body'), ('cardio', 'Cardio')]
    )
    is_cardio = models.BooleanField(default=False)
    is_custom = models.BooleanField(default=False)
    created_by = models.UUIDField(null=True, blank=True)  # User who created custom exercise
    illustration = models.URLField(blank=True)
    video_url = models.URLField(blank=True)
    equipment_needed = models.CharField(max_length=100, blank=True)
    difficulty_level = models.IntegerField(default=1)  # 1-5 scale
    
    class Meta:
        indexes = [
            models.Index(fields=['muscle_group']),
            models.Index(fields=['is_custom', 'created_by']),
        ]
```

#### Workout
Records a completed workout session.

```python
class Workout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    name = models.CharField(max_length=100)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    duration = models.IntegerField(default=0)  # In minutes
    calories_burned = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    workout_plan_id = models.UUIDField(null=True, blank=True)  # Link to plan if following one
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-start_time']
        indexes = [
            models.Index(fields=['user_id', 'date']),
            models.Index(fields=['user_id', 'is_public']),
        ]
```

#### WorkoutSet
Individual sets performed during a workout.

```python
class WorkoutSet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout = models.ForeignKey('Workout', on_delete=models.CASCADE, related_name='sets')
    exercise = models.ForeignKey('Exercise', on_delete=models.PROTECT)
    set_number = models.IntegerField()
    reps = models.IntegerField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)  # in kg
    duration = models.IntegerField(null=True, blank=True)  # in seconds (for timed exercises)
    distance = models.FloatField(null=True, blank=True)  # in km (for cardio)
    rpe = models.IntegerField(null=True, blank=True)  # Rate of Perceived Exertion (1-10)
    one_rm = models.FloatField(null=True, blank=True)  # Calculated 1RM
    notes = models.CharField(max_length=200, blank=True)
    
    class Meta:
        ordering = ['workout', 'set_number']
        unique_together = ['workout', 'exercise', 'set_number']
```

#### WorkoutPlan
Template for a structured workout program.

```python
class WorkoutPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()  # Creator of the plan
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    goal = models.CharField(max_length=50)
    days_per_week = models.IntegerField()
    duration_weeks = models.IntegerField(default=4)
    fitness_level = models.CharField(
        max_length=20,
        choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), 
                ('advanced', 'Advanced')],
    )
    is_public = models.BooleanField(default=False)
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    progression_strategy = models.TextField(blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['fitness_level', 'is_public']),
        ]
```

#### WorkoutDay
A specific day in a workout plan.

```python
class WorkoutDay(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey('WorkoutPlan', on_delete=models.CASCADE, related_name='days')
    day_number = models.IntegerField()  # Which day in the plan (1-7)
    focus = models.CharField(max_length=100)  # E.g., "Upper Body", "Legs", etc.
    warm_up = models.TextField(blank=True)
    cool_down = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['plan', 'day_number']
        ordering = ['plan', 'day_number']
```

#### PlannedExercise
A specific exercise prescribed in a workout plan.

```python
class PlannedExercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    day = models.ForeignKey('WorkoutDay', on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey('Exercise', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)  # For custom exercises not in database
    sets = models.IntegerField()
    reps = models.CharField(max_length=50)  # "8-12" or similar
    rest_seconds = models.IntegerField(default=60)
    notes = models.TextField(blank=True)
    order = models.IntegerField()  # Order of exercises in the workout
    
    class Meta:
        ordering = ['day', 'order']
```

### Nutrition Models

#### Food
Represents a food item with nutritional information.

```python
class Food(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    calories = models.IntegerField()
    protein = models.FloatField()  # in grams
    carbs = models.FloatField()  # in grams
    fat = models.FloatField()  # in grams
    fiber = models.FloatField(default=0)  # in grams
    sugar = models.FloatField(default=0)  # in grams
    serving_size = models.FloatField(default=100)  # in grams
    serving_unit = models.CharField(max_length=50, default='g')
    barcode = models.CharField(max_length=100, blank=True)
    is_custom = models.BooleanField(default=False)
    created_by = models.UUIDField(null=True, blank=True)  # User who created custom food
    verified = models.BooleanField(default=False)
    
    class Meta:
        indexes = [
            models.Index(fields=['barcode']),
            models.Index(fields=['name']),
            models.Index(fields=['is_custom', 'created_by']),
        ]
```

#### MealEntry
Records a meal eaten by a user.

```python
class MealEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    food = models.ForeignKey('Food', on_delete=models.PROTECT)
    date = models.DateField()
    time = models.TimeField()
    meal_type = models.CharField(
        max_length=20,
        choices=[('breakfast', 'Breakfast'), ('lunch', 'Lunch'), 
                ('dinner', 'Dinner'), ('snack', 'Snack')]
    )
    quantity = models.FloatField()  # Multiple of serving size
    notes = models.CharField(max_length=200, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'date']),
            models.Index(fields=['user_id', 'meal_type']),
        ]
```

#### NutritionGoal
User's nutritional targets.

```python
class NutritionGoal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True)
    calorie_target = models.IntegerField()
    protein_target = models.IntegerField()  # in grams
    carbs_target = models.IntegerField()  # in grams
    fat_target = models.IntegerField()  # in grams
    fiber_target = models.IntegerField(default=0)  # in grams
    water_target = models.IntegerField(default=2000)  # in ml
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### FoodImage
Images of food used for recognition and tracking.

```python
class FoodImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    meal_entry = models.ForeignKey('MealEntry', on_delete=models.CASCADE, 
                                  related_name='images', null=True, blank=True)
    food = models.ForeignKey('Food', on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(upload_to=food_image_path)
    created_at = models.DateTimeField(auto_now_add=True)
    ai_processed = models.BooleanField(default=False)
    ai_confidence = models.FloatField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'created_at']),
            models.Index(fields=['ai_processed']),
        ]
```

### Social Models

#### SocialFollow
Represents a follow relationship between users.

```python
class SocialFollow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower_id = models.UUIDField()  # User who is following
    following_id = models.UUIDField()  # User being followed
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['follower_id', 'following_id']
        indexes = [
            models.Index(fields=['follower_id']),
            models.Index(fields=['following_id']),
        ]
```

#### SocialPost
User-generated content shared on the social platform.

```python
class SocialPost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    content = models.TextField()
    workout = models.ForeignKey('Workout', on_delete=models.SET_NULL, 
                               null=True, blank=True, related_name='social_posts')
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', 'created_at']),
        ]
```

#### PostMedia
Media attached to social posts.

```python
class PostMedia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey('SocialPost', on_delete=models.CASCADE, related_name='media')
    media_type = models.CharField(
        max_length=10,
        choices=[('image', 'Image'), ('video', 'Video')]
    )
    media_url = models.URLField()
    thumbnail_url = models.URLField(blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['post', 'order']
```

#### Challenge
Group fitness challenges and competitions.

```python
class Challenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    challenge_type = models.CharField(
        max_length=20,
        choices=[('workout', 'Workout Count'), ('volume', 'Lifting Volume'),
                ('distance', 'Distance'), ('calories', 'Calories Burned')]
    )
    start_date = models.DateField()
    end_date = models.DateField()
    created_by = models.UUIDField()
    is_public = models.BooleanField(default=True)
    participant_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['is_public']),
        ]
```

#### ChallengeParticipant
Links users to challenges they're participating in.

```python
class ChallengeParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge = models.ForeignKey('Challenge', on_delete=models.CASCADE, 
                                 related_name='participants')
    user_id = models.UUIDField()
    joined_at = models.DateTimeField(auto_now_add=True)
    current_progress = models.FloatField(default=0.0)  # Value depends on challenge_type
    rank = models.IntegerField(null=True, blank=True)
    
    class Meta:
        unique_together = ['challenge', 'user_id']
        indexes = [
            models.Index(fields=['challenge', 'current_progress']),
        ]
```

#### Achievement
Achievements and badges that users can earn.

```python
class Achievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=[('workout', 'Workout'), ('nutrition', 'Nutrition'), 
                ('social', 'Social'), ('strength', 'Strength')]
    )
    icon_url = models.URLField(blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['code']),
        ]
```

#### UserAchievement
Tracks achievements earned by users.

```python
class UserAchievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    achievement = models.ForeignKey('Achievement', on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_id', 'achievement']
        indexes = [
            models.Index(fields=['user_id', 'earned_at']),
        ]
```

### Analytics Models

#### StrengthProgress
Tracks strength progression for exercises over time.

```python
class StrengthProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    exercise_id = models.UUIDField()
    date = models.DateField()
    one_rep_max = models.FloatField()  # in kg
    volume = models.FloatField()  # total weight × reps
    sets_count = models.IntegerField()
    calculated_1rm = models.BooleanField(default=True)  # True if estimated, False if tested
    
    class Meta:
        unique_together = ['user_id', 'exercise_id', 'date']
        indexes = [
            models.Index(fields=['user_id', 'exercise_id', 'date']),
        ]
```

#### BodyMetric
Tracks body measurements and composition over time.

```python
class BodyMetric(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    date = models.DateField()
    weight = models.FloatField(null=True, blank=True)  # in kg
    body_fat = models.FloatField(null=True, blank=True)  # percentage
    muscle_mass = models.FloatField(null=True, blank=True)  # in kg
    chest = models.FloatField(null=True, blank=True)  # in cm
    waist = models.FloatField(null=True, blank=True)  # in cm
    hips = models.FloatField(null=True, blank=True)  # in cm
    arms = models.FloatField(null=True, blank=True)  # in cm
    thighs = models.FloatField(null=True, blank=True)  # in cm
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_id', 'date']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
```

#### WorkoutAnalysis
Aggregated workout analytics for a time period.

```python
class WorkoutAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    start_date = models.DateField()
    end_date = models.DateField()
    total_workouts = models.IntegerField(default=0)
    total_volume = models.FloatField(default=0)  # Total weight lifted
    total_duration = models.IntegerField(default=0)  # in minutes
    avg_intensity = models.FloatField(default=0)  # Average % of 1RM
    consistency_score = models.FloatField(default=0)  # 0-100 score
    most_trained_muscle = models.CharField(max_length=50, blank=True)
    least_trained_muscle = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_id', 'start_date', 'end_date']
```

#### NutritionSummary
Daily summary of nutritional intake.

```python
class NutritionSummary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    date = models.DateField()
    calories = models.IntegerField(default=0)
    protein = models.FloatField(default=0)  # in grams
    carbs = models.FloatField(default=0)  # in grams
    fat = models.FloatField(default=0)  # in grams
    fiber = models.FloatField(default=0)  # in grams
    sugar = models.FloatField(default=0)  # in grams
    water = models.IntegerField(default=0)  # in ml
    meal_count = models.IntegerField(default=0)
    compliance_score = models.FloatField(default=0)  # 0-100% of goals
    
    class Meta:
        unique_together = ['user_id', 'date']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
```

### Wearable Integration Models

#### WearableDevice
Stores information about connected wearable devices.

```python
class WearableDevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    device_type = models.CharField(
        max_length=20,
        choices=[('fitbit', 'Fitbit'), ('garmin', 'Garmin'), 
                ('apple_watch', 'Apple Watch'), ('oura', 'Oura Ring'),
                ('whoop', 'Whoop'), ('other', 'Other')]
    )
    device_id = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    last_synced = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    auth_token = models.TextField(blank=True)  # Encrypted
    refresh_token = models.TextField(blank=True)  # Encrypted
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_id', 'device_id']
```

#### DailyActivity
Activity data from wearables, synchronized daily.

```python
class DailyActivity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    device = models.ForeignKey('WearableDevice', on_delete=models.CASCADE, null=True)
    date = models.DateField()
    steps = models.IntegerField(default=0)
    distance = models.FloatField(default=0)  # in km
    active_calories = models.IntegerField(default=0)
    total_calories = models.IntegerField(default=0)
    active_minutes = models.IntegerField(default=0)
    floors_climbed = models.IntegerField(default=0)
    resting_heart_rate = models.IntegerField(null=True, blank=True)
    sync_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user_id', 'date']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
```

#### SleepData
Sleep metrics from wearable devices.

```python
class SleepData(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    device = models.ForeignKey('WearableDevice', on_delete=models.CASCADE, null=True)
    date = models.DateField()
    sleep_start = models.DateTimeField()
    sleep_end = models.DateTimeField()
    duration = models.IntegerField()  # in minutes
    deep_sleep = models.IntegerField(null=True, blank=True)  # in minutes
    light_sleep = models.IntegerField(null=True, blank=True)  # in minutes
    rem_sleep = models.IntegerField(null=True, blank=True)  # in minutes
    awake = models.IntegerField(null=True, blank=True)  # in minutes
    sleep_score = models.IntegerField(null=True, blank=True)  # 0-100
    hrv = models.FloatField(null=True, blank=True)  # Heart Rate Variability
    respiratory_rate = models.FloatField(null=True, blank=True)  # breaths per minute
    
    class Meta:
        unique_together = ['user_id', 'date', 'sleep_start']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
```

#### HeartRateData
Detailed heart rate data from workouts or throughout the day.

```python
class HeartRateData(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    device = models.ForeignKey('WearableDevice', on_delete=models.CASCADE, null=True)
    workout = models.ForeignKey('Workout', on_delete=models.CASCADE, 
                              null=True, blank=True, related_name='heart_rate_data')
    timestamp = models.DateTimeField()
    heart_rate = models.IntegerField()  # BPM
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'timestamp']),
            models.Index(fields=['workout']),
        ]
```

## Key Database Relationships & Foreign Keys

Here are the most important relationships in our system:

1. **User → Workouts**: One-to-many - A user can have many workouts
2. **Workout → WorkoutSets**: One-to-many - A workout contains multiple sets
3. **WorkoutSet → Exercise**: Many-to-one - Many sets can reference the same exercise<!-- filepath: /workspaces/fitness/docs/backend-libraries/model-relationships.md -->
# Model Relationships Documentation

## Overview
This document outlines the database schema and relationships between models in our fitness application. Understanding these relationships is essential for efficient API development, query optimization, and maintaining data integrity.

## Core Model Structure

Our database schema is organized around several core domains:
- **User Management**: Authentication, profiles, and user settings
- **Workout Tracking**: Exercises, workouts, and performance metrics
- **Nutrition Management**: Food items, meals, and nutritional data
- **Social Platform**: Social connections, challenges, and activities
- **Analytics**: Progress tracking and performance insights
- **Wearable Integration**: Data from connected devices and external services

## Entity-Relationship Diagram

Here's a high-level view of the primary relationships between our core models:

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  UserProfile │◄───────┤    User      │───────▶│  UserSettings│
└──────┬───────┘        └──────────────┘        └──────────────┘
       │                        ▲
       │                        │
       ▼                        │
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│ SocialFollow │◄────────┤  Workout     │───────▶│  WorkoutSet  │
└──────────────┘         └──────┬───────┘        └──────┬───────┘
                                │                        │
                                │                        │
                                ▼                        ▼
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│ WorkoutPlan  │◄────────┤  Challenge   │        │  Exercise    │
└──────┬───────┘         └──────────────┘        └──────────────┘
       │                        ▲                        ▲
       │                        │                        │
       ▼                        │                        │
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│  WorkoutDay  │         │  MealEntry   │───────▶│  Food        │
└──────┬───────┘         └──────┬───────┘        └──────────────┘
       │                        │
       │                        │
       ▼                        ▼
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│PlannedExercise│        │ FoodImage    │◄───────┤ BodyMetric   │
└──────────────┘         └──────────────┘        └──────────────┘
```

## Model Relationships in Detail

### User Models

#### User (Django Auth User or Supabase Auth)
The core user account model that handles authentication.

```python
# Using Django's built-in User model or Supabase auth
from django.contrib.auth.models import User
```

#### UserProfile
Extends the base User model with fitness-specific profile information.

```python
class UserProfile(models.Model):
    user_id = models.UUIDField(primary_key=True)  # UUID from auth system
    display_name = models.CharField(max_length=150)
    email = models.EmailField()
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    user_type = models.CharField(
        max_length=20, 
        choices=[('user', 'Regular User'), ('trainer', 'Trainer')],
        default='user'
    )
    fitness_level = models.CharField(
        max_length=20,
        choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), 
                ('advanced', 'Advanced')],
        default='beginner'
    )
    height = models.FloatField(null=True, blank=True)  # in cm
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### UserSettings
Stores user preferences and app configuration settings.

```python
class UserSettings(models.Model):
    user_id = models.UUIDField(unique=True)
    dark_mode = models.BooleanField(default=False)
    notification_workouts = models.BooleanField(default=True)
    notification_nutrition = models.BooleanField(default=True)
    notification_social = models.BooleanField(default=True)
    measurement_system = models.CharField(
        max_length=10,
        choices=[('metric', 'Metric'), ('imperial', 'Imperial')],
        default='metric'
    )
    primary_goal = models.CharField(
        max_length=20,
        choices=[('strength', 'Strength'), ('weight_loss', 'Weight Loss'),
                ('muscle_gain', 'Muscle Gain'), ('endurance', 'Endurance')],
        default='strength'
    )
    workout_days_per_week = models.IntegerField(default=3)
    language = models.CharField(max_length=10, default='en')
```

### Workout Models

#### Exercise
Represents a specific exercise that can be performed.

```python
class Exercise(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    muscle_group = models.CharField(
        max_length=50,
        choices=[('chest', 'Chest'), ('back', 'Back'), ('legs', 'Legs'),
                ('shoulders', 'Shoulders'), ('arms', 'Arms'), ('core', 'Core'),
                ('full_body', 'Full Body'), ('cardio', 'Cardio')]
    )
    is_cardio = models.BooleanField(default=False)
    is_custom = models.BooleanField(default=False)
    created_by = models.UUIDField(null=True, blank=True)  # User who created custom exercise
    illustration = models.URLField(blank=True)
    video_url = models.URLField(blank=True)
    equipment_needed = models.CharField(max_length=100, blank=True)
    difficulty_level = models.IntegerField(default=1)  # 1-5 scale
    
    class Meta:
        indexes = [
            models.Index(fields=['muscle_group']),
            models.Index(fields=['is_custom', 'created_by']),
        ]
```

#### Workout
Records a completed workout session.

```python
class Workout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    name = models.CharField(max_length=100)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    duration = models.IntegerField(default=0)  # In minutes
    calories_burned = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    workout_plan_id = models.UUIDField(null=True, blank=True)  # Link to plan if following one
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-start_time']
        indexes = [
            models.Index(fields=['user_id', 'date']),
            models.Index(fields=['user_id', 'is_public']),
        ]
```

#### WorkoutSet
Individual sets performed during a workout.

```python
class WorkoutSet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout = models.ForeignKey('Workout', on_delete=models.CASCADE, related_name='sets')
    exercise = models.ForeignKey('Exercise', on_delete=models.PROTECT)
    set_number = models.IntegerField()
    reps = models.IntegerField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)  # in kg
    duration = models.IntegerField(null=True, blank=True)  # in seconds (for timed exercises)
    distance = models.FloatField(null=True, blank=True)  # in km (for cardio)
    rpe = models.IntegerField(null=True, blank=True)  # Rate of Perceived Exertion (1-10)
    one_rm = models.FloatField(null=True, blank=True)  # Calculated 1RM
    notes = models.CharField(max_length=200, blank=True)
    
    class Meta:
        ordering = ['workout', 'set_number']
        unique_together = ['workout', 'exercise', 'set_number']
```

#### WorkoutPlan
Template for a structured workout program.

```python
class WorkoutPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()  # Creator of the plan
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    goal = models.CharField(max_length=50)
    days_per_week = models.IntegerField()
    duration_weeks = models.IntegerField(default=4)
    fitness_level = models.CharField(
        max_length=20,
        choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), 
                ('advanced', 'Advanced')],
    )
    is_public = models.BooleanField(default=False)
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    progression_strategy = models.TextField(blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['fitness_level', 'is_public']),
        ]
```

#### WorkoutDay
A specific day in a workout plan.

```python
class WorkoutDay(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey('WorkoutPlan', on_delete=models.CASCADE, related_name='days')
    day_number = models.IntegerField()  # Which day in the plan (1-7)
    focus = models.CharField(max_length=100)  # E.g., "Upper Body", "Legs", etc.
    warm_up = models.TextField(blank=True)
    cool_down = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['plan', 'day_number']
        ordering = ['plan', 'day_number']
```

#### PlannedExercise
A specific exercise prescribed in a workout plan.

```python
class PlannedExercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    day = models.ForeignKey('WorkoutDay', on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey('Exercise', on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)  # For custom exercises not in database
    sets = models.IntegerField()
    reps = models.CharField(max_length=50)  # "8-12" or similar
    rest_seconds = models.IntegerField(default=60)
    notes = models.TextField(blank=True)
    order = models.IntegerField()  # Order of exercises in the workout
    
    class Meta:
        ordering = ['day', 'order']
```

### Nutrition Models

#### Food
Represents a food item with nutritional information.

```python
class Food(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    calories = models.IntegerField()
    protein = models.FloatField()  # in grams
    carbs = models.FloatField()  # in grams
    fat = models.FloatField()  # in grams
    fiber = models.FloatField(default=0)  # in grams
    sugar = models.FloatField(default=0)  # in grams
    serving_size = models.FloatField(default=100)  # in grams
    serving_unit = models.CharField(max_length=50, default='g')
    barcode = models.CharField(max_length=100, blank=True)
    is_custom = models.BooleanField(default=False)
    created_by = models.UUIDField(null=True, blank=True)  # User who created custom food
    verified = models.BooleanField(default=False)
    
    class Meta:
        indexes = [
            models.Index(fields=['barcode']),
            models.Index(fields=['name']),
            models.Index(fields=['is_custom', 'created_by']),
        ]
```

#### MealEntry
Records a meal eaten by a user.

```python
class MealEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    food = models.ForeignKey('Food', on_delete=models.PROTECT)
    date = models.DateField()
    time = models.TimeField()
    meal_type = models.CharField(
        max_length=20,
        choices=[('breakfast', 'Breakfast'), ('lunch', 'Lunch'), 
                ('dinner', 'Dinner'), ('snack', 'Snack')]
    )
    quantity = models.FloatField()  # Multiple of serving size
    notes = models.CharField(max_length=200, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'date']),
            models.Index(fields=['user_id', 'meal_type']),
        ]
```

#### NutritionGoal
User's nutritional targets.

```python
class NutritionGoal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True)
    calorie_target = models.IntegerField()
    protein_target = models.IntegerField()  # in grams
    carbs_target = models.IntegerField()  # in grams
    fat_target = models.IntegerField()  # in grams
    fiber_target = models.IntegerField(default=0)  # in grams
    water_target = models.IntegerField(default=2000)  # in ml
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### FoodImage
Images of food used for recognition and tracking.

```python
class FoodImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    meal_entry = models.ForeignKey('MealEntry', on_delete=models.CASCADE, 
                                  related_name='images', null=True, blank=True)
    food = models.ForeignKey('Food', on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(upload_to=food_image_path)
    created_at = models.DateTimeField(auto_now_add=True)
    ai_processed = models.BooleanField(default=False)
    ai_confidence = models.FloatField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'created_at']),
            models.Index(fields=['ai_processed']),
        ]
```

### Social Models

#### SocialFollow
Represents a follow relationship between users.

```python
class SocialFollow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower_id = models.UUIDField()  # User who is following
    following_id = models.UUIDField()  # User being followed
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['follower_id', 'following_id']
        indexes = [
            models.Index(fields=['follower_id']),
            models.Index(fields=['following_id']),
        ]
```

#### SocialPost
User-generated content shared on the social platform.

```python
class SocialPost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    content = models.TextField()
    workout = models.ForeignKey('Workout', on_delete=models.SET_NULL, 
                               null=True, blank=True, related_name='social_posts')
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', 'created_at']),
        ]
```

#### PostMedia
Media attached to social posts.

```python
class PostMedia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey('SocialPost', on_delete=models.CASCADE, related_name='media')
    media_type = models.CharField(
        max_length=10,
        choices=[('image', 'Image'), ('video', 'Video')]
    )
    media_url = models.URLField()
    thumbnail_url = models.URLField(blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['post', 'order']
```

#### Challenge
Group fitness challenges and competitions.

```python
class Challenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    challenge_type = models.CharField(
        max_length=20,
        choices=[('workout', 'Workout Count'), ('volume', 'Lifting Volume'),
                ('distance', 'Distance'), ('calories', 'Calories Burned')]
    )
    start_date = models.DateField()
    end_date = models.DateField()
    created_by = models.UUIDField()
    is_public = models.BooleanField(default=True)
    participant_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['is_public']),
        ]
```

#### ChallengeParticipant
Links users to challenges they're participating in.

```python
class ChallengeParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge = models.ForeignKey('Challenge', on_delete=models.CASCADE, 
                                 related_name='participants')
    user_id = models.UUIDField()
    joined_at = models.DateTimeField(auto_now_add=True)
    current_progress = models.FloatField(default=0.0)  # Value depends on challenge_type
    rank = models.IntegerField(null=True, blank=True)
    
    class Meta:
        unique_together = ['challenge', 'user_id']
        indexes = [
            models.Index(fields=['challenge', 'current_progress']),
        ]
```

#### Achievement
Achievements and badges that users can earn.

```python
class Achievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=[('workout', 'Workout'), ('nutrition', 'Nutrition'), 
                ('social', 'Social'), ('strength', 'Strength')]
    )
    icon_url = models.URLField(blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['code']),
        ]
```

#### UserAchievement
Tracks achievements earned by users.

```python
class UserAchievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    achievement = models.ForeignKey('Achievement', on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_id', 'achievement']
        indexes = [
            models.Index(fields=['user_id', 'earned_at']),
        ]
```

### Analytics Models

#### StrengthProgress
Tracks strength progression for exercises over time.

```python
class StrengthProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    exercise_id = models.UUIDField()
    date = models.DateField()
    one_rep_max = models.FloatField()  # in kg
    volume = models.FloatField()  # total weight × reps
    sets_count = models.IntegerField()
    calculated_1rm = models.BooleanField(default=True)  # True if estimated, False if tested
    
    class Meta:
        unique_together = ['user_id', 'exercise_id', 'date']
        indexes = [
            models.Index(fields=['user_id', 'exercise_id', 'date']),
        ]
```

#### BodyMetric
Tracks body measurements and composition over time.

```python
class BodyMetric(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    date = models.DateField()
    weight = models.FloatField(null=True, blank=True)  # in kg
    body_fat = models.FloatField(null=True, blank=True)  # percentage
    muscle_mass = models.FloatField(null=True, blank=True)  # in kg
    chest = models.FloatField(null=True, blank=True)  # in cm
    waist = models.FloatField(null=True, blank=True)  # in cm
    hips = models.FloatField(null=True, blank=True)  # in cm
    arms = models.FloatField(null=True, blank=True)  # in cm
    thighs = models.FloatField(null=True, blank=True)  # in cm
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_id', 'date']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
```

#### WorkoutAnalysis
Aggregated workout analytics for a time period.

```python
class WorkoutAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    start_date = models.DateField()
    end_date = models.DateField()
    total_workouts = models.IntegerField(default=0)
    total_volume = models.FloatField(default=0)  # Total weight lifted
    total_duration = models.IntegerField(default=0)  # in minutes
    avg_intensity = models.FloatField(default=0)  # Average % of 1RM
    consistency_score = models.FloatField(default=0)  # 0-100 score
    most_trained_muscle = models.CharField(max_length=50, blank=True)
    least_trained_muscle = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_id', 'start_date', 'end_date']
```

#### NutritionSummary
Daily summary of nutritional intake.

```python
class NutritionSummary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    date = models.DateField()
    calories = models.IntegerField(default=0)
    protein = models.FloatField(default=0)  # in grams
    carbs = models.FloatField(default=0)  # in grams
    fat = models.FloatField(default=0)  # in grams
    fiber = models.FloatField(default=0)  # in grams
    sugar = models.FloatField(default=0)  # in grams
    water = models.IntegerField(default=0)  # in ml
    meal_count = models.IntegerField(default=0)
    compliance_score = models.FloatField(default=0)  # 0-100% of goals
    
    class Meta:
        unique_together = ['user_id', 'date']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
```

### Wearable Integration Models

#### WearableDevice
Stores information about connected wearable devices.

```python
class WearableDevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    device_type = models.CharField(
        max_length=20,
        choices=[('fitbit', 'Fitbit'), ('garmin', 'Garmin'), 
                ('apple_watch', 'Apple Watch'), ('oura', 'Oura Ring'),
                ('whoop', 'Whoop'), ('other', 'Other')]
    )
    device_id = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    last_synced = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    auth_token = models.TextField(blank=True)  # Encrypted
    refresh_token = models.TextField(blank=True)  # Encrypted
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user_id', 'device_id']
```

#### DailyActivity
Activity data from wearables, synchronized daily.

```python
class DailyActivity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    device = models.ForeignKey('WearableDevice', on_delete=models.CASCADE, null=True)
    date = models.DateField()
    steps = models.IntegerField(default=0)
    distance = models.FloatField(default=0)  # in km
    active_calories = models.IntegerField(default=0)
    total_calories = models.IntegerField(default=0)
    active_minutes = models.IntegerField(default=0)
    floors_climbed = models.IntegerField(default=0)
    resting_heart_rate = models.IntegerField(null=True, blank=True)
    sync_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user_id', 'date']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
```

#### SleepData
Sleep metrics from wearable devices.

```python
class SleepData(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    device = models.ForeignKey('WearableDevice', on_delete=models.CASCADE, null=True)
    date = models.DateField()
    sleep_start = models.DateTimeField()
    sleep_end = models.DateTimeField()
    duration = models.IntegerField()  # in minutes
    deep_sleep = models.IntegerField(null=True, blank=True)  # in minutes
    light_sleep = models.IntegerField(null=True, blank=True)  # in minutes
    rem_sleep = models.IntegerField(null=True, blank=True)  # in minutes
    awake = models.IntegerField(null=True, blank=True)  # in minutes
    sleep_score = models.IntegerField(null=True, blank=True)  # 0-100
    hrv = models.FloatField(null=True, blank=True)  # Heart Rate Variability
    respiratory_rate = models.FloatField(null=True, blank=True)  # breaths per minute
    
    class Meta:
        unique_together = ['user_id', 'date', 'sleep_start']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
```

#### HeartRateData
Detailed heart rate data from workouts or throughout the day.

```python
class HeartRateData(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    device = models.ForeignKey('WearableDevice', on_delete=models.CASCADE, null=True)
    workout = models.ForeignKey('Workout', on_delete=models.CASCADE, 
                              null=True, blank=True, related_name='heart_rate_data')
    timestamp = models.DateTimeField()
    heart_rate = models.IntegerField()  # BPM
    
    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'timestamp']),
            models.Index(fields=['workout']),
        ]
```

## Key Database Relationships & Foreign Keys

Here are the most important relationships in our system:

1. **User → Workouts**: One-to-many - A user can have many workouts
2. **Workout → WorkoutSets**: One-to-many - A workout contains multiple sets
3. **WorkoutSet → Exercise**: Many-to-one - Many sets can reference the same exercise
4. **User → MealEntries**: One-to-many - A user can log multiple meals
5. **MealEntry → Food**: Many-to-one - Many meal entries can reference the same food item
6. **User → WorkoutPlans**: One-to-many - A user can create multiple workout plans
7. **WorkoutPlan → WorkoutDays**: One-to-many - A plan contains multiple days
8. **WorkoutDay → PlannedExercises**: One-to-many - A day contains multiple exercises
9. **User → Follows/Followers**: Many-to-many - Users can follow and be followed by many users
10. **User → Challenges**: Many-to-many - Users can participate in multiple challenges

## Common Query Patterns

### User Profile & Settings

```python
# Get user profile with settings
def get_user_profile_complete(user_id):
    try:
        profile = UserProfile.objects.get(user_id=user_id)
        try:
            settings = UserSettings.objects.get(user_id=user_id)
        except UserSettings.DoesNotExist:
            # Create default settings if they don't exist
            settings = UserSettings.objects.create(user_id=user_id)
            
        return {
            'profile': profile,
            'settings': settings
        }
    except UserProfile.DoesNotExist:
        return None
```

### Workout History with Sets

```python
# Get full workout details with sets
def get_workout_with_sets(workout_id):
    try:
        workout = Workout.objects.prefetch_related('sets__exercise').get(id=workout_id)
        
        # Organize workout data
        workout_data = {
            'id': workout.id,
            'name': workout.name,
            'date': workout.date,
            'duration': workout.duration,
            'notes': workout.notes,
            'sets': []
        }
        
        # Group sets by exercise
        exercise_sets = {}
        for workout_set in workout.sets.all():
            exercise_id = workout_set.exercise.id
            if exercise_id not in exercise_sets:
                exercise_sets[exercise_id] = {
                    'exercise_name': workout_set.exercise.name,
                    'exercise_id': exercise_id,
                    'sets': []
                }
                
            exercise_sets[exercise_id]['sets'].append({
                'set_number': workout_set.set_number,
                'weight': workout_set.weight,
                'reps': workout_set.reps,
                'duration': workout_set.duration,
                'distance': workout_set.distance,
                'one_rm': workout_set.one_rm
            })
            
        # Add exercises to workout data
        workout_data['exercises'] = list(exercise_sets.values())
        
        return workout_data
    except Workout.DoesNotExist:
        return None
```

### User Nutrition Summary

```python
# Get a user's nutrition data for a specific day
def get_daily_nutrition(user_id, date):
    meals = MealEntry.objects.select_related('food').filter(
        user_id=user_id, 
        date=date
    ).order_by('time')
    
    # Get user's nutrition goals
    try:
        goals = NutritionGoal.objects.get(user_id=user_id, is_active=True)
    except NutritionGoal.DoesNotExist:
        goals = None
        
    # Initialize summary
    summary = {
        'date': date,
        'total_calories': 0,
        'total_protein': 0,
        'total_carbs': 0,
        'total_fat': 0,
        'total_fiber': 0,
        'total_sugar': 0,
        'meal_count': 0,
        'meals': {},
        'goals_met': {
            'calories': False,
            'protein': False,
            'carbs': False,
            'fat': False
        }
    }
    
    # Group meals by type
    for meal in meals:
        meal_type = meal.meal_type
        if meal_type not in summary['meals']:
            summary['meals'][meal_type] = []
            
        # Calculate actual nutritional values based on quantity
        quantity_multiplier = meal.quantity
        
        meal_data = {
            'id': meal.id,
            'food_name': meal.food.name,
            'quantity': meal.quantity,
            'time': meal.time,
            'calories': meal.food.calories * quantity_multiplier,
            'protein': meal.food.protein * quantity_multiplier,
            'carbs': meal.food.carbs * quantity_multiplier,
            'fat': meal.food.fat * quantity_multiplier,
        }
        
        # Add meal to appropriate type
        summary['meals'][meal_type].append(meal_data)
        
        # Update totals
        summary['total_calories'] += meal_data['calories']
        summary['total_protein'] += meal_data['protein']
        summary['total_carbs'] += meal_data['carbs']
        summary['total_fat'] += meal_data['fat']
        summary['total_fiber'] += meal.food.fiber * quantity_multiplier
        summary['total_sugar'] += meal.food.sugar * quantity_multiplier
        
    summary['meal_count'] = len(meals)
    
    # Check if goals are met
    if goals:
        summary['goals_met']['calories'] = summary['total_calories'] >= goals.calorie_target
        summary['goals_met']['protein'] = summary['total_protein'] >= goals.protein_target
        summary['goals_met']['carbs'] = summary['total_carbs'] >= goals.carbs_target
        summary['goals_met']['fat'] = summary['total_fat'] >= goals.fat_target
        summary['goals'] = {
            'calories': goals.calorie_target,
            'protein': goals.protein_target,
            'carbs': goals.carbs_target,
            'fat': goals.fat_target,
            'fiber': goals.fiber_target
        }
    
    return summary
```

### Social Feed Generation

```python
# Get personalized social feed for a user
def get_social_feed(user_id, page=1, page_size=10):
    # Get users that the current user follows
    following = SocialFollow.objects.filter(
        follower_id=user_id
    ).values_list('following_id', flat=True)
    
    # Get posts from followed users and the user's own posts
    posts = SocialPost.objects.select_related('user').prefetch_related('media').filter(
        user_id__in=list(following) + [user_id]
    ).order_by('-created_at')
    
    # Paginate results
    start = (page - 1) * page_size
    end = page * page_size
    paginated_posts = posts[start:end]
    
    result = []
    for post in paginated_posts:
        # Get user profile for each post
        try:
            profile = UserProfile.objects.get(user_id=post.user_id)
            display_name = profile.display_name
            avatar_url = profile.avatar_url
        except UserProfile.DoesNotExist:
            display_name = "Unknown User"
            avatar_url = ""
        
        # Get media for the post
        media = []
        for m in post.media.all():
            media.append({
                'type': m.media_type,
                'url': m.media_url,
                'thumbnail': m.thumbnail_url if m.thumbnail_url else m.media_url
            })
        
        # Get workout data if post is linked to a workout
        workout_data = None
        if post.workout_id:
            try:
                workout = Workout.objects.get(id=post.workout_id)
                workout_data = {
                    'id': workout.id,
                    'name': workout.name,
                    'duration': workout.duration
                }
            except Workout.DoesNotExist:
                workout_data = None
        
        # Construct post data
        post_data = {
            'id': post.id,
            'user_id': post.user_id,
            'display_name': display_name,
            'avatar_url': avatar_url,
            'content': post.content,
            'created_at': post.created_at,
            'likes_count': post.likes_count,
            'comments_count': post.comments_count,
            'media': media,
            'workout': workout_data
        }
        
        result.append(post_data)
    
    return {
        'posts': result,
        'total': posts.count(),
        'page': page,
        'page_size': page_size,
        'has_next': posts.count() > end
    }
```

### Challenge Leaderboard

```python
# Get leaderboard for a challenge
def get_challenge_leaderboard(challenge_id):
    try:
        challenge = Challenge.objects.get(id=challenge_id)
        
        # Get participants with their progress, ordered by rank
        participants = ChallengeParticipant.objects.filter(
            challenge_id=challenge_id
        ).order_by('rank')
        
        leaderboard = []
        for participant in participants:
            # Get user profile
            try:
                profile = UserProfile.objects.get(user_id=participant.user_id)
                display_name = profile.display_name
                avatar_url = profile.avatar_url
            except UserProfile.DoesNotExist:
                display_name = "Unknown User"
                avatar_url = ""
                
            leaderboard.append({
                'rank': participant.rank,
                'user_id': participant.user_id,
                'display_name': display_name,
                'avatar_url': avatar_url,
                'progress': participant.current_progress,
                'joined_at': participant.joined_at
            })
            
        return {
            'challenge': {
                'id': challenge.id,
                'name': challenge.name,
                'description': challenge.description,
                'challenge_type': challenge.challenge_type,
                'start_date': challenge.start_date,
                'end_date': challenge.end_date,
                'participant_count': challenge.participant_count
            },
            'leaderboard': leaderboard
        }
    except Challenge.DoesNotExist:
        return None
```

## Performance Considerations

### Indexing Strategy

Our database schema uses strategic indexing to optimize common queries:

1. **User-Based Queries**: Most tables include a `user_id` index for quick filtering
2. **Date Range Queries**: Tables with time-series data have date indexes for efficient range queries
3. **Relationship Lookups**: Foreign key fields are indexed to speed up joins
4. **Text Search**: Name fields in entities like `Exercise` and `Food` are indexed for fast text search

### Denormalization

For performance reasons, some data is intentionally denormalized:

1. **Workout & Nutrition Stats**: We store aggregate counts (e.g., `likes_count`) to avoid expensive COUNT queries
2. **User Profile Data**: Common profile attributes are duplicated in various contexts to reduce joins
3. **Challenge Progress**: Participant rankings are pre-calculated and stored rather than computed on-the-fly

### Data Loading Patterns

To efficiently load related data, we use these patterns:

1. **select_related**: For foreign key relationships
   ```python
   # Efficient loading of related exercise data
   workout_sets = WorkoutSet.objects.select_related('exercise').filter(workout_id=workout_id)
   ```

2. **prefetch_related**: For reverse foreign key or many-to-many relationships
   ```python
   # Efficient loading of all sets for a workout
   workout = Workout.objects.prefetch_related('sets').get(id=workout_id)
   ```

3. **Batch Processing**: For heavy operations that affect multiple records
   ```python
   # Process users in batches for analytics
   def process_weekly_stats():
       users = UserProfile.objects.all()
       batch_size = 100
       
       for i in range(0, len(users), batch_size):
           batch = users[i:i+batch_size]
           for user in batch:
               generate_weekly_stats(user.user_id)
   ```

## Data Integrity and Constraints

### Cascading Deletes

We carefully manage our cascading delete behavior:

1. **CASCADE**: When parent deletion should remove children
   - `WorkoutSet` is deleted when its `Workout` is deleted
   - `WorkoutDay` is deleted when its `WorkoutPlan` is deleted

2. **PROTECT**: When child records should prevent parent deletion
   - `Food` entries are protected to preserve meal history
   - `Exercise` entries are protected to preserve workout history

3. **SET_NULL**: When the relationship should be severed but data preserved
   - `SocialPost.workout` is set to NULL if the linked workout is deleted

### Unique Constraints

Several unique constraints ensure data integrity:

1. **User Settings**: One settings record per user
   ```python
   class Meta:
       unique_together = ['user_id']
   ```

2. **Daily Metrics**: One entry per user per date
   ```python
   class Meta:
       unique_together = ['user_id', 'date']
   ```

3. **Social Relationships**: Prevent duplicate follow relationships
   ```python
   class Meta:
       unique_together = ['follower_id', 'following_id']
   ```

## Advanced Data Access Patterns

### User Activity Timeline

```python
def get_user_activity_timeline(user_id, days=30):
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Get workouts in date range
    workouts = Workout.objects.filter(
        user_id=user_id,
        date__gte=start_date,
        date__lte=end_date
    ).values('id', 'name', 'date', 'duration')
    
    # Get meal entries in date range
    meals = MealEntry.objects.filter(
        user_id=user_id,
        date__gte=start_date,
        date__lte=end_date
    ).values('date').annotate(count=Count('id'))
    
    # Get body metrics in date range
    metrics = BodyMetric.objects.filter(
        user_id=user_id,
        date__gte=start_date,
        date__lte=end_date
    ).values('date', 'weight', 'body_fat')
    
    # Create timeline
    timeline = {}
    current = start_date
    while current <= end_date:
        timeline[current.isoformat()] = {
            'date': current.isoformat(),
            'has_workout': False,
            'workouts': [],
            'has_meals': False,
            'meal_count': 0,
            'has_metrics': False,
            'metrics': {}
        }
        current += timedelta(days=1)
    
    # Fill with workouts
    for workout in workouts:
        date_str = workout['date'].isoformat()
        timeline[date_str]['has_workout'] = True
        timeline[date_str]['workouts'].append({
            'id': workout['id'],
            'name': workout['name'],
            'duration': workout['duration']
        })
    
    # Fill with meals
    for meal_day in meals:
        date_str = meal_day['date'].isoformat()
        timeline[date_str]['has_meals'] = True
        timeline[date_str]['meal_count'] = meal_day['count']
    
    # Fill with body metrics
    for metric in metrics:
        date_str = metric['date'].isoformat()
        timeline[date_str]['has_metrics'] = True
        timeline[date_str]['metrics'] = {
            'weight': metric['weight'],
            'body_fat': metric['body_fat']
        }
    
    return list(timeline.values())
```

### Exercise Progress Tracking

```python
def get_exercise_progress(user_id, exercise_id, days=90):
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    # Get all sets for this exercise
    sets = WorkoutSet.objects.filter(
        workout__user_id=user_id,
        exercise_id=exercise_id,
        workout__date__gte=start_date,
        workout__date__lte=end_date
    ).select_related('workout').order_by('workout__date')
    
    # Group by workout date
    progress = {}
    for workout_set in sets:
        date = workout_set.workout.date.isoformat()
        if date not in progress:
            progress[date] = {
                'date': date,
                'sets': [],
                'volume': 0,
                'max_weight': 0,
                'max_reps': 0,
                'one_rm': 0
            }
        
        # Skip if missing weight or reps
        if workout_set.weight is None or workout_set.reps is None:
            continue
            
        # Calculate volume and track max values
        set_volume = workout_set.weight * workout_set.reps
        progress[date]['volume'] += set_volume
        progress[date]['max_weight'] = max(progress[date]['max_weight'], workout_set.weight)
        progress[date]['max_reps'] = max(progress[date]['max_reps'], workout_set.reps)
        
        # Use calculated 1RM if available, otherwise estimate
        if workout_set.one_rm:
            progress[date]['one_rm'] = max(progress[date]['one_rm'], workout_set.one_rm)
        elif workout_set.reps <= 10:  # Brzycki formula reliable for <= 10 reps
            estimated_1rm = workout_set.weight * (36 / (37 - workout_set.reps))
            progress[date]['one_rm'] = max(progress[date]['one_rm'], estimated_1rm)
        
        # Add set data
        progress[date]['sets'].append({
            'set_number': workout_set.set_number,
            'weight': workout_set.weight,
            'reps': workout_set.reps,
            'volume': set_volume
        })
    
    # Convert to list and calculate improvement
    result = list(progress.values())
    
    # Calculate improvement if we have enough data points
    if len(result) >= 2:
        first_entry = result[0]
        last_entry = result[-1]
        
        if first_entry['one_rm'] > 0:
            one_rm_improvement = ((last_entry['one_rm'] - first_entry['one_rm']) / first_entry['one_rm']) * 100
        else:
            one_rm_improvement = 0
            
        if first_entry['volume'] > 0:
            volume_improvement = ((last_entry['volume'] - first_entry['volume']) / first_entry['volume']) * 100
        else:
            volume_improvement = 0
            
        improvement = {
            'one_rm_improvement': round(one_rm_improvement, 1),
            'volume_improvement': round(volume_improvement, 1),
            'period_days': days
        }
    else:
        improvement = None
    
    return {
        'exercise_id': exercise_id,
        'progress': result,
        'improvement': improvement
    }
```

## Database Migration and Evolution

As our app evolves, we follow these principles for schema changes:

1. **Non-destructive migrations**: Add columns before removing or changing old ones
2. **Data migration planning**: Prepare data migration scripts for complex changes
3. **Rolling updates**: Deploy in stages to ensure compatibility during transitions
4. **Version tracking**: Maintain schema versions to support API versioning

## Conclusion

This document provides a comprehensive overview of our database schema and model relationships. Understanding these relationships is crucial for efficient development, optimization, and maintenance of our fitness application's backend.

For specific implementation details, refer to the API documentation and backend service implementations.