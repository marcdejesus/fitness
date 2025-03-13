# Analytics Services Documentation

## Overview
Our fitness app includes robust analytics capabilities that track, analyze, and visualize user performance data. These analytics provide valuable insights to users about their progress and help optimize their fitness journey. This document explains the implementation and functionality of our analytics services.

## Key Analytics Features

- **Progress Tracking**: Monitor changes in key metrics over time (weight, strength, endurance)
- **Workout Analysis**: Break down workout frequency, volume, and intensity
- **Nutritional Insights**: Track macro/micronutrient patterns and calorie trends
- **Goal Progress**: Visualize progression towards defined fitness goals
- **Comparative Analysis**: Compare current performance against historical periods
- **Predictive Analytics**: Forecast future performance based on current trends
- **Recovery Monitoring**: Analyze rest periods and recovery metrics
- **Consistency Scoring**: Quantify workout and nutrition adherence
- **Achievement Tracking**: Record and display fitness milestones reached

## Data Collection Architecture

Our analytics system collects data from multiple sources:

- **User Inputs**: Directly entered workout and nutrition data
- **Wearable Devices**: Heart rate, sleep, and activity data from integrated devices
- **AI Services**: Processed data from our AI components (food recognition, form analysis)
- **Social Features**: Engagement metrics from community interactions
- **System Usage**: App usage patterns and feature engagement

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │                │      │                │
│  User Inputs   │──┐   │   Wearable     │──┐   │  AI Service    │
│  & Activities  │  │   │   Device Data  │  │   │  Results       │
│                │  │   │                │  │   │                │
└────────────────┘  │   └────────────────┘  │   └────────────────┘
                    ▼                       ▼                     ▼
                 ┌─────────────────────────────────────────────────┐
                 │                                                 │
                 │            Data Collection Pipeline             │
                 │                                                 │
                 └───────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │                                                 │
                 │            Data Processing & Analysis           │
                 │                                                 │
                 └───────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │                                                 │
                 │            Insights & Visualizations            │
                 │                                                 │
                 └─────────────────────────────────────────────────┘
```

## Key Performance Metrics

### Workout Metrics
- **Volume**: Total weight lifted (sets × reps × weight)
- **Intensity**: Weight relative to 1RM (one-rep max)
- **Frequency**: Workouts per week/month
- **Duration**: Time spent working out
- **Exercise Distribution**: Balance between muscle groups/movement patterns
- **Progressive Overload**: Increases in weight/reps/sets over time
- **Rest Times**: Average rest between sets
- **Heart Rate Zones**: Time spent in different HR zones during cardio

### Nutrition Metrics
- **Macronutrient Ratios**: Protein/carbs/fat distribution
- **Caloric Balance**: Intake vs. expenditure
- **Meal Timing**: Distribution of calories throughout the day
- **Hydration Levels**: Daily water intake
- **Micronutrient Coverage**: Essential vitamins and minerals
- **Adherence Rate**: Consistency with nutrition targets

### Body Composition Metrics
- **Weight Changes**: Trends over time
- **Body Fat Percentage**: Changes in body composition
- **Muscle Mass**: Estimated changes in lean body mass
- **Measurements**: Changes in key body measurements
- **BMI/BMR**: Basic health indicators

### Performance Metrics
- **Strength Progression**: Changes in lifting capacity
- **Endurance Improvements**: Cardio capacity and stamina
- **Recovery Rate**: Heart rate variability and resting heart rate
- **Sleep Quality**: Duration and quality metrics
- **Energy Levels**: Subjective ratings from user input

## Implementation Details

### Data Collection & Storage

#### Model Structure for Analytics
```python
# api/analytics/models.py
from django.db import models
from django.utils import timezone
import uuid

