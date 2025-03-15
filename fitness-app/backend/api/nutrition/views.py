from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models import FoodCategory, FoodItem, UserFoodItem, NutritionGoal, MealType, MealEntry
from .serializers import (
    FoodCategorySerializer, FoodItemSerializer, 
    UserFoodItemSerializer, FoodItemCreateSerializer,
    NutritionGoalSerializer, MealTypeSerializer, MealEntrySerializer,
    DailyNutritionSummarySerializer
)

class FoodCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for food categories
    """
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class FoodItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for food items
    """
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_verified', 'is_custom', 'brand']
    search_fields = ['name', 'brand', 'barcode']
    ordering_fields = ['name', 'calories', 'protein', 'carbs', 'fat', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Return all verified foods and user's custom foods
        """
        user_id = self.request.user.user_id
        return FoodItem.objects.filter(
            Q(is_verified=True) | Q(created_by=user_id)
        )
    
    def get_serializer_class(self):
        """
        Use different serializer for creation
        """
        if self.action == 'create':
            return FoodItemCreateSerializer
        return FoodItemSerializer
    
    def get_serializer_context(self):
        """
        Add user_id to serializer context
        """
        context = super().get_serializer_context()
        context['user_id'] = self.request.user.user_id
        return context
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search for food items by name, brand, or barcode
        """
        query = request.query_params.get('q', '')
        category = request.query_params.get('category', None)
        limit = int(request.query_params.get('limit', 20))
        
        if not query and not category:
            return Response(
                {"error": "Please provide a search query or category"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset()
        
        # Filter by category if provided
        if category:
            queryset = queryset.filter(category=category)
        
        # Search by query if provided
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(brand__icontains=query) |
                Q(barcode__icontains=query)
            )
        
        # Limit results
        queryset = queryset[:limit]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def custom(self, request):
        """
        Get all custom foods created by the user
        """
        user_id = request.user.user_id
        queryset = FoodItem.objects.filter(created_by=user_id, is_custom=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """
        Get all favorite foods for the user
        """
        user_id = request.user.user_id
        user_food_items = UserFoodItem.objects.filter(user_id=user_id, is_favorite=True)
        food_ids = user_food_items.values_list('food_item_id', flat=True)
        queryset = FoodItem.objects.filter(id__in=food_ids)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def barcode(self, request):
        """
        Search for a food item by barcode
        """
        barcode = request.query_params.get('code', '')
        if not barcode:
            return Response(
                {"error": "Please provide a barcode"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            food_item = FoodItem.objects.get(barcode=barcode)
            serializer = self.get_serializer(food_item)
            return Response(serializer.data)
        except FoodItem.DoesNotExist:
            return Response(
                {"error": "Food item not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        """
        Add a food item to favorites
        """
        user_id = request.user.user_id
        food_item = self.get_object()
        
        user_food_item, created = UserFoodItem.objects.get_or_create(
            user_id=user_id,
            food_item=food_item,
            defaults={'is_favorite': True}
        )
        
        if not created:
            user_food_item.is_favorite = True
            user_food_item.save()
        
        return Response({"status": "added to favorites"})
    
    @action(detail=True, methods=['post'])
    def unfavorite(self, request, pk=None):
        """
        Remove a food item from favorites
        """
        user_id = request.user.user_id
        food_item = self.get_object()
        
        try:
            user_food_item = UserFoodItem.objects.get(
                user_id=user_id,
                food_item=food_item
            )
            user_food_item.is_favorite = False
            user_food_item.save()
            return Response({"status": "removed from favorites"})
        except UserFoodItem.DoesNotExist:
            return Response(
                {"error": "Food item not in favorites"},
                status=status.HTTP_404_NOT_FOUND
            )

class UserFoodItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user food items
    """
    serializer_class = UserFoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.request.user.user_id
        return UserFoodItem.objects.filter(user_id=user_id)
    
    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.user_id)

class NutritionGoalViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user nutrition goals
    """
    serializer_class = NutritionGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.request.user.user_id
        return NutritionGoal.objects.filter(user_id=user_id)
    
    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.user_id)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get the current nutrition goal for the user
        """
        user_id = request.user.user_id
        try:
            goal = NutritionGoal.objects.get(user_id=user_id)
            serializer = self.get_serializer(goal)
            return Response(serializer.data)
        except NutritionGoal.DoesNotExist:
            # Create default goal if none exists
            goal = NutritionGoal.objects.create(user_id=user_id)
            serializer = self.get_serializer(goal)
            return Response(serializer.data)

class MealTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for meal types
    """
    queryset = MealType.objects.all()
    serializer_class = MealTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def seed(self, request):
        """
        Seed default meal types if none exist
        """
        if MealType.objects.count() == 0:
            meal_types = [
                {'name': 'Breakfast', 'order': 1},
                {'name': 'Lunch', 'order': 2},
                {'name': 'Dinner', 'order': 3},
                {'name': 'Snack', 'order': 4},
            ]
            for meal_type in meal_types:
                MealType.objects.create(**meal_type)
            
            return Response({"status": "Meal types seeded successfully"})
        return Response({"status": "Meal types already exist"})

class MealEntryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for meal entries
    """
    serializer_class = MealEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date', 'meal_type']
    ordering_fields = ['date', 'time', 'created_at']
    ordering = ['-date', 'time']
    
    def get_queryset(self):
        user_id = self.request.user.user_id
        return MealEntry.objects.filter(user_id=user_id)
    
    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.user_id)
    
    @action(detail=False, methods=['get'])
    def daily(self, request):
        """
        Get meal entries for a specific date
        """
        user_id = request.user.user_id
        date_str = request.query_params.get('date', None)
        
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            date = timezone.now().date()
        
        entries = MealEntry.objects.filter(user_id=user_id, date=date)
        serializer = self.get_serializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get nutrition summary for a specific date
        """
        user_id = request.user.user_id
        date_str = request.query_params.get('date', None)
        
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            date = timezone.now().date()
        
        # Get all entries for the date
        entries = MealEntry.objects.filter(user_id=user_id, date=date)
        
        # Get or create nutrition goal
        try:
            goal = NutritionGoal.objects.get(user_id=user_id)
        except NutritionGoal.DoesNotExist:
            goal = NutritionGoal.objects.create(user_id=user_id)
        
        # Calculate totals
        totals = entries.aggregate(
            total_calories=Sum('calories'),
            total_protein=Sum('protein'),
            total_carbs=Sum('carbs'),
            total_fat=Sum('fat'),
            total_fiber=Sum('fiber'),
            total_sugar=Sum('sugar'),
            total_sodium=Sum('sodium')
        )
        
        # Replace None values with 0
        for key, value in totals.items():
            if value is None:
                totals[key] = 0 if 'calories' in key else Decimal('0.0')
        
        # Calculate progress percentages
        calorie_progress = int((totals['total_calories'] / goal.calorie_target) * 100) if goal.calorie_target > 0 else 0
        protein_progress = int((totals['total_protein'] / goal.protein_target) * 100) if goal.protein_target > 0 else 0
        carbs_progress = int((totals['total_carbs'] / goal.carbs_target) * 100) if goal.carbs_target > 0 else 0
        fat_progress = int((totals['total_fat'] / goal.fat_target) * 100) if goal.fat_target > 0 else 0
        
        # Group entries by meal type
        meals = {}
        for entry in entries:
            meal_type_name = entry.meal_type.name
            if meal_type_name not in meals:
                meals[meal_type_name] = []
            meals[meal_type_name].append(entry)
        
        # Create summary data
        summary_data = {
            'date': date,
            'total_calories': totals['total_calories'],
            'total_protein': totals['total_protein'],
            'total_carbs': totals['total_carbs'],
            'total_fat': totals['total_fat'],
            'total_fiber': totals['total_fiber'],
            'total_sugar': totals['total_sugar'],
            'total_sodium': totals['total_sodium'],
            'calorie_goal': goal.calorie_target,
            'protein_goal': goal.protein_target,
            'carbs_goal': goal.carbs_target,
            'fat_goal': goal.fat_target,
            'calorie_progress': calorie_progress,
            'protein_progress': protein_progress,
            'carbs_progress': carbs_progress,
            'fat_progress': fat_progress,
            'meals': meals
        }
        
        serializer = DailyNutritionSummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def weekly(self, request):
        """
        Get nutrition summary for the past week
        """
        user_id = request.user.user_id
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=6)  # Last 7 days
        
        # Get all entries for the date range
        entries = MealEntry.objects.filter(
            user_id=user_id, 
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Group by date
        daily_data = {}
        for entry in entries:
            date_str = entry.date.strftime('%Y-%m-%d')
            if date_str not in daily_data:
                daily_data[date_str] = {
                    'date': entry.date,
                    'calories': 0,
                    'protein': Decimal('0.0'),
                    'carbs': Decimal('0.0'),
                    'fat': Decimal('0.0')
                }
            
            daily_data[date_str]['calories'] += entry.calories
            daily_data[date_str]['protein'] += entry.protein
            daily_data[date_str]['carbs'] += entry.carbs
            daily_data[date_str]['fat'] += entry.fat
        
        # Fill in missing dates
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            if date_str not in daily_data:
                daily_data[date_str] = {
                    'date': current_date,
                    'calories': 0,
                    'protein': Decimal('0.0'),
                    'carbs': Decimal('0.0'),
                    'fat': Decimal('0.0')
                }
            current_date += timedelta(days=1)
        
        # Convert to list and sort by date
        result = list(daily_data.values())
        result.sort(key=lambda x: x['date'])
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def frequently_used(self, request):
        """
        Get frequently used food items
        """
        user_id = request.user.user_id
        limit = int(request.query_params.get('limit', 10))
        
        # Get food items used in the last 30 days
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        # Count occurrences of each food item
        entries = MealEntry.objects.filter(
            user_id=user_id,
            date__gte=thirty_days_ago
        ).values('food_item').annotate(
            count=Sum('servings')
        ).order_by('-count')[:limit]
        
        # Get the food items
        food_ids = [entry['food_item'] for entry in entries]
        food_items = FoodItem.objects.filter(id__in=food_ids)
        
        # Sort by frequency
        food_dict = {str(item.id): item for item in food_items}
        result = [food_dict[str(entry['food_item'])] for entry in entries if str(entry['food_item']) in food_dict]
        
        serializer = FoodItemSerializer(result, many=True)
        return Response(serializer.data)
