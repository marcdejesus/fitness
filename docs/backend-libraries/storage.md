# Storage & File Management

## Overview
Our fitness app requires robust file storage capabilities for user uploads including profile pictures, workout videos, food images, and more. We utilize Django's storage framework with cloud storage integration for scalability.

## Storage Requirements

- **User Media**: Profile pictures, workout photos/videos
- **Food Images**: For nutrition tracking and AI recognition
- **Exercise Demonstrations**: Instructional content
- **Workout Tracking Videos**: For form analysis
- **Temporary Storage**: For processing and analysis
- **Document Storage**: PDFs for workout plans and meal guides

## Implementation

### Storage Configuration
```python
# settings.py
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Local storage for development
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Different storage backends based on environment
if os.environ.get('USE_S3', 'False') == 'True':
    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    
    # S3 Static settings
    STATIC_LOCATION = 'static'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{STATIC_LOCATION}/'
    STATICFILES_STORAGE = 'api.storage_backends.StaticStorage'
    
    # S3 Media settings
    PUBLIC_MEDIA_LOCATION = 'media/public'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{PUBLIC_MEDIA_LOCATION}/'
    DEFAULT_FILE_STORAGE = 'api.storage_backends.PublicMediaStorage'
    
    # Private media files
    PRIVATE_MEDIA_LOCATION = 'media/private'
    PRIVATE_FILE_STORAGE = 'api.storage_backends.PrivateMediaStorage'
```

### Custom Storage Classes
```python
# api/storage_backends.py
from storages.backends.s3boto3 import S3Boto3Storage
from django.conf import settings

class StaticStorage(S3Boto3Storage):
    location = settings.STATIC_LOCATION
    default_acl = 'public-read'

class PublicMediaStorage(S3Boto3Storage):
    location = settings.PUBLIC_MEDIA_LOCATION
    file_overwrite = False
    default_acl = 'public-read'

class PrivateMediaStorage(S3Boto3Storage):
    location = settings.PRIVATE_MEDIA_LOCATION
    default_acl = 'private'
    file_overwrite = False
    custom_domain = False
```

### File Upload Models
```python
# api/social/models.py
from django.db import models
from api.storage_backends import PublicMediaStorage, PrivateMediaStorage

def user_profile_image_path(instance, filename):
    """Generate file path for user profile images"""
    # File will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return f'user_{instance.user_id}/profile/{filename}'

def workout_media_path(instance, filename):
    """Generate file path for workout media"""
    return f'user_{instance.workout.user_id}/workouts/{instance.workout.id}/{filename}'

def food_image_path(instance, filename):
    """Generate file path for food images"""
    return f'user_{instance.user_id}/nutrition/{instance.date.strftime("%Y%m%d")}/{filename}'

class UserProfileImage(models.Model):
    user_id = models.UUIDField()
    image = models.ImageField(
        storage=PublicMediaStorage(), 
        upload_to=user_profile_image_path
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Profile image for user {self.user_id}"

class WorkoutMedia(models.Model):
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
    )
    
    workout = models.ForeignKey('workouts.Workout', on_delete=models.CASCADE, related_name='media')
    file = models.FileField(
        storage=PublicMediaStorage(),
        upload_to=workout_media_path
    )
    media_type = models.CharField(max_length=5, choices=MEDIA_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.media_type} for workout {self.workout.id}"

class FoodImage(models.Model):
    user_id = models.UUIDField()
    meal_entry = models.ForeignKey('nutrition.MealEntry', on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(
        storage=PublicMediaStorage(),
        upload_to=food_image_path
    )
    created_at = models.DateTimeField(auto_now_add=True)
    ai_processed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Food image for meal on {self.meal_entry.date}"
```

### Handling File Uploads in Views
```python
# api/social/views.py
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class ProfileImageUploadView(APIView):
    """
    View for uploading profile images
    """
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, format=None):
        user_id = request.user.id  # Assuming user is authenticated
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle file upload
        image_file = request.FILES['image']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Please upload a JPEG or PNG image.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Limit file size (e.g., 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Image size too large. Maximum allowed size is 5MB.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new profile image
        profile_image = UserProfileImage(user_id=user_id, image=image_file)
        profile_image.save()
        
        # Update user profile with new image URL
        from api.social.models import UserProfile
        try:
            profile = UserProfile.objects.get(user_id=user_id)
            profile.avatar_url = profile_image.image.url
            profile.save(update_fields=['avatar_url'])
        except UserProfile.DoesNotExist:
            pass
        
        return Response(
            {'image_url': profile_image.image.url}, 
            status=status.HTTP_201_CREATED
        )
```