class UserMetric(models.Model):
    """Base model for tracking user metrics over time"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class BodyMetric(UserMetric):
    """Track body measurements and composition"""
    weight = models.FloatField(null=True, blank=True)  # in kg
    body_fat_percentage = models.FloatField(null=True, blank=True)
    muscle_mass = models.FloatField(null=True, blank=True)  # in kg
    waist = models.FloatField(null=True, blank=True)  # in cm
    chest = models.FloatField(null=True, blank=True)  # in cm
    arms = models.FloatField(null=True, blank=True)  # in cm
    thighs = models.FloatField(null=True, blank=True)  # in cm
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['user_id', 'date']

class StrengthProgress(UserMetric):
    """Track strength progression for key exercises"""
    exercise_id = models.UUIDField()
    exercise_name = models.CharField(max_length=100)
    one_rep_max = models.FloatField()  # Actual or calculated 1RM
    is_estimated = models.BooleanField(default=True)  # Whether 1RM is calculated or tested
    
    class Meta:
        unique_together = ['user_id', 'date', 'exercise_id']

class EnduranceMetric(UserMetric):
    """Track cardio and endurance progress"""
    activity_type = models.CharField(max_length=50)  # running, cycling, etc.
    distance = models.FloatField(null=True, blank=True)  # in km
    duration = models.IntegerField(null=True, blank=True)  # in seconds
    average_heart_rate = models.IntegerField(null=True, blank=True)  # in bpm
    max_heart_rate = models.IntegerField(null=True, blank=True)  # in bpm
    calories_burned = models.IntegerField(null=True, blank=True)
    perceived_exertion = models.IntegerField(null=True, blank=True)  # Scale 1-10
    
    class Meta:
        unique_together = ['user_id', 'date', 'activity_type']

class NutritionSummary(UserMetric):
    """Daily nutrition summary"""
    calories = models.IntegerField(default=0)
    protein = models.FloatField(default=0)  # in grams
    carbs = models.FloatField(default=0)  # in grams
    fat = models.FloatField(default=0)  # in grams
    fiber = models.FloatField(default=0)  # in grams
    sugar = models.FloatField(default=0)  # in grams
    water = models.FloatField(default=0)  # in liters
    target_calories = models.IntegerField(null=True, blank=True)
    adherence_score = models.FloatField(default=0)  # 0-100 score of adherence to targets
    
    class Meta:
        unique_together = ['user_id', 'date']

class SleepMetric(UserMetric):
    """Sleep quality and duration metrics"""
    duration = models.IntegerField()  # in minutes
    quality = models.IntegerField(null=True, blank=True)  # Scale 1-10
    deep_sleep = models.IntegerField(null=True, blank=True)  # in minutes
    rem_sleep = models.IntegerField(null=True, blank=True)  # in minutes
    resting_heart_rate = models.IntegerField(null=True, blank=True)
    heart_rate_variability = models.FloatField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user_id', 'date']

class WorkoutAnalysis(models.Model):
    """Aggregated workout analysis"""
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

class AIServiceLog(models.Model):
    """Track AI service usage for analytics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_name = models.CharField(max_length=100)
    request_data = models.JSONField(null=True, blank=True)
    response_status = models.CharField(max_length=20)
    error_message = models.TextField(null=True, blank=True)
    processing_time_ms = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['service_name', 'timestamp']),
        ]
```

### Data Processing Services

#### Strength Analytics Service
```python
# api/analytics/services/strength_analytics.py
from api.workouts.models import Workout, WorkoutSet
from api.analytics.models import StrengthProgress
from django.db.models import Max, Avg, Count, Sum, F, ExpressionWrapper, fields
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from datetime import timedelta

def calculate_one_rep_max(weight, reps):
    """
    Calculate theoretical 1RM using Brzycki formula
    1RM = weight × (36 / (37 - reps))
    Valid for reps <= 10
    """
    if reps > 10:
        # Less accurate for higher reps
        return weight * (1 + reps/30)
    elif reps <= 0:
        return weight
    else:
        return weight * (36 / (37 - reps))

def update_strength_metrics(user_id):
    """
    Update strength progress metrics based on recent workouts
    """
    # Get workouts from the last 30 days
    thirty_days_ago = timezone.now().date() - timedelta(days=30)
    recent_workouts = Workout.objects.filter(
        user_id=user_id,
        date__gte=thirty_days_ago
    )
    
    # Get all exercises performed in these workouts
    workout_sets = WorkoutSet.objects.filter(
        workout__in=recent_workouts
    ).select_related('exercise')
    
    # Group by exercise and date to find the best set each day
    exercise_days = {}
    for workout_set in workout_sets:
        exercise_id = workout_set.exercise.id
        exercise_name = workout_set.exercise.name
        date = workout_set.workout.date
        
        # Calculate estimated 1RM for this set
        one_rm = calculate_one_rep_max(workout_set.weight, workout_set.reps)
        
        key = (exercise_id, date)
        if key not in exercise_days or one_rm > exercise_days[key]['one_rm']:
            exercise_days[key] = {
                'exercise_id': exercise_id,
                'exercise_name': exercise_name,
                'date': date,
                'one_rm': one_rm
            }
    
    # Create or update StrengthProgress entries
    for key, data in exercise_days.items():
        StrengthProgress.objects.update_or_create(
            user_id=user_id,
            date=data['date'],
            exercise_id=data['exercise_id'],
            defaults={
                'exercise_name': data['exercise_name'],
                'one_rep_max': data['one_rm'],
                'is_estimated': True
            }
        )
    
    return len(exercise_days)

