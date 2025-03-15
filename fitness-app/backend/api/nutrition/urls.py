from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FoodCategoryViewSet, FoodItemViewSet, UserFoodItemViewSet,
    NutritionGoalViewSet, MealTypeViewSet, MealEntryViewSet
)

router = DefaultRouter()
router.register(r'categories', FoodCategoryViewSet)
router.register(r'foods', FoodItemViewSet, basename='food')
router.register(r'user-foods', UserFoodItemViewSet, basename='user-food')
router.register(r'goals', NutritionGoalViewSet, basename='nutrition-goal')
router.register(r'meal-types', MealTypeViewSet, basename='meal-type')
router.register(r'meals', MealEntryViewSet, basename='meal-entry')

urlpatterns = [
    path('', include(router.urls)),
]