### File Upload Views
```python
# api/social/views.py
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import UserProfile
from .serializers import UserProfileSerializer

class ProfilePictureUploadView(generics.UpdateAPIView):
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        return UserProfile.objects.get(user_id=self.request.user.id)
        
    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        
        # Check if there's an existing avatar to delete
        if profile.avatar:
            profile.avatar.delete(save=False)
            
        profile.avatar = request.FILES.get('avatar')
        profile.save()
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
```

### Temporary File Handling
```python
import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage

def handle_uploaded_food_image(image_file):
    """
    Handle uploaded food image for AI processing
    Stores in temporary location, processes, then moves to permanent storage
    """
    # Generate unique filename
    ext = os.path.splitext(image_file.name)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    
    # Define temporary path
    temp_path = os.path.join('temp', unique_filename)
    
    # Save to temporary storage
    path = default_storage.save(temp_path, image_file)
    
    # Get the full URL
    if settings.USE_S3 == 'True':
        # For S3
        url = default_storage.url(path)
    else:
        # For local development
        url = os.path.join(settings.MEDIA_URL, path)
    
    return {
        'path': path,
        'url': url,
        'filename': unique_filename
    }

def cleanup_temp_files():
    """
    Cleanup temporary files older than 24 hours
    This should be run as a scheduled task
    """
    import time
    from datetime import datetime, timedelta
    
    temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
    cutoff_time = datetime.now() - timedelta(hours=24)
    
    # For local storage
    if not settings.USE_S3:
        if os.path.exists(temp_dir):
            for filename in os.listdir(temp_dir):
                filepath = os.path.join(temp_dir, filename)
                file_modified = datetime.fromtimestamp(os.path.getmtime(filepath))
                if file_modified < cutoff_time:
                    os.remove(filepath)
    else:
        # For S3 storage
        import boto3
        s3 = boto3.resource('s3')
        bucket = s3.Bucket(settings.AWS_STORAGE_BUCKET_NAME)
        
        for obj in bucket.objects.filter(Prefix='temp/'):
            if obj.last_modified.replace(tzinfo=None) < cutoff_time:
                obj.delete()
```

### Food Image Processing for AI Analysis
```python
# api/nutrition/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from api.ai.tasks import process_food_image

class FoodImageRecognitionView(APIView):
    """
    Upload food image for AI recognition
    """
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response(
                {"error": "No image provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_id = request.user.id
        image = request.FILES['image']
        
        # Handle uploaded file
        file_info = handle_uploaded_food_image(image)
        
        # Process with Celery task
        task = process_food_image.delay(file_info['path'], user_id)
        
        return Response({
            'task_id': task.id,
            'status': 'Processing',
            'image_url': file_info['url']
        }, status=status.HTTP_202_ACCEPTED)
```

### Serving Private Files
```python
# api/workouts/views.py
from django.http import HttpResponse, Http404
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import WorkoutMedia
import boto3
import botocore

class PrivateMediaView(APIView):
    """
    Serve private media files with authentication check
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, media_id):
        try:
            media = WorkoutMedia.objects.get(id=media_id)
            workout = media.workout
            
            # Check if user has access to this media
            if str(workout.user_id) != str(request.user.id):
                # Check if user is a trainer for this user or a friend
                from api.social.models import FriendRelation
                is_friend = FriendRelation.objects.filter(
                    user_id=workout.user_id,
                    friend_id=request.user.id
                ).exists()
                
                if not is_friend:
                    raise Http404("You don't have permission to access this file")
            
            if settings.USE_S3:
                # For S3 stored files
                s3 = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
                )
                
                # Generate a presigned URL that expires in 60 seconds
                url = s3.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                        'Key': media.file.name
                    },
                    ExpiresIn=60
                )
                
                # Redirect to the presigned URL
                return HttpResponse(status=302, headers={'Location': url})
            else:
                # For local development, serve the file directly
                response = HttpResponse()
                response['X-Accel-Redirect'] = f'/protected-media/{media.file.name}'
                response['Content-Type'] = ''  # Nginx will set this
                return response
                
        except WorkoutMedia.DoesNotExist:
            raise Http404("Media file not found")
        except Exception as e:
            raise Http404(f"Error accessing media: {str(e)}")
```

