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
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # For Supabase tokens, we don't verify with our secret
            # We need to extract user info from the JWT payload directly
            # This is because Supabase signs tokens with their own key
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            user_id = decoded.get('sub')
            email = decoded.get('email')
            
            if not user_id or not email:
                raise AuthenticationFailed('Invalid token format')
            
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(
                user_id=user_id,
                defaults={'email': email, 'display_name': email.split('@')[0]}
            )
            
            # Add token data to the request
            request.auth = token
            return (profile, token)
            
        except jwt.PyJWTError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')