// messenger-frontend/src/components/ChatWindow/ChatWindow.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API, { setAuthToken, getUserIdFromToken } from '../../services/api';

function ChatWindow({ token: propToken }) {
  const { chatId } = useParams();
  const token = propToken || localStorage.getItem('accessToken');
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const wsInitializedRef = useRef(false);

  // Определяем userId из токена
  const currentUserId = getUserIdFromToken(token);

  useEffect(() => {
    if (token && chatId) {
      setAuthToken(token);
      API.get(`chats/${chatId}/messages/`)
        .then(response => setMessages(response.data))
        .catch(err => console.error("Ошибка получения сообщений:", err));
    }
  }, [chatId, token]);

  useEffect(() => {
    if (!chatId || wsInitializedRef.current) return;
    wsInitializedRef.current = true;

    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${chatId}/?token=${token}`);

    socket.onopen = () => {
      console.log("WebSocket соединение установлено");
    };

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        console.log("Получено сообщение через WS:", data);
        if (data.message) {
          setMessages(prev => [...prev, {
            content: data.message,
            sender: data.sender_id, // Если ваш сервер отправляет sender_id
          }]);
        }
      } catch (error) {
        console.error("Ошибка парсинга WS-сообщения:", error);
      }
    };

    socket.onerror = error => {
      console.error("WebSocket ошибка:", error);
    };

    socket.onclose = (e) => {
      console.log("WebSocket соединение закрыто, код:", e.code);
      wsInitializedRef.current = false;
    };

    setWs(socket);

    return () => {
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      wsInitializedRef.current = false;
    };
  }, [chatId, token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (ws && ws.readyState === WebSocket.OPEN && content.trim() !== '') {
      const messageObject = { message: content };
      ws.send(JSON.stringify(messageObject));
      setContent('');
    } else {
      console.error("Невозможно отправить сообщение: WebSocket не открыт или сообщение пустое");
    }
  };

  return (
    <div className="chat-window-container">
      <div className="chat-window-header">Чат {chatId}</div>

      <div className="chat-messages">
        {messages.map((msg, index) => {
          // Если ваш бэкенд при получении сообщения добавляет sender_id = scope["user"].id
          // Тогда мы здесь проверяем:
          const isOwn = (msg.sender === currentUserId);
          // Стилизации для "своих" и "чужих" сообщений
          const messageClass = isOwn ? 'chat-message chat-message-self' : 'chat-message';
          return (
            <div key={index} className={messageClass}>
              {msg.content}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          className="chat-input"
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Введите сообщение..."
        />
        <button className="chat-send-button" onClick={handleSend}>Отправить</button>
      </div>
    </div>
  );
}

export default ChatWindow;
