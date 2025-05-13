// src/components/ChatList/ChatList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken, getUserIdFromToken } from '../../services/api';
import '../../App.css';

function ChatList({ token }) {
  const currentUserId = getUserIdFromToken(token);
  const [chats, setChats]       = useState([]);
  const [search, setSearch]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    API.get('chats/')
      .then(res => setChats(res.data))
      .catch(err => console.error('Ошибка получения чатов:', err));
  }, [token]);

  const handleSearch = () => {
    if (!search.trim()) return;
    API.post('chats/find_or_create/', { username: search.trim() })
      .then(res => navigate(`/chat/${res.data.id}`))
      .catch(err => console.error('Ошибка создания/поиска чата:', err));
  };

  return (
    <div className="chat-list">
      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Найти пользователя по нику"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={handleSearch}>Найти</button>
      </div>

      <div className="chat-list-items">
        {chats.map(chat => {
          // Определяем ник второго участника
          const other = chat.participants_usernames.filter(
            (_, i) => chat.participants[i] !== currentUserId
          )[0] || `Чат ${chat.id}`;

          return (
            <div
              key={chat.id}
              className="chat-list-item"
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <div className="avatar" />
              <div className="username">{other}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChatList;