def get_strength_progression(user_id, exercise_id=None, start_date=None, end_date=None):
    """
    Get strength progression data for visualization or reporting
    """
    # Set default dates if not provided
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=90)  # Last 3 months by default
    
    # Base query
    query = StrengthProgress.objects.filter(
        user_id=user_id,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('exercise_name', 'date')
    
    # Filter by exercise if specified
    if exercise_id:
        query = query.filter(exercise_id=exercise_id)
    
    # Prepare progression data
    result = {}
    for entry in query:
        if entry.exercise_name not in result:
            result[entry.exercise_name] = {
                'exercise_id': entry.exercise_id,
                'data_points': []
            }
        
        result[entry.exercise_name]['data_points'].append({
            'date': entry.date.isoformat(),
            'one_rm': entry.one_rep_max
        })
    
    # Calculate improvements
    for exercise_name, data in result.items():
        data_points = data['data_points']
        if len(data_points) > 1:
            first = data_points[0]['one_rm']
            last = data_points[-1]['one_rm']
            improvement = ((last - first) / first) * 100 if first > 0 else 0
            result[exercise_name]['improvement'] = round(improvement, 1)
    
    return result
```

#### Workout Analysis Service
```python
# api/analytics/services/workout_analytics.py
from api.workouts.models import Workout, WorkoutSet
from api.analytics.models import WorkoutAnalysis
from django.db.models import Count, Sum, Avg, F, Q, ExpressionWrapper, fields
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta
import numpy as np

def analyze_workout_period(user_id, start_date, end_date):
    """
    Generate comprehensive workout analysis for a specific time period
    """
    # Get workouts in the date range
    workouts = Workout.objects.filter(
        user_id=user_id,
        date__gte=start_date,
        date__lte=end_date
    )
    
    # Skip if no workouts found
    workout_count = workouts.count()
    if workout_count == 0:
        return None
    
    # Calculate total workout time
    total_duration = workouts.aggregate(total=Sum('duration'))['total'] or 0
    
    # Get all sets from these workouts
    workout_sets = WorkoutSet.objects.filter(workout__in=workouts)
    
    # Calculate total volume (weight × reps × sets)
    volume_by_set = workout_sets.annotate(
        volume=F('weight') * F('reps')
    )
    total_volume = volume_by_set.aggregate(total=Sum('volume'))['total'] or 0
    
    # Calculate average intensity (% of 1RM)
    # This requires a more complex calculation with estimated 1RMs
    # Simplified version here
    avg_intensity = 70  # Placeholder - actual calculation would be more complex
    
    # Analyze muscle group distribution
    muscle_group_counts = workout_sets.values(
        'exercise__muscle_group'
    ).annotate(
        count=Count('id')
    ).order_by('-count')
    
    most_trained_muscle = ""
    least_trained_muscle = ""
    
    if muscle_group_counts:
        most_trained_muscle = muscle_group_counts.first()['exercise__muscle_group']
        least_trained_muscle = muscle_group_counts.last()['exercise__muscle_group']
    
    # Calculate consistency score
    # Number of days with workouts / total number of days in period
    days_in_period = (end_date - start_date).days + 1
    days_with_workouts = workouts.dates('date', 'day').count()
    
    # Calculate consistency score based on planned frequency
    from api.social.models import UserProfile
    try:
        profile = UserProfile.objects.get(user_id=user_id)
        planned_frequency = profile.target_workouts_per_week
    except:
        # Default to 3 workouts per week if not set
        planned_frequency = 3
    
    # Expected workouts in the period
    expected_workouts = (days_in_period / 7) * planned_frequency
    
    # Consistency score (capped at 100%)
    consistency_score = min(100, (workout_count / expected_workouts) * 100) if expected_workouts > 0 else 0
    
    # Create or update the analysis record
    analysis, created = WorkoutAnalysis.objects.update_or_create(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        defaults={
            'total_workouts': workout_count,
            'total_volume': total_volume,
            'total_duration': total_duration,
            'avg_intensity': avg_intensity,
            'consistency_score': consistency_score,
            'most_trained_muscle': most_trained_muscle,
            'least_trained_muscle': least_trained_muscle
        }
    )
    
    return {
        'id': analysis.id,
        'total_workouts': workout_count,
        'total_volume': total_volume,
        'total_duration': total_duration,
        'avg_intensity': avg_intensity,
        'consistency_score': consistency_score,
        'most_trained_muscle': most_trained_muscle,
        'least_trained_muscle': least_trained_muscle,
        'start_date': start_date,
        'end_date': end_date
    }

def get_workout_frequency_heatmap(user_id, start_date=None, end_date=None):
    """
    Generate workout frequency heatmap data 
    (similar to GitHub contribution graph)
    """
    # Set default dates if not provided
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=365)  # Last year by default
    
    # Get all dates with workouts
    workouts_by_date = Workout.objects.filter(
        user_id=user_id,
        date__gte=start_date,
        date__lte=end_date
    ).values('date').annotate(
        count=Count('id')
    )
    
    # Create a dictionary with all dates in range
    all_dates = {}
    current_date = start_date
    while current_date <= end_date:
        all_dates[current_date.isoformat()] = 0
        current_date += timedelta(days=1)
    
    # Fill in workout counts
    for item in workouts_by_date:
        date_key = item['date'].isoformat()
        all_dates[date_key] = item['count']
    
    return all_dates

