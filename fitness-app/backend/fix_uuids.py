import json
import uuid
import os

# Read the exercises.json file
file_path = 'workouts/fixtures/exercises.json'
with open(file_path, 'r') as f:
    exercises = json.load(f)

# Replace all UUIDs with valid ones
for exercise in exercises:
    try:
        # Try to parse the UUID - if it fails, replace it
        uuid.UUID(exercise['pk'])
    except ValueError:
        # Generate a new valid UUID
        exercise['pk'] = str(uuid.uuid4())
        print(f"Replaced invalid UUID for {exercise['fields']['name']}")

# Write the updated exercises back to the file
with open(file_path, 'w') as f:
    json.dump(exercises, f, indent=2)

print("UUID validation complete!")