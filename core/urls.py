from django.urls import path
from .views import (
    UserRegistrationView, ProtectedView, ChatListCreateView,
    MessageListCreateView, ProfileDetailUpdateView, UserSearchView
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('protected/', ProtectedView.as_view(), name='protected'),
    path('chats/', ChatListCreateView.as_view(), name='chats'),
    path('chats/<int:chat_id>/messages/', MessageListCreateView.as_view(), name='messages'),
    path('profile/', ProfileDetailUpdateView.as_view(), name='profile'),
    path('users/search/', UserSearchView.as_view(), name='user_search'),
]