def calculate_volume_trends(user_id, weeks=12):
    """
    Calculate weekly volume trends for different muscle groups
    """
    start_date = timezone.now().date() - timedelta(weeks=weeks)
    
    # Get workout sets grouped by week and muscle group
    sets_by_week = WorkoutSet.objects.filter(
        workout__user_id=user_id,
        workout__date__gte=start_date
    ).annotate(
        week=TruncWeek('workout__date')
    ).values(
        'week', 'exercise__muscle_group'
    ).annotate(
        volume=Sum(F('weight') * F('reps'))
    ).order_by('week', 'exercise__muscle_group')
    
    # Organize by week
    weeks_data = {}
    for entry in sets_by_week:
        week_key = entry['week'].strftime('%Y-%m-%d')
        muscle = entry['exercise__muscle_group'] or 'Other'
        volume = entry['volume'] or 0
        
        if week_key not in weeks_data:
            weeks_data[week_key] = {}
        
        weeks_data[week_key][muscle] = volume
    
    # Convert to array format for charting
    result = []
    for week, muscles in sorted(weeks_data.items()):
        week_data = {'week': week}
        week_data.update(muscles)
        result.append(week_data)
    
    return result
```

#### Nutrition Analysis Service
```python
# api/analytics/services/nutrition_analytics.py
from api.nutrition.models import MealEntry, Food
from api.analytics.models import NutritionSummary
from django.db.models import Sum, Avg, Count, F, Q
from django.utils import timezone
from datetime import timedelta

def update_nutrition_summary(user_id, date=None):
    """
    Calculate or update nutrition summary for a specific day
    """
    if date is None:
        date = timezone.now().date()
    
    # Get all meal entries for the day
    meals = MealEntry.objects.filter(
        user_id=user_id,
        date=date
    ).select_related('food')
    
    # Calculate totals
    totals = {
        'calories': 0,
        'protein': 0,
        'carbs': 0,
        'fat': 0,
        'fiber': 0,
        'sugar': 0,
        'water': 0
    }
    
    for meal in meals:
        if meal.food:
            totals['calories'] += meal.food.calories * meal.quantity
            totals['protein'] += meal.food.protein * meal.quantity
            totals['carbs'] += meal.food.carbs * meal.quantity
            totals['fat'] += meal.food.fat * meal.quantity
            totals['fiber'] += meal.food.fiber * meal.quantity
            totals['sugar'] += meal.food.sugar * meal.quantity
    
    # Get water entries
    from api.nutrition.models import WaterEntry
    water_entries = WaterEntry.objects.filter(
        user_id=user_id,
        date=date
    )
    totals['water'] = water_entries.aggregate(total=Sum('amount'))['total'] or 0
    
    # Get user nutrition targets
    from api.social.models import UserNutritionTarget
    try:
        target = UserNutritionTarget.objects.get(user_id=user_id)
        target_calories = target.target_calories
        
        # Calculate adherence score (0-100)
        calorie_adherence = 100 - min(100, abs(totals['calories'] - target_calories) / target_calories * 100)
        protein_adherence = 100 - min(100, abs(totals['protein'] - target.target_protein) / target.target_protein * 100)
        
        adherence_score = (calorie_adherence * 0.5) + (protein_adherence * 0.5)
    except UserNutritionTarget.DoesNotExist:
        target_calories = 2000  # Default
        adherence_score = 0
    
    # Create or update the summary
    summary, created = NutritionSummary.objects.update_or_create(
        user_id=user_id,
        date=date,
        defaults={
            'calories': totals['calories'],
            'protein': totals['protein'],
            'carbs': totals['carbs'],
            'fat': totals['fat'],
            'fiber': totals['fiber'],
            'sugar': totals['sugar'],
            'water': totals['water'],
            'target_calories': target_calories,
            'adherence_score': adherence_score
        }
    )
    
    return summary

