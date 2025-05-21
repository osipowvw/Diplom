// src/components/Auth/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        'http://127.0.0.1:8000/api/token/',
        { username, password }
      );

      localStorage.setItem('accessToken',  data.access);
      localStorage.setItem('refreshToken', data.refresh);
      onLogin && onLogin(data.access);

      setError('');
      navigate('/', { replace: true });
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

      <div className="redirect-link">
        Ещё нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </div>
    </div>
  );
}

export default Login;
