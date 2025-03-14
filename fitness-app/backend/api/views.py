from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class TestAuthView(APIView):
    """Test authenticated endpoint"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'message': 'Authentication successful',
            'user_id': request.user.user_id,
            'email': request.user.email
        })
