import csv
import os
from django.core.management.base import BaseCommand
from api.nutrition.models import FoodCategory, FoodItem

class Command(BaseCommand):
    help = 'Seeds the database with common food items'

    def handle(self, *args, **options):
        self.stdout.write('Seeding food categories...')
        self.seed_categories()
        
        self.stdout.write('Seeding common food items...')
        self.seed_common_foods()
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded food database!'))
    
    def seed_categories(self):
        categories = [
            {'name': 'Fruits', 'description': 'Fresh and dried fruits'},
            {'name': 'Vegetables', 'description': 'Fresh and cooked vegetables'},
            {'name': 'Grains', 'description': 'Rice, pasta, bread, and other grains'},
            {'name': 'Protein', 'description': 'Meat, fish, eggs, and plant-based proteins'},
            {'name': 'Dairy', 'description': 'Milk, cheese, yogurt, and other dairy products'},
            {'name': 'Snacks', 'description': 'Chips, crackers, and other snack foods'},
            {'name': 'Beverages', 'description': 'Drinks, including water, juice, and soda'},
            {'name': 'Condiments', 'description': 'Sauces, dressings, and spreads'},
            {'name': 'Desserts', 'description': 'Sweet treats and desserts'},
            {'name': 'Prepared Meals', 'description': 'Ready-to-eat meals and dishes'},
        ]
        
        for category_data in categories:
            FoodCategory.objects.get_or_create(
                name=category_data['name'],
                defaults={'description': category_data['description']}
            )
            self.stdout.write(f"Added category: {category_data['name']}")
    
    def seed_common_foods(self):
        # Get categories
        categories = {category.name: category for category in FoodCategory.objects.all()}
        
        # Common fruits
        fruits = [
            {
                'name': 'Apple', 'brand': 'Generic', 
                'serving_size': 182, 'serving_unit': 'g',
                'calories': 95, 'protein': 0.5, 'carbs': 25, 'fat': 0.3,
                'fiber': 4.4, 'sugar': 19, 'sodium': 2
            },
            {
                'name': 'Banana', 'brand': 'Generic', 
                'serving_size': 118, 'serving_unit': 'g',
                'calories': 105, 'protein': 1.3, 'carbs': 27, 'fat': 0.4,
                'fiber': 3.1, 'sugar': 14, 'sodium': 1
            },
            {
                'name': 'Orange', 'brand': 'Generic', 
                'serving_size': 131, 'serving_unit': 'g',
                'calories': 62, 'protein': 1.2, 'carbs': 15.4, 'fat': 0.2,
                'fiber': 3.1, 'sugar': 12.2, 'sodium': 0
            },
        ]
        
        for food_data in fruits:
            FoodItem.objects.get_or_create(
                name=food_data['name'],
                brand=food_data['brand'],
                defaults={
                    'category': categories['Fruits'],
                    'serving_size': food_data['serving_size'],
                    'serving_unit': food_data['serving_unit'],
                    'calories': food_data['calories'],
                    'protein': food_data['protein'],
                    'carbs': food_data['carbs'],
                    'fat': food_data['fat'],
                    'fiber': food_data['fiber'],
                    'sugar': food_data['sugar'],
                    'sodium': food_data['sodium'],
                    'is_verified': True
                }
            )
            self.stdout.write(f"Added food: {food_data['name']}")
        
        # Common vegetables
        vegetables = [
            {
                'name': 'Broccoli', 'brand': 'Generic', 
                'serving_size': 91, 'serving_unit': 'g',
                'calories': 31, 'protein': 2.6, 'carbs': 6, 'fat': 0.3,
                'fiber': 2.4, 'sugar': 1.5, 'sodium': 30
            },
            {
                'name': 'Carrot', 'brand': 'Generic', 
                'serving_size': 128, 'serving_unit': 'g',
                'calories': 52, 'protein': 1.2, 'carbs': 12.3, 'fat': 0.3,
                'fiber': 3.6, 'sugar': 6.1, 'sodium': 88
            },
            {
                'name': 'Spinach', 'brand': 'Generic', 
                'serving_size': 30, 'serving_unit': 'g',
                'calories': 7, 'protein': 0.9, 'carbs': 1.1, 'fat': 0.1,
                'fiber': 0.7, 'sugar': 0.1, 'sodium': 24
            },
        ]
        
        for food_data in vegetables:
            FoodItem.objects.get_or_create(
                name=food_data['name'],
                brand=food_data['brand'],
                defaults={
                    'category': categories['Vegetables'],
                    'serving_size': food_data['serving_size'],
                    'serving_unit': food_data['serving_unit'],
                    'calories': food_data['calories'],
                    'protein': food_data['protein'],
                    'carbs': food_data['carbs'],
                    'fat': food_data['fat'],
                    'fiber': food_data['fiber'],
                    'sugar': food_data['sugar'],
                    'sodium': food_data['sodium'],
                    'is_verified': True
                }
            )
            self.stdout.write(f"Added food: {food_data['name']}")
        
        # Common proteins
        proteins = [
            {
                'name': 'Chicken Breast', 'brand': 'Generic', 
                'serving_size': 100, 'serving_unit': 'g',
                'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6,
                'fiber': 0, 'sugar': 0, 'sodium': 74
            },
            {
                'name': 'Salmon', 'brand': 'Generic', 
                'serving_size': 100, 'serving_unit': 'g',
                'calories': 206, 'protein': 22, 'carbs': 0, 'fat': 13,
                'fiber': 0, 'sugar': 0, 'sodium': 59
            },
            {
                'name': 'Eggs', 'brand': 'Generic', 
                'serving_size': 50, 'serving_unit': 'g',
                'calories': 72, 'protein': 6.3, 'carbs': 0.4, 'fat': 5,
                'fiber': 0, 'sugar': 0.2, 'sodium': 71
            },
        ]
        
        for food_data in proteins:
            FoodItem.objects.get_or_create(
                name=food_data['name'],
                brand=food_data['brand'],
                defaults={
                    'category': categories['Protein'],
                    'serving_size': food_data['serving_size'],
                    'serving_unit': food_data['serving_unit'],
                    'calories': food_data['calories'],
                    'protein': food_data['protein'],
                    'carbs': food_data['carbs'],
                    'fat': food_data['fat'],
                    'fiber': food_data['fiber'],
                    'sugar': food_data['sugar'],
                    'sodium': food_data['sodium'],
                    'is_verified': True
                }
            )
            self.stdout.write(f"Added food: {food_data['name']}")
        
        # Common grains
        grains = [
            {
                'name': 'White Rice', 'brand': 'Generic', 
                'serving_size': 100, 'serving_unit': 'g',
                'calories': 130, 'protein': 2.7, 'carbs': 28.2, 'fat': 0.3,
                'fiber': 0.4, 'sugar': 0.1, 'sodium': 1
            },
            {
                'name': 'Whole Wheat Bread', 'brand': 'Generic', 
                'serving_size': 30, 'serving_unit': 'g',
                'calories': 81, 'protein': 4, 'carbs': 13.8, 'fat': 1.1,
                'fiber': 1.9, 'sugar': 1.4, 'sodium': 152
            },
            {
                'name': 'Oatmeal', 'brand': 'Generic', 
                'serving_size': 40, 'serving_unit': 'g',
                'calories': 150, 'protein': 5, 'carbs': 27, 'fat': 2.5,
                'fiber': 4, 'sugar': 1, 'sodium': 0
            },
        ]
        
        for food_data in grains:
            FoodItem.objects.get_or_create(
                name=food_data['name'],
                brand=food_data['brand'],
                defaults={
                    'category': categories['Grains'],
                    'serving_size': food_data['serving_size'],
                    'serving_unit': food_data['serving_unit'],
                    'calories': food_data['calories'],
                    'protein': food_data['protein'],
                    'carbs': food_data['carbs'],
                    'fat': food_data['fat'],
                    'fiber': food_data['fiber'],
                    'sugar': food_data['sugar'],
                    'sodium': food_data['sodium'],
                    'is_verified': True
                }
            )
            self.stdout.write(f"Added food: {food_data['name']}")
        
        # Common dairy
        dairy = [
            {
                'name': 'Milk (2%)', 'brand': 'Generic', 
                'serving_size': 240, 'serving_unit': 'ml',
                'calories': 122, 'protein': 8.1, 'carbs': 11.7, 'fat': 4.8,
                'fiber': 0, 'sugar': 12.3, 'sodium': 115
            },
            {
                'name': 'Greek Yogurt', 'brand': 'Generic', 
                'serving_size': 170, 'serving_unit': 'g',
                'calories': 100, 'protein': 17, 'carbs': 6, 'fat': 0,
                'fiber': 0, 'sugar': 6, 'sodium': 65
            },
            {
                'name': 'Cheddar Cheese', 'brand': 'Generic', 
                'serving_size': 28, 'serving_unit': 'g',
                'calories': 113, 'protein': 7, 'carbs': 0.4, 'fat': 9.3,
                'fiber': 0, 'sugar': 0.1, 'sodium': 174
            },
        ]
        
        for food_data in dairy:
            FoodItem.objects.get_or_create(
                name=food_data['name'],
                brand=food_data['brand'],
                defaults={
                    'category': categories['Dairy'],
                    'serving_size': food_data['serving_size'],
                    'serving_unit': food_data['serving_unit'],
                    'calories': food_data['calories'],
                    'protein': food_data['protein'],
                    'carbs': food_data['carbs'],
                    'fat': food_data['fat'],
                    'fiber': food_data['fiber'],
                    'sugar': food_data['sugar'],
                    'sodium': food_data['sodium'],
                    'is_verified': True
                }
            )
            self.stdout.write(f"Added food: {food_data['name']}") 