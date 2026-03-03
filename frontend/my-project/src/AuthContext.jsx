import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Note: Ensure jwt-decode is installed via npm install jwt-decode

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({ email: decoded.sub });
                localStorage.setItem('token', token);
            } catch (e) {
                console.error("Invalid token", e);
                logout();
            }
        } else {
            setUser(null);
            localStorage.removeItem('token');
        }
    }, [token]);

    const login = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2PasswordRequestForm expects username
        formData.append('password', password);

        const response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Login failed');
        }

        const data = await response.json();
        setToken(data.access_token);
    };

    const register = async (email, password) => {
        const response = await fetch('http://localhost:8000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Registration failed');
        }
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};
