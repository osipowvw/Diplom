# core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.conf import settings

from .models import Chat, Message, Profile
from .utils import gen_signed_url


class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError("Пароли должны совпадать!")
        return data

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'sender_username', 'content', 'media', 'created_at']
        read_only_fields = ['id', 'sender_username', 'created_at', 'chat', 'sender']

    def to_representation(self, instance):
        rep = super().to_representation(instance)

        # Если есть медиа, проксируем его через Django,
        # формируя абсолютный URL на бекенд
        if instance.media:
            proxy_path = gen_signed_url(instance.media.name, ttl=300)

            request = self.context.get('request')
            if request:
                # http://127.0.0.1:8000/media-proxy/…
                rep['media'] = request.build_absolute_uri(proxy_path)
            else:
                # Вдруг request нет — берём из настроек
                backend = getattr(settings, 'BACKEND_URL', '').rstrip('/')
                rep['media'] = f"{backend}{proxy_path}"
        else:
            rep['media'] = None

        return rep


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
        fields = [
            'id',
            'name',
            'is_group',
            'participants',
            'participants_usernames',
            'created_at',
            'messages',
        ]
        read_only_fields = ['id', 'participants_usernames', 'created_at', 'messages']


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email    = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = ['username', 'email', 'phone', 'avatar', 'bio']


class UserSearchSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profile.phone', default='')

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone']
