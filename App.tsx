import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { User, UserRole, AuthState, Language, Theme } from './types';
import { DB } from './db';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import CitizenDashboard from './pages/CitizenDashboard';
import PickerDashboard from './pages/PickerDashboard';
import { LayoutDashboard, LogOut, Recycle, Sun, Moon, Languages, User as UserIcon } from 'lucide-react';
import { useTranslation } from './translations';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>((localStorage.getItem('ecoclean_lang') as Language) || 'EN');
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('ecoclean_theme') as Theme) || 'light');

  const t = useTranslation(lang);

  useEffect(() => {
    const session = DB.getSession();
    if (session) {
      setAuth({ user: session, isAuthenticated: true });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ecoclean_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ecoclean_lang', lang);
  }, [lang]);

  const handleLogout = () => {
    DB.setSession(null);
    setAuth({ user: null, isAuthenticated: false });
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'EN' ? 'HI' : 'EN');

  if (loading) return <div className="flex items-center justify-center h-screen dark:bg-slate-900 dark:text-white">Loading...</div>;

  return (
    <HashRouter>
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <nav className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-emerald-700'} text-white shadow-lg sticky top-0 z-50 transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <Recycle className="h-8 w-8 text-emerald-200" />
                <span className="font-bold text-xl tracking-tight">{t.appName}</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={toggleLang}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-1 text-sm font-medium"
                  title="Switch Language"
                >
                  <Languages size={18} />
                  <span>{lang}</span>
                </button>
                
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  title="Toggle Theme"
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                {auth.isAuthenticated && (
                  <>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full text-sm">
                      <UserIcon size={14} />
                      <span>{auth.user?.name} ({auth.user?.role === UserRole.ADMIN ? t.admin : auth.user?.role === UserRole.CITIZEN ? t.citizen : t.picker})</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 hover:bg-black/20 px-3 py-2 rounded-md transition-colors"
                    >
                      <LogOut size={18} />
                      <span className="hidden sm:inline">{t.logout}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow">
          <Routes>
            <Route 
              path="/login" 
              element={!auth.isAuthenticated ? <Login lang={lang} theme={theme} onLogin={(user) => setAuth({ user, isAuthenticated: true })} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/signup" 
              element={!auth.isAuthenticated ? <Signup lang={lang} theme={theme} onSignup={(user) => setAuth({ user, isAuthenticated: true })} /> : <Navigate to="/" />} 
            />
            
            <Route 
              path="/" 
              element={
                auth.isAuthenticated ? (
                  auth.user?.role === UserRole.ADMIN ? <AdminDashboard lang={lang} theme={theme} user={auth.user} /> :
                  auth.user?.role === UserRole.CITIZEN ? <CitizenDashboard lang={lang} theme={theme} user={auth.user} /> :
                  <PickerDashboard lang={lang} theme={theme} user={auth.user!} />
                ) : <Navigate to="/login" />
              } 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer className={`py-6 border-t ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'} transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-4 text-center text-sm">
            {t.copyright} {t.tagline}
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;