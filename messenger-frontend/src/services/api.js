import axios from 'axios';
const jwt_decode = require('jwt-decode');

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common['Authorization'];
  }
};

export function getUserIdFromToken(token) {
  try {
    const decoded = jwt_decode(token);
    return decoded.user_id;
  } catch (e) {
    return null;
  }
}

export default API;
