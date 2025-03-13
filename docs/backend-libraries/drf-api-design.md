# Django REST Framework API Design

## Overview
Our fitness app uses Django REST Framework to build a comprehensive API that supports all core features including workout tracking, nutrition logging, social interactions, and AI-powered recommendations.

## API Structure & Design Principles

- **Resource-based URL structure**: Clear, hierarchical endpoints
- **Consistent response formats**: Standard error and success responses
- **Pagination**: For listing large datasets
- **Filtering & searching**: Powerful query capabilities
- **Versioning**: API versioning for future compatibility

## Core API Endpoints

### Workout Endpoints
```python
# api/workouts/urls.py
urlpatterns = [
    path('exercises/', ExerciseListView.as_view(), name='exercise-list'),
    path('exercises/<int:pk>/', ExerciseDetailView.as_view(), name='exercise-detail'),
    path('exercises/custom/', CustomExerciseListView.as_view(), name='custom-exercise-list'),
    
    path('workouts/', WorkoutListView.as_view(), name='workout-list'),
    path('workouts/<int:pk>/', WorkoutDetailView.as_view(), name='workout-detail'),
    path('workouts/<int:pk>/sets/', WorkoutSetListView.as_view(), name='workout-set-list'),
    
    path('templates/', WorkoutTemplateListView.as_view(), name='template-list'),
    path('templates/<int:pk>/', WorkoutTemplateDetailView.as_view(), name='template-detail'),
    
    path('progress/<slug:exercise_name>/', ExerciseProgressView.as_view(), name='exercise-progress'),
    path('streaks/', WorkoutStreakView.as_view(), name='workout-streaks'),
    path('personal-records/', PersonalRecordsView.as_view(), name='personal-records'),
]
```

### Nutrition Endpoints
```python
# api/nutrition/urls.py
urlpatterns = [
    path('foods/', FoodListView.as_view(), name='food-list'),
    path('foods/<int:pk>/', FoodDetailView.as_view(), name='food-detail'),
    path('foods/custom/', CustomFoodListView.as_view(), name='custom-food-list'),
    path('foods/barcode/<str:barcode>/', BarcodeFoodView.as_view(), name='barcode-food'),
    
    path('meals/', MealEntryListView.as_view(), name='meal-list'),
    path('meals/<int:pk>/', MealEntryDetailView.as_view(), name='meal-detail'),
    path('meals/summary/daily/<str:date>/', DailyMealSummaryView.as_view(), name='daily-meal-summary'),
    path('meals/summary/weekly/', WeeklyMealSummaryView.as_view(), name='weekly-meal-summary'),
    
    path('water/', WaterIntakeListView.as_view(), name='water-list'),
    path('water/summary/<str:date>/', WaterDailySummaryView.as_view(), name='water-summary'),
    
    path('meal-plan/', MealPlanListView.as_view(), name='meal-plan-list'),
    path('meal-plan/generate/', GenerateMealPlanView.as_view(), name='generate-meal-plan'),
]
```

### Social Endpoints
```python
# api/social/urls.py
urlpatterns = [
    path('profiles/', UserProfileListView.as_view(), name='profile-list'),
    path('profiles/<str:user_id>/', UserProfileDetailView.as_view(), name='profile-detail'),
    path('profiles/<str:user_id>/follow/', FollowUserView.as_view(), name='follow-user'),
    path('profiles/me/followers/', MyFollowersView.as_view(), name='my-followers'),
    path('profiles/me/following/', MyFollowingView.as_view(), name='my-following'),
    
    path('posts/', PostListView.as_view(), name='post-list'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/like/', LikePostView.as_view(), name='like-post'),
    path('posts/<int:pk>/comments/', CommentListView.as_view(), name='comment-list'),
    
    path('challenges/', ChallengeListView.as_view(), name='challenge-list'),
    path('challenges/<int:pk>/', ChallengeDetailView.as_view(), name='challenge-detail'),
    path('challenges/<int:pk>/join/', JoinChallengeView.as_view(), name='join-challenge'),
    path('challenges/<int:pk>/leaderboard/', ChallengLeaderboardView.as_view(), name='challenge-leaderboard'),
]
```

