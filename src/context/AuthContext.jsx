import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set persistence to session only to ensure user is asked to log in 
        // after closing the browser if they didn't explicitly sign out.
        setPersistence(auth, browserSessionPersistence)
            .catch((error) => console.error("Error setting persistence:", error));

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        try {
            await signOut(auth);
            // Clear session storage to reset UI state (active tab, viewed reports, etc.)
            sessionStorage.clear();
            // Clear specific local storage items if any (e.g., lastSeenReportCount)
            localStorage.removeItem('lastSeenReportCount');
        } catch (error) {
            throw error;
        }
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
