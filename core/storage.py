# core/storage.py
from django.core.files.storage import FileSystemStorage
from cryptography.fernet import Fernet
from django.conf import settings

fernet = Fernet(settings.FERNET_KEY)

class EncryptedFileSystemStorage(FileSystemStorage):
    def _save(self, name, content):
        encrypted = fernet.encrypt(content.read())
        content.file.seek(0)
        content.file.write(encrypted)
        content.file.truncate()
        content.file.seek(0)
        return super()._save(name, content)
    
    def _open(self, name, mode='rb'):
        f = super()._open(name, mode)
        data = fernet.decrypt(f.read())
        f.seek(0)
        f.write(data)
        f.truncate()
        f.seek(0)
        return f
