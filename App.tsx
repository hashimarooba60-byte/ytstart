import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import HomePage from './pages/HomePage';
import WatchPage from './pages/WatchPage';
import AdminPage from './pages/AdminPage';
import { auth } from './services/firebase';
import type { AppUser } from './types';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // In a real app, you would fetch custom claims to check for admin role
                const appUser = Object.assign(firebaseUser, { isAdmin: firebaseUser.email === 'admin@sverse.com' });
                setUser(appUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
                <Header toggleSidebar={toggleSidebar} />
                <div className="flex flex-1">
                    <Sidebar isOpen={isSidebarOpen} />
                    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'ml-0'}`}>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/watch/:id" element={<WatchPage />} />
                            <Route path="/admin" element={user?.isAdmin ? <AdminPage /> : <HomePage />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </AuthContext.Provider>
    );
}

export default App;
