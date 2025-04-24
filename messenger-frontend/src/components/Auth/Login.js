import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // <-- добавляем состояние для ошибки

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });
      const { access } = response.data;
      localStorage.setItem('accessToken', access);
      if (onLogin) onLogin(access);
      setError(''); // сбрасываем ошибку при успехе
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError('Неверные учетные данные или проблема с сетью');
    }
  };

  return (
    <div className="form-container">
      <div className="form-title">Вход</div>
      {/* Если error непустой, выводим */}
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

        <button className="form-button" type="submit">Войти</button>
      </form>
    </div>
  );
}

export default Login;