'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';


export interface User {
    id: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (userData: User, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simulation de l'utilisateur stocké (pour l'état initial)
const getStoredUser = (): User | null => {
    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser) as User;
            } catch (e) {
                console.error("Erreur de parsing de l'utilisateur stocké:", e);
                return null;
            }
        }
    }
    return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(getStoredUser());
    const [isLoggedIn, setIsLoggedIn] = useState(!!getStoredUser());
    
    // Fonction de connexion simplifiée
    const login = (userData: User, token: string) => {
        // Le token serait stocké ici pour les appels API futurs
        if (typeof window !== 'undefined') {
             localStorage.setItem('user', JSON.stringify(userData));
             localStorage.setItem('token', token);
        }
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
        setUser(null);
        setIsLoggedIn(false);
    };

    // La valeur du contexte est simplifiée
    const contextValue = useMemo(() => ({
        user,
        isLoggedIn,
        login,
        logout,
    }), [user, isLoggedIn]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};