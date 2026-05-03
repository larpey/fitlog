import axios from 'axios';

const API_URL = '/api';

// helper to get auth header
export function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: 'Bearer ' + token };
}

export default axios.create({ baseURL: API_URL });
