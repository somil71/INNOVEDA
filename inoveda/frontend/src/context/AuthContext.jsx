import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Typically you'd fetch user profile here
            const role = localStorage.getItem("role");
            const userId = localStorage.getItem("userId");
            const name = localStorage.getItem("userName");
            if (role && userId) {
                setUser({ id: userId, role, name });
            }
        }
        setLoading(false);
    }, [token]);

    const login = (payload) => {
        localStorage.setItem("token", payload.access_token);
        localStorage.setItem("role", payload.role);
        localStorage.setItem("userId", payload.user_id);
        localStorage.setItem("userName", payload.name || "User");
        setToken(payload.access_token);
        setUser({ id: payload.user_id, role: payload.role, name: payload.name });
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
