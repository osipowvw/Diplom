// src/components/Profile/Profile.js
import React, { useEffect, useState } from 'react';
import API, { setAuthToken } from '../../services/api';

function Profile({ token }) {
  // всегда используем из пропса (актуальный после логина)
  const [profile, setProfile] = useState(null);
  const [phone,   setPhone]   = useState('');
  const [bio,     setBio]     = useState('');
  const [avatarUrl,  setAvatarUrl ]  = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    API.get('profile/')
      .then(res => {
        setProfile(res.data);
        setPhone(res.data.phone || '');
        setBio(res.data.bio || '');
        setAvatarUrl(res.data.avatar || '');
      })
      .catch(err => console.error('Ошибка получения профиля:', err));
  }, [token]);

  const handleAvatarChange = e => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    const form = new FormData();
    form.append('phone', phone);
    form.append('bio', bio);
    if (avatarFile) form.append('avatar', avatarFile);

    API.put('profile/', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        setProfile(res.data);
        setAvatarUrl(res.data.avatar || '');
        alert('Профиль обновлен!');
      })
      .catch(err => {
        console.error('Ошибка обновления профиля:', err);
        alert('Не удалось обновить профиль');
      });
  };

  return (
    <div className="profile-container">
      <h2>Профиль</h2>
      {profile ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Имя пользователя:</label>
            <span>{profile.username}</span>
          </div>
          <div>
            <label>Email:</label>
            <span>{profile.email}</span>
          </div>

          <div>
            <label>Телефон:</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Телефон"
            />
          </div>

          <div>
            <label>О себе:</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Кратко о себе"
            />
          </div>

          <div>
            <label>Аватар:</label>
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="avatar"
                height="100"
                style={{ display: 'block', marginBottom: 8 }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          <button type="submit">Обновить профиль</button>
        </form>
      ) : (
        <p>Загрузка профиля...</p>
      )}
    </div>
  );
}

export default Profile;
