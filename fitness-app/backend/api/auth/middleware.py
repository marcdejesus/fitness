import jwt
import json
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from api.models import UserProfile

class SupabaseAuthentication(authentication.BaseAuthentication):
    """Authentication using Supabase JWT tokens"""
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        # Check for both Bearer and Token formats
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            token_type = 'Bearer'
        elif auth_header.startswith('Token '):
            token = auth_header.split(' ')[1]
            token_type = 'Token'
        else:
            # No auth header or unsupported format
            return None
        
        try:
            # For Supabase tokens, we don't verify with our secret
            # We need to extract user info from the JWT payload directly
            # This is because Supabase signs tokens with their own key
            try:
                # First try to decode as JWT
                decoded = jwt.decode(token, options={"verify_signature": False})
                
                user_id = decoded.get('sub')
                email = decoded.get('email')
                
                if not user_id or not email:
                    raise AuthenticationFailed('Invalid token format: missing user_id or email')
            except jwt.PyJWTError as jwt_error:
                # If JWT decoding fails, try to handle as a simple token
                # This is a fallback for non-JWT tokens
                if token_type == 'Token':
                    # For simple tokens, extract user ID from the token
                    # Assuming the token format is: user_id:random_string or just the user_id
                    user_id = token.split(':')[0] if ':' in token else token
                    email = f'{user_id}@example.com'
                else:
                    # If it's a Bearer token but not a valid JWT, that's an error
                    raise AuthenticationFailed(f'Invalid JWT token: {str(jwt_error)}')
            
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(
                user_id=user_id,
                defaults={'email': email, 'display_name': email.split('@')[0]}
            )
            
            # Add user_id to the request for easy access
            request.user_id = user_id
            
            # Add token data to the request
            request.auth = token
            return (profile, token)
            
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            raise AuthenticationFailed(f'Authentication failed: {str(e)}')


class SimpleTokenAuthentication(authentication.BaseAuthentication):
    """Simple token-based authentication for development and testing"""
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Token '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # Extract user ID from the token
            # For a simple implementation, we'll use the token itself as the user ID
            # In a real app, you would validate this token against your database
            
            # For development purposes, we'll extract a user ID from the token
            # Assuming the token format is: user_id:random_string or just the user_id
            user_id = token.split(':')[0] if ':' in token else token
            
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(
                user_id=user_id,
                defaults={
                    'email': f'{user_id}@example.com',
                    'display_name': f'User {user_id}'
                }
            )
            
            # Add user_id to the request for easy access
            request.user_id = user_id
            
            return (profile, token)
            
        except Exception as e:
            print(f"SimpleTokenAuthentication error: {str(e)}")
            raise AuthenticationFailed(f'Authentication failed: {str(e)}')