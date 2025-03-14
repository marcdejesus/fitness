import os
from dotenv import load_dotenv
import supabase

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# Add channels for WebSockets
INSTALLED_APPS = [
    # ...
    'channels',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_yasg',
    'storages',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...other middleware
]

# For real-time features
ASGI_APPLICATION = 'core.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(os.getenv('REDIS_HOST', 'localhost'), 6379)],
        },
    },
}

# For background tasks
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')