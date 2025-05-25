// src/components/ChatWindow/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  useParams,
  useNavigate,
  useLocation,
  Navigate
} from 'react-router-dom';
import API, { setAuthToken, getUserIdFromToken } from '../../services/api';
import '../../App.css';

// Вспомогательная функция форматирования даты
function formatDateTime(isoString) {
  const d = new Date(isoString);
  const hours   = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day     = String(d.getDate()).padStart(2, '0');
  const month   = String(d.getMonth() + 1).padStart(2, '0');
  const year    = d.getFullYear();
  return `${hours}:${minutes} ${day}.${month}.${year}`;
}

// Рендерим вложение: изображение, видео или ссылка
function renderAttachment(url) {
  if (!url) {
    return null;
  }

  let filename = url.split('/').pop().split('?')[0];
  // если URL прокси — пытаемся взять параметр p
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.searchParams.has('p')) {
      const raw = parsed.searchParams.get('p');
      filename = decodeURIComponent(raw.split('/').pop());
    }
  } catch (e) {
    // игнорируем
  }

  // Картинки
  if (/\.(jpe?g|png|gif|bmp)$/i.test(filename)) {
    return <img src={url} alt={filename} className="msg-media" />;
  }
  // Видео
  if (/\.(mp4|webm|ogg)$/i.test(filename)) {
    return <video src={url} controls className="msg-media" />;
  }
  // Остальные файлы — ссылка на скачивание
  return (
    <a
      href={url}
      download={filename}
      className="msg-media file-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      📎 {filename}
    </a>
  );
}

export default function ChatWindow({ token: propToken }) {
  const { chatId }       = useParams();
  const navigate         = useNavigate();
  const location         = useLocation();
  const token            = propToken || localStorage.getItem('accessToken');
  const currentUserId    = getUserIdFromToken(token);

  // Можно передать имя чата через state, иначе «Чат id»
  const [chatName, setChatName] = useState(
    location.state?.name || `Чат ${chatId}`
  );
  const [messages, setMessages]   = useState([]);
  const [content, setContent]     = useState('');
  const [mediaFile, setMediaFile] = useState(null);

  const wsRef        = useRef(null);
  const wsInitRef    = useRef(false);
  const endRef       = useRef(null);
  const fileInputRef = useRef(null);

  // Редирект на логин, если нет токена
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // Загрузка информации о чате и истории
  useEffect(() => {
    if (!token) {
      return;
    }
    setAuthToken(token);

    // Метаданные чата
    API.get(`chats/${chatId}/`)
      .then(res => {
        const chat = res.data;
        if (chat.is_group) {
          setChatName(chat.name || chatName);
        } else {
          const other = chat.participants_usernames.find(
            (_, idx) => chat.participants[idx] !== currentUserId
          );
          if (other) {
            setChatName(other);
          }
        }
      })
      .catch(console.error);

    // История сообщений
    API.get(`chats/${chatId}/messages/`)
      .then(res => {
        setMessages(res.data);
      })
      .catch(console.error);
  }, [chatId, token, currentUserId, chatName]);

  // WebSocket
  useEffect(() => {
    if (!token || wsInitRef.current) {
      return;
    }
    wsInitRef.current = true;

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/chat/${chatId}/?token=${token}`
    );
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WS подключён');
    };

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [
          ...prev,
          {
            id:              data.id || Date.now(),
            content:         data.message || '',
            sender:          data.sender_id,
            sender_username: data.sender_username,
            media:           data.media_url || null,
            created_at:      data.created_at,
          }
        ]);
      } catch (err) {
        console.error('Не удалось распарсить WS-сообщение', err);
      }
    };

    socket.onerror = err => {
      console.error('WS ошибка:', err);
    };

    socket.onclose = () => {
      wsInitRef.current = false;
    };

    return () => {
      if (socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      wsInitRef.current = false;
    };
  }, [chatId, token]);

  // Автоскролл вниз при появлении нового сообщения
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Обработчик отправки
  const handleSend = async () => {
    // Если выбран файл
    if (mediaFile) {
      const form = new FormData();
      form.append('media', mediaFile);
      form.append('content', content);

      try {
        const { data } = await API.post(
          `chats/${chatId}/messages/`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setMessages(prev => [...prev, data]);
        setContent('');
        setMediaFile(null);
      } catch (err) {
        console.error('Ошибка при отправке файла:', err);
      }
      return;
    }

    // Текстовое сообщение через WS
    if (content.trim() !== '' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: content }));
      setContent('');
    }
  };

  // Если нет токена, перенаправляем
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="chat-window-container">
      <div className="chat-window-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <span className="chat-header-title">{chatName}</span>
      </div>

      <div className="chat-messages">
        {messages.map((m, idx) => {
          const mine = m.sender === currentUserId;
          return (
            <div
              key={m.id ?? idx}
              className={`chat-message ${
                mine ? 'chat-message-self' : 'chat-message-other'
              }`}
            >
              <div className="msg-user">{m.sender_username}</div>
              <div className="msg-content">
                {renderAttachment(m.media)}
                {m.content && <div className="msg-text">{m.content}</div>}
              </div>
              <div className="msg-time">{formatDateTime(m.created_at)}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        <button
          className="chat-media-button"
          onClick={() => fileInputRef.current.click()}
          title="Прикрепить файл"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              setMediaFile(e.target.files[0]);
            }
          }}
        />

        {mediaFile && (
          <div className="selected-file-preview">
            <span className="file-name">{mediaFile.name}</span>
            <button
              className="file-remove-btn"
              title="Убрать файл"
              onClick={() => setMediaFile(null)}
            >
              ✕
            </button>
          </div>
        )}

        <input
          className="chat-input"
          type="text"
          placeholder="Введите сообщение..."
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
        />

        <button
          className="chat-send-button"
          onClick={handleSend}
          title="Отправить"
        >
          ✈️
        </button>
      </div>
    </div>
  );
}
