import axios from 'axios';

const VITE_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = VITE_URL.trim();

if (!API_BASE_URL) {
    console.error("CRITICAL: No API URL found in .env! Please check VITE_GOOGLE_SCRIPT_URL.");
}

const gasPost = async (body: object) => {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    const data = await response.json();
    if (data.result === 'error') throw new Error(data.error);
    return data;
};

export const candidateApi = {
    submitPhase1: async (payload: any) => {
        try {
            const data = await gasPost({ action: 'submit_phase1', ...payload });
            return data;
        } catch (error: any) {
            if (error.message === 'Failed to fetch') {
                throw new Error(`Failed to connect to Google Script. Verify URL is reachable and deployed as 'Anyone': ${API_BASE_URL}`);
            }
            throw error;
        }
    },

    submitPhase2: async (payload: any) => {
        const data = await gasPost({ action: 'submit_phase2', ...payload });
        return data;
    },

    getApplicationByRegId: async (regId: string) => {
        const data = await gasPost({ action: 'get_application_by_regid', data: { registrationId: regId } });
        return data.data;
    },

    getApplicationByEmail: async (email: string) => {
        const data = await gasPost({ action: 'get_application_by_email', data: { email } });
        return data.data;
    },

    getAllApplications: async () => {
        try {
            const data = await gasPost({ action: 'get_applications' });
            return data.data || [];
        } catch (error) {
            console.error("Get Applications Error:", error);
            return [];
        }
    },

    updateStatus: async (id: string, status: string, remarks?: string) => {
        await gasPost({ action: 'update_status', data: { id, status, remarks } });
        return { _id: id, status, remarks };
    },

    deleteApplication: async (registrationId: string) => {
        await gasPost({ action: 'delete_application', data: { registrationId } });
        return { registrationId };
    },

    getPhase: async () => {
        try {
            const data = await gasPost({ action: 'get_phase' });
            return data.phase;
        } catch {
            return 1;
        }
    },

    updatePhase: async (phase: number) => {
        const data = await gasPost({ action: 'update_phase', data: { currentPhase: phase } });
        return data.phase;
    }
};
