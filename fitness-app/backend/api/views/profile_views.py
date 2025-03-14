from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from ..models import UserProfile, UserSettings
from ..serializers import UserProfileSerializer, UserSettingsSerializer, UserProfileCompleteSerializer

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's profile"""
        profile = get_object_or_404(UserProfile, user_id=request.user.user_id)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update current user's profile"""
        profile = get_object_or_404(UserProfile, user_id=request.user.user_id)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's settings"""
        settings, created = UserSettings.objects.get_or_create(user_id=request.user.user_id)
        serializer = UserSettingsSerializer(settings)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update current user's settings"""
        settings, created = UserSettings.objects.get_or_create(user_id=request.user.user_id)
        serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileCompleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get complete user profile with settings"""
        profile = get_object_or_404(UserProfile, user_id=request.user.user_id)
        settings, created = UserSettings.objects.get_or_create(user_id=request.user.user_id)
        
        data = {
            'profile': UserProfileSerializer(profile).data,
            'settings': UserSettingsSerializer(settings).data
        }
        
        return Response(data)