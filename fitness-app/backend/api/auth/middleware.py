import jwt
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
            # Verify JWT token using Supabase JWT secret
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET,
                algorithms=['HS256']
            )
            
            user_id = payload.get('sub')
            if not user_id:
                raise AuthenticationFailed('Invalid token')
            
            # Get or create user profile
            try:
                profile = UserProfile.objects.get(user_id=user_id)
            except UserProfile.DoesNotExist:
                raise AuthenticationFailed('User not found')
            
            return (profile, token)
            
        except jwt.PyJWTError:
            raise AuthenticationFailed('Invalid token')