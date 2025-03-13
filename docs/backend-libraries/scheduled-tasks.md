# Scheduled Tasks & Background Jobs

## Overview
Our fitness app requires various scheduled tasks and background jobs to handle operations like analytics calculation, workout reminders, and data cleanups that should happen automatically at specific intervals.

## Features Used in Our Fitness App

- **Daily Reports**: Sending daily activity summaries to users
- **Weekly Progress Reports**: Calculating weekly progress metrics and insights
- **Inactive User Reminders**: Notifying users who haven't worked out recently
- **Challenge Start/End Notifications**: Sending alerts when challenges begin or end
- **Leaderboard Updates**: Recalculating global and challenge leaderboards
- **Data Aggregation**: Computing trending workouts and exercises
- **Database Maintenance**: Cleaning up expired or temporary data

## Implementation Examples

### Django Crontab Integration
```python
# settings.py
INSTALLED_APPS = [
    # ...
    'django_crontab',
    # ...
]

CRONJOBS = [
    # Run daily at 6:00 AM
    ('0 6 * * *', 'api.tasks.send_daily_summaries'),
    
    # Run weekly on Monday at 8:00 AM
    ('0 8 * * 1', 'api.tasks.send_weekly_progress_reports'),
    
    # Run every 3 hours
    ('0 */3 * * *', 'api.tasks.update_leaderboards'),
    
    # Run every night at midnight
    ('0 0 * * *', 'api.tasks.clean_temporary_data'),
]
```

### Celery Beat Schedule (Alternative to Django Crontab)
```python
# settings.py
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'send-daily-summaries': {
        'task': 'api.tasks.send_daily_summaries',
        'schedule': crontab(hour=6, minute=0),
    },
    'send-weekly-progress-reports': {
        'task': 'api.tasks.send_weekly_progress_reports',
        'schedule': crontab(hour=8, minute=0, day_of_week=1),
    },
    'update-leaderboards': {
        'task': 'api.tasks.update_leaderboards',
        'schedule': crontab(hour='*/3', minute=0),
    },
    'clean-temporary-data': {
        'task': 'api.tasks.clean_temporary_data',
        'schedule': crontab(hour=0, minute=0),
    },
}
```

