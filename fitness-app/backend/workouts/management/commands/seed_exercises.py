from django.core.management.base import BaseCommand
from workouts.models import Exercise  # Updated import
import json
import os

class Command(BaseCommand):
    help = 'Seed the database with common exercises'

    def handle(self, *args, **kwargs):
        # Clear existing exercises that are not custom
        Exercise.objects.filter(is_custom=False).delete()
        
        # Path to the exercises.json file
        fixtures_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
            'fixtures', 
            'exercises.json'
        )
        
        # Create fixtures directory if it doesn't exist
        fixtures_dir = os.path.dirname(fixtures_path)
        if not os.path.exists(fixtures_dir):
            os.makedirs(fixtures_dir)
        
        # Create exercises.json if it doesn't exist
        if not os.path.exists(fixtures_path):
            self._create_initial_exercises_file(fixtures_path)
        
        with open(fixtures_path, 'r') as f:
            exercises = json.load(f)
        
        count = 0
        for exercise_data in exercises:
            fields = exercise_data.get('fields', {})
            Exercise.objects.create(
                id=exercise_data.get('pk'),
                name=fields.get('name'),
                description=fields.get('description'),
                muscle_group=fields.get('muscle_group'),
                is_cardio=fields.get('is_cardio', False),
                is_custom=fields.get('is_custom', False),
                equipment_needed=fields.get('equipment_needed', ''),
                difficulty_level=fields.get('difficulty_level', 1),
                illustration=fields.get('illustration', ''),
                video_url=fields.get('video_url', '')
            )
            count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} exercises'))
    
    def _create_initial_exercises_file(self, filepath):
        """Create a basic exercises fixture file if it doesn't exist"""
        import uuid
        exercises = [
            {
                "model": "workouts.exercise",
                "pk": str(uuid.uuid4()),
                "fields": {
                    "name": "Bench Press",
                    "description": "Lie on flat bench and press barbell upward",
                    "muscle_group": "chest",
                    "is_cardio": False,
                    "is_custom": False,
                    "equipment_needed": "Barbell, Bench",
                    "difficulty_level": 2
                }
            },
            # Add more exercises as needed
        ]
        with open(filepath, 'w') as f:
            json.dump(exercises, f, indent=2)