def get_nutrition_trends(user_id, days=30):
    """
    Get nutrition trends for visualization
    """
    start_date = timezone.now().date() - timedelta(days=days-1)
    
    # Get summaries for the date range
    summaries = NutritionSummary.objects.filter(
        user_id=user_id,
        date__gte=start_date
    ).order_by('date')
    
    result = {
        'dates': [],
        'calories': [],
        'protein': [],
        'carbs': [],
        'fat': [],
        'water': [],
        'adherence': []
    }
    
    # Create a dictionary for fast lookup
    summary_by_date = {s.date.isoformat(): s for s in summaries}
    
    # Fill in all dates in range, adding zeros for missing dates
    current_date = start_date
    today = timezone.now().date()
    
    while current_date <= today:
        date_str = current_date.isoformat()
        result['dates'].append(date_str)
        
        if date_str in summary_by_date:
            summary = summary_by_date[date_str]
            result['calories'].append(summary.calories)
            result['protein'].append(summary.protein)
            result['carbs'].append(summary.carbs)
            result['fat'].append(summary.fat)
            result['water'].append(summary.water)
            result['adherence'].append(summary.adherence_score)
        else:
            # No data for this date
            result['calories'].append(0)
            result['protein'].append(0)
            result['carbs'].append(0)
            result['fat'].append(0)
            result['water'].append(0)
            result['adherence'].append(0)
        
        current_date += timedelta(days=1)
    
    # Calculate averages
    result['avg_calories'] = sum(result['calories']) / len(result['calories']) if result['calories'] else 0
    result['avg_protein'] = sum(result['protein']) / len(result['protein']) if result['protein'] else 0
    result['avg_adherence'] = sum(result['adherence']) / len(result['adherence']) if result['adherence'] else 0
    
    return result

def analyze_macro_distribution(user_id, start_date=None, end_date=None):
    """
    Analyze macronutrient distribution over a period
    """
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=7)  # One week by default
    
    # Get summaries for the period
    summaries = NutritionSummary.objects.filter(
        user_id=user_id,
        date__gte=start_date,
        date__lte=end_date
    )
    
    if not summaries:
        return None
    
    # Calculate averages
    totals = summaries.aggregate(
        avg_calories=Avg('calories'),
        avg_protein=Avg('protein'),
        avg_carbs=Avg('carbs'),
        avg_fat=Avg('fat')
    )
    
    # Calculate percentages
    avg_protein = totals['avg_protein'] or 0
    avg_carbs = totals['avg_carbs'] or 0
    avg_fat = totals['avg_fat'] or 0
    
    total_calories_from_macros = (avg_protein * 4) + (avg_carbs * 4) + (avg_fat * 9)
    
    if total_calories_from_macros > 0:
        protein_pct = (avg_protein * 4 / total_calories_from_macros) * 100
        carbs_pct = (avg_carbs * 4 / total_calories_from_macros) * 100
        fat_pct = (avg_fat * 9 / total_calories_from_macros) * 100
    else:
        protein_pct = carbs_pct = fat_pct = 0
    
    return {
        'period': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat(),
        },
        'averages': {
            'calories': round(totals['avg_calories'] or 0, 1),
            'protein': round(avg_protein, 1),
            'carbs': round(avg_carbs, 1),
            'fat': round(avg_fat, 1),
        },
        'percentages': {
            'protein': round(protein_pct, 1),
            'carbs': round(carbs_pct, 1),
            'fat': round(fat_pct, 1),
        }
    }
```

### Data Analysis & Reporting Tasks

#### Scheduled Analytics Tasks
```python
# api/analytics/tasks.py
from celery import shared_task
import logging
from django.utils import timezone
from datetime import timedelta
from api.social.models import UserProfile
from api.analytics.services.workout_analytics import analyze_workout_period
from api.analytics.services.strength_analytics import update_strength_metrics
from api.analytics.services.nutrition_analytics import update_nutrition_summary

logger = logging.getLogger(__name__)

@shared_task
def generate_daily_analytics():
    """
    Task to run analytics processing for all users at the end of the day
    """
    # Process previous day's data
    yesterday = timezone.now().date() - timedelta(days=1)
    
    # Get all active users
    users = UserProfile.objects.all().values_list('user_id', flat=True)
    
    processed_users = 0
    
    for user_id in users:
        try:
            # Update nutrition summary
            update_nutrition_summary(user_id, yesterday)
            
            # Update strength metrics
            update_strength_metrics(user_id)
            
            processed_users += 1
        except Exception as e:
            logger.error(f"Error processing analytics for user {user_id}: {str(e)}")
    
    return processed_users

@shared_task
def generate_weekly_analysis():
    """
    Task to generate weekly workout analysis for all users
    """
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    
    # Get all active users
    users = UserProfile.objects.all().values_list('user_id', flat=True)
    
    processed_users = 0
    
    for user_id in users:
        try:
            # Generate workout analysis
            analyze_workout_period(user_id, week_ago, today)
            
            processed_users += 1
        except Exception as e:
            logger.error(f"Error generating weekly analysis for user {user_id}: {str(e)}")
    
    return processed_users

@shared_task
def update_leaderboards():
    """
    Task to update various leaderboards in the system
    """
    from api.social.services.leaderboard_service import (
        update_global_leaderboards,
        update_challenge_leaderboards
    )
    
    logger.info("Starting leaderboard updates")
    
    try:
        # Update global leaderboards (strength, volume, consistency)
        global_updates = update_global_leaderboards()
        
        # Update active challenge leaderboards
        challenge_updates = update_challenge_leaderboards()
        
        logger.info(f"Updated {global_updates} global leaderboards and {challenge_updates} challenge leaderboards")
        
        return {
            'global': global_updates,
            'challenges': challenge_updates
        }
    except Exception as e:
        logger.error(f"Error updating leaderboards: {str(e)}")
        raise