### Image Processing and Optimization
```python
# api/utils/image_processors.py
from PIL import Image, ExifTags
from io import BytesIO
from django.core.files.base import ContentFile
import os

def optimize_image(image_field):
    """
    Optimize an image by:
    1. Resizing if too large
    2. Compressing quality
    3. Fixing orientation based on EXIF data
    4. Converting to JPEG if needed
    """
    if not image_field or not hasattr(image_field, 'path'):
        return image_field
        
    try:
        img = Image.open(image_field.path)
        
        # Fix orientation based on EXIF data
        try:
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
                    
            exif = dict(img._getexif().items())
            
            if exif[orientation] == 2:
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            elif exif[orientation] == 3:
                img = img.rotate(180)
            elif exif[orientation] == 4:
                img = img.transpose(Image.FLIP_TOP_BOTTOM)
            elif exif[orientation] == 5:
                img = img.transpose(Image.FLIP_LEFT_RIGHT).rotate(90)
            elif exif[orientation] == 6:
                img = img.rotate(-90)
            elif exif[orientation] == 7:
                img = img.transpose(Image.FLIP_LEFT_RIGHT).rotate(-90)
            elif exif[orientation] == 8:
                img = img.rotate(90)
        except (AttributeError, KeyError, IndexError):
            # No EXIF data or orientation data
            pass
            
        # Resize large images
        max_size = (1200, 1200)
        if img.height > max_size[1] or img.width > max_size[0]:
            img.thumbnail(max_size, Image.LANCZOS)
            
        # Convert to RGB if needed (e.g., for PNGs with transparency)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Save the optimized image
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        
        # Save back to the model
        file_name = os.path.splitext(os.path.basename(image_field.name))[0] + '.jpg'
        image_field.save(
            file_name,
            ContentFile(buffer.getvalue()),
            save=False
        )
        
    except Exception as e:
        print(f"Image optimization error: {e}")
        
    return image_field
```

### File Upload URL Configuration
```python
# urls.py
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from api.social.views import ProfilePictureUploadView
from api.nutrition.views import FoodImageRecognitionView
from api.workouts.views import PrivateMediaView

urlpatterns = [
    # File upload endpoints
    path('api/profile/upload-picture/', ProfilePictureUploadView.as_view(), name='upload_profile_picture'),
    path('api/nutrition/food-recognition/', FoodImageRecognitionView.as_view(), name='food_image_recognition'),
    path('api/workouts/media/<int:media_id>/', PrivateMediaView.as_view(), name='workout_media'),
]

# Add media serving for development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Nginx Configuration for Production
When deploying to production, it's important to configure Nginx to serve media files efficiently:

```nginx
# Nginx configuration for protected media files
location /protected-media/ {
    internal;
    alias /path/to/media/private/;
}

# For public media
location /media/ {
    alias /path/to/media/public/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}

# For static files
location /static/ {
    alias /path/to/static/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}
```

## Best Practices

### Security Considerations
1. **Use private storage** for sensitive user data like workout videos
2. **Generate pre-signed URLs** for temporary access to private files
3. **Validate file types** to prevent malicious uploads
4. **Implement access controls** based on file ownership
5. **Set appropriate file size limits** to prevent abuse

### Performance Optimization
1. **Use a CDN** for serving static assets and public media
2. **Implement image optimization** to reduce file sizes
3. **Use lazy loading** for images and videos in the frontend
4. **Set appropriate cache headers** for static content
5. **Implement video transcoding** for different qualities and formats

### Storage Organization
1. **Use consistent naming conventions** for files and directories
2. **Organize files by user and content type** for easier management
3. **Implement regular cleanup tasks** for temporary files
4. **Use versioning** when appropriate (e.g., for workout plans)
5. **Keep sensitive and non-sensitive data separated** in different storage buckets

## Mobile Considerations
For the React Native mobile app, additional considerations include:

1. **Local caching** of frequently accessed images
2. **Progressive loading** for large media files
3. **Offline storage** for user-generated content
4. **Upload resume capability** for unstable connections
5. **Image compression** on device before upload

### React Native Implementation Example
```javascript
// Example of image upload from React Native with compression
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import api from '../api';

async function uploadFoodImage(imageUri) {
  try {
    // First compress the image
    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      1200,  // max width
      1200,  // max height
      'JPEG',
      85,    // quality
      0,     // rotation
      null,  // output path (null = temp file)
      false  // keep metadata
    );
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('image', {
      uri: Platform.OS === 'android' ? resizedImage.uri : resizedImage.uri.replace('file://', ''),
      type: 'image/jpeg',
      name: 'food-image.jpg',
    });
    
    // Upload to server
    const response = await api.post('/nutrition/food-recognition/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.loaded / progressEvent.total;
        console.log(`Upload progress: ${Math.round(progress * 100)}%`);
      },
    });
    
    // Clean up temp file
    await RNFS.unlink(resizedImage.uri);
    
    return response.data;
  } catch (error) {
    console.error('Error uploading food image:', error);
    throw error;
  }
}

// Example of image caching implementation
import FastImage from 'react-native-fast-image';

function CachedProfileImage({ uri, size }) {
  return (
    <FastImage
      style={{ width: size, height: size, borderRadius: size / 2 }}
      source={{
        uri: uri,
        // Cache control
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable,
      }}
      resizeMode={FastImage.resizeMode.cover}
    />
  );
}
```

By following these practices, our fitness app can efficiently manage the various types of media and files required for a rich user experience while maintaining security and performance.