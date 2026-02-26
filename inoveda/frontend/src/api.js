import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const cachedGet = async (url, key) => {
    try {
        const res = await api.get(url);
        localStorage.setItem(key, JSON.stringify(res.data));
        return res.data;
    } catch (err) {
        const cached = localStorage.getItem(key);
        if (cached) return JSON.parse(cached);
        throw err;
    }
};

export default api;
