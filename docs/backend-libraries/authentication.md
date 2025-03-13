# Authentication & Authorization

## Overview
Our fitness app uses a robust authentication system with JWT (JSON Web Tokens) for secure API access, integrating with Supabase for user management and supporting various authentication methods.

## Features Used in Our Fitness App

- **JWT Authentication**: Secure token-based authentication for API requests
- **Social Login**: Integration with Google, Facebook, and Apple authentication
- **Role-Based Access Control**: Different permission levels for users and trainers
- **Password Reset Flow**: Secure password recovery process
- **Account Verification**: Email verification for new accounts
- **Session Management**: Handling device sessions and token refresh
- **OAuth2 Integration**: For connecting third-party fitness services

## Implementation Examples

### JWT Authentication Setup
```python
# settings.py
from datetime import timedelta

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    # ...
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('SECRET_KEY'),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

### Authentication Views
```python
# api/auth/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import RegistrationSerializer, CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that returns user data along with tokens
    """
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(APIView):
    """
    API endpoint for user registration
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create tokens
            refresh = RefreshToken.for_user(user)
            
            # Create user profile
            from api.social.models import UserProfile
            UserProfile.objects.create(
                user_id=user.id,
                display_name=user.username,
                email=user.email
            )
            
            # Send verification email
            send_verification_email(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_verified': False
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    """
    API endpoint for user logout - blacklist the refresh token
    """
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
```

### Custom Token Serializer
```python
# api/auth/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        # Don't add sensitive info to token claims
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra responses
        from api.social.models import UserProfile
        profile = UserProfile.objects.get(user_id=self.user.id)
        
        data.update({
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'is_verified': self.user.is_active,
                'display_name': profile.display_name,
                'avatar_url': profile.avatar_url
            }
        })
        
        return data

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        return attrs
    
    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']
        )
        
        user.set_password(validated_data['password'])
        user.save()
        
        return user
```

### Password Reset
```python
# api/auth/views.py
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

