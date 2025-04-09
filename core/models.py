from django.db import models
from django.contrib.auth.models import User

class Chat(models.Model):
    """
    Модель для представления чата (личного или группового).
    """
    name = models.CharField(max_length=255, blank=True, null=True)  # Может быть пустым для личных чатов
    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(User, related_name='chats', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name if self.name else f"Чат {self.pk}"

class Message(models.Model):
    """
    Модель для хранения сообщений в чате.
    """
    chat = models.ForeignKey(Chat, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='messages', on_delete=models.CASCADE)
    content = models.TextField(blank=True)  # Текст сообщения
    media = models.FileField(upload_to='message_media/', blank=True, null=True)  # Поле для медиа-файлов (изображений, аудио, видео и пр.)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Сообщение {self.pk} в чате {self.chat.pk}"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)  # Дополнительное поле для информации о пользователе

    def __str__(self):
        return f"Профиль пользователя {self.user.username}"
