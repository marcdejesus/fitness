from django.conf import settings
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import json

from api.models import UserProfile
from api.auth.serializers import (
    RegistrationSerializer, TokenSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from core.settings import supabase_client  # Add this import

class RegisterView(APIView):
    """Register a new user with Supabase"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        display_name = serializer.validated_data.get('display_name', '')
        
        try:
            # Register user with Supabase - use the imported client directly
            response = supabase_client.auth.sign_up({  # Change here
                "email": email,
                "password": password,
            })
            
            # Create user profile in our database
            if response.user:
                UserProfile.objects.create(
                    user_id=response.user.id,
                    display_name=display_name or email.split('@')[0],
                    email=email
                )
            
            return Response({
                'user_id': response.user.id,
                'message': 'User created successfully'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Login with Supabase and get JWT token"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = TokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            # Sign in with Supabase - use the imported client directly
            response = supabase_client.auth.sign_in_with_password({  # Change here
                "email": email,
                "password": password,
            })
            
            # Get user profile
            try:
                profile = UserProfile.objects.get(user_id=response.user.id)
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(
                    user_id=response.user.id,
                    email=email,
                    display_name=email.split('@')[0]
                )
            
            return Response({
                'access_token': response.session.access_token,
                'refresh_token': response.session.refresh_token,
                'user': {
                    'id': response.user.id,
                    'email': response.user.email,
                    'display_name': profile.display_name,
                    'avatar_url': profile.avatar_url
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class RequestPasswordResetView(APIView):
    """Request password reset email"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        email = serializer.validated_data['email']
        
        try:
            # Request password reset with Supabase - use the imported client directly
            supabase_client.auth.reset_password_for_email(email)  # Change here
            
            return Response({
                'message': 'Password reset email sent. Check your inbox.'
            })
        except Exception as e:
            # Always return success for security reasons
            return Response({
                'message': 'If your email is registered, you will receive a password reset link.'
            })


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # This would need to be implemented with Supabase's password reset flow
        # Usually handled via redirects on the frontend
        return Response({
            'message': 'Please complete the password reset via the link sent to your email.'
        })