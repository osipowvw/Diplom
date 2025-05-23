import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import './GroupChatModal.css';

export default function GroupChatModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [dialogs, setDialogs] = useState([]);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      API.getDialogs()
        .then(res => setDialogs(res.data.filter(c => !c.is_group)))
        .catch(console.error);
    }
  }, [isOpen]);

  const toggle = id => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleCreate = () => {
    API.post('chats/group_create/', {
      name,
      user_ids: [...selected],
    })
      .then(res => {
        onCreated(res.data); // возвращаем новый чат в ChatList
        onClose();
      })
      .catch(console.error);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window">
        <h3>Новый групповой чат</h3>

        <label>Название:</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Введите имя чата"
        />

        <div className="modal-participants">
          <p>Добавьте участников:</p>
          {dialogs.map(d => {
            const friend = d.participants_usernames.find(
              (_, i) => d.participants[i] !== d.current_user // current_user вернём на фронт (см. ниже)
            );
            return (
              <label key={d.id}>
                <input
                  type="checkbox"
                  checked={selected.has(friend.id)}
                  onChange={() => toggle(friend.id)}
                />
                {friend.username}
              </label>
            );
          })}
        </div>

        <div className="modal-actions">
          <button onClick={handleCreate} disabled={!name || !selected.size}>
            Создать
          </button>
          <button onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}
