import React, { useState, useEffect, useMemo } from 'react';
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

  // Загрузка списка чатов
  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    API.get('chats/')
       .then(res => setChats(res.data))
       .catch(err => console.error('Ошибка получения чатов:', err));
  }, [token]);

  // Формируем список «контактов» — пользователей из личных диалогов
  const contacts = useMemo(() => {
    const list = [];
    chats.forEach(chat => {
      if (!chat.is_group) {
        const idx = chat.participants.indexOf(currentUserId);
        const otherIdx = idx === 0 ? 1 : 0;
        const id = chat.participants[otherIdx];
        const username = chat.participants_usernames[otherIdx];
        if (!list.find(u => u.id === id)) {
          list.push({ id, username });
        }
      }
    });
    return list;
  }, [chats, currentUserId]);

  // Личный чат по нику
  const handleSearch = () => {
    if (!search.trim()) return;
    API.post('chats/find_or_create/', { username: search.trim() })
       .then(res => {
         const chat = res.data;
         const other = chat.participants_usernames.filter(
           (_, i) => chat.participants[i] !== currentUserId
         );
         const name = other[0] || `Чат ${chat.id}`;
         navigate(`/chat/${chat.id}`, { state: { name } });
       })
       .catch(err => console.error(err));
  };

  // Открыть / закрыть модалку
  const openModal  = () => {
    setGroupName('');
    setSelectedIds([]);
    setShowGroupModal(true);
  };
  const closeModal = () => setShowGroupModal(false);

  // Выбор / снятие выбора участника
  const toggleSelect = id => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // Создать групповой чат
  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    createGroupChat(groupName.trim(), selectedIds)
      .then(res => {
        const chat = res.data;
        navigate(`/chat/${chat.id}`, { state: { name: chat.name } });
        closeModal();
      })
      .catch(err => console.error('Ошибка создания группы:', err));
  };

  return (
    <div className="chat-list-container">
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
          onClick={openModal}
        >👥+</button>
      </div>

      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Найти пользователя..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={handleSearch}>Найти</button>
      </div>

      <div className="chat-list-items">
        {chats.map(chat => {
          let title = chat.name;
          if (!chat.is_group) {
            const other = chat.participants_usernames.filter(
              (_, i) => chat.participants[i] !== currentUserId
            );
            title = other[0] || `Чат ${chat.id}`;
          }
          return (
            <div
              key={chat.id}
              className="chat-list-item"
              onClick={() =>
                navigate(`/chat/${chat.id}`, { state: { name: title } })
              }
            >
              <div className="avatar" />
              <div className="username">{title}</div>
            </div>
          );
        })}
      </div>

      {showGroupModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Новый групповой чат</h3>

            <label className="modal-label">
              Название группы:
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Имя группы"
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
              <button
                className="btn"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedIds.length === 0}
              >
                Создать
              </button>
              <button className="btn btn-secondary" onClick={closeModal}>
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
