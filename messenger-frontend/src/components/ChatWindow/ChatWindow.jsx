// src/components/ChatWindow/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API, { setAuthToken, getUserIdFromToken } from '../../services/api';
import '../../App.css';

export default function ChatWindow({ token: propToken }) {
  const { chatId }    = useParams();
  const navigate      = useNavigate();
  const location      = useLocation();
  const token         = propToken || localStorage.getItem('accessToken');
  const currentUserId = getUserIdFromToken(token);

  // chatName может прийти из Link-state при переходе из списка
  const [chatName,  setChatName]  = useState(location.state?.name || `Чат ${chatId}`);
  const [messages,  setMessages]  = useState([]);
  const [content,   setContent]   = useState('');
  const [mediaFile, setMediaFile] = useState(null);

  const wsRef        = useRef(null);
  const wsInitRef    = useRef(false);
  const endRef       = useRef(null);
  const fileInputRef = useRef(null);

  // Если нет токена — на логин
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // Подгружаем метаданные чата и историю
  useEffect(() => {
    if (!token) return;
    setAuthToken(token);

    // Метаданные
    API.get(`chats/${chatId}/`)
      .then(res => {
        const chat = res.data;
        if (chat.is_group) {
          // Групповой: своё имя или default
          setChatName(chat.name || `Группа ${chat.id}`);
        } else {
          // Один-на-один: ник собеседника
          const other = chat.participants_usernames.find(
            (_u, i) => chat.participants[i] !== currentUserId
          );
          if (other) setChatName(other);
        }
      })
      .catch(console.error);

    // История
    API.get(`chats/${chatId}/messages/`)
      .then(res => setMessages(res.data))
      .catch(console.error);
  }, [chatId, token, currentUserId]);

  // WebSocket
  useEffect(() => {
    if (!token || wsInitRef.current) return;
    wsInitRef.current = true;

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/chat/${chatId}/?token=${token}`
    );
    wsRef.current = socket;

    socket.onopen = () => console.log('WS подключён');
    socket.onmessage = e => {
      try {
        const d = JSON.parse(e.data);
        setMessages(prev => [
          ...prev,
          {
            id:      d.id,
            content: d.message,
            sender:  d.sender_id,
            media:   d.media_url,
            sender_name: d.sender_username, // если передаём имя автора
          }
        ]);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };
    socket.onerror = err => console.error('WS error:', err);
    socket.onclose = () => { wsInitRef.current = false; };

    return () => {
      if (socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      wsInitRef.current = false;
    };
  }, [chatId, token]);

  // Автоскролл вниз
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Рендер вложений
  const renderAttachment = url => {
    if (!url) return null;
    const name = decodeURIComponent(url.split('/').pop().split('?')[0]);
    if (/\.(jpe?g|png|gif|bmp)$/i.test(url)) {
      return <img src={url} alt={name} className="msg-media" />;
    }
    if (/\.(mp4|webm|ogg)$/i.test(url)) {
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
        📎 {name}
      </a>
    );
  };

  // Отправка
  const handleSend = async () => {
    if (mediaFile) {
      const fd = new FormData();
      fd.append('media', mediaFile);
      fd.append('content', content);
      try {
        const { data } = await API.post(
          `chats/${chatId}/messages/`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setMessages(prev => [...prev, data]);
        setMediaFile(null);
        setContent('');
      } catch (err) {
        console.error('Ошибка загрузки файла:', err);
      }
      return;
    }
    if (content.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: content }));
      setContent('');
    }
  };

  return (
    <div className="chat-window-container">
      <div className="chat-window-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="chat-header-title">{chatName}</span>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => {
          const mine = m.sender === currentUserId;
          return (
            <div
              key={m.id ?? i}
              className={`chat-message ${mine ? 'chat-message-self' : 'chat-message-other'}`}
            >
              {!mine && m.sender_name && (
                <div className="msg-author">{m.sender_name}</div>
              )}
              {renderAttachment(m.media)}
              {m.content && <div className="msg-text">{m.content}</div>}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        <button
          className="chat-media-button"
          title="Прикрепить файл"
          onClick={() => fileInputRef.current.click()}
        >📎</button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={e => e.target.files[0] && setMediaFile(e.target.files[0])}
        />

        {mediaFile && (
          <div className="selected-file-preview">
            <span className="file-name">{mediaFile.name}</span>
            <button
              className="file-remove-btn"
              title="Убрать файл"
              onClick={() => setMediaFile(null)}
            >✕</button>
          </div>
        )}

        <input
          className="chat-input"
          type="text"
          placeholder="Введите сообщение…"
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => {
            // Явный if вместо логического &&
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
        />
        <button
          className="chat-send-button"
          onClick={handleSend}
        >✈️</button>
      </div>
    </div>
  );
}
