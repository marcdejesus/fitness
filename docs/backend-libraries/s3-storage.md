# S3 Storage Integration

## Overview
Amazon S3 (Simple Storage Service) provides object storage for user-uploaded files in our fitness app, such as workout photos, profile pictures, and food images.

## Features Used in Our Fitness App

- **User Avatar Storage**: Profile pictures and avatars
- **Workout Media**: Photos and videos of workouts
- **Food Recognition Images**: Photos of meals for AI recognition
- **Workout Plan PDFs**: Generated workout plans for download
- **Before/After Progress Photos**: User transformation tracking
- **Challenge Media**: Photos and videos for fitness challenges

## Implementation Examples

### Configuration with Django Storages
```python
# settings.py
import os
from dotenv import load_dotenv

load_dotenv()

# S3 Storage Configuration
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_DEFAULT_ACL = 'public-read'
AWS_S3_SIGNATURE_VERSION = 's3v4'

# Media files location
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
MEDIA_ROOT = 'media/'

# Define custom storage classes for different types of content
class ProfilePictureStorage(S3Boto3Storage):
    location = 'media/profile_pictures'
    file_overwrite = False

class WorkoutMediaStorage(S3Boto3Storage):
    location = 'media/workout_media'
    file_overwrite = False

class FoodImageStorage(S3Boto3Storage):
    location = 'media/food_images'
    file_overwrite = True  # Overwrite temp food images
```

### Upload Service for File Handling
```python
# api/utils/storage.py
import uuid
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage
from PIL import Image
import io
import boto3
from botocore.exceptions import ClientError

def get_s3_client():
    """Get an S3 client for direct operations"""
    return boto3.client(
        's3',
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )

def upload_profile_picture(user_id, image_file):
    """
    Upload a profile picture to S3
    Resize, optimize and store in the profile_pictures directory
    """
    try:
        # Generate a unique filename
        file_ext = image_file.name.split('.')[-1]
        filename = f"{user_id}-{uuid.uuid4()}.{file_ext}"
        s3_key = f"media/profile_pictures/{filename}"
        
        # Process the image - resize and optimize
        img = Image.open(image_file)
        
        # Resize to standard profile picture size
        img.thumbnail((300, 300))
        
        # Save to memory buffer
        buffer = io.BytesIO()
        if file_ext.lower() == 'png':
            img.save(buffer, 'PNG', optimize=True)
        else:
            img.save(buffer, 'JPEG', optimize=True, quality=85)
        buffer.seek(0)
        
        # Upload to S3
        s3_client = get_s3_client()
        s3_client.upload_fileobj(
            buffer,
            settings.AWS_STORAGE_BUCKET_NAME,
            s3_key,
            ExtraArgs={
                'ContentType': f'image/{file_ext.lower()}',
                'ACL': 'public-read'
            }
        )
        
        # Return the URL to the uploaded file
        return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{s3_key}"
    except Exception as e:
        print(f"Error uploading profile picture: {e}")
        return None

def upload_food_image(user_id, image_file):
    """
    Upload a food image to S3 for AI processing
    """
    try:
        # Generate a unique filename
        file_ext = image_file.name.split('.')[-1]
        timestamp = int(time.time())
        filename = f"{user_id}-{timestamp}-{uuid.uuid4()}.{file_ext}"
        s3_key = f"media/food_images/{filename}"
        
        # Upload to S3
        s3_client = get_s3_client()
        s3_client.upload_fileobj(
            image_file,
            settings.AWS_STORAGE_BUCKET_NAME,
            s3_key,
            ExtraArgs={
                'ContentType': f'image/{file_ext.lower()}',
                'ACL': 'public-read'
            }
        )
        
        # Return the URL to the uploaded file
        return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{s3_key}"
    except Exception as e:
        print(f"Error uploading food image: {e}")
        return None
```

### Integration with Django REST Framework Views
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from api.utils.storage import upload_profile_picture
from api.social.models import UserProfile

class ProfilePictureUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response(
                {"error": "No image provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        user_id = request.user.id
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        if image_file.content_type not in allowed_types:
            return Response(
                {"error": "Only JPEG and PNG images are allowed"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {"error": "Image file size must be less than 5MB"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Upload to S3
        image_url = upload_profile_picture(user_id, image_file)
        
        if not image_url:
            return Response(
                {"error": "Failed to upload image"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Update user profile
        try:
            profile = UserProfile.objects.get(user_id=user_id)
            profile.avatar_url = image_url
            profile.save()
            
            return Response({
                "avatar_url": image_url,
                "message": "Profile picture updated successfully"
            })
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
```

### Generating Presigned URLs for Direct Uploads
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import uuid
import time

class PresignedURLView(APIView):
    """
    Generate pre-signed URLs for direct client-to-S3 uploads
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        file_type = request.data.get('file_type', '')
        content_type = request.data.get('content_type', '')
        
        if not file_type or not content_type:
            return Response(
                {"error": "File type and content type are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_id = request.user.id
        timestamp = int(time.time())
        filename = f"{user_id}-{timestamp}-{uuid.uuid4()}"
        
        # Determine S3 path based on file type
        if file_type == 'profile_picture':
            s3_key = f"media/profile_pictures/{filename}"
        elif file_type == 'workout_media':
            s3_key = f"media/workout_media/{filename}"
        elif file_type == 'food_image':
            s3_key = f"media/food_images/{filename}"
        else:
            s3_key = f"media/misc/{filename}"
        
        # Generate presigned URL
        try:
            s3_client = get_s3_client()
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': s3_key,
                    'ContentType': content_type,
                    'ACL': 'public-read'
                },
                ExpiresIn=300  # URL expires in 5 minutes
            )
            
            return Response({
                'presigned_url': presigned_url,
                'public_url': f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{s3_key}"
            })
        except ClientError as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### Direct Frontend Upload with Presigned URLs
```javascript
// Example React component using presigned URLs
import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = ({ fileType }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const uploadToS3 = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setProgress(0);
    
    try {
      // Step 1: Get a presigned URL
      const contentType = selectedFile.type;
      const presignedResponse = await axios.post('/api/storage/presigned-url', {
        file_type: fileType,
        content_type: contentType
      });
      
      const { presigned_url, public_url } = presignedResponse.data;
      
      // Step 2: Upload file directly to S3 using the presigned URL
      await axios.put(presigned_url, selectedFile, {
        headers: {
          'Content-Type': contentType
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });
      
      // Step 3: File is now uploaded, we can use the public URL
      setImageUrl(public_url);
      
      // Step 4: Notify the backend about the successful upload
      await axios.post('/api/storage/upload-complete', {
        file_type: fileType,
        file_url: public_url
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadToS3} disabled={!selectedFile || uploading}>
        Upload
      </button>
      {uploading && <div>Uploading: {progress}%</div>}
      {imageUrl && <img src={imageUrl} alt="Uploaded" width="200" />}
    </div>
  );
};

export default ImageUploader;
```

## Security Considerations
1. **Set appropriate CORS headers** to allow uploads only from your app domains
2. **Use short-lived presigned URLs** (5-15 minutes) to minimize security risks
3. **Implement server-side validation** for file types, sizes, and content
4. **Set up proper IAM roles and policies** with minimal required permissions
5. **Enable server-side encryption** for sensitive user data
6. **Implement proper bucket policies** to prevent public access where not needed

## Performance Optimization
1. **Enable CloudFront CDN** for faster media delivery worldwide
2. **Set appropriate cache headers** to optimize delivery performance
3. **Use image compression** before upload to reduce storage and bandwidth costs
4. **Implement image resizing** using AWS Lambda or at upload time for different use cases
5. **Configure lifecycle policies** to archive or delete temporary files