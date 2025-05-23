from django.urls import path
from .views import (
    UserRegistrationView, ProtectedView, ChatListCreateView,
    MessageListCreateView, ProfileDetailUpdateView, UserSearchView,
    SearchOrCreateChatView, GroupChatCreateView
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('protected/', ProtectedView.as_view(), name='protected'),
    path('chats/', ChatListCreateView.as_view(), name='chats'),
    path('chats/<int:chat_id>/messages/', MessageListCreateView.as_view(), name='messages'),
    path('profile/', ProfileDetailUpdateView.as_view(), name='profile'),
    path('users/search/', UserSearchView.as_view(), name='user_search'),
    path('chats/find_or_create/', SearchOrCreateChatView.as_view(), name='find_or_create_chat'),
    path('chats/group_create/', GroupChatCreateView.as_view(), name='group_chat_create'),
]
