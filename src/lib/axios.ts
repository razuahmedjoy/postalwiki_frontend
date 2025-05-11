import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

export const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
            try {
                const { state } = JSON.parse(stored);
                if (state.token) {
                    config.headers.Authorization = `Bearer ${state.token}`;
                }
            } catch (error) {
                console.error('Failed to parse auth storage:', error);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling token expiration
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
); 