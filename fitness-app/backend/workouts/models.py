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
