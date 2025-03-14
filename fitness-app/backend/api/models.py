from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user_id = models.CharField(max_length=255, primary_key=True)
    display_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    avatar_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.email
