import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });
      const { access } = response.data;
      localStorage.setItem('accessToken', access);
      onLogin(access);
    } catch (error) {
      console.error('Ошибка входа', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Вход</h2>
      <input type="text" value={username} placeholder="Имя пользователя" onChange={(e) => setUsername(e.target.value)} required />
      <input type="password" value={password} placeholder="Пароль" onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Войти</button>
    </form>
  );
}

export default Login;
