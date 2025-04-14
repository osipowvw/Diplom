import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from core.models import Chat, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            print("WebSocket CONNECT request, scope path:", self.scope.get('path'))
            self.chat_id = self.scope['url_route']['kwargs']['chat_id']
            self.chat_group_name = f'chat_{self.chat_id}'
            
            await self.channel_layer.group_add(
                self.chat_group_name,
                self.channel_name
            )
            await self.accept()
            print("WebSocket connection accepted")
        except Exception as e:
            print("Ошибка в connect:", e)
            await self.close()

    async def disconnect(self, close_code):
        print("WebSocket disconnect, code:", close_code)
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_text = data.get('message')
            if message_text:
                # Попытка сохранить сообщение
                await self.save_message(message_text)
                # Рассылка сообщения участникам группы
                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_text,
                    }
                )
        except Exception as e:
            print("Ошибка в receive:", e)
            # Здесь можно отправить сообщение об ошибке или закрыть соединение
            await self.close()

    async def chat_message(self, event):
        message = event.get('message', '')
        try:
            await self.send(text_data=json.dumps({'message': message}))
        except Exception as e:
            print("Ошибка при отправке WS-сообщения:", e)

    @database_sync_to_async
    def save_message(self, content):
        try:
            # Предполагаем, что аутентификация производится
            user = self.scope.get("user")
            if not user or not user.is_authenticated:
                # Можно либо пропустить сохранение, либо присвоить значение AnonymousUser
                print("Пользователь не аутентифицирован, сообщение не сохраняется.")
                return
            chat = Chat.objects.get(pk=self.chat_id)
            Message.objects.create(chat=chat, sender=user, content=content)
        except Exception as e:
            print("Ошибка сохранения сообщения:", e)
            raise e
