from django.urls import path
from api.auth.views import (
    RegisterView, LoginView,
    RequestPasswordResetView, PasswordResetConfirmView
)
from api.views.test_views import TestAuthView
from api.views.auth_views import SignUpView, SignInView, CurrentUserView
from api.views.profile_views import UserProfileView, UserSettingsView, UserProfileCompleteView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/signup/', SignUpView.as_view(), name='signup'),
    path('auth/login/', SignInView.as_view(), name='login'),
    path('auth/password-reset/', RequestPasswordResetView.as_view(), name='password_reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/test/', TestAuthView.as_view(), name='test_auth'),
    path('auth/me/', CurrentUserView.as_view(), name='me'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/settings/', UserSettingsView.as_view(), name='user_settings'),
    path('profile/complete/', UserProfileCompleteView.as_view(), name='user_profile_complete'),
]