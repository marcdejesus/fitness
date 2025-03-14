from rest_framework import serializers
from .models import Exercise, Workout, WorkoutSet

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'description', 'muscle_group', 
                 'is_cardio', 'is_custom', 'equipment_needed', 
                 'difficulty_level', 'illustration', 'video_url']

class WorkoutSetSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    
    class Meta:
        model = WorkoutSet
        fields = ['id', 'exercise', 'exercise_name', 'set_number', 
                 'reps', 'weight', 'duration', 'distance', 
                 'rpe', 'is_warmup', 'notes']
    
    def validate(self, data):
        """Validate that there isn't already a set with the same number for this exercise and workout"""
        # Get the workout from context
        workout = self.context.get('workout')
        
        # If no workout in context, we can't validate
        if not workout:
            print("WARNING: No workout in context, skipping duplicate set validation")
            return data
            
        # Check if exercise and set_number are provided
        if 'exercise' in data and 'set_number' in data:
            exercise = data['exercise']
            set_number = data['set_number']
            
            # Extract ID from exercise if it's an instance
            exercise_id = str(exercise.id) if hasattr(exercise, 'id') else str(exercise)
            
            # Explicitly log what we're checking
            print(f"Validating set: workout={workout.id}, exercise={exercise_id}, set_number={set_number}")
            
            # Check for existing sets with same workout, exercise, and set number
            existing_sets = WorkoutSet.objects.filter(
                workout=workout,
                exercise__id=exercise_id,
                set_number=set_number
            )
            
            # If we're updating an existing instance, exclude it from the check
            if self.instance:
                existing_sets = existing_sets.exclude(pk=self.instance.pk)
                
            if existing_sets.exists():
                print(f"Duplicate found: {existing_sets.first()}")
                # Make sure to raise this
                raise serializers.ValidationError({
                    'set_number': f'Set number {set_number} already exists for this exercise in this workout.'
                })
            else:
                print("No duplicates found")
                
        return data

class WorkoutSerializer(serializers.ModelSerializer):
    sets = WorkoutSetSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workout
        fields = ['id', 'user_id', 'name', 'date', 'start_time', 
                 'end_time', 'duration', 'notes', 'calories_burned', 
                 'is_public', 'created_at', 'updated_at', 'sets']
        read_only_fields = ['id', 'created_at', 'updated_at']

class WorkoutCreateSerializer(serializers.ModelSerializer):
    sets = WorkoutSetSerializer(many=True, required=False)
    
    class Meta:
        model = Workout
        fields = ['name', 'date', 'start_time', 'end_time', 
                 'duration', 'notes', 'calories_burned', 
                 'is_public', 'sets']
    
    def create(self, validated_data):
        sets_data = validated_data.pop('sets', [])
        workout = Workout.objects.create(**validated_data)
        
        for set_data in sets_data:
            WorkoutSet.objects.create(workout=workout, **set_data)
            
        return workout
        
    # Add this method to include ID in the response
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['id'] = str(instance.id)
        return representation

class WorkoutStatsSerializer(serializers.Serializer):
    total_workouts = serializers.IntegerField()
    total_sets = serializers.IntegerField()
    total_reps = serializers.IntegerField()
    total_volume = serializers.FloatField()
    average_duration = serializers.FloatField()
    most_trained_muscle = serializers.CharField()