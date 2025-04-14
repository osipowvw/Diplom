import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API, { setAuthToken } from '../../services/api';

function ChatList({ token }) {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // Устанавливаем токен для всех запросов в нашем API-инстансе
      setAuthToken(token);
      // Получаем список чатов через REST API
      API.get('chats/')
        .then(response => {
          setChats(response.data);
        })
        .catch(err => {
          console.error('Ошибка получения чатов:', err);
        });
    }
  }, [token]);

  const handleSearch = () => {
    if (!search.trim()) return;
    // POST /api/chats/find_or_create/
    API.post('chats/find_or_create/', { username: search.trim() })
      .then(res => {
        const chat = res.data;
        // Перенаправляем в /chat/<chat.id>
        navigate(`/chat/${chat.id}`);
      })
      .catch(err => {
        console.error("Ошибка создания/поиска чата:", err);
      });
  };

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">Чаты</div>

      {/* Поисковая строка */}
      <div style={{ padding: '8px' }}>
        <input
          type="text"
          placeholder="Найти пользователя по нику"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '80%' }}
        />
        <button onClick={handleSearch}>Найти</button>
      </div>

      <ul className="chat-list-items">
        {chats.map(chat => (
          <li key={chat.id} className="chat-list-item">
            <Link to={`/chat/${chat.id}`}>
              {chat.name ? chat.name : `Чат ${chat.id}`}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default ChatList;
