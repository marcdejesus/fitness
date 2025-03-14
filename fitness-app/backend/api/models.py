from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user_id = models.CharField(max_length=255, primary_key=True)
    display_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, default="")
    
    # Fitness specific fields
    fitness_level = models.CharField(
        max_length=20,
        choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), 
                ('advanced', 'Advanced')],
        default='beginner'
    )
    height = models.FloatField(null=True, blank=True)  # in cm
    weight = models.FloatField(null=True, blank=True)  # in kg
    date_of_birth = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add these properties for DRF authentication compatibility
    @property
    def is_authenticated(self):
        return True  # User is authenticated via Supabase
    
    @property
    def is_anonymous(self):
        return False
        
    def __str__(self):
        return self.email

class UserSettings(models.Model):
    user_id = models.CharField(max_length=255, unique=True)
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
    
    # Notification preferences
    notification_workouts = models.BooleanField(default=True)
    notification_nutrition = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Settings for {self.user_id}"