```

#### Using Analytics Data in the Frontend

```jsx
// Example React component using analytics data
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getStrengthProgression } from '../api/analytics';

function StrengthProgressionChart({ userId, exerciseId }) {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getStrengthProgression(userId, exerciseId);
        setProgressData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userId, exerciseId]);

  if (loading) return <div>Loading strength data...</div>;
  if (error) return <div>Error loading data: {error}</div>;
  if (!progressData || Object.keys(progressData).length === 0) {
    return <div>No strength data available</div>;
  }

  // Get the first exercise if exerciseId wasn't specified
  const exerciseName = Object.keys(progressData)[0];
  const chartData = progressData[exerciseName].data_points;
  const improvement = progressData[exerciseName].improvement || 0;

  return (
    <div>
      <h3>{exerciseName}</h3>
      {improvement > 0 && (
        <div className="improvement-badge">
          +{improvement}% improvement
        </div>
      )}
      
      <LineChart width={600} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="one_rm" 
          name="1RM (kg)" 
          stroke="#8884d8" 
          activeDot={{ r: 8 }} 
        />
      </LineChart>
    </div>
  );
}
```

### API Endpoints for Analytics

```python
# api/analytics/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services.strength_analytics import get_strength_progression
from .services.workout_analytics import (
    analyze_workout_period, 
    get_workout_frequency_heatmap,
    calculate_volume_trends
)
from .services.nutrition_analytics import (
    get_nutrition_trends,
    analyze_macro_distribution
)
from django.utils import timezone
from datetime import timedelta

class StrengthProgressionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = request.user.id
        exercise_id = request.query_params.get('exercise_id')
        days = int(request.query_params.get('days', 90))
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        data = get_strength_progression(
            user_id, 
            exercise_id=exercise_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return Response(data)

class WorkoutAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = request.user.id
        period = request.query_params.get('period', 'week')
        
        end_date = timezone.now().date()
        
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            # Custom range
            try:
                start_date = timezone.datetime.strptime(
                    request.query_params.get('start_date'),
                    '%Y-%m-%d'
                ).date()
            except:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        data = analyze_workout_period(user_id, start_date, end_date)
        
        if data is None:
            return Response(
                {"message": "No workout data found in the specified period."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(data)

class WorkoutFrequencyHeatmapView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = request.user.id
        data = get_workout_frequency_heatmap(user_id)
        return Response(data)

class NutritionTrendsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = request.user.id
        days = int(request.query_params.get('days', 30))
        data = get_nutrition_trends(user_id, days=days)
        return Response(data)

class MacroDistributionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = request.user.id
        period = request.query_params.get('period', 'week')
        
        end_date = timezone.now().date()
        
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        else:
            # Custom range
            try:
                start_date = timezone.datetime.strptime(
                    request.query_params.get('start_date'),
                    '%Y-%m-%d'
                ).date()
            except:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        data = analyze_macro_distribution(user_id, start_date, end_date)
        
        if data is None:
            return Response(
                {"message": "No nutrition data found in the specified period."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(data)
```

## Analytics Dashboard Implementation

The analytics dashboard is a key feature of our fitness app, providing users with visual representations of their progress and insights.

### Dashboard Component Structure

```jsx
// Main Dashboard Component
function AnalyticsDashboard() {
  return (
    <div className="analytics-dashboard">
      <h1>Your Progress Dashboard</h1>
      
      <section className="dashboard-section">
        <h2>Workout Progress</h2>
        <div className="dashboard-grid">
          <WorkoutConsistencyCard />
          <WeeklyVolumeCard />
          <MuscleBalanceCard />
        </div>
      </section>
      
      <section className="dashboard-section">
        <h2>Strength Progress</h2>
        <div className="dashboard-grid">
          <KeyLiftsProgressCard />
          <OneRepMaxRankingCard />
          <StrengthGoalsCard />
        </div>
      </section>
      
      <section className="dashboard-section">
        <h2>Nutrition Overview</h2>
        <div className="dashboard-grid">
          <MacroDistributionCard />
          <CalorieHistoryCard />
          <WaterIntakeCard />
        </div>
      </section>
      
      <section className="dashboard-section">
        <h2>Body Composition</h2>
        <div className="dashboard-grid">
          <WeightTrendCard />
          <BodyFatCard />
          <MeasurementsCard />
        </div>
      </section>
    </div>
  );
}
```

### Mobile Considerations

For the React Native mobile app, we've optimized our analytics display for smaller screens:

```jsx
// Mobile Analytics Dashboard with Tabs
function MobileAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('workout');
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Your Progress</Text>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'workout' && styles.activeTab]} 
          onPress={() => setActiveTab('workout')}
        >
          <Text>Workouts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'strength' && styles.activeTab]} 
          onPress={() => setActiveTab('strength')}
        >
          <Text>Strength</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]} 
          onPress={() => setActiveTab('nutrition')}
        >
          <Text>Nutrition</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'body' && styles.activeTab]} 
          onPress={() => setActiveTab('body')}
        >
          <Text>Body</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        {activeTab === 'workout' && <WorkoutAnalyticsPanel />}
        {activeTab === 'strength' && <StrengthAnalyticsPanel />}
        {activeTab === 'nutrition' && <NutritionAnalyticsPanel />}
        {activeTab === 'body' && <BodyAnalyticsPanel />}
      </ScrollView>
    </SafeAreaView>
  );
}
```

## Predictive Analytics Implementation

One of our advanced features is predictive analytics, which forecasts future performance based on historical data.

```python
# api/analytics/services/predictive_analytics.py
import numpy as np
from scipy import stats
from datetime import timedelta
from django.utils import timezone
from api.analytics.models import StrengthProgress, BodyMetric

