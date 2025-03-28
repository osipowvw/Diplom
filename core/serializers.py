from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Chat, Message, Profile

# Уже существующий код для регистрации
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Пароли должны совпадать!")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

# Новые сериализаторы для чатов и сообщений
class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'sender_username', 'content', 'created_at']
        read_only_fields = ['id', 'sender_username', 'created_at', 'chat', 'sender']


class ChatSerializer(serializers.ModelSerializer):
    participants_usernames = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='username',
        source='participants'
    )
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'name', 'is_group', 'participants', 'participants_usernames', 'created_at', 'messages']
        read_only_fields = ['id', 'participants_usernames', 'created_at', 'messages']

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = ['username', 'email', 'phone', 'avatar', 'bio']

class UserSearchSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profile.phone', default='')

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone']

