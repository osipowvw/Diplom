// src/components/Auth/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (password !== password2) {
      setError('Пароли не совпадают');
      return;
    }
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', {
        username, email, password, password2
      });
      setError('');
      setSuccess('Регистрация прошла успешно!');
      // перенаправим на логин через пару секунд
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError('Не удалось зарегистрироваться');
      setSuccess('');
    }
  };

  return (
    <div className="form-container">
      <div className="form-title">Регистрация</div>
      {error   && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

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
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
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

        <div className="form-group">
          <label>Повтор пароля</label>
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
          />
        </div>

        <button className="form-button" type="submit">
          Зарегистрироваться
        </button>
      </form>

      <div className="redirect-link">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </div>
    </div>
  );
}

export default Register;
