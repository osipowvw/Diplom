import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API, { setAuthToken, getUserIdFromToken } from '../../services/api';
import '../../App.css';

function ChatWindow({ token: propToken }) {
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

  // Загрузка информации о чате и истории сообщений
  useEffect(() => {
    if (token && chatId) {
      setAuthToken(token);
      API.get(`chats/${chatId}/`)
        .then(res => setChatInfo(res.data))
        .catch(err => console.error('Ошибка чата:', err));
      API.get(`chats/${chatId}/messages/`)
        .then(res => setMessages(res.data))
        .catch(err => console.error('Ошибка получения сообщений:', err));
    }
  }, [chatId, token]);

  // WebSocket-подключение
  useEffect(() => {
    if (!chatId || wsInitializedRef.current) return;
    wsInitializedRef.current = true;

    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/chat/${chatId}/?token=${token}`
    );

    socket.onopen = () => console.log('WS установлено');
    socket.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.message) {
        setMessages(prev => [...prev, {
          ...data,
          content: data.message,
          sender: data.sender_id
        }]);
      }
    };
    socket.onerror = err => console.error('WS ошибка:', err);
    socket.onclose = e => {
      console.log('WS закрыто', e.code);
      wsInitializedRef.current = false;
    };

    setWs(socket);
    return () => {
      if (socket.readyState !== WebSocket.CLOSED) socket.close();
      wsInitializedRef.current = false;
    };
  }, [chatId, token]);

  // Автопрокрутка
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Отправка (текст или медиа)
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

  // Вычисляем имя окна: имя собеседника
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
      <div className="chat-window-header">{headerName}</div>

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isOwn = msg.sender === currentUserId;
          const cls = isOwn
            ? 'chat-message chat-message-self'
            : 'chat-message chat-message-other';
          return (
            <div key={i} className={cls}>
              {msg.content}
              {/* если есть медиа */}
              {msg.media && (
                <div><img src={msg.media} alt="media" style={{ maxWidth: '100%' }}/></div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <button
          className="chat-media-button"
          onClick={() => fileInputRef.current.click()}
        >📎</button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none'
          }}
          onChange={e => setMediaFile(e.target.files[0])}
        />
        <input
          className="chat-input"
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Введите сообщение..."
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="chat-send-button" onClick={handleSend}>✈️</button>
      </div>
    </div>
  );
}

export default ChatWindow;