def predict_strength_progression(user_id, exercise_id, days_ahead=30):
    """
    Predict future strength progression based on historical data
    """
    # Get historical data (last 90 days)
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=90)
    
    strength_data = StrengthProgress.objects.filter(
        user_id=user_id,
        exercise_id=exercise_id,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('date')
    
    if len(strength_data) < 5:
        return None  # Not enough data for reliable prediction
    
    # Prepare data for regression
    dates = [(entry.date - start_date).days for entry in strength_data]
    values = [entry.one_rep_max for entry in strength_data]
    
    # Linear regression
    slope, intercept, r_value, p_value, std_err = stats.linregress(dates, values)
    
    # Calculate predictions
    last_date = dates[-1]
    prediction_dates = [last_date + i for i in range(1, days_ahead + 1)]
    predictions = [slope * x + intercept for x in prediction_dates]
    
    # Format results
    future_date = end_date
    result = []
    
    for i, pred in enumerate(predictions):
        future_date = future_date + timedelta(days=1)
        result.append({
            'date': future_date.isoformat(),
            'predicted_1rm': max(values[-1], round(pred, 1))  # Ensure non-decreasing
        })
    
    return {
        'current_1rm': values[-1],
        'prediction_slope': slope,
        'correlation': r_value,
        'predictions': result,
        'confidence': min(abs(r_value) * 100, 100)  # Confidence based on correlation strength
    }

def predict_weight_change(user_id, days_ahead=30):
    """
    Predict future weight changes based on historical data and nutrition
    """
    # Get historical weight data (last 60 days)
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=60)
    
    weight_data = BodyMetric.objects.filter(
        user_id=user_id,
        date__gte=start_date,
        date__lte=end_date,
        weight__isnull=False
    ).order_by('date')
    
    if len(weight_data) < 5:
        return None  # Not enough data for reliable prediction
    
    # Calculate average weekly deficit/surplus
    from api.analytics.models import NutritionSummary
    from api.analytics.services.workout_analytics import get_calorie_expenditure
    
    calorie_balance_data = []
    current_date = start_date
    
    while current_date <= end_date:
        # Get calorie intake for the day
        try:
            nutrition = NutritionSummary.objects.get(
                user_id=user_id,
                date=current_date
            )
            calorie_intake = nutrition.calories
        except NutritionSummary.DoesNotExist:
            calorie_intake = None
        
        # Get estimated expenditure for the day
        try:
            expenditure = get_calorie_expenditure(user_id, current_date)
        except:
            expenditure = None
        
        if calorie_intake is not None and expenditure is not None:
            calorie_balance_data.append(calorie_intake - expenditure)
        
        current_date += timedelta(days=1)
    
    # Prepare weight data for regression
    dates = [(entry.date - start_date).days for entry in weight_data]
    weights = [entry.weight for entry in weight_data]
    
    # Linear regression
    slope, intercept, r_value, p_value, std_err = stats.linregress(dates, weights)
    
    # Calculate predictions
    last_date = dates[-1]
    prediction_dates = [last_date + i for i in range(1, days_ahead + 1)]
    predictions = [slope * x + intercept for x in prediction_dates]
    
    # Consider calorie balance for prediction adjustment
    avg_daily_balance = sum(calorie_balance_data) / len(calorie_balance_data) if calorie_balance_data else 0
    
    # 7700 kcal deficit/surplus = 1kg weight change
    expected_weekly_change = (avg_daily_balance * 7) / 7700
    
    # Format results
    future_date = end_date
    result = []
    
    for i, pred in enumerate(predictions):
        future_date = future_date + timedelta(days=1)
        
        # Weight can't go below certain threshold
        safe_min_weight = max(40, weights[-1] * 0.8)
        
        result.append({
            'date': future_date.isoformat(),
            'predicted_weight': max(safe_min_weight, round(pred, 1))
        })
    
    return {
        'current_weight': weights[-1],
        'avg_daily_calorie_balance': round(avg_daily_balance, 0),
        'expected_weekly_change': round(expected_weekly_change, 2),
        'predictions': result,
        'confidence': min(abs(r_value) * 100, 100)  # Confidence based on correlation strength
    }
