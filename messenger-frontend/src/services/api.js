// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// Передавать токен в заголовок Authorization
export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
}

// Парсер user_id из токена, если нужен
export function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1]));
    return payload.user_id;
  } catch {
    return null;
  }
}

// Новый API-метод
export function createGroupChat(name, user_ids) {
  return API.post('chats/group_create/', { name, user_ids });
}

export default API;
