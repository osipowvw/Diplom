// src/components/ChatWindow/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { setAuthToken, getUserIdFromToken } from '../../services/api';
import '../../App.css';

export default function ChatWindow({ token: propToken }) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const token = propToken || localStorage.getItem('accessToken');
  const currentUserId = getUserIdFromToken(token);

  const [chatInfo, setChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [ws, setWs] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef();
  const wsInitializedRef = useRef(false);

  // Редирект на /login, если токена нет
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // Получаем информацию о чате и историю сообщений
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

  // Открываем WS-соединение
  useEffect(() => {
    if (!token || !chatId || wsInitializedRef.current) {
      return;
    }
    wsInitializedRef.current = true;

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/chat/${chatId}/?token=${token}`
    );

    socket.onopen = () => {
      console.log('WebSocket подключен');
    };

    socket.onmessage = event => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error('Ошибка парсинга WS-сообщения:', e);
        return;
      }
      const incoming = {
        id: data.id || Date.now(),
        content: data.message || '',
        sender: data.sender_id,
        media: data.media_url || null,
      };
      setMessages(prev => [...prev, incoming]);
    };

    socket.onerror = err => console.error('WebSocket ошибка:', err);

    socket.onclose = () => {
      wsInitializedRef.current = false;
    };

    setWs(socket);

    return () => {
      if (socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      wsInitializedRef.current = false;
    };
  }, [chatId, token]);

  // Скроллим вниз при любых изменениях списка сообщений
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Обработчик отправки текста или файла
  const handleSend = async () => {
    if (mediaFile) {
      const formData = new FormData();
      formData.append('media', mediaFile);
      formData.append('content', content);
      try {
        const res = await API.post(
          `chats/${chatId}/messages/`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setMessages(prev => [...prev, res.data]);
        setContent('');
        setMediaFile(null);
        setFileError('');
      } catch (err) {
        console.error('Ошибка отправки файла:', err);
        setFileError('Не удалось загрузить файл');
      }
    } else {
      if (ws && ws.readyState === WebSocket.OPEN && content.trim() !== '') {
        ws.send(JSON.stringify({ message: content }));
        setContent('');
      }
    }
  };

  // Генерация отображаемого имени чата (ник собеседника или название группы)
  let headerName = `Чат ${chatId}`;
  if (chatInfo) {
    if (!chatInfo.is_group) {
      const other = chatInfo.participants_usernames.filter(
        (_, idx) => chatInfo.participants[idx] !== currentUserId
      );
      if (other.length > 0) {
        headerName = other[0];
      }
    } else if (chatInfo.name) {
      headerName = chatInfo.name;
    }
  }

  // Вспомогательная функция: читаемое имя файла
  const getFileName = url => {
    try {
      return decodeURIComponent(url.split('/').pop().split('?')[0]);
    } catch {
      return 'file';
    }
  };

  // Рендер вложения: картинка, видео или ссылка
  const renderAttachment = url => {
    if (!url) {
      return null;
    }
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

  // Назад к списку чатов
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="chat-window-container">
      <div className="chat-window-header">
        <button className="back-btn" onClick={handleBack}>←</button>
        <span className="chat-header-title">{headerName}</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender === currentUserId;
          const cls = isOwn ? 'chat-message-self' : 'chat-message-other';
          return (
            <div key={msg.id || idx} className={`chat-message ${cls}`}>
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
          title="Прикрепить файл"
          onClick={() => fileInputRef.current.click()}
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files.length > 0) {
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
        {fileError && <div className="file-error">{fileError}</div>}

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
        <button className="chat-send-button" onClick={handleSend}>✈️</button>
      </div>
    </div>
  );
}
