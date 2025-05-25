# core/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from core.models import Chat, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'
        await self.channel_layer.group_add(self.chat_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.chat_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get('message')
        if content is None:
            return

        # Сохраняем сообщение и получаем объект
        msg = await self.save_message(content)
        if not msg:
            return

        # Рассылаем всем участникам
        await self.channel_layer.group_send(
            self.chat_group_name,
            {
                'type': 'chat_message',
                'id': msg.id,
                'message': msg.content,
                'sender_id': msg.sender.id,
                'sender_username': msg.sender.username,
                'media_url': msg.media.url if msg.media else None,
                'created_at': msg.created_at.isoformat(),
            }
        )

    async def chat_message(self, event):
        # Шлём клиенту все поля
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'media_url': event.get('media_url'),
            'created_at': event['created_at'],
        }))

    @database_sync_to_async
    def save_message(self, content):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            return None
        chat = Chat.objects.get(pk=self.chat_id)
        return Message.objects.create(chat=chat, sender=user, content=content)
