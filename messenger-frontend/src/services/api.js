// src/services/api.js
import axios from 'axios';

// базовый URL вашего бэка
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// Устанавливает или убирает заголовок Authorization
export const setAuthToken = token => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

// Вычленяет user_id из JWT
export const getUserIdFromToken = token => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id;
  } catch {
    return null;
  }
};

export default API;
