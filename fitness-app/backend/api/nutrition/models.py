import uuid
from django.db import models
from django.utils import timezone

class FoodCategory(models.Model):
    """
    Categories for food items (e.g., Fruits, Vegetables, Proteins, etc.)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name_plural = "Food Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class FoodItem(models.Model):
    """
    Represents a food item in the database with nutritional information
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=200, blank=True)
    category = models.ForeignKey(FoodCategory, on_delete=models.SET_NULL, null=True, related_name='food_items')
    
    # Serving information
    serving_size = models.DecimalField(max_digits=8, decimal_places=2)
    serving_unit = models.CharField(max_length=50)  # g, ml, oz, etc.
    
    # Nutritional information (per serving)
    calories = models.IntegerField()
    protein = models.DecimalField(max_digits=8, decimal_places=2)  # in grams
    carbs = models.DecimalField(max_digits=8, decimal_places=2)  # in grams
    fat = models.DecimalField(max_digits=8, decimal_places=2)  # in grams
    fiber = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # in grams
    sugar = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # in grams
    sodium = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # in mg
    
    # Metadata
    is_verified = models.BooleanField(default=False)  # Verified by admin
    is_custom = models.BooleanField(default=False)  # User-created food
    created_by = models.CharField(max_length=255, null=True, blank=True)  # User ID who created it
    barcode = models.CharField(max_length=100, blank=True)  # UPC/EAN barcode
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['barcode']),
        ]
    
    def __str__(self):
        if self.brand:
            return f"{self.name} ({self.brand})"
        return self.name

class UserFoodItem(models.Model):
    """
    Custom food items created by users
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=255)  # Match to user ID
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='user_foods')
    is_favorite = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user_id', 'food_item']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.food_item.name} - {self.user_id}"

class NutritionGoal(models.Model):
    """
    User's nutrition goals for daily intake
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=255, unique=True)  # Match to user ID
    
    # Daily targets
    calorie_target = models.IntegerField(default=2000)
    protein_target = models.DecimalField(max_digits=8, decimal_places=2, default=150)  # in grams
    carbs_target = models.DecimalField(max_digits=8, decimal_places=2, default=200)  # in grams
    fat_target = models.DecimalField(max_digits=8, decimal_places=2, default=65)  # in grams
    fiber_target = models.DecimalField(max_digits=8, decimal_places=2, default=25)  # in grams
    sugar_target = models.DecimalField(max_digits=8, decimal_places=2, default=50)  # in grams
    sodium_target = models.DecimalField(max_digits=8, decimal_places=2, default=2300)  # in mg
    
    # Goal type
    GOAL_CHOICES = [
        ('lose', 'Lose Weight'),
        ('maintain', 'Maintain Weight'),
        ('gain', 'Gain Weight'),
    ]
    goal_type = models.CharField(max_length=10, choices=GOAL_CHOICES, default='maintain')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Nutrition Goal - {self.user_id}"

class MealType(models.Model):
    """
    Types of meals (Breakfast, Lunch, Dinner, Snack, etc.)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)  # For ordering meals chronologically
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name

class MealEntry(models.Model):
    """
    A food item logged by a user for a specific meal and date
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=255)  # Match to user ID
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='meal_entries')
    meal_type = models.ForeignKey(MealType, on_delete=models.CASCADE, related_name='meal_entries')
    
    # Date and time
    date = models.DateField(default=timezone.now)
    time = models.TimeField(default=timezone.now)
    
    # Serving information
    servings = models.DecimalField(max_digits=8, decimal_places=2, default=1.0)
    
    # Calculated nutrition (based on servings)
    calories = models.IntegerField()
    protein = models.DecimalField(max_digits=8, decimal_places=2)  # in grams
    carbs = models.DecimalField(max_digits=8, decimal_places=2)  # in grams
    fat = models.DecimalField(max_digits=8, decimal_places=2)  # in grams
    fiber = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # in grams
    sugar = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # in grams
    sodium = models.DecimalField(max_digits=8, decimal_places=2, default=0)  # in mg
    
    # Notes
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'time']
        indexes = [
            models.Index(fields=['user_id', 'date']),
            models.Index(fields=['meal_type']),
        ]
    
    def __str__(self):
        return f"{self.food_item.name} - {self.meal_type.name} - {self.date}"
    
    def save(self, *args, **kwargs):
        # Calculate nutrition values based on servings
        if not self.calories:
            self.calories = int(self.food_item.calories * self.servings)
        if not self.protein:
            self.protein = self.food_item.protein * self.servings
        if not self.carbs:
            self.carbs = self.food_item.carbs * self.servings
        if not self.fat:
            self.fat = self.food_item.fat * self.servings
        if not self.fiber:
            self.fiber = self.food_item.fiber * self.servings
        if not self.sugar:
            self.sugar = self.food_item.sugar * self.servings
        if not self.sodium:
            self.sodium = self.food_item.sodium * self.servings
        
        super().save(*args, **kwargs)
