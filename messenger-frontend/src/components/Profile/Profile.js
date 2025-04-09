import React, { useEffect, useState } from 'react';
import API, { setAuthToken } from '../../services/api';

function Profile({ token: propToken }) {
  // Берем токен либо из пропсов, либо из localStorage
  const token = propToken || localStorage.getItem('accessToken');
  console.log("Token in Profile:", token);
  
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (token) {
      // Устанавливаем заголовок Authorization для нашего API-инстанса
      setAuthToken(token);
      // Используем API.get, чтобы гарантировать, что заголовок передается
      API.get('profile/')
        .then(response => {
          setProfile(response.data);
          setPhone(response.data.phone || '');
          setBio(response.data.bio || '');
          setAvatarUrl(response.data.avatar || '');
        })
        .catch(err => {
          console.error('Ошибка получения профиля:', err);
        });
    }
  }, [token]);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('bio', bio);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    API.put('profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        setProfile(res.data);
        alert('Профиль обновлен!');
      })
      .catch(err => {
        console.error('Ошибка обновления профиля:', err);
        alert('Ошибка обновления профиля');
      });
  };

  return (
    <div>
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
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Телефон"
            />
          </div>
          <div>
            <label>О себе:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Кратко о себе"
            />
          </div>
          <div>
            <label>Аватар:</label>
            {avatarUrl && <img src={avatarUrl} alt="avatar" height="100" />}
            <input type="file" name="avatar" onChange={handleAvatarChange} />
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
