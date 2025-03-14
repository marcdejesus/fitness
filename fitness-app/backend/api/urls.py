from django.urls import path
from api.auth.views import (
    RegisterView, LoginView,
    RequestPasswordResetView, PasswordResetConfirmView
)
from api.views import TestAuthView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/password-reset/', RequestPasswordResetView.as_view(), name='password_reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('auth/test/', TestAuthView.as_view(), name='test_auth'),
]