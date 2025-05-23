// src/components/ChatList/ChatList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, {
  setAuthToken,
  getUserIdFromToken,
  createGroupChat
} from '../../services/api';
import '../../App.css';

export default function ChatList({ token: propToken }) {
  const token         = propToken || localStorage.getItem('accessToken');
  const currentUserId = getUserIdFromToken(token);
  const [chats, setChats]           = useState([]);
  const [search, setSearch]         = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName]   = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate       = useNavigate();

  // Загружаем список чатов
  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    API.get('chats/')
       .then(res => setChats(res.data))
       .catch(err => console.error('Ошибка получения чатов:', err));
  }, [token]);

  // Поиск или создание личного чата
  const handleSearch = () => {
    if (!search.trim()) return;
    API.post('chats/find_or_create/', { username: search.trim() })
       .then(res => {
         const chat = res.data;
         // вычисляем имя собеседника
         const other = chat.participants_usernames.filter(
           (_, i) => chat.participants[i] !== currentUserId
         );
         const name = other[0] || `Чат ${chat.id}`;
         navigate(`/chat/${chat.id}`, { state: { name } });
       })
       .catch(err => console.error('Ошибка создания чата:', err));
  };

  // Список контактных пользователей (из личных чатов)
  const contacts = React.useMemo(() => {
    return chats
      .filter(c => !c.is_group)
      .map(c => {
        const idx = c.participants.indexOf(currentUserId);
        const otherIdx = idx === 0 ? 1 : 0;
        return {
          id: c.participants[otherIdx],
          username: c.participants_usernames[otherIdx]
        };
      })
      // убрать дубли
      .reduce((acc, u) => {
        if (!acc.find(x => x.id === u.id)) acc.push(u);
        return acc;
      }, []);
  }, [chats, currentUserId]);

  // Открыть/закрыть попап
  const openGroupModal = () => {
    setGroupName('');
    setSelectedIds([]);
    setShowGroupModal(true);
  };
  const closeGroupModal = () => setShowGroupModal(false);

  // Переключаем чекбокс участника
  const toggleSelect = id => {
    setSelectedIds(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    );
  };

  // Создать групповой чат
  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    createGroupChat(groupName.trim(), selectedIds)
      .then(res => {
        const chat = res.data;
        navigate(`/chat/${chat.id}`, { state: { name: chat.name } });
        closeGroupModal();
      })
      .catch(err => {
        console.error('Ошибка создания группового чата:', err);
      });
  };

  return (
    <div className="chat-list-container">
      {/* Header: название + кнопки */}
      <div className="chat-list-header">
        <div className="chat-list-title">Чаты</div>
        <button
          className="profile-btn"
          title="Профиль"
          onClick={() => navigate('/profile')}
        >👤</button>
        <button
          className="group-create-btn"
          title="Новый групповой чат"
          onClick={openGroupModal}
        >👥+</button>
      </div>

      {/* Поиск личного чата */}
      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Найти пользователя..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={handleSearch}>Найти</button>
      </div>

      {/* Список личных и групповых чатов */}
      <div className="chat-list-items">
        {chats.map(chat => {
          // вычисляем отображаемое имя
          let name = chat.name;
          if (!chat.is_group) {
            const other = chat.participants_usernames.filter(
              (_, i) => chat.participants[i] !== currentUserId
            );
            name = other[0] || `Чат ${chat.id}`;
          }
          return (
            <div
              key={chat.id}
              className="chat-list-item"
              onClick={() => navigate(`/chat/${chat.id}`, { state: { name } })}
            >
              <div className="avatar" />
              <div className="username">{name}</div>
            </div>
          );
        })}
      </div>

      {/* Попап создания группового чата */}
      {showGroupModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Новый групповой чат</h3>
            <label>
              Название:
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Введите имя группы"
              />
            </label>
            <div className="contacts-list">
              {contacts.map(u => (
                <label key={u.id} className="contact-item">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(u.id)}
                    onChange={() => toggleSelect(u.id)}
                  />
                  {u.username}
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={handleCreateGroup} disabled={!groupName || !selectedIds.length}>
                Создать
              </button>
              <button onClick={closeGroupModal}>Отменить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
