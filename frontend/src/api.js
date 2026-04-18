import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
});

export const getCities = () => api.get('/api/cities').then(res => res.data.data);
export const getCurrentData = (city = 'Pune', zone = '') => api.get(`/api/current?city=${city}&zone=${zone}`).then(res => res.data.data);
export const getHistoryData = (city = 'Pune', hours = 24) => api.get(`/api/history?city=${city}&hours=${hours}`).then(res => res.data.data);
export const getHeatmapData = (city = 'Pune') => api.get(`/api/heatmap?city=${city}`).then(res => res.data.data);
export const getPredictionData = (city = 'Pune', days = 10) => api.get(`/api/predict?city=${city}&days=${days}`).then(res => res.data);
export const simulateEvent = (eventType, city, zone) => api.post('/api/simulate', { event_type: eventType, city, zone }).then(res => res.data);
export const getSuggestions = (city = 'Pune', zone = '') => api.get(`/api/suggestions?city=${city}&zone=${zone}`).then(res => res.data.suggestions);
