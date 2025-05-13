// src/components/Auth/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken } from '../../services/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // POST http://127.0.0.1:8000/api/token/
      const { data } = await API.post('token/', { username, password });

      // Сохраняем оба токена
      localStorage.setItem('accessToken',  data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // Устанавливаем в заголовки для всех будущих запросов
      setAuthToken(data.access);

      // Поднимаем новый токен наверх (App.js)
      if (onLogin) onLogin(data.access);

      // Перенаправляем в корень (список чатов слева + сообщение «Выберите чат» справа)
      navigate('/', { replace: true });
      setError('');
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError('Неверные учетные данные или проблема с сетью');
    }
  };

  return (
    <div className="form-container">
      <div className="form-title">Вход</div>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Имя пользователя</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="form-button" type="submit">
          Войти
        </button>
      </form>
    </div>
  );
}

export default Login;
