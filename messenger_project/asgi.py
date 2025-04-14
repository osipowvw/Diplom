import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'messenger_project.settings')
import django
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

# Импортируем нашу фабрику middleware
from core.middleware import JWTAuthMiddlewareStack
import core.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(core.routing.websocket_urlpatterns)
    ),
})
