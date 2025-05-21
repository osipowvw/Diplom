import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken } from '../../services/api';
import '../../App.css';

function Profile({ token }) {
  const navigate = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [phone, setPhone]       = useState('');
  const [bio, setBio]           = useState('');
  const [avatarUrl, setAvatarUrl]   = useState('');
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
    if (e.target.files && e.target.files[0]) {
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
        setAvatarFile(null);
        alert('Профиль обновлён');
      })
      .catch(err => {
        console.error('Ошибка обновления профиля:', err);
        alert('Не удалось обновить профиль');
      });
  };

  return (
    <div className="profile-container">
      {/* Заголовок с кнопкой назад */}
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2 className="profile-title">Профиль</h2>
      </div>

      {profile ? (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-avatar-section">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="avatar"
                className="profile-avatar-img"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">Имя пользователя</label>
            <span className="profile-value">{profile.username}</span>
          </div>

          <div className="profile-field">
            <label className="profile-label">Email</label>
            <span className="profile-value">{profile.email}</span>
          </div>

          <div className="profile-field">
            <label className="profile-label">Телефон</label>
            <input
              type="text"
              className="profile-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Телефон"
            />
          </div>

          <div className="profile-field">
            <label className="profile-label">О себе</label>
            <textarea
              className="profile-textarea"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Кратко о себе"
            />
          </div>

          <button type="submit" className="profile-save-btn">
            Сохранить
          </button>
        </form>
      ) : (
        <p>Загрузка профиля…</p>
      )}
    </div>
  );
}

export default Profile;
