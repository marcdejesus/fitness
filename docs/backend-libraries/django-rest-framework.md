# Django REST Framework

## Overview
Django REST Framework (DRF) is a powerful toolkit for building Web APIs in Django applications, offering features like serialization, authentication, and viewsets that streamline API development.

## Features Used in Our Fitness App

- **ModelViewSets**: Creating CRUD endpoints for workout, nutrition, and user data
- **Serializers**: Converting complex data types (like Django models) to native Python datatypes
- **Authentication**: JWT authentication for secure API access
- **Permissions**: Fine-grained access control for resources
- **Filtering & Pagination**: Managing large datasets efficiently
- **Nested Resources**: Handling related resources (like workouts and their sets)
- **Validation**: Ensuring data integrity with custom validators

## Implementation Examples

### API Structure
```python
# Core API structure for our fitness app
urlpatterns = [
    path('api/workouts/', include('api.workouts.urls')),
    path('api/nutrition/', include('api.nutrition.urls')),
    path('api/social/', include('api.social.urls')),
    path('api/ai/', include('api.ai.urls')),
    path('api/analytics/', include('api.analytics.urls')),
    path('api/wearables/', include('api.wearables.urls')),
]
```

### ModelViewSet for Workouts
```python
from rest_framework import viewsets, permissions
from .models import Workout, WorkoutSet
from .serializers import WorkoutSerializer, WorkoutSetSerializer
from .permissions import IsOwnerOrReadOnly

class WorkoutViewSet(viewsets.ModelViewSet):
    """
    CRUD API for workouts
    """
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Workout.objects.filter(user_id=user_id)
        return Workout.objects.filter(user_id=self.request.user.id)
    
    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.id)
```

### Nested Serializers for Related Data
```python
from rest_framework import serializers
from .models import Workout, WorkoutSet, Exercise

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'description', 'muscle_group', 'is_cardio']

class WorkoutSetSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    exercise_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = WorkoutSet
        fields = ['id', 'exercise', 'exercise_id', 'reps', 'weight', 
                  'duration', 'distance', 'set_number']

class WorkoutSerializer(serializers.ModelSerializer):
    sets = WorkoutSetSerializer(many=True, read_only=False)
    
    class Meta:
        model = Workout
        fields = ['id', 'name', 'date', 'duration', 'notes', 'sets']
        read_only_fields = ['user_id']
    
    def create(self, validated_data):
        sets_data = validated_data.pop('sets', [])
        workout = Workout.objects.create(**validated_data)
        
        for set_data in sets_data:
            WorkoutSet.objects.create(workout=workout, **set_data)
        
        return workout
```

### Custom Permission Classes
```python
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the owner
        return obj.user_id == request.user.id
```

### Filtering and Pagination
```python
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class NutritionEntryViewSet(viewsets.ModelViewSet):
    serializer_class = MealEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['date', 'meal_type']
    search_fields = ['food__name']
    ordering_fields = ['date', 'time']
```

## API Documentation with drf-yasg
```python
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Fitness API",
        default_version='v1',
        description="API for fitness tracking app",
        contact=openapi.Contact(email="contact@fitnessapp.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # API docs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # API endpoints
    path('api/', include('api.urls')),
]
```

## Performance Optimizations
- Using `select_related()` and `prefetch_related()` to reduce database queries
- Implementing caching for frequently accessed endpoints
- Using DRF's throttling to limit API requests
- Optimizing serializers with custom `.to_representation()` methods