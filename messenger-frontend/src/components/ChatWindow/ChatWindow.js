// src/components/ChatWindow/ChatWindow.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import API, { setAuthToken, getUserIdFromToken } from '../../services/api';
import '../../App.css';

export default function ChatWindow({ token: propToken }) {
  const { chatId } = useParams();
  const token = propToken || localStorage.getItem('accessToken');
  const currentUserId = getUserIdFromToken(token);

  const [chatInfo, setChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [ws, setWs] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef();
  const wsInitializedRef = useRef(false);

  // Хелпер для получения «читаемого» имени файла
  const getFileName = url => {
    try {
      return decodeURIComponent(url.split('/').pop().split('?')[0]);
    } catch {
      return 'file';
    }
  };

  // Рендер вложений: картинка, видео или ссылка
  const renderAttachment = url => {
    if (!url) return null;
    if (url.match(/\.(jpe?g|png|gif|bmp)$/i)) {
      return <img src={url} alt={getFileName(url)} className="msg-media" />;
    }
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return <video src={url} controls className="msg-media" />;
    }
    return (
      <a
        href={url}
        download
        className="msg-media file-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        📎 {getFileName(url)}
      </a>
    );
  };

  // Загрузка информации о чате и истории сообщений
  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    API.get(`chats/${chatId}/`)
      .then(res => setChatInfo(res.data))
      .catch(err => console.error('Ошибка чата:', err));
    API.get(`chats/${chatId}/messages/`)
      .then(res => setMessages(res.data))
      .catch(err => console.error('Ошибка сообщений:', err));
  }, [chatId, token]);

  // WebSocket-подключение
  useEffect(() => {
    if (!chatId || wsInitializedRef.current) return;
    wsInitializedRef.current = true;

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/chat/${chatId}/?token=${token}`
    );

    socket.onopen = () => console.log('WS подключено');
    socket.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.message || data.media_url) {
        setMessages(prev => [
          ...prev,
          {
            id: data.id || Date.now(),
            content: data.message || '',
            sender: data.sender_id,
            media: data.media_url || null,
          }
        ]);
      }
    };
    socket.onerror = err => console.error('WS ошибка:', err);
    socket.onclose = () => {
      wsInitializedRef.current = false;
    };

    setWs(socket);
    return () => {
      // заменили "логическое И" на if
      if (socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      wsInitializedRef.current = false;
    };
  }, [chatId, token]);

  // Автоскролл вниз при новом сообщении
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Редирект на логин, если нет токена
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Отправка сообщения или файла
  const handleSend = async () => {
    if (mediaFile) {
      const form = new FormData();
      form.append('media', mediaFile);
      form.append('content', content);
      try {
        const res = await API.post(
          `chats/${chatId}/messages/`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setMessages(prev => [...prev, res.data]);
        setContent('');
        setMediaFile(null);
      } catch (err) {
        console.error('Ошибка отправки медиа:', err);
      }
    } else if (ws && ws.readyState === WebSocket.OPEN && content.trim()) {
      ws.send(JSON.stringify({ message: content }));
      setContent('');
    }
  };

  // Определяем заголовок — ник собеседника или название группы
  let headerName = `Чат ${chatId}`;
  if (chatInfo) {
    if (!chatInfo.is_group) {
      const other = chatInfo.participants_usernames.filter((_, i) =>
        chatInfo.participants[i] !== currentUserId
      );
      headerName = other[0] || headerName;
    } else {
      headerName = chatInfo.name || headerName;
    }
  }

  return (
    <div className="chat-window-container">
      <div className="chat-window-header">
        ← {headerName}
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isOwn = msg.sender === currentUserId;
          const cls = isOwn
            ? 'chat-message chat-message-self'
            : 'chat-message chat-message-other';

          return (
            <div key={i} className={cls}>
              {renderAttachment(msg.media)}
              {msg.content && <div className="msg-text">{msg.content}</div>}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
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
          accept="*/*"
          style={{ display: 'none' }}
          onChange={e => setMediaFile(e.target.files[0])}
        />
        <input
          className="chat-input"
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Введите сообщение..."
          // заменил «&&» на if-вызов внутри тела стрелки
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
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
