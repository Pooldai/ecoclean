
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { User, UserRole, AuthState } from './types';
import { DB } from './db';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import CitizenDashboard from './pages/CitizenDashboard';
import PickerDashboard from './pages/PickerDashboard';
import { LayoutDashboard, LogOut, Recycle, MapPin, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = DB.getSession();
    if (session) {
      setAuth({ user: session, isAuthenticated: true });
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    DB.setSession(null);
    setAuth({ user: null, isAuthenticated: false });
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        {auth.isAuthenticated && (
          <nav className="bg-emerald-700 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-2">
                  <Recycle className="h-8 w-8 text-emerald-200" />
                  <span className="font-bold text-xl tracking-tight">EcoClean</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-600 rounded-full text-sm">
                    <UserIcon size={14} />
                    <span>{auth.user?.name} ({auth.user?.role})</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 hover:bg-emerald-800 px-3 py-2 rounded-md transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="flex-grow">
          <Routes>
            <Route 
              path="/login" 
              element={!auth.isAuthenticated ? <Login onLogin={(user) => setAuth({ user, isAuthenticated: true })} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/signup" 
              element={!auth.isAuthenticated ? <Signup onSignup={(user) => setAuth({ user, isAuthenticated: true })} /> : <Navigate to="/" />} 
            />
            
            <Route 
              path="/" 
              element={
                auth.isAuthenticated ? (
                  auth.user?.role === UserRole.ADMIN ? <AdminDashboard user={auth.user} /> :
                  auth.user?.role === UserRole.CITIZEN ? <CitizenDashboard user={auth.user} /> :
                  <PickerDashboard user={auth.user!} />
                ) : <Navigate to="/login" />
              } 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer className="bg-slate-100 border-t border-slate-200 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
            &copy; 2024 EcoClean Waste Management Platform. Empowering sustainable cities.
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
