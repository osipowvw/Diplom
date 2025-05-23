from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.filters import SearchFilter
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model           # * оставлено – пригодится
from rest_framework.permissions import IsAuthenticated   #  <<<

from .models import Chat, Message, Profile
from .serializers import (UserRegistrationSerializer, ChatSerializer,
                          MessageSerializer, ProfileSerializer,
                          UserSearchSerializer)


def test_cors(request):
    return JsonResponse({"detail": "OK"})


# ----------  регистрация / авторизация  ----------
class UserRegistrationView(generics.CreateAPIView):
    queryset         = User.objects.all()
    serializer_class = UserRegistrationSerializer


class ProtectedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"message": "Этот ресурс доступен только авторизованным пользователям."})


# ----------  ЧАТЫ И СООБЩЕНИЯ  ----------
class ChatListCreateView(generics.ListCreateAPIView):
    serializer_class   = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user)

    def get_serializer_context(self):                     #  <<<
        ctx = super().get_serializer_context()
        ctx['request'] = self.request                     #  <<<
        return ctx                                        #  <<<

    def perform_create(self, serializer):
        chat = serializer.save()
        chat.participants.add(self.request.user)


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class   = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Message.objects.filter(chat_id=self.kwargs['chat_id'])

    def get_serializer_context(self):                     #  <<<
        ctx = super().get_serializer_context()
        ctx['request'] = self.request                     #  <<<
        return ctx                                        #  <<<

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user, chat_id=self.kwargs['chat_id'])


# ----------  ПРОФИЛЬ  ----------
class ProfileDetailUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class   = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


# ----------  ПОИСК ПОЛЬЗОВАТЕЛЯ / ЧАТ С ОДНИМ СОБЕСЕДНИКОМ  ----------
class UserSearchView(generics.ListAPIView):
    serializer_class   = UserSearchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [SearchFilter]
    search_fields      = ['username', 'profile__phone']
    queryset           = User.objects.all()


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

        chat = (Chat.objects
                    .filter(is_group=False, participants=request.user)
                    .filter(participants=target_user)
                    .first())
        if not chat:
            chat = Chat.objects.create(is_group=False)
            chat.participants.add(request.user, target_user)

        ser = ChatSerializer(chat, context={'request': request})  #  <<<
        return Response(ser.data, status=status.HTTP_200_OK)


class UserChatsView(generics.ListAPIView):
    serializer_class   = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user)

    def get_serializer_context(self):                     #  <<<
        ctx = super().get_serializer_context()
        ctx['request'] = self.request                     #  <<<
        return ctx                                        #  <<<


# ----------  СОЗДАНИЕ ГРУППОВОГО ЧАТА  ----------
class GroupChatCreateView(APIView):
    """
    POST /api/chats/group_create/
    {
        "name": "Весёлый чат",
        "user_ids": [4, 9, 12]
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        name     = request.data.get("name", "").strip()
        user_ids = request.data.get("user_ids", [])

        if not name:
            return Response({"detail": "Нужно указать имя чата"},
                            status=status.HTTP_400_BAD_REQUEST)
        if not user_ids:
            return Response({"detail": "Добавьте хотя бы одного участника"},
                            status=status.HTTP_400_BAD_REQUEST)

        users_qs = User.objects.filter(id__in=user_ids)
        if users_qs.count() != len(user_ids):
            return Response({"detail": "Некорректный список пользователей"},
                            status=status.HTTP_400_BAD_REQUEST)

        chat = Chat.objects.create(name=name, is_group=True)
        chat.participants.add(request.user, *users_qs)

        ser = ChatSerializer(chat, context={'request': request})  #  <<<
        return Response(ser.data, status=status.HTTP_201_CREATED)
