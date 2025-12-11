import axios from 'axios';

const customFetch = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

export default customFetch;
