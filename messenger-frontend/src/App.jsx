import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatList from './components/ChatList/ChatList';
import ChatWindow from './components/ChatWindow/ChatWindow';
import Profile from './components/Profile/Profile';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));

  return (
    <Router>
      {/*
        Если нет токена — показываем только авторизацию/регистрацию
      */}
      {!token ? (
        <Routes>
          <Route
            path="/login"
            element={<Login onLogin={setToken} />}
          />
          <Route
            path="/register"
            element={<Register />}
          />
          {/* Всё остальное направляем на логин */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      ) : (
        <div className="app-container">
          {/* Сайдбар со списком чатов */}
          <ChatList token={token} />

          <Routes>
            {/* Профиль */}
            <Route
              path="/profile"
              element={<Profile token={token} />}
            />
            {/* Конкретный чат */}
            <Route
              path="/chat/:chatId"
              element={<ChatWindow token={token} />}
            />
            {/* Заглушка: когда чат не выбран */}
            <Route
              path="/"
            />
            {/* Любой другой URL — возвращаем на «домашнюю» */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </div>
      )}
    </Router>
  );
}

export default App;
