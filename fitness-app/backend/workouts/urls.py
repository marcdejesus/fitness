from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from . import views

# Create a router for workouts
router = routers.DefaultRouter()
router.register(r'exercises', views.ExerciseViewSet)
router.register(r'workouts', views.WorkoutViewSet, basename='workout')

# Create nested router for workout sets
workout_router = routers.NestedDefaultRouter(
    router, 
    r'workouts', 
    lookup='workout'
)
workout_router.register(
    r'sets', 
    views.WorkoutSetViewSet, 
    basename='workout-set'
)

urlpatterns = [
    path('', include(router.urls)),
    path('', include(workout_router.urls)),
]