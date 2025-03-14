from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny

@method_decorator(csrf_exempt, name='dispatch')
class SignUpView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        from ..serializers import UserSerializer
        import traceback  # Add this import
        
        try:
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                try:
                    user = serializer.save()
                    if user:
                        try:
                            token = Token.objects.create(user=user)
                            return Response({
                                'user': {
                                    'id': user.id,
                                    'email': user.email,
                                    'display_name': user.first_name,
                                    'avatar_url': None,
                                },
                                'token': token.key
                            }, status=status.HTTP_201_CREATED)
                        except Exception as e:
                            # If token creation fails, log the error and return it
                            print(f"Token creation error: {str(e)}")
                            return Response({
                                'error': f"Failed to create authentication token: {str(e)}"
                            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                except Exception as e:
                    # If saving the user fails, log the error and return it
                    print(f"User save error: {str(e)}")
                    print(traceback.format_exc())  # Print the full traceback
                    return Response({
                        'error': f"Failed to save user: {str(e)}"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Catch any other exceptions
            print(f"Unexpected error in SignUpView: {str(e)}")
            print(traceback.format_exc())  # Print the full traceback
            return Response({
                'error': f"An unexpected error occurred: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class SignInView(APIView):
    permission_classes = [AllowAny]  # Add this line to allow anyone to sign in
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = authenticate(username=user.username, password=password)
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'display_name': user.first_name,
                    'avatar_url': None,
                },
                'token': token.key
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class CurrentUserView(APIView):
    def get(self, request):
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            user = token.user
            return Response({
                'id': user.id,
                'email': user.email,
                'display_name': user.first_name,
                'avatar_url': None,
            })
        except Token.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)