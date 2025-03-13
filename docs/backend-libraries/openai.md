# OpenAI Integration

## Overview
The OpenAI API allows us to integrate advanced AI capabilities into our fitness app, including image recognition, personalized recommendations, and natural language processing.

## Features Used in Our Fitness App

- **Food Recognition**: Identifying foods from images and providing nutritional information
- **Workout Plan Generation**: Creating personalized workout routines based on user goals
- **Exercise Form Analysis**: Analyzing exercise form from videos/images
- **Natural Language Queries**: Allowing users to ask fitness-related questions
- **Meal Planning**: Generating meal plans based on dietary restrictions and goals
- **Progress Analysis**: Providing insights on user's fitness journey

## Implementation Examples

### Food Recognition from Images
```python
import os
import base64
import openai
from typing import Dict, Any

def encode_image(image_path):
    """Convert image to base64 string for API transmission"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def identify_food(image_path: str) -> Dict[str, Any]:
    """
    Identify food from an image and return nutritional information
    """
    try:
        # Set up OpenAI client
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        # Create base64 image string
        base64_image = encode_image(image_path)
        
        response = openai.ChatCompletion.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What food is in this image? Provide a structured response with the name and estimated nutritional information (calories, protein, carbs, fat) in JSON format."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        # Extract the structured data from the response
        result = json.loads(response.choices[0].message.content)
        
        return {
            "food_name": result.get("food_name", "Unknown food"),
            "calories": result.get("calories", 0),
            "protein": result.get("protein", 0),
            "carbs": result.get("carbs", 0),
            "fat": result.get("fat", 0),
            "confidence": result.get("confidence", "medium")
        }
    except Exception as e:
        print(f"Error in food recognition: {e}")
        return {
            "food_name": "Unknown food",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "confidence": "none",
            "error": str(e)
        }
```

### Personalized Workout Plan Generation
```python
from typing import Dict, List, Any

def generate_workout_plan(user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate a personalized workout plan based on user data
    """
    try:
        # Construct the prompt
        prompt = f"""
        Create a personalized {user_data['duration']} week workout plan for a user with the following characteristics:
        - Goal: {user_data['goal']}
        - Fitness level: {user_data['fitness_level']}
        - Available equipment: {', '.join(user_data['available_equipment'])}
        - Preferred workout duration: {user_data['preferred_duration']} minutes
        - Workout frequency: {user_data['frequency']} days per week
        - Any injuries or limitations: {user_data.get('limitations', 'None')}
        
        Return a structured JSON response with the workout plan organized by week and day, with each day containing exercises, sets, reps, and rest periods.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are an expert fitness coach creating personalized workout plans."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        # Process and validate the workout plan
        workout_plan = json.loads(response.choices[0].message.content)
        validated_plan = validate_workout_plan(workout_plan)
        
        return validated_plan
    except Exception as e:
        print(f"Error generating workout plan: {e}")
        return []
```

### Exercise Form Analysis
```python
def analyze_exercise_form(video_path: str, exercise_type: str) -> Dict[str, Any]:
    """
    Analyze exercise form from a video and provide feedback
    """
    try:
        # Extract frames from video
        frames = extract_key_frames(video_path)
        
        # Convert frames to base64
        base64_frames = [encode_image(frame) for frame in frames]
        
        # Create the prompt
        content = [
            {"type": "text", "text": f"Analyze this {exercise_type} exercise form and provide detailed feedback. Focus on posture, range of motion, and potential issues. Return a JSON response with overall score, strong points, areas for improvement, and safety concerns."}
        ]
        
        # Add frames to the content
        for frame in base64_frames:
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{frame}"}
            })
        
        response = openai.ChatCompletion.create(
            model="gpt-4-vision-preview",
            messages=[
                {"role": "user", "content": content}
            ],
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        
        # Process the response
        form_analysis = json.loads(response.choices[0].message.content)
        
        return {
            "exercise_type": exercise_type,
            "form_score": form_analysis.get("form_score", 0),
            "strong_points": form_analysis.get("strong_points", []),
            "improvement_areas": form_analysis.get("improvement_areas", []),
            "safety_concerns": form_analysis.get("safety_concerns", []),
            "recommendations": form_analysis.get("recommendations", [])
        }
    except Exception as e:
        print(f"Error analyzing exercise form: {e}")
        return {
            "error": str(e),
            "exercise_type": exercise_type,
            "form_score": 0,
            "strong_points": [],
            "improvement_areas": [],
            "safety_concerns": ["Could not analyze form properly"]
        }
```

### Natural Language Fitness Queries
```python
def answer_fitness_query(query: str, user_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Answer fitness-related questions with personalized context
    """
    try:
        # Create system message with user context
        system_message = f"""
        You are a knowledgeable fitness assistant. Provide helpful, accurate responses to fitness questions.
        
        User context:
        - Fitness level: {user_context.get('fitness_level', 'Not specified')}
        - Goals: {user_context.get('goals', 'Not specified')}
        - Age: {user_context.get('age', 'Not specified')}
        - Weight: {user_context.get('weight', 'Not specified')}
        - Height: {user_context.get('height', 'Not specified')}
        - Dietary preferences: {user_context.get('dietary_preferences', 'Not specified')}
        - Exercise history: {user_context.get('exercise_history', 'Not specified')}
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": query}
            ],
            max_tokens=500
        )
        
        answer = response.choices[0].message.content
        
        # Detect if we should suggest resources
        suggest_resources = "recommend" in query.lower() or "suggest" in query.lower()
        
        # Get resources if needed
        resources = []
        if suggest_resources:
            resources = get_related_resources(query)
        
        return {
            "answer": answer,
            "resources": resources
        }
    except Exception as e:
        print(f"Error answering query: {e}")
        return {
            "answer": "Sorry, I couldn't process your question. Please try again.",
            "error": str(e)
        }
```

## Prompt Engineering Best Practices
- **Be specific**: Clearly define the expected output format (especially for structured data)
- **Provide context**: Include relevant user data for personalized responses
- **Use system messages**: Set the tone and role of the AI assistant
- **Handle errors gracefully**: Always have fallback options if the AI response isn't as expected
- **Post-process responses**: Validate and clean AI-generated content before presenting to users
- **Rate limits**: Implement queuing for high-volume operations
- **User feedback loop**: Allow users to flag unhelpful responses to improve the system