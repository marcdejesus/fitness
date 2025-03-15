from rest_framework import serializers
from .models import FoodCategory, FoodItem, UserFoodItem, NutritionGoal, MealType, MealEntry

class FoodCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodCategory
        fields = '__all__'

class FoodItemSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FoodItem
        fields = '__all__'
    
    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

class FoodItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = '__all__'
        read_only_fields = ['is_verified', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Mark as custom food and set created_by to current user
        validated_data['is_custom'] = True
        validated_data['created_by'] = self.context['request'].user.user_id
        return super().create(validated_data)

class UserFoodItemSerializer(serializers.ModelSerializer):
    food_item_details = FoodItemSerializer(source='food_item', read_only=True)
    
    class Meta:
        model = UserFoodItem
        fields = '__all__'
        read_only_fields = ['user_id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set user_id to current user
        validated_data['user_id'] = self.context['request'].user.user_id
        return super().create(validated_data)

class NutritionGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionGoal
        fields = '__all__'
        read_only_fields = ['user_id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set user_id to current user
        validated_data['user_id'] = self.context['request'].user.user_id
        return super().create(validated_data)

class MealTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealType
        fields = '__all__'

class MealEntrySerializer(serializers.ModelSerializer):
    food_item_details = FoodItemSerializer(source='food_item', read_only=True)
    meal_type_name = serializers.CharField(source='meal_type.name', read_only=True)
    
    class Meta:
        model = MealEntry
        fields = '__all__'
        read_only_fields = ['user_id', 'calories', 'protein', 'carbs', 'fat', 
                           'fiber', 'sugar', 'sodium', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set user_id to current user
        validated_data['user_id'] = self.context['request'].user.user_id
        return super().create(validated_data)

class DailyNutritionSummarySerializer(serializers.Serializer):
    date = serializers.DateField()
    total_calories = serializers.IntegerField()
    total_protein = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_carbs = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_fat = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_fiber = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_sugar = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_sodium = serializers.DecimalField(max_digits=8, decimal_places=2)
    
    # Goal progress
    calorie_goal = serializers.IntegerField()
    protein_goal = serializers.DecimalField(max_digits=8, decimal_places=2)
    carbs_goal = serializers.DecimalField(max_digits=8, decimal_places=2)
    fat_goal = serializers.DecimalField(max_digits=8, decimal_places=2)
    
    # Progress percentages
    calorie_progress = serializers.IntegerField()
    protein_progress = serializers.IntegerField()
    carbs_progress = serializers.IntegerField()
    fat_progress = serializers.IntegerField()
    
    # Meal breakdowns
    meals = serializers.DictField(child=serializers.ListField(child=MealEntrySerializer()))
