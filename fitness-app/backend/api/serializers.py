from rest_framework import serializers
from .models import UserProfile, UserSettings
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source='first_name')
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'display_name', 'password')
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        first_name = validated_data.pop('first_name', '')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        # Check if user with this email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists.'})
        
        # Use email as username as well
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user_id', 'email', 'created_at', 'updated_at']

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = '__all__'
        read_only_fields = ['user_id', 'created_at', 'updated_at']

class UserProfileCompleteSerializer(serializers.Serializer):
    profile = UserProfileSerializer()
    settings = UserSettingsSerializer()