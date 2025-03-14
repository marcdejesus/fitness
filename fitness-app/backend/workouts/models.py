from django.db import models
import uuid

class Exercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Muscle group categorization
    MUSCLE_GROUP_CHOICES = [
        ('chest', 'Chest'),
        ('back', 'Back'),
        ('legs', 'Legs'),
        ('shoulders', 'Shoulders'),
        ('arms', 'Arms'),
        ('core', 'Core'),
        ('full_body', 'Full Body'),
        ('cardio', 'Cardio')
    ]
    muscle_group = models.CharField(max_length=50, choices=MUSCLE_GROUP_CHOICES)
    
    # Exercise type and metadata
    is_cardio = models.BooleanField(default=False)
    is_custom = models.BooleanField(default=False)
    created_by = models.UUIDField(null=True, blank=True)
    
    # Additional metadata
    equipment_needed = models.CharField(max_length=100, blank=True)
    difficulty_level = models.IntegerField(default=1)
    illustration = models.URLField(blank=True)
    video_url = models.URLField(blank=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Workout(models.Model):
    """
    Represents a single workout session
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=255)  # Match to Supabase user_id
    name = models.CharField(max_length=100)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    duration = models.IntegerField(default=0, help_text="Duration in minutes")
    notes = models.TextField(blank=True)
    
    # Tracking fields
    calories_burned = models.IntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-start_time']
        indexes = [
            models.Index(fields=['user_id', 'date']),
        ]
    
    def __str__(self):
        return f"{self.name} on {self.date}"

class WorkoutSet(models.Model):
    """
    Represents a set within a workout
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='sets')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    set_number = models.IntegerField()
    reps = models.IntegerField()
    weight = models.FloatField(null=True, blank=True)  # in kg
    
    # For cardio exercises
    duration = models.IntegerField(null=True, blank=True, help_text="Duration in seconds")
    distance = models.FloatField(null=True, blank=True, help_text="Distance in meters")
    
    # Optional fields
    rpe = models.IntegerField(null=True, blank=True, help_text="Rate of Perceived Exertion (1-10)")
    is_warmup = models.BooleanField(default=False)
    notes = models.CharField(max_length=255, blank=True)
    
    class Meta:
        ordering = ['workout', 'exercise', 'set_number']
        unique_together = ['workout', 'exercise', 'set_number']

    def __str__(self):
        if self.weight:
            return f"{self.exercise.name}: {self.reps} at {self.weight}kg"
        else:
            return f"{self.exercise.name}: {self.reps} reps"
