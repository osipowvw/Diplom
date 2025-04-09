import os
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application  # явный импорт
import core.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'messenger_project.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # используем импортированную функцию
    "websocket": AuthMiddlewareStack(
        URLRouter(
            core.routing.websocket_urlpatterns
        )
    ),
})
