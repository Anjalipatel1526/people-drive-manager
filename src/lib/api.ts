import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const candidateApi = {
    submitPhase1: async (formData) => {
        const response = await api.post('/phase1', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getApplicationByRegId: async (regId) => {
        const response = await api.get(`/applications/${regId}`);
        return response.data;
    },

    submitPhase2: async (formData) => {
        const response = await api.post('/phase2', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getAllApplications: async () => {
        const response = await api.get('/applications');
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await api.patch(`/status/${id}`, { status });
        return response.data;
    },
};
