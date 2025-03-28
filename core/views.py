from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import UserRegistrationSerializer, ChatSerializer, MessageSerializer, ProfileSerializer, UserSearchSerializer
from .models import Chat, Message, Profile
from rest_framework.filters import SearchFilter

# Существующие представления
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer

class ProtectedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"message": "Этот ресурс доступен только авторизованным пользователям."})

# Новые представления для чатов и сообщений
class ChatListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        chat = serializer.save()
        chat.participants.add(self.request.user)

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        chat_id = self.kwargs.get('chat_id')
        return Message.objects.filter(chat_id=chat_id)

    def perform_create(self, serializer):
        chat_id = self.kwargs.get('chat_id')
        serializer.save(sender=self.request.user, chat_id=chat_id)

class ProfileDetailUpdateView(generics.RetrieveUpdateAPIView):
    """
    Получение и обновление профиля текущего пользователя.
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

class UserSearchView(generics.ListAPIView):
    serializer_class = UserSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['username', 'profile__phone']

    queryset = User.objects.all()
