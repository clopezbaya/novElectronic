import axios from 'axios';

const customFetch = axios.create({
  baseURL: 'http://localhost:3000/api', // Explicitly set to avoid environment variable issues
});

export default customFetch;
