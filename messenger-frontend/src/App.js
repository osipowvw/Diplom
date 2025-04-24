import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
      <div className="app-container">
        <ChatList token={token} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile token={token} />} />
          <Route path="/chat/:chatId" element={<ChatWindow token={token} />} />
          <Route path="*" element={<div>Выберите чат или войдите</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;