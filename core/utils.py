# core/utils.py
import jwt, time
from django.conf import settings
from django.urls import reverse

def gen_signed_url(path: str, ttl: int = 300) -> str:
    """
    path — относительный путь в MEDIA_ROOT, например "message_media/abc.pdf"
    Возвращает /media-proxy/<path>?token=...
    """
    # если ключ не задан, просто отдадим прямую ссылку
    if not settings.DOWNLOAD_TOKEN_KEY:
        return settings.MEDIA_URL + path

    payload = {
        "path": path,
        "exp": time.time() + ttl,
    }
    token = jwt.encode(payload, settings.DOWNLOAD_TOKEN_KEY, algorithm="HS256")
    # строим URL прокси, передавая path как часть URL
    proxy_url = reverse("media_proxy", args=[path])
    return f"{proxy_url}?token={token}"
