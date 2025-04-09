import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatList from './components/ChatList/ChatList';
import ChatWindow from './components/ChatWindow/ChatWindow';
import Profile from './components/Profile/Profile';

function App() {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));

  return (
    <Router>
      <Routes>
        {/* Страница регистрации */}
        <Route path="/register" element={<Register />} />
        {/* Страница входа */}
        <Route path="/login" element={<Login onLogin={(t) => setToken(t)} />} />
        {token ? (
          <>
            <Route path="/chats" element={<ChatList token={token} />} />
            <Route path="/chat/:chatId" element={<ChatWindow />} />
            <Route path="/profile" element={<Profile token={token} />} />
            <Route path="*" element={<Navigate to="/chats" />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
