import axios from 'axios';

const customFetch = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api', // Default to localhost:3000/api if not set
});

export default customFetch;
