import os
import django

# Setup Django before importing channels
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.middleware import JWTAuthMiddleware  # <--- Import this
from chat.routing import websocket_urlpatterns # Ensure you have routing.py

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(  # <--- Wrap URLRouter with this
        URLRouter(
            websocket_urlpatterns
        )
    ),
})