### Task Implementation Examples
```python
# api/tasks.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_daily_summaries():
    """
    Send daily activity summaries to users
    """
    from api.notifications.services import send_daily_summary
    from api.social.models import UserProfile
    
    logger.info("Starting daily summary task")
    yesterday = timezone.now().date() - timedelta(days=1)
    
    # Get all active users
    user_profiles = UserProfile.objects.all()
    
    for profile in user_profiles:
        try:
            # Gather user activity data from yesterday
            activity_data = get_user_daily_activity(profile.user_id, yesterday)
            
            # Send summary if they had any activity
            if activity_data['had_activity']:
                send_daily_summary(
                    user_id=profile.user_id,
                    activity_data=activity_data
                )
                logger.info(f"Sent daily summary to user {profile.user_id}")
        except Exception as e:
            logger.error(f"Failed to send daily summary to {profile.user_id}: {e}")
            
    return len(user_profiles)

@shared_task
def send_weekly_progress_reports():
    """
    Calculate and send weekly progress reports to users
    """
    from api.notifications.services import send_weekly_report
    from api.social.models import UserProfile
    from api.analytics.services import generate_weekly_report
    
    logger.info("Starting weekly report task")
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=7)
    
    # Get all active users
    user_profiles = UserProfile.objects.all()
    sent_count = 0
    
    for profile in user_profiles:
        try:
            # Generate weekly report data
            report_data = generate_weekly_report(profile.user_id, start_date, end_date)
            
            # Only send if they had workouts this week
            if report_data['workout_count'] > 0:
                send_weekly_report(
                    user_id=profile.user_id,
                    report_data=report_data
                )
                sent_count += 1
                logger.info(f"Sent weekly report to user {profile.user_id}")
        except Exception as e:
            logger.error(f"Failed to send weekly report to {profile.user_id}: {e}")
    
    return sent_count

@shared_task
def send_challenge_notifications():
    """
    Send notifications for challenges that are starting or ending soon
    """
    from api.social.models import Challenge
    from api.notifications.services import send_push_notification
    
    logger.info("Checking for challenges requiring notifications")
    today = timezone.now().date()
    
    # Find challenges starting soon (1 day before start)
    starting_tomorrow = today + timedelta(days=1)
    starting_challenges = Challenge.objects.filter(start_date=starting_tomorrow)
    
    # Find challenges ending soon (1 day before end)
    ending_tomorrow = today + timedelta(days=1)
    ending_challenges = Challenge.objects.filter(end_date=ending_tomorrow)
    
    # Send notifications for challenges starting soon
    for challenge in starting_challenges:
        participants = challenge.participants.all()
        
        for participant in participants:
            send_push_notification(
                user_id=participant.user_id,
                title="Challenge Starting Tomorrow!",
                body=f"Get ready! The '{challenge.title}' challenge begins tomorrow.",
                data={
                    "type": "challenge_starting",
                    "challenge_id": str(challenge.id)
                }
            )
        
        logger.info(f"Sent starting notifications for challenge {challenge.id}")
    
    # Send notifications for challenges ending soon
    for challenge in ending_challenges:
        participants = challenge.participants.all()
        
        for participant in participants:
            send_push_notification(
                user_id=participant.user_id,
                title="Challenge Ending Tomorrow!",
                body=f"Final push! The '{challenge.title}' challenge ends tomorrow.",
                data={
                    "type": "challenge_ending",
                    "challenge_id": str(challenge.id)
                }
            )
        
        logger.info(f"Sent ending notifications for challenge {challenge.id}")
    
    return len(starting_challenges) + len(ending_challenges)

@shared_task
def clean_temporary_data():
    """
    Remove old temporary data to keep the database clean
    """
    from api.ai.models import TemporaryUpload
    from api.analytics.models import CachedStats
    
    logger.info("Starting database cleanup task")
    
    # Remove temporary uploads older than 24 hours
    one_day_ago = timezone.now() - timedelta(days=1)
    deleted_uploads = TemporaryUpload.objects.filter(
        created_at__lt=one_day_ago
    ).delete()
    
    # Refresh cached statistics older than 1 week
    one_week_ago = timezone.now() - timedelta(days=7)
    old_stats = CachedStats.objects.filter(
        last_updated__lt=one_week_ago
    )
    
    for stat in old_stats:
        try:
            # Recalculate the statistics
            recalculate_user_stats.delay(stat.user_id)
        except Exception as e:
            logger.error(f"Failed to queue recalculation for user {stat.user_id}: {e}")
    
    return {
        "deleted_uploads": deleted_uploads[0],
        "refreshed_stats": old_stats.count()
    }

@shared_task
def send_inactive_user_reminders():
    """
    Send reminders to users who haven't logged workouts recently
    """
    from api.workouts.models import Workout
    from api.social.models import UserProfile
    from api.notifications.services import send_push_notification
    
    logger.info("Starting inactive user reminder task")
    
    # Find users who haven't logged a workout in 7 days
    seven_days_ago = timezone.now() - timedelta(days=7)
    
    # Get all user IDs who have logged workouts in the last 7 days
    active_user_ids = Workout.objects.filter(
        date__gte=seven_days_ago
    ).values_list('user_id', flat=True).distinct()
    
    # Find users who are inactive
    inactive_profiles = UserProfile.objects.exclude(
        user_id__in=active_user_ids
    )
    
    # Send reminders to inactive users
    for profile in inactive_profiles:
        # Get the user's last workout
        last_workout = Workout.objects.filter(
            user_id=profile.user_id
        ).order_by('-date').first()
        
        # Calculate days since last workout
        days_inactive = None
        if last_workout:
            days_inactive = (timezone.now().date() - last_workout.date.date()).days
            message = f"It's been {days_inactive} days since your last workout. Time to get moving!"
        else:
            message = "You haven't logged a workout yet. Start your fitness journey today!"
        
        # Send the notification
        send_push_notification(
            user_id=profile.user_id,
            title="Missing Your Workouts!",
            body=message,
            data={
                "type": "inactivity_reminder",
                "days_inactive": days_inactive
            }
        )
        
        logger.info(f"Sent inactivity reminder to user {profile.user_id}")
    
    return len(inactive_profiles)
```

## Deployment Considerations

### Running Scheduled Tasks in Production

#### Using Django Crontab on Traditional Servers
```sh
# Add cronjobs to system crontab
python manage.py crontab add

# Show current cronjobs
python manage.py crontab show

# Remove all cronjobs
python manage.py crontab remove
```

#### Using Celery Beat with Docker
```yaml
# docker-compose.yml example
services:
  web:
    build: .
    # ...other configurations
  
  worker:
    build: .
    command: celery -A core worker -l INFO
    depends_on:
      - redis
      - web
  
  beat:
    build: .
    command: celery -A core beat -l INFO
    depends_on:
      - redis
      - web
  
  redis:
    image: redis:6-alpine
```

### Monitoring Scheduled Tasks

#### Celery Flower for Real-time Monitoring
```python
# Install flower
# pip install flower

# Run flower
# celery -A core flower --port=5555
```

#### Logging and Alerts
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'scheduled_tasks.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'api.tasks': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

## Performance Best Practices

1. **Use database indexes** for frequently queried fields in scheduled tasks
2. **Batch processing** for operations involving many records
3. **Implement timeout handling** for long-running tasks
4. **Stagger task execution** to prevent server load spikes
5. **Use transaction management** for complex database operations
6. **Implement idempotency** to safely handle task retries
7. **Monitor memory usage** for resource-intensive tasks