```

## Achievement Tracking System

Our analytics system also powers an achievement tracking system that rewards users for reaching milestones:

```python
# api/analytics/services/achievement_service.py
from django.utils import timezone
from api.social.models import Achievement, UserAchievement
from api.workouts.models import Workout, WorkoutSet
from django.db.models import Sum, Count, Max, F

def check_workout_achievements(user_id):
    """
    Check if user has earned any workout-related achievements
    """
    # Get user's workout stats
    workout_count = Workout.objects.filter(user_id=user_id).count()
    total_volume = WorkoutSet.objects.filter(
        workout__user_id=user_id
    ).annotate(
        vol=F('weight') * F('reps')
    ).aggregate(
        total=Sum('vol')
    )['total'] or 0
    
    # Dictionary to track newly earned achievements
    earned_achievements = []
    
    # Check workout count achievements
    workout_milestones = {
        'first_workout': 1,
        'ten_workouts': 10,
        'fifty_workouts': 50,
        'hundred_workouts': 100,
        'workout_master': 500
    }
    
    for achievement_key, count in workout_milestones.items():
        if workout_count >= count:
            achievement, created = Achievement.objects.get_or_create(
                code=achievement_key,
                defaults={
                    'name': achievement_key.replace('_', ' ').title(),
                    'description': f'Complete {count} workouts',
                    'category': 'workout'
                }
            )
            
            # Award to user if not already earned
            user_achievement, created = UserAchievement.objects.get_or_create(
                user_id=user_id,
                achievement=achievement,
                defaults={'earned_at': timezone.now()}
            )
            
            if created:
                earned_achievements.append({
                    'code': achievement_key,
                    'name': achievement.name,
                    'description': achievement.description
                })
    
    # Check volume achievements
    volume_milestones = {
        'heavy_lifter': 10000,
        'volume_king': 100000,
        'volume_legend': 1000000
    }
    
    for achievement_key, volume in volume_milestones.items():
        if total_volume >= volume:
            achievement, created = Achievement.objects.get_or_create(
                code=achievement_key,
                defaults={
                    'name': achievement_key.replace('_', ' ').title(),
                    'description': f'Lift {volume:,} kg total volume',
                    'category': 'strength'
                }
            )
            
            # Award to user if not already earned
            user_achievement, created = UserAchievement.objects.get_or_create(
                user_id=user_id,
                achievement=achievement,
                defaults={'earned_at': timezone.now()}
            )
            
            if created:
                earned_achievements.append({
                    'code': achievement_key,
                    'name': achievement.name,
                    'description': achievement.description
                })
    
    return earned_achievements
```

## Performance & Scaling Considerations

For a production environment with many users, several optimizations are implemented:

1. **Database Indexes**:
   ```python
   # Additional indexes for analytics queries
   class Meta:
       indexes = [
           models.Index(fields=['user_id', 'date']),
           models.Index(fields=['exercise_id', 'date']),
       ]
   ```

2. **Data Aggregation**:
   - Daily raw data is aggregated into summary tables
   - Historical data is periodically archived or compressed

3. **Caching Strategy**:
   ```python
   from django.core.cache import cache
   
   def get_cached_analytics(user_id, key_suffix, data_function, ttl=3600):
       """Cache wrapper for expensive analytics calculations"""
       cache_key = f"analytics:{user_id}:{key_suffix}"
       result = cache.get(cache_key)
       
       if result is None:
           result = data_function()
           cache.set(cache_key, result, ttl)
           
       return result
   ```

4. **Asynchronous Processing**:
   - Heavy analytics calculations are performed in background tasks
   - Users receive notifications when new insights are available

5. **Progressive Loading**:
   - API endpoints support pagination for large datasets
   - Time-series data is loaded at different resolutions based on zoom level

## Privacy & Data Retention

Our analytics system implements the following privacy-focused practices:

1. **Data Anonymization**: Aggregate analytics for global insights without exposing personal data
2. **User Control**: Users can opt out of certain types of data collection
3. **Data Retention Policies**: Historical data is subject to configurable retention periods
4. **Data Export**: Users can export their complete analytics history

## Future Analytics Enhancements

Planned enhancements to our analytics system include:

1. **AI-Powered Insights**: More personalized recommendations based on user patterns
2. **Advanced Forecasting**: Multi-variable prediction models for more accurate projections
3. **Cross-Training Analysis**: Identify relationships between different training activities
4. **Recovery Optimization**: Analysis of workout performance relative to recovery metrics
5. **Personalized Benchmarks**: Compare progress to similar users rather than global averages