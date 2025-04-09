import React, { useState } from 'react';
import axios from 'axios';

function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Простейшая проверка совпадения паролей
    if (password !== password2) {
      setError("Пароли не совпадают!");
      return;
    }

    try {
      // Отправка POST-запроса на эндпоинт регистрации
      const response = await axios.post('http://127.0.0.1:8000/api/register/', {
        username,
        email,
        password,
        password2
      });
      
      // Если регистрация успешна, можно вызвать onRegister и/или отобразить сообщение
      setSuccess("Регистрация успешна! Теперь выполните вход.");
      setError(null);
      // Вы можете, например, автоматически переключить пользователя на страницу входа:
      if(onRegister) {
        onRegister(response.data);
      }
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      setError("Ошибка регистрации. Проверьте введенные данные.");
      setSuccess(null);
    }
  };

  return (
    <div>
      <h2>Регистрация</h2>
      { error && <div style={{color: "red"}}>{error}</div> }
      { success && <div style={{color: "green"}}>{success}</div> }
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Подтверждение пароля"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>
        <button type="submit">Зарегистрироваться</button>
      </form>
    </div>
  );
}

export default Register;