class RequestPasswordResetView(APIView):
    """
    Request a password reset
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            
            # Create token
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # Build reset link
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            
            # Send email with reset link
            send_password_reset_email(user, reset_link)
            
            return Response(
                {"message": "Password reset email has been sent."},
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            # Don't reveal that the user doesn't exist
            return Response(
                {"message": "Password reset email has been sent."},
                status=status.HTTP_200_OK
            )
        
class PasswordResetConfirmView(APIView):
    """
    Confirm password reset and set new password
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not uid or not token or not new_password:
            return Response(
                {"error": "Invalid data provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Decode user id
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Check if token is valid
            if not default_token_generator.check_token(user, token):
                return Response(
                    {"error": "Invalid or expired reset link"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Invalidate all existing tokens
            try:
                OutstandingToken.objects.filter(user_id=user.id).delete()
            except:
                pass
            
            return Response(
                {"message": "Password has been reset successfully."},
                status=status.HTTP_200_OK
            )
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset link"},
                status=status.HTTP_400_BAD_REQUEST
            )
```

### Email Verification
```python
# api/auth/views.py
def send_verification_email(user):
    """
    Send verification email to newly registered user
    """
    # Create token
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    
    # Build verification link
    verification_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"
    
    # Send email
    send_mail(
        'Verify your email address',
        f'Please click the link to verify your email address: {verification_link}',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

class VerifyEmailView(APIView):
    """
    Verify user's email address
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        
        if not uid or not token:
            return Response(
                {"error": "Invalid data provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Decode user id
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Check if token is valid
            if not default_token_generator.check_token(user, token):
                return Response(
                    {"error": "Invalid or expired verification link"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark user as verified
            user.is_active = True
            user.save()
            
            return Response(
                {"message": "Email verified successfully."},
                status=status.HTTP_200_OK
            )
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid verification link"},
                status=status.HTTP_400_BAD_REQUEST
            )
```

### Social Authentication
```python
# api/auth/views.py
class GoogleLoginView(APIView):
    """
    Authenticate with Google OAuth
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response(
                {"error": "Google token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify the token with Google
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests
            
            google_user_info = google_id_token.verify_oauth2_token(
                id_token, 
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            
            # Get or create user based on email
            email = google_user_info.get('email')
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Create new user
                username = email.split('@')[0]
                base_username = username
                counter = 1
                
                # Ensure username is unique
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create(
                    username=username,
                    email=email,
                    is_active=True  # Google has already verified the email
                )
                
                # Create user profile
                profile_data = {
                    'user_id': user.id,
                    'display_name': google_user_info.get('name', username),
                    'email': email
                }
                
                if 'picture' in google_user_info:
                    profile_data['avatar_url'] = google_user_info['picture']
                
                from api.social.models import UserProfile
                UserProfile.objects.create(**profile_data)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_verified': user.is_active
                }
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
```

### API Authentication Middleware
```python
# api/middleware.py
from django.utils.functional import SimpleLazyObject
from rest_framework_simplejwt.authentication import JWTAuthentication

def get_user(request):
    """
    Get the user from JWT token in request
    """
    jwt_auth = JWTAuthentication()
    
    try:
        # Extract HTTP Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header:
            # Authenticate with JWT
            auth = jwt_auth.authenticate(request)
            if auth:
                user, token = auth
                return user
    except:
        pass
    
    return None

class JWTAuthenticationMiddleware:
    """
    Middleware to authenticate requests with JWT
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Attach user to request
        request.user = SimpleLazyObject(lambda: get_user(request))
        
        # Continue with request processing
        return self.get_response(request)
```

### Role-Based Permissions
```python
# api/permissions.py
from rest_framework import permissions

class IsTrainer(permissions.BasePermission):
    """
    Permission to only allow trainers to access certain views
    """
    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, 'profile') and 
                   request.user.profile.user_type == 'trainer')

class IsVerifiedUser(permissions.BasePermission):
    """
    Permission to only allow verified users
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)
```

### URL Configuration
```python
# urls.py
from django.urls import path
from api.auth.views import (
    CustomTokenObtainPairView, RegisterView, LogoutView,
    RequestPasswordResetView, PasswordResetConfirmView,
    VerifyEmailView, GoogleLoginView
)

urlpatterns = [
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/password-reset/', RequestPasswordResetView.as_view(), name='password_reset'),
    path('api/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('api/verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('api/social/google/', GoogleLoginView.as_view(), name='google_login'),
]
```

## Supabase Integration
When using Supabase for authentication, we can replace Django's auth system with Supabase's JWT verification:

```python
# api/auth/supabase.py
import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Authentication using Supabase JWT tokens
    """
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # Verify JWT token using Supabase JWT secret
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET,
                algorithms=['HS256']
            )
            
            user_id = payload.get('sub')
            if not user_id:
                raise AuthenticationFailed('Invalid token')
            
            # Get or create user in local database if needed
            from api.social.models import UserProfile
            try:
                profile = UserProfile.objects.get(user_id=user_id)
            except UserProfile.DoesNotExist:
                # Create minimal profile if user exists in Supabase but not in our DB
                profile = UserProfile.objects.create(
                    user_id=user_id,
                    email=payload.get('email', ''),
                    display_name=payload.get('email', '').split('@')[0]
                )
            
            return (profile, token)
            
        except jwt.PyJWTError:
            return None
```

## Security Best Practices

1. **Token Management**:
   - Keep access tokens short-lived (1 hour or less)
   - Use refresh tokens with rotation for persistent sessions
   - Securely store tokens in HttpOnly cookies or secure storage on mobile

2. **Request Protection**:
   - Implement CSRF protection for web applications
   - Use API rate limiting to prevent abuse
   - Validate all input data to prevent injection attacks

3. **Authentication Hardening**:
   - Enforce strong password policies
   - Implement multi-factor authentication for sensitive operations
   - Use secure password recovery flows

4. **Session Management**:
   - Allow users to view and terminate active sessions
   - Implement automatic session timeout for inactive users
   - Track suspicious login attempts

5. **OAuth Security**:
   - Validate OAuth state parameters to prevent CSRF
   - Verify redirect URIs against allowed list
   - Securely store OAuth secrets outside of version control