from django.shortcuts import render
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Avg, F
from django.utils import timezone
from datetime import timedelta

from .models import Exercise, Workout, WorkoutSet
from .serializers import (
    ExerciseSerializer, WorkoutSerializer, 
    WorkoutSetSerializer, WorkoutCreateSerializer,
    WorkoutStatsSerializer
)

class ExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint to view exercises
    """
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    
    def get_queryset(self):
        """Filter exercises by query parameters"""
        queryset = Exercise.objects.all()
        
        # Filter by muscle group
        muscle_group = self.request.query_params.get('muscle_group')
        if muscle_group:
            queryset = queryset.filter(muscle_group=muscle_group)
        
        # Filter by exercise type
        is_cardio = self.request.query_params.get('is_cardio')
        if is_cardio is not None:
            is_cardio_bool = is_cardio.lower() == 'true'
            queryset = queryset.filter(is_cardio=is_cardio_bool)
        
        # Search by name or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset

class WorkoutViewSet(viewsets.ModelViewSet):
    """
    API endpoint for CRUD operations on workouts
    """
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get workouts for the current user"""
        # Get the user_id from the authenticated user
        user_id = self.request.user.user_id
        print(f"Filtering workouts for user_id: {user_id}")
        return Workout.objects.filter(user_id=user_id)
    
    def get_serializer_class(self):
        """Use different serializers for list/retrieve vs create/update"""
        if self.action == 'create':
            return WorkoutCreateSerializer
        return WorkoutSerializer
    
    def perform_create(self, serializer):
        """Set user_id when creating a workout"""
        user_id = self.request.user.user_id
        print(f"Creating workout for user_id: {user_id}")
        serializer.save(user_id=user_id)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get workout statistics for the user"""
        user_id = self.request.user.user_id
        
        # Get all workouts for this user
        workouts = Workout.objects.filter(user_id=user_id)
        workout_count = workouts.count()
        
        if workout_count == 0:
            return Response({
                'total_workouts': 0,
                'total_sets': 0,
                'total_reps': 0,
                'total_volume': 0,
                'average_duration': 0,
                'most_trained_muscle': 'N/A'
            })
        
        # Get all sets
        workout_sets = WorkoutSet.objects.filter(workout__user_id=user_id)
        
        # Calculate stats
        total_sets = workout_sets.count()
        total_reps = workout_sets.aggregate(Sum('reps'))['reps__sum'] or 0
        
        # Calculate volume (weight × reps)
        total_volume = 0
        for workout_set in workout_sets:
            if workout_set.weight:
                total_volume += workout_set.weight * workout_set.reps
        
        # Average workout duration
        avg_duration = workouts.aggregate(Avg('duration'))['duration__avg'] or 0
        
        # Most trained muscle group
        muscle_counts = workout_sets.values('exercise__muscle_group').annotate(
            count=Count('id')
        ).order_by('-count')
        
        most_trained_muscle = 'N/A'
        if muscle_counts:
            most_trained_muscle = muscle_counts[0]['exercise__muscle_group']
        
        stats = {
            'total_workouts': workout_count,
            'total_sets': total_sets,
            'total_reps': total_reps,
            'total_volume': total_volume,
            'average_duration': avg_duration,
            'most_trained_muscle': most_trained_muscle
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get workout history by date range"""
        user_id = request.user.user_id
        days = int(request.query_params.get('days', 30))
        
        print(f"Fetching workout history for user_id: {user_id}, days: {days}")
        
        # Calculate date range
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        workouts = Workout.objects.filter(
            user_id=user_id,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        print(f"Found {workouts.count()} workouts for user_id: {user_id}")
        
        return Response(WorkoutSerializer(workouts, many=True).data)

class WorkoutSetViewSet(viewsets.ModelViewSet):
    """
    API endpoint for CRUD operations on workout sets
    """
    serializer_class = WorkoutSetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get sets for the specified workout"""
        workout_id = self.kwargs.get('workout_pk')
        return WorkoutSet.objects.filter(workout_id=workout_id)
    
    def perform_create(self, serializer):
        """Set workout when creating a set"""
        workout_id = self.kwargs.get('workout_pk')
        workout = Workout.objects.get(id=workout_id)
        
        # Ensure the workout belongs to the user
        if workout.user_id != self.request.user.user_id:
            raise permissions.PermissionDenied("You don't have permission to modify this workout")
            
        serializer.save(workout=workout)

# Add these new views if you use the simplified URL approach

from django.shortcuts import get_object_or_404

class WorkoutSetListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutSetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get sets for the specified workout"""
        workout_id = self.kwargs.get('workout_id')
        return WorkoutSet.objects.filter(workout_id=workout_id)
    
    def get_serializer_context(self):
        """Add workout to serializer context for validation"""
        context = super().get_serializer_context()
        workout_id = self.kwargs.get('workout_id')
        from django.shortcuts import get_object_or_404
        workout = get_object_or_404(Workout, id=workout_id)
        context['workout'] = workout
        return context
    
    def perform_create(self, serializer):
        """Set workout when creating a set"""
        workout_id = self.kwargs.get('workout_id')
        from django.shortcuts import get_object_or_404
        workout = get_object_or_404(Workout, id=workout_id)
        
        # Ensure the workout belongs to the user
        if workout.user_id != self.request.user.user_id:
            raise permissions.PermissionDenied("You don't have permission to modify this workout")
            
        serializer.save(workout=workout)

class WorkoutSetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkoutSetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        workout_id = self.kwargs.get('workout_id')
        return WorkoutSet.objects.filter(workout_id=workout_id)

class WorkoutStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = self.request.user.user_id
        
        # Get all workouts for this user
        workouts = Workout.objects.filter(user_id=user_id)
        workout_count = workouts.count()
        
        if workout_count == 0:
            return Response({
                'total_workouts': 0,
                'total_sets': 0,
                'total_reps': 0,
                'total_volume': 0,
                'average_duration': 0,
                'most_trained_muscle': 'N/A'
            })
        
        # Get all sets
        workout_sets = WorkoutSet.objects.filter(workout__user_id=user_id)
        
        # Calculate stats
        total_sets = workout_sets.count()
        total_reps = workout_sets.aggregate(Sum('reps'))['reps__sum'] or 0
        
        # Calculate volume (weight × reps)
        total_volume = 0
        for workout_set in workout_sets:
            if workout_set.weight:
                total_volume += workout_set.weight * workout_set.reps
        
        # Average workout duration
        avg_duration = workouts.aggregate(Avg('duration'))['duration__avg'] or 0
        
        # Most trained muscle group
        muscle_counts = workout_sets.values('exercise__muscle_group').annotate(
            count=Count('id')
        ).order_by('-count')
        
        most_trained_muscle = 'N/A'
        if muscle_counts:
            most_trained_muscle = muscle_counts[0]['exercise__muscle_group']
        
        stats = {
            'total_workouts': workout_count,
            'total_sets': total_sets,
            'total_reps': total_reps,
            'total_volume': total_volume,
            'average_duration': avg_duration,
            'most_trained_muscle': most_trained_muscle
        }
        
        return Response(stats)

class WorkoutHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = request.user.user_id
        days = int(request.query_params.get('days', 30))
        
        # Calculate date range
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        workouts = Workout.objects.filter(
            user_id=user_id,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        return Response(WorkoutSerializer(workouts, many=True).data)
