import jwt
import urllib.parse
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken
from channels.db import database_sync_to_async

User = get_user_model()

class JWTAuthMiddleware:
    """
    Middleware для Channels, который извлекает JWT из query string
    и аутентифицирует пользователя.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        qs = urllib.parse.parse_qs(query_string)
        token_list = qs.get('token')
        token = token_list[0] if token_list else None

        if not token:
            print("JWTAuthMiddleware: токен не передан.")
            scope['user'] = AnonymousUser()
        else:
            print("JWTAuthMiddleware: получен токен:", token)
            try:
                # Проверка валидности токена
                UntypedToken(token)
            except (InvalidToken, TokenError) as e:
                print("JWTAuthMiddleware: невалидный токен:", e)
                scope['user'] = AnonymousUser()
            else:
                # Если токен валиден, извлекаем пользователя
                user = await self.get_user_from_token(token)
                if user:
                    scope['user'] = user
                    print("JWTAuthMiddleware: аутентифицирован пользователь:", user.username)
                else:
                    print("JWTAuthMiddleware: не удалось найти пользователя по токену")
                    scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Синхронный вызов (User.objects.get) оборачиваем в database_sync_to_async
        чтобы вызывать его из асинхронного контекста.
        """
        try:
            decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get("user_id")
            if not user_id:
                return None
            return User.objects.get(id=user_id)
        except Exception as e:
            print("JWTAuthMiddleware: ошибка при декодировании токена или получении пользователя:", e)
            return None

def JWTAuthMiddlewareStack(inner):
    """
    Обёртка вокруг AuthMiddlewareStack, которая добавляет наш JWTAuthMiddleware.
    """
    from channels.auth import AuthMiddlewareStack
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
