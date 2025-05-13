// src/App.js
import React, { useState, useEffect } from 'react';
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
import { setAuthToken } from './services/api';
import './App.css';

function App() {
  // Храним в стейте актуальный токен
  const [token, setToken] = useState(localStorage.getItem('accessToken'));

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  return (
    <Router>
      <div className="app-container">
        {/* Слева список чатов (получает token) */}
        {token && <ChatList token={token} />}

        <Routes>
          {/* Если пользователь залогинен, не пускаем на /login и /register */}
          <Route
            path="/login"
            element={<Login onLogin={newToken => {
              // Сохраняем в localStorage и поднимаем в state
              localStorage.setItem('accessToken', newToken);
              setToken(newToken);
            }} />}
          />
          <Route
            path="/register"
            element={
              token
                ? <Navigate to="/" replace />
                : <Register />
            }
          />

          {/* Профиль и чат — только для авторизованных */}
          <Route
            path="/profile"
            element={
              token
                ? <Profile token={token} />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/chat/:chatId"
            element={
              token
                ? <ChatWindow token={token} />
                : <Navigate to="/login" replace />
            }
          />

          {/* По умолчанию если нет ни /chat, ни /login */}
          <Route
            path="/"
            element={
              token
                ? <div>Выберите чат слева</div>
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="*"
            element={<div>Страница не найдена</div>}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
