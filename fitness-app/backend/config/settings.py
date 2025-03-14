# Add these to INSTALLED_APPS if not already there
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
    # ...
]

# Make sure you have CORS settings
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # This should be at the top
    # ... other middleware
]

# For development, allow all origins
CORS_ALLOW_ALL_ORIGINS = True
# For production, specify your frontend URL
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
# ]