### AI Recommendation Endpoints
```python
# api/ai/urls.py
urlpatterns = [
    path('food/recognize/', RecognizeFoodView.as_view(), name='recognize-food'),
    path('workout/generate/', GenerateWorkoutPlanView.as_view(), name='generate-workout'),
    path('meal/generate/', GenerateMealPlanView.as_view(), name='generate-meal'),
    path('exercise/suggest/', SuggestExercisesView.as_view(), name='suggest-exercise'),
    path('insights/', UserInsightsView.as_view(), name='user-insights'),
]
```

## API Serializers

### Workout Serializers
```python
# api/workouts/serializers.py
from rest_framework import serializers
from .models import Exercise, Workout, WorkoutSet, WorkoutTemplate

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'description', 'muscle_group', 'is_cardio', 'is_custom']

class WorkoutSetSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    
    class Meta:
        model = WorkoutSet
        fields = ['id', 'exercise', 'exercise_name', 'reps', 'weight', 'duration', 
                  'distance', 'set_number']

class WorkoutSerializer(serializers.ModelSerializer):
    sets = WorkoutSetSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workout
        fields = ['id', 'name', 'date', 'duration', 'notes', 'sets']
        
    def create(self, validated_data):
        sets_data = self.context['request'].data.get('sets', [])
        workout = Workout.objects.create(**validated_data)
        
        for set_data in sets_data:
            WorkoutSet.objects.create(workout=workout, **set_data)
            
        return workout
```

## ViewSets and Views

### Filtering and Pagination
```python
# api/workouts/views.py
from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Exercise, Workout
from .serializers import ExerciseSerializer, WorkoutSerializer
from .pagination import StandardResultsSetPagination

class WorkoutListView(generics.ListCreateAPIView):
    serializer_class = WorkoutSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['date']
    search_fields = ['name', 'notes']
    ordering_fields = ['date', 'duration']
    
    def get_queryset(self):
        user_id = self.request.user.id
        return Workout.objects.filter(user_id=user_id).order_by('-date')
    
    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.id)
```

## Testing API Endpoints
```python
# api/workouts/tests.py
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Exercise, Workout

class WorkoutAPITests(APITestCase):
    def setUp(self):
        # Create test user and authenticate
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        
        # Create test exercise
        self.exercise = Exercise.objects.create(
            name='Test Exercise',
            muscle_group='Chest',
            is_cardio=False,
            is_custom=False
        )
    
    def test_create_workout(self):
        url = reverse('workout-list')
        data = {
            'name': 'Test Workout',
            'date': '2023-03-15T10:00:00Z',
            'duration': 60,
            'notes': 'Test notes',
            'sets': [
                {
                    'exercise': self.exercise.id,
                    'reps': 10,
                    'weight': 100,
                    'set_number': 1
                },
                {
                    'exercise': self.exercise.id,
                    'reps': 10,
                    'weight': 100,
                    'set_number': 2
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Workout.objects.count(), 1)
        self.assertEqual(Workout.objects.get().name, 'Test Workout')
```

## API Documentation
Our API is documented using DRF-Yasg, which provides Swagger UI for interactive API documentation.

```python
# urls.py
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Fitness App API",
      default_version='v1',
      description="API for tracking workouts, nutrition, and social interactions",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@fitnessapp.local"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # ... other url patterns
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
```

## API Versioning Strategy
We've implemented API versioning to ensure future compatibility:

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
    'DEFAULT_VERSION': 'v1',
    'ALLOWED_VERSIONS': ['v1'],
    'VERSION_PARAM': 'version',
}
```

This allows us to introduce breaking changes in the future while maintaining backward compatibility.