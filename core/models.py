from django.db import models
from django.contrib.auth.models import User
from fernet_fields import EncryptedTextField, EncryptedCharField

class Chat(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    participants = models.ManyToManyField(User, related_name='chats')
    created_at = models.DateTimeField(auto_now_add=True)
    is_group = models.BooleanField(default=False)

    def __str__(self):
        return self.name or f"Чат {self.pk}"

class Message(models.Model):
    """
    Модель для хранения сообщений в чате.
    """
    chat = models.ForeignKey(Chat, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='messages', on_delete=models.CASCADE)
    content = EncryptedTextField(blank=True)
    media = models.FileField(upload_to='message_media/', blank=True, null=True)  # Поле для медиа-файлов (изображений, аудио, видео и пр.)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Сообщение {self.pk} в чате {self.chat.pk}"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone  = EncryptedCharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio    = EncryptedTextField(blank=True, null=True)

    def __str__(self):
        return f"Профиль пользователя {self.user.username}"
