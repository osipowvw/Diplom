from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.filters import SearchFilter
from django.contrib.auth import get_user_model

from .models import Chat, Message, Profile
from .serializers import (
    UserRegistrationSerializer, ChatSerializer, MessageSerializer,
    ProfileSerializer, UserSearchSerializer
)

def test_cors(request):
    return JsonResponse({"detail": "OK"})

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer

class ProtectedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"message": "Этот ресурс доступен только авторизованным пользователям."})

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

class SearchOrCreateChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_username = request.data.get("username")
        if not target_username:
            return Response({"detail": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return Response({"detail": "Пользователь не найден."}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({"detail": "Нельзя создать чат с самим собой"}, status=status.HTTP_400_BAD_REQUEST)

        chat = Chat.objects.filter(is_group=False, participants=request.user).filter(participants=target_user).first()
        if not chat:
            chat = Chat.objects.create(is_group=False)
            chat.participants.add(request.user, target_user)

        serializer = ChatSerializer(chat)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserChatsView(generics.ListAPIView):
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user)
