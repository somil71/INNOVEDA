import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("userId");
        const name = localStorage.getItem("userName");
        if (role && userId) {
            setUser({ id: userId, role, name });
        }
        setLoading(false);
    }, []);

    const login = (payload) => {
        // Backend now sets the HttpOnly cookie automatically.
        localStorage.setItem("role", payload.role);
        localStorage.setItem("userId", payload.user_id);
        localStorage.setItem("userName", payload.name || "User");
        setUser({ id: payload.user_id, role: payload.role, name: payload.name });
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (err) {
            console.error("Logout failed", err);
        } finally {
            localStorage.clear();
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role: user?.role ?? null, login, logout, isAuthenticated: !